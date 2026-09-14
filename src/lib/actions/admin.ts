"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyGstin } from "@/lib/kyc";
import { requireRole, requireStaff } from "@/lib/auth";
import { audit, notify } from "@/lib/notify";
import { slugify } from "@/lib/utils";
import { qualifyReferral } from "@/lib/actions/referrals";
import type { ActionState } from "@/lib/types";


export async function reviewCertification(fd: FormData) {
  const admin = await requireStaff("verify");
  const id = String(fd.get("id"));
  const decision = String(fd.get("decision")) as "VERIFIED" | "REJECTED";
  const note = String(fd.get("note") ?? "").trim() || null;
  const cert = await db.certification.findUnique({ where: { id }, include: { trainer: { select: { id: true, userId: true, slug: true } } } });
  if (!cert) return;
  await db.certification.update({ where: { id }, data: { status: decision, reviewNote: note, reviewedById: admin.id } });
  if (decision === "VERIFIED") {
    await db.trainerProfile.update({ where: { id: cert.trainer.id }, data: { verifiedAt: new Date() } });
    await qualifyReferral(cert.trainer.userId);
  }
  await notify(cert.trainer.userId, "verification", decision === "VERIFIED" ? "Certification verified" : "Certification not verified", `${cert.name} (${cert.issuer})${note ? `: ${note}` : ""}`, "/settings");
  await audit(admin.id, `certification.${decision.toLowerCase()}`, cert.id, { trainer: cert.trainer.slug, name: cert.name, note });
  revalidatePath("/admin"); revalidatePath(`/trainers/${cert.trainer.slug}`);
}

export async function verifyCompanyDomain(fd: FormData) {
  const admin = await requireStaff("verify");
  const id = String(fd.get("id"));
  const verify = String(fd.get("verify")) === "1";
  const c = await db.company.update({ where: { id }, data: { domainVerifiedAt: verify ? new Date() : null }, include: { members: { select: { userId: true } } } });
  if (verify) await notify(c.members.map((m) => m.userId), "verification", "Company verified", `${c.name} now shows a verified badge.`, `/companies/${c.slug}`);
  await audit(admin.id, verify ? "company.verify" : "company.unverify", c.id, { name: c.name });
  revalidatePath("/admin"); revalidatePath(`/companies/${c.slug}`);
}

export async function verifyIdentity(fd: FormData) {
  const admin = await requireStaff("verify");
  const id = String(fd.get("id"));
  const verify = String(fd.get("verify")) === "1";
  const note = String(fd.get("note") ?? "").trim() || null;
  const u = await db.user.update({ where: { id }, data: { identityVerifiedAt: verify ? new Date() : null, identityNote: note }, include: { trainerProfile: { select: { slug: true } } } });
  await notify(u.id, "verification", verify ? "Identity verified" : "Identity check not approved", verify ? "Your profile now carries the Identity verified badge." : note ?? "Upload a clearer document and try again.", "/settings");
  await audit(admin.id, verify ? "identity.verify" : "identity.reject", id, { note });
  revalidatePath("/admin"); revalidatePath("/admin/users");
  if (u.trainerProfile) revalidatePath(`/trainers/${u.trainerProfile.slug}`);
}

export async function verifyGst(fd: FormData) {
  const admin = await requireStaff("verify");
  const id = String(fd.get("id"));
  const verify = String(fd.get("verify")) === "1";
  if (String(fd.get("viaApi")) === "1") {
    const company = await db.company.findUnique({ where: { id }, select: { gstin: true } });
    const r = company?.gstin ? await verifyGstin(company.gstin) : null;
    if (!r?.valid) { await audit(admin.id, "company.gst.apicheck", id, { result: r?.message ?? "no gstin" }); revalidatePath("/admin"); return; }
    await db.company.update({ where: { id }, data: { gstLegalName: r.legalName ?? undefined, gstVerifiedVia: r.provider === "sandbox" ? "api" : "format" } });
  }
  const c = await db.company.update({ where: { id }, data: { gstVerifiedAt: verify ? new Date() : null }, include: { members: { select: { userId: true } } } });
  if (verify) await notify(c.members.map((m) => m.userId), "verification", "GST verified", `${c.name} now carries the GST verified badge.`, `/companies/${c.slug}`);
  await audit(admin.id, verify ? "company.gst.verify" : "company.gst.unverify", id, { gstin: c.gstin });
  revalidatePath("/admin"); revalidatePath(`/companies/${c.slug}`);
}

export async function setUserStatus(fd: FormData) {
  const admin = await requireStaff("users");
  const id = String(fd.get("id"));
  const status = String(fd.get("status")) === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.id === admin.id) return;
  if (target.role === "SUPER_ADMIN" || (target.role === "ADMIN" && admin.role !== "SUPER_ADMIN")) return;
  await db.user.update({ where: { id }, data: { status } });
  await audit(admin.id, `user.${status.toLowerCase()}`, id, { email: target.email });
  revalidatePath("/admin/users");
}

export async function moderateComment(fd: FormData) {
  const admin = await requireStaff("moderate");
  const id = String(fd.get("id"));
  const c = await db.comment.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit(admin.id, "comment.remove", id, { requirementId: c.requirementId });
  revalidatePath(`/requirements/${c.requirementId}`); revalidatePath("/admin");
}

export async function moderateRequirement(fd: FormData) {
  const admin = await requireStaff("moderate");
  const id = String(fd.get("id"));
  const r = await db.requirement.update({ where: { id }, data: { status: "CANCELLED" }, include: { company: { include: { members: { select: { userId: true } } } } } });
  await notify(r.company.members.map((m) => m.userId), "moderation", "Requirement removed by CorpGurus", `${r.title} was taken down. Reply to support@corpgurus.com if you think this is a mistake.`, `/requirements/${id}`);
  await audit(admin.id, "requirement.takedown", id, { title: r.title });
  revalidatePath(`/requirements/${id}`); revalidatePath("/admin");
}

export async function setAnnouncement(_p: ActionState, fd: FormData): Promise<ActionState> {
  const su = await requireRole(["SUPER_ADMIN"]);
  const text = String(fd.get("text") ?? "").trim();
  const tone = ["info", "warning", "success"].includes(String(fd.get("tone"))) ? String(fd.get("tone")) : "info";
  const href = String(fd.get("href") ?? "").trim();
  const until = String(fd.get("until") ?? "").trim();
  const rows: [string, string][] = [["announcement_text", text], ["announcement_tone", tone], ["announcement_href", href], ["announcement_until", until ? new Date(until).toISOString() : ""], ["announcement_id", String(Date.now())]];
  for (const [key, value] of rows) await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await audit(su.id, text ? "announcement.set" : "announcement.clear", "announcement", { text, tone, until });
  revalidatePath("/", "layout");
  return { ok: text ? "Announcement is live." : "Announcement cleared." };
}

export async function runJobsNow(): Promise<void> {
  const su = await requireRole(["SUPER_ADMIN"]);
  const { runDailyJobs } = await import("@/lib/jobs");
  const summary = await runDailyJobs();
  await audit(su.id, "jobs.run", "daily", { summary });
  revalidatePath("/admin/platform");
}

export async function createAdmin(_p: ActionState, fd: FormData): Promise<ActionState> {
  const su = await requireRole(["SUPER_ADMIN"]);
  const parsed = z.object({ name: z.string().trim().min(2), email: z.string().trim().toLowerCase().email(), password: z.string().min(8) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Name, valid email and an 8+ character password are required." };
  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "That email is already registered." };
  const role = (["ADMIN", "MODERATOR", "FINANCE", "SUPPORT"].includes(String(fd.get("role"))) ? String(fd.get("role")) : "ADMIN") as "ADMIN" | "MODERATOR" | "FINANCE" | "SUPPORT";
  const u = await db.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(password, 10), onboardingCompletedAt: new Date() } });
  await audit(su.id, "admin.create", u.id, { email, role });
  revalidatePath("/admin/platform");
  return { ok: `${name} can now sign in as ${role.toLowerCase().replace("_", " ")}.` };
}

export async function removeAdmin(fd: FormData) {
  const su = await requireRole(["SUPER_ADMIN"]);
  const id = String(fd.get("id"));
  const target = await db.user.findUnique({ where: { id } });
  if (!target || !["ADMIN", "MODERATOR", "FINANCE", "SUPPORT"].includes(target.role)) return;
  await db.user.update({ where: { id }, data: { status: "SUSPENDED" } });
  await audit(su.id, "admin.remove", id, { email: target.email });
  revalidatePath("/admin/platform");
}

export async function upsertTaxonomy(_p: ActionState, fd: FormData): Promise<ActionState> {
  const su = await requireRole(["SUPER_ADMIN"]);
  const kind = String(fd.get("kind")) === "category" ? "category" : "skill";
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Enter a name." };
  const slug = slugify(name);
  if (kind === "category") await db.category.upsert({ where: { slug }, create: { name, slug }, update: { name } });
  else await db.skill.upsert({ where: { slug }, create: { name, slug }, update: { name } });
  await audit(su.id, `${kind}.upsert`, slug);
  revalidatePath("/admin/platform");
  return { ok: `${kind === "category" ? "Domain" : "Skill"} “${name}” saved.` };
}

export async function updateSetting(_p: ActionState, fd: FormData): Promise<ActionState> {
  const su = await requireRole(["SUPER_ADMIN"]);
  const key = String(fd.get("key")), value = String(fd.get("value") ?? "").trim();
  if (!key) return { error: "Missing key." };
  await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await audit(su.id, "setting.update", key, { value });
  revalidatePath("/admin/platform");
  return { ok: `Saved ${key}.` };
}

/** Super admin changes a staff member's role (never their own, never another super admin's). */
export async function setStaffRole(fd: FormData) {
  const su = await requireRole(["SUPER_ADMIN"]);
  const id = String(fd.get("id")), role = String(fd.get("role"));
  if (id === su.id || !["ADMIN", "MODERATOR", "FINANCE", "SUPPORT", "SUPER_ADMIN"].includes(role)) return;
  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.role === "SUPER_ADMIN" || !["ADMIN", "MODERATOR", "FINANCE", "SUPPORT"].includes(target.role)) return;
  await db.user.update({ where: { id }, data: { role: role as "ADMIN" } });
  await audit(su.id, "admin.role", id, { from: target.role, to: role });
  revalidatePath("/admin/platform");
}

/** Super admin switches a platform feature on or off (Setting `feature_<key>`). */
export async function toggleFeature(fd: FormData) {
  const su = await requireStaff("platform");
  const key = String(fd.get("key")).replace(/[^a-z_]/g, "");
  const on = String(fd.get("on")) === "1";
  if (!key) return;
  await db.setting.upsert({ where: { key: `feature_${key}` }, create: { key: `feature_${key}`, value: on ? "1" : "0" }, update: { value: on ? "1" : "0" } });
  await audit(su.id, on ? "feature.on" : "feature.off", key);
  revalidatePath("/admin/platform"); revalidatePath("/admin/overview"); revalidatePath("/", "layout");
}
