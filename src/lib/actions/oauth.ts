"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, requireUser } from "@/lib/auth";
import { PENDING_COOKIE, readPending } from "@/lib/oauth";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

const schema = z.object({
  role: z.enum(["TRAINER", "COMPANY"]),
  name: z.string().trim().min(2, "Enter your full name"),
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

/** Finish sign-up for a member who arrived through Google / LinkedIn. */
export async function completeOAuthSignup(_p: ActionState, fd: FormData): Promise<ActionState> {
  const jar = await cookies();
  const pending = await readPending(jar.get(PENDING_COOKIE)?.value);
  if (!pending) return { error: "Your sign-in session expired. Start again from the sign-in page." };
  if (!pending.email) return { error: `${pending.provider === "google" ? "Google" : "LinkedIn"} did not share an email address. Sign up with email instead.` };

  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.role === "TRAINER" && !d.headline) return { error: "Add a one-line headline, e.g. “AWS Authorized Instructor · 8 yrs”" };
  if (d.role === "COMPANY" && !d.companyName) return { error: "Enter your company name" };
  if (await db.user.findUnique({ where: { email: pending.email } })) return { error: "This email is already registered. Sign in with your password, then link this account from Settings." };

  const user = await db.user.create({
    data: {
      name: d.name, email: pending.email, role: d.role, avatarUrl: pending.picture,
      oauthAccounts: { create: { provider: pending.provider, providerAccountId: pending.sub, email: pending.email } },
    },
  });

  if (d.role === "TRAINER") {
    const slug = await uniqueSlug(d.name, async (s) => !!(await db.trainerProfile.findUnique({ where: { slug: s } })));
    await db.trainerProfile.create({ data: { userId: user.id, slug, headline: d.headline! } });
  } else {
    const slug = await uniqueSlug(d.companyName!, async (s) => !!(await db.company.findUnique({ where: { slug: s } })));
    const domain = pending.email.split("@")[1];
    const company = await db.company.create({
      data: { name: d.companyName!, slug, type: d.companyType ?? "DIRECT", domain: ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"].includes(domain) ? null : domain },
    });
    await db.companyMember.create({ data: { companyId: company.id, userId: user.id, role: "OWNER" } });
  }

  await db.notification.create({
    data: { userId: user.id, type: "welcome", title: "Welcome to CorpGurus", body: d.role === "TRAINER" ? "Complete your profile and add certifications to get verified." : "Complete your company page, then post your first requirement.", href: "/settings" },
  });

  jar.delete(PENDING_COOKIE);
  await createSession(user.id);
  redirect(pending.next && pending.next.startsWith("/") ? pending.next : d.role === "TRAINER" ? "/onboarding/trainer" : "/onboarding/company");
}

export async function unlinkProvider(fd: FormData) {
  const user = await requireUser();
  const provider = String(fd.get("provider"));
  const full = await db.user.findUnique({ where: { id: user.id }, include: { oauthAccounts: true } });
  if (!full) return;
  const others = full.oauthAccounts.filter((a) => a.provider !== provider).length;
  // Never leave the account with no way to sign in.
  if (!full.passwordHash && others === 0) return;
  await db.oAuthAccount.deleteMany({ where: { userId: user.id, provider } });
  revalidatePath("/settings");
}
