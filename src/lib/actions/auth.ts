"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sendVerificationEmail } from "@/lib/actions/account-security";
import { z } from "zod";
import { db } from "@/lib/db";
import { track } from "@/lib/analytics";
import { createSession, destroySession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/ratelimit";
import type { ActionState } from "@/lib/types";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password needs at least 8 characters"),
  role: z.enum(["TRAINER", "COMPANY"]),
  headline: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  companyType: z.enum(["DIRECT", "TRAINING_PARTNER"]).optional(),
});

async function uniqueSlug(base: string, exists: (s: string) => Promise<boolean>) {
  let slug = slugify(base) || "member";
  let i = 1;
  while (await exists(slug)) slug = `${slugify(base)}-${++i}`;
  return slug;
}

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await rateLimit("signup", 10, 60 * 60 * 1000))) return { error: "Too many sign-ups from this network. Try again in an hour." };
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.role === "TRAINER" && !d.headline) return { error: "Add a one-line headline, e.g. “HPE & Aruba certified instructor”" };
  if (d.role === "COMPANY" && !d.companyName) return { error: "Enter your company name" };

  if (await db.user.findUnique({ where: { email: d.email } })) return { error: "An account with this email already exists. Sign in instead." };

  const passwordHash = await bcrypt.hash(d.password, 10);
  const refCode = String(formData.get("ref") ?? "").trim().toUpperCase();
  const referrer = refCode ? await db.user.findUnique({ where: { referralCode: refCode }, select: { id: true } }) : null;
  const user = await db.user.create({ data: { name: d.name, email: d.email, passwordHash, role: d.role, referredById: referrer?.id ?? null } });

  if (d.role === "TRAINER") {
    const slug = await uniqueSlug(d.name, async (s) => !!(await db.trainerProfile.findUnique({ where: { slug: s } })));
    await db.trainerProfile.create({ data: { userId: user.id, slug, headline: d.headline! } });
  } else {
    const slug = await uniqueSlug(d.companyName!, async (s) => !!(await db.company.findUnique({ where: { slug: s } })));
    const domain = d.email.split("@")[1];
    const company = await db.company.create({
      data: { name: d.companyName!, slug, type: d.companyType ?? "DIRECT", domain: ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"].includes(domain) ? null : domain },
    });
    await db.companyMember.create({ data: { companyId: company.id, userId: user.id, role: "OWNER" } });
  }

  await db.notification.create({
    data: { userId: user.id, type: "welcome", title: "Welcome to CorpGurus", body: d.role === "TRAINER" ? "Complete your profile and add certifications to get verified." : "Complete your company page, then post your first requirement.", href: "/settings" },
  });

  await createSession(user.id);
  void track("signup", user.id, { role: d.role, method: "password" });
  await sendVerificationEmail(user.id).catch((e) => console.error("[verify email]", (e as Error).message));
  redirect(d.role === "TRAINER" ? "/onboarding/trainer" : "/onboarding/company");
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await rateLimit("login", 20, 15 * 60 * 1000))) return { error: "Too many sign-in attempts. Wait 15 minutes and try again." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const user = await db.user.findUnique({ where: { email }, include: { oauthAccounts: { select: { provider: true } } } });
  if (user && !user.passwordHash) {
    const via = user.oauthAccounts.map((a) => (a.provider === "google" ? "Google" : "LinkedIn")).join(" or ");
    return { error: `This account signs in with ${via || "a linked provider"}. Use that button, or set a password from Settings after signing in.` };
  }
  if (!user || !(await bcrypt.compare(password, user.passwordHash!))) return { error: "Email or password is incorrect." };
  if (user.status === "DELETED") return { error: "This account was deleted." };
  if (user.status === "SUSPENDED") return { error: "This account is disabled. Contact support@corpgurus.com." };
  await createSession(user.id);
  redirect(next && next.startsWith("/") ? next : "/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
