"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { saveUpload } from "@/lib/uploads";
import { parseList } from "@/lib/utils";
import { entitlementsFor } from "@/lib/billing";
import type { ActionState } from "@/lib/types";
import { isStaffRole } from "@/lib/permissions";

/** Onboarding wizards. Each step saves what it can and moves on; nothing here is mandatory beyond the first step's basics. */

const FREE_MAIL = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com", "protonmail.com", "icloud.com"];

async function bump(userId: string, step: number) {
  await db.user.update({ where: { id: userId }, data: { onboardingStep: { set: step } } });
}
async function finish(userId: string) {
  await db.user.update({ where: { id: userId }, data: { onboardingCompletedAt: new Date(), onboardingStep: 5 } });
  revalidatePath("/dashboard"); revalidatePath("/settings");
  redirect("/dashboard?onboarded=1");
}

/* ---------------- Trainer ---------------- */

export async function trainerStep1(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Trainer accounts only." };
  const headline = String(fd.get("headline") ?? "").trim();
  if (headline.length < 8) return { error: "Write a headline of at least 8 characters, e.g. “HPE VM Essentials & Morpheus instructor · 12 yrs infra”." };
  let avatarUrl: string | null = null;
  try { avatarUrl = await saveUpload(fd.get("avatar") as File | null, "avatars", ["image"]); } catch (e) { return { error: (e as Error).message }; }
  await db.user.update({ where: { id: user.id }, data: { name: String(fd.get("name") ?? "").trim() || user.name, ...(avatarUrl ? { avatarUrl } : {}) } });
  await db.trainerProfile.update({ where: { id: user.trainerProfile.id }, data: { headline, bio: String(fd.get("bio") ?? "").trim(), languages: fd.getAll("languages").map(String).filter(Boolean) } });
  await bump(user.id, 2);
  redirect("/onboarding/trainer?step=2");
}

export async function trainerStep2(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Trainer accounts only." };
  const skills = fd.getAll("skills").map(String).filter(Boolean);
  if (!skills.length) return { error: "Pick at least one skill. Skills drive matching and notifications." };
  await db.trainerProfile.update({ where: { id: user.trainerProfile.id }, data: { yearsExperience: Math.max(0, Math.min(50, Number(fd.get("yearsExperience") || 0))), skills: { set: skills.map((slug) => ({ slug })) } } });
  // Up to three certifications in one go. Rows with no name are ignored.
  for (const i of [1, 2, 3]) {
    const name = String(fd.get(`certName${i}`) ?? "").trim();
    if (!name) continue;
    const issuer = String(fd.get(`certIssuer${i}`) ?? "").trim() || "—";
    const credentialId = String(fd.get(`certId${i}`) ?? "").trim() || null;
    if (credentialId) {
      const dup = await db.certification.findFirst({ where: { credentialId, trainerId: { not: user.trainerProfile.id } }, select: { id: true } });
      if (dup) return { error: `Certificate ID ${credentialId} is already registered to another trainer. Check the number, or contact support if it is yours.` };
    }
    let fileUrl: string | null = null;
    try { fileUrl = await saveUpload(fd.get(`certFile${i}`) as File | null, "certs", ["image", "doc"]); } catch (e) { return { error: `Certification ${i}: ${(e as Error).message}` }; }
    const expiresOn = String(fd.get(`certExpires${i}`) || "");
    await db.certification.create({ data: { trainerId: user.trainerProfile.id, name, issuer, credentialId, fileUrl, expiresOn: expiresOn ? new Date(expiresOn) : null } });
  }
  await bump(user.id, 3);
  redirect("/onboarding/trainer?step=3");
}

export async function trainerStep3(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Trainer accounts only." };
  const modes = fd.getAll("deliveryModes").map(String).filter((m) => ["ONSITE", "VIRTUAL", "HYBRID"].includes(m)) as ("ONSITE" | "VIRTUAL" | "HYBRID")[];
  if (!modes.length) return { error: "Pick at least one delivery mode." };
  const cities = parseList(fd.get("cities"));
  if (modes.some((m) => m !== "VIRTUAL") && !cities.length) return { error: "Add the cities you can deliver onsite in, or choose virtual only." };
  const min = Number(fd.get("dayRateMin") || 0) || null, max = Number(fd.get("dayRateMax") || 0) || null;
  if (min && max && max < min) return { error: "The maximum day rate must be at least the minimum." };
  await db.trainerProfile.update({ where: { id: user.trainerProfile.id }, data: { deliveryModes: modes, cities, dayRateMin: min, dayRateMax: max, currency: String(fd.get("currency") || "INR"), availabilityNote: String(fd.get("availabilityNote") ?? "").trim() || null } });
  for (const i of [1, 2]) {
    const s = String(fd.get(`blockStart${i}`) || ""), e = String(fd.get(`blockEnd${i}`) || "");
    if (!s || !e) continue;
    const start = new Date(s), end = new Date(e);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return { error: `Availability block ${i}: check the dates.` };
    const kind = String(fd.get(`blockKind${i}`)) === "TENTATIVE" ? "TENTATIVE" : "UNAVAILABLE";
    await db.availabilityBlock.create({ data: { trainerId: user.trainerProfile.id, startDate: start, endDate: end, kind, note: kind === "TENTATIVE" ? "Tentative (added during onboarding)" : "Unavailable (added during onboarding)" } });
  }
  await bump(user.id, 4);
  redirect("/onboarding/trainer?step=4");
}

export async function trainerStep4(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Trainer accounts only." };
  for (const i of [1, 2, 3]) {
    const title = String(fd.get(`expTitle${i}`) ?? "").trim(), org = String(fd.get(`expOrg${i}`) ?? "").trim();
    if (!title || !org) continue;
    const start = String(fd.get(`expStart${i}`) || ""), end = String(fd.get(`expEnd${i}`) || "");
    await db.experience.create({ data: { trainerId: user.trainerProfile.id, title, organisation: org, startDate: start ? new Date(`${start}-01`) : null, endDate: end ? new Date(`${end}-01`) : null, current: String(fd.get(`expCurrent${i}`)) === "1", description: String(fd.get(`expDesc${i}`) ?? "").trim() } });
  }
  const courseTitle = String(fd.get("courseTitle") ?? "").trim();
  if (courseTitle) {
    const summary = String(fd.get("courseSummary") ?? "").trim();
    if (summary.length < 20) return { error: "Describe the course in a sentence or two (at least 20 characters)." };
    const profile = await db.trainerProfile.findUnique({ where: { id: user.trainerProfile.id }, select: { deliveryModes: true, skills: { select: { slug: true, categoryId: true }, take: 5 } } });
    await db.course.create({ data: { trainerId: user.trainerProfile.id, title: courseTitle, summary, durationDays: Math.max(1, Math.min(30, Number(fd.get("courseDays") || 1))), modes: profile?.deliveryModes ?? [], published: true, categoryId: profile?.skills[0]?.categoryId ?? null, skills: { connect: (profile?.skills ?? []).map((s) => ({ slug: s.slug })) } } });
  }
  const videoUrl = String(fd.get("videoUrl") ?? "").trim();
  if (videoUrl && !/^https?:\/\//.test(videoUrl)) return { error: "The intro video link must start with http(s)://" };
  await db.trainerProfile.update({ where: { id: user.trainerProfile.id }, data: { videoUrl: videoUrl || null } });
  await bump(user.id, 5);
  redirect("/onboarding/trainer?step=5");
}

export async function trainerFinish() {
  const user = await requireUser();
  if (!user.trainerProfile) return;
  await finish(user.id);
}

/* ---------------- Company ---------------- */

async function ownerContext() {
  const user = await requireUser();
  if (!user.membership) return null;
  return { user, companyId: user.membership.company.id, isOwner: user.membership.role === "OWNER" };
}

export async function companyStep1(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await ownerContext();
  if (!ctx) return { error: "Company accounts only." };
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Enter the company name." };
  let logoUrl: string | null = null;
  try { logoUrl = await saveUpload(fd.get("logo") as File | null, "logos", ["image"]); } catch (e) { return { error: (e as Error).message }; }
  const website = String(fd.get("website") ?? "").trim().replace(/^(?!https?:\/\/)/, "https://");
  await db.company.update({ where: { id: ctx.companyId }, data: { name, type: String(fd.get("type")) === "TRAINING_PARTNER" ? "TRAINING_PARTNER" : "DIRECT", industry: String(fd.get("industry") ?? "").trim(), size: String(fd.get("size") ?? ""), website: website === "https://" ? null : website, description: String(fd.get("description") ?? "").trim(), ...(logoUrl ? { logoUrl } : {}) } });
  await bump(ctx.user.id, 2);
  redirect("/onboarding/company?step=2");
}

export async function companyStep2(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await ownerContext();
  if (!ctx) return { error: "Company accounts only." };
  const gstin = String(fd.get("gstin") ?? "").trim().toUpperCase();
  if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) return { error: "That does not look like a valid GSTIN (15 characters, e.g. 29ABCDE1234F1Z5)." };
  const company = await db.company.findUnique({ where: { id: ctx.companyId }, select: { domain: true, website: true, domainVerifiedAt: true } });
  // Automatic domain verification: the owner's work-email domain matches the website host.
  let autoVerified = false;
  const emailDomain = ctx.user.email.split("@")[1]?.toLowerCase();
  const host = company?.website ? new URL(company.website).hostname.replace(/^www\./, "").toLowerCase() : null;
  if (!company?.domainVerifiedAt && emailDomain && host && !FREE_MAIL.includes(emailDomain) && (host === emailDomain || host.endsWith(`.${emailDomain}`) || emailDomain.endsWith(`.${host}`))) autoVerified = true;
  await db.company.update({ where: { id: ctx.companyId }, data: { gstin: gstin || null, billingAddress: String(fd.get("billingAddress") ?? "").trim() || null, ...(autoVerified ? { domainVerifiedAt: new Date(), domain: company?.domain ?? emailDomain } : {}) } });
  if (autoVerified) await notify(ctx.user.id, "verification", "Company domain verified", `${emailDomain} matches your website, so your company now carries the verified badge.`, "/settings");
  await bump(ctx.user.id, 3);
  redirect("/onboarding/company?step=3");
}

export async function companyStep3(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await ownerContext();
  if (!ctx) return { error: "Company accounts only." };
  const cats = fd.getAll("categories").map(String).filter(Boolean);
  if (!cats.length) return { error: "Pick at least one domain you hire trainers for." };
  await db.company.update({ where: { id: ctx.companyId }, data: { hiringCategories: cats, hiringCities: parseList(fd.get("cities")), batchesPerQuarter: String(fd.get("batchesPerQuarter") || "") || null, budgetBand: String(fd.get("budgetBand") || "") || null } });
  // Seed one trainer alert per chosen domain's most common skill so the bench fills up on its own.
  const existing = await db.savedSearch.count({ where: { userId: ctx.user.id, kind: "TRAINERS" } });
  if (!existing) {
    const categories = await db.category.findMany({ where: { slug: { in: cats } }, select: { name: true, skills: { select: { slug: true }, orderBy: { trainers: { _count: "desc" } }, take: 1 } } });
    for (const c of categories) if (c.skills[0]) await db.savedSearch.create({ data: { userId: ctx.user.id, kind: "TRAINERS", name: `${c.name} trainers`, params: { skill: c.skills[0].slug }, alerts: true } });
  }
  await bump(ctx.user.id, 4);
  redirect("/onboarding/company?step=4");
}

export async function companyStep4(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await ownerContext();
  if (!ctx) return { error: "Company accounts only." };
  const rows = [1, 2, 3].map((i) => ({ name: String(fd.get(`name${i}`) ?? "").trim(), email: String(fd.get(`email${i}`) ?? "").trim().toLowerCase(), role: (["OWNER", "ADMIN", "HIRING_MANAGER", "FINANCE", "VIEWER"].includes(String(fd.get(`role${i}`))) ? String(fd.get(`role${i}`)) : "HIRING_MANAGER") as "OWNER" | "ADMIN" | "HIRING_MANAGER" | "FINANCE" | "VIEWER" })).filter((r) => r.email);
  if (rows.length && !ctx.isOwner) return { error: "Only the company owner can add team members. Skip this step or ask the owner." };
  const ent = await entitlementsFor(ctx.user);
  const current = await db.companyMember.count({ where: { companyId: ctx.companyId } });
  if (current + rows.length > ent.memberLimit) return { error: `Your plan allows ${ent.memberLimit} team members. Invite fewer now or upgrade later from Pricing.` };
  const temps: string[] = [];
  for (const r of rows) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) return { error: `“${r.email}” is not a valid email.` };
    const existing = await db.user.findUnique({ where: { email: r.email }, include: { memberships: true } });
    if (existing?.memberships.some((m) => m.companyId === ctx.companyId)) return { error: `${r.email} is already on your team.` };
    if (existing && isStaffRole(existing.role)) return { error: `${r.email} is a CorpGurus staff account.` };
    const temp = `Cg-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 6)}`;
    const member = existing ?? (await db.user.create({ data: { name: r.name || r.email.split("@")[0], email: r.email, role: "COMPANY", passwordHash: await bcrypt.hash(temp, 10), onboardingCompletedAt: new Date() } }));
    await db.companyMember.create({ data: { companyId: ctx.companyId, userId: member.id, role: r.role } });
    await notify(member.id, "team", `You were added to ${ctx.user.membership!.company.name}`, `${ctx.user.name} added you as ${r.role.toLowerCase()}.`, "/dashboard");
    if (!existing) temps.push(`${r.email}: ${temp}`);
  }
  await bump(ctx.user.id, 5);
  revalidatePath("/onboarding/company");
  if (temps.length) return { ok: `Team added. Temporary passwords (share securely): ${temps.join(" · ")}. Continue when ready.` };
  redirect("/onboarding/company?step=5");
}

export async function companyFinish(fd: FormData) {
  const ctx = await ownerContext();
  if (!ctx) return;
  const next = String(fd.get("next") || "");
  await db.user.update({ where: { id: ctx.user.id }, data: { onboardingCompletedAt: new Date(), onboardingStep: 5 } });
  revalidatePath("/dashboard"); revalidatePath("/settings");
  redirect(next === "post" ? "/requirements/new" : next === "import" ? "/requirements/import" : "/dashboard?onboarded=1");
}

/** Skip the wizard entirely (link in the header). Nothing is lost; the dashboard checklist keeps nudging. */
export async function skipOnboarding() {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { onboardingCompletedAt: new Date() } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
