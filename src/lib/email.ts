import "server-only";
import { db } from "./db";

const from = () => process.env.EMAIL_FROM ?? "CorpGurus <notifications@corpgurus.com>";
export const emailConfigured = () => !!process.env.RESEND_API_KEY;
const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3210").replace(/\/$/, "");

function esc(s: string) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)); }

/** Corporate-styled transactional email. */
export function renderEmail({ title, body, ctaLabel, ctaHref, footer }: { title: string; body: string; ctaLabel?: string; ctaHref?: string; footer?: string }) {
  const url = ctaHref ? (ctaHref.startsWith("http") ? ctaHref : `${appUrl()}${ctaHref}`) : null;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#14213a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e1e6ee;border-radius:12px">
<tr><td style="padding:24px 28px 8px"><span style="display:inline-block;background:#0b2a5b;color:#fff;font-weight:700;font-size:13px;padding:6px 8px;border-radius:6px">CG</span> <span style="font-weight:700;font-size:18px;color:#0b2a5b;vertical-align:middle">Corp<span style="color:#0f4c9a">Gurus</span></span></td></tr>
<tr><td style="padding:8px 28px 0"><h1 style="margin:0;font-size:20px;line-height:1.3">${esc(title)}</h1></td></tr>
<tr><td style="padding:12px 28px 0;font-size:15px;line-height:1.6;color:#2b3648">${esc(body).replace(/\n/g, "<br>")}</td></tr>
${url ? `<tr><td style="padding:22px 28px 0"><a href="${url}" style="display:inline-block;background:#0f4c9a;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:8px">${esc(ctaLabel ?? "Open CorpGurus")}</a></td></tr>` : ""}
<tr><td style="padding:24px 28px 26px;font-size:12px;color:#8b96a8;line-height:1.5">${esc(footer ?? "You are receiving this because you have a CorpGurus account. Manage email preferences in Settings.")}<br><a href="${appUrl()}/settings" style="color:#0f4c9a">${appUrl().replace(/^https?:\/\//, "")}/settings</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = `${title}\n\n${body}\n\n${url ? `${ctaLabel ?? "Open"}: ${url}\n\n` : ""}${footer ?? "Manage email preferences in Settings."}`;
  return { html, text };
}

/** Sends through Resend when a key is present; otherwise records the email as "logged" so the flow can be inspected in development. */
export async function sendEmail({ to, subject, html, text, userId }: { to: string; subject: string; html: string; text: string; userId?: string | null }) {
  if (!emailConfigured()) {
    await db.emailLog.create({ data: { userId: userId ?? null, to, subject, status: "logged" } });
    if (process.env.NODE_ENV !== "production") console.log(`[email → ${to}] ${subject}`);
    return { ok: true, logged: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: from(), to: [to], subject, html, text }),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) throw new Error(json.message || `Resend ${res.status}`);
    await db.emailLog.create({ data: { userId: userId ?? null, to, subject, status: "sent", providerId: json.id } });
    return { ok: true };
  } catch (e) {
    await db.emailLog.create({ data: { userId: userId ?? null, to, subject, status: "failed", error: (e as Error).message } });
    return { ok: false, error: (e as Error).message };
  }
}

export async function emailUsers(userIds: string[], payload: { title: string; body: string; ctaLabel?: string; ctaHref?: string }) {
  if (!userIds.length) return;
  const users = await db.user.findMany({ where: { id: { in: userIds }, status: "ACTIVE", emailNotifications: true }, select: { id: true, email: true, name: true } });
  const { html, text } = renderEmail(payload);
  await Promise.all(users.map((u) => sendEmail({ to: u.email, subject: payload.title, html, text, userId: u.id })));
}
