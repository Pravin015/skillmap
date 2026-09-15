"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { renderEmail, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/oauth";
import { rateLimit } from "@/lib/ratelimit";
import { audit } from "@/lib/notify";
import { consumeToken, issueToken, liveTokenKind } from "@/lib/tokens";
import type { ActionState } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails a verification link. Called on sign-up and from the "resend" button. */
export async function sendVerificationEmail(userId: string) {
  const u = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, emailVerifiedAt: true, status: true } });
  if (!u || u.emailVerifiedAt || u.status !== "ACTIVE") return;
  const raw = await issueToken(u.id, "EMAIL_VERIFY");
  const { html, text } = renderEmail({ title: "Confirm your email address", body: `Hi ${u.name.split(" ")[0]},\n\nTap the button to confirm ${u.email} is yours. The link works for 3 days.`, ctaLabel: "Confirm email", ctaHref: `${appUrl()}/verify/${raw}`, footer: "If you did not create a CorpGurus account, ignore this email." });
  await sendEmail({ to: u.email, subject: "Confirm your CorpGurus email", html, text, userId: u.id });
}

export async function resendVerification(_p: ActionState): Promise<ActionState> {
  void _p;
  const user = await requireUser();
  if (!(await rateLimit(`verify:${user.id}`, 3, 15 * 60 * 1000))) return { error: "Please wait a few minutes before requesting another link." };
  const full = await db.user.findUnique({ where: { id: user.id }, select: { emailVerifiedAt: true, email: true } });
  if (full?.emailVerifiedAt) return { ok: "Your email is already confirmed." };
  await sendVerificationEmail(user.id);
  return { ok: `Confirmation link sent to ${full?.email}. Check spam if it does not arrive within a minute.` };
}

/** Forgot password: always answers the same way so email addresses cannot be probed. */
export async function requestPasswordReset(_p: ActionState, fd: FormData): Promise<ActionState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Enter the email you signed up with." };
  if (!(await rateLimit("forgot", 8, 60 * 60 * 1000))) return { error: "Too many requests from this network. Try again in an hour." };
  const u = await db.user.findUnique({ where: { email }, select: { id: true, name: true, status: true, passwordHash: true } });
  if (u && u.status === "ACTIVE") {
    const raw = await issueToken(u.id, "PASSWORD_RESET");
    const { html, text } = renderEmail({ title: "Reset your CorpGurus password", body: `Hi ${u.name.split(" ")[0]},\n\nSomeone asked to reset the password for this account. The link below works for one hour and can be used once.${u.passwordHash ? "" : "\n\nThis account signs in with Google, LinkedIn or Microsoft; resetting sets a password you can use as well."}`, ctaLabel: "Choose a new password", ctaHref: `${appUrl()}/reset/${raw}`, footer: "If you did not ask for this, you can ignore the email; your password stays the same." });
    await sendEmail({ to: email, subject: "Reset your CorpGurus password", html, text, userId: u.id });
    await audit(u.id, "password.reset_requested", u.id);
  }
  return { ok: `If ${email} has an account, a reset link is on its way. It expires in one hour.` };
}

export async function resetPassword(_p: ActionState, fd: FormData): Promise<ActionState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? ""), confirm = String(fd.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };
  const t = await consumeToken(token, "PASSWORD_RESET");
  if (!t) return { error: "This reset link is invalid or has expired. Request a new one." };
  if (t.user.status !== "ACTIVE") return { error: "This account cannot sign in. Contact support@corpgurus.com." };
  await db.user.update({ where: { id: t.userId }, data: { passwordHash: await bcrypt.hash(password, 10), emailVerifiedAt: new Date() } });
  await audit(t.userId, "password.reset", t.userId);
  redirect("/login?reset=1");
}

/** Signed-in user changes their email: the new address gets a confirmation link; nothing changes until it is opened. */
export async function requestEmailChange(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const newEmail = String(fd.get("newEmail") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!EMAIL_RE.test(newEmail)) return { error: "Enter a valid email address." };
  if (newEmail === user.email) return { error: "That is already your email." };
  const full = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (full?.passwordHash && !(await bcrypt.compare(password, full.passwordHash))) return { error: "Your current password is incorrect." };
  if (await db.user.findUnique({ where: { email: newEmail }, select: { id: true } })) return { error: "Another account already uses that email." };
  if (!(await rateLimit(`email-change:${user.id}`, 3, 60 * 60 * 1000))) return { error: "Please wait before requesting another change." };
  const raw = await issueToken(user.id, "EMAIL_CHANGE", newEmail);
  const { html, text } = renderEmail({ title: "Confirm your new email", body: `Hi ${user.name.split(" ")[0]},\n\nConfirm that ${newEmail} should become the sign-in email for your CorpGurus account. The link works for 24 hours.`, ctaLabel: "Confirm new email", ctaHref: `${appUrl()}/verify/${raw}`, footer: `Requested from the account currently registered as ${user.email}. Ignore this if it was not you.` });
  await sendEmail({ to: newEmail, subject: "Confirm your new CorpGurus email", html, text, userId: user.id });
  const { html: h2, text: t2 } = renderEmail({ title: "Email change requested", body: `A request was made to move your CorpGurus sign-in to ${newEmail}. Nothing changes until that address confirms. If this was not you, change your password now.`, ctaLabel: "Review security settings", ctaHref: `${appUrl()}/settings` });
  await sendEmail({ to: user.email, subject: "CorpGurus: email change requested", html: h2, text: t2, userId: user.id });
  await audit(user.id, "email.change_requested", user.id, { newEmail });
  revalidatePath("/settings");
  return { ok: `Confirmation sent to ${newEmail}. Open the link there to switch; your current email keeps working until then.` };
}

/** Handles /verify/<token> for both verification and email change. Returns where to send the browser. */
export async function applyVerifyToken(raw: string): Promise<string> {
  const me = await getCurrentUser();
  const kind = await liveTokenKind(raw);
  if (!kind) return me ? "/settings?verify=invalid" : "/login?verify=invalid";
  if (kind === "EMAIL_VERIFY") {
    const used = await consumeToken(raw, "EMAIL_VERIFY");
    if (!used) return "/login?verify=invalid";
    await db.user.update({ where: { id: used.userId }, data: { emailVerifiedAt: new Date() } });
    await audit(used.userId, "email.verified", used.userId);
    return me?.id === used.userId ? "/dashboard?verify=done" : "/login?verify=done";
  }
  if (kind === "EMAIL_CHANGE") {
    const used = await consumeToken(raw, "EMAIL_CHANGE");
    if (!used?.newEmail) return "/settings?verify=invalid";
    if (await db.user.findUnique({ where: { email: used.newEmail }, select: { id: true } })) return "/settings?verify=taken";
    await db.user.update({ where: { id: used.userId }, data: { email: used.newEmail, emailVerifiedAt: new Date() } });
    await audit(used.userId, "email.changed", used.userId, { from: used.user.email, to: used.newEmail });
    return me?.id === used.userId ? "/settings?verify=changed" : "/login?verify=changed";
  }
  return "/login";
}
