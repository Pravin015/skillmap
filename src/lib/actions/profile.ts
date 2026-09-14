"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { parseList } from "@/lib/utils";
import { savePrivateUpload, saveUpload } from "@/lib/uploads";
import { entitlementsFor } from "@/lib/billing";
import { alertTrainerSearches } from "@/lib/saved-searches";
import type { ActionState } from "@/lib/types";

export async function updateTrainerProfile(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "No trainer profile on this account." };
  const headline = String(fd.get("headline") ?? "").trim();
  if (headline.length < 8) return { error: "Headline should be at least 8 characters." };
  const modes = fd.getAll("deliveryModes").map(String) as Array<"ONSITE" | "VIRTUAL" | "HYBRID">;
  const min = Number(fd.get("dayRateMin") || 0) || null, max = Number(fd.get("dayRateMax") || 0) || null;
  if (min && max && max < min) return { error: "Max day rate must be at least the min." };
  let avatarUrl: string | null | undefined;
  try { avatarUrl = await saveUpload(fd.get("avatar") as File | null, "avatars", ["image"]); } catch (e) { return { error: (e as Error).message }; }

  await db.user.update({ where: { id: user.id }, data: { name: String(fd.get("name") ?? user.name).trim() || user.name, ...(avatarUrl ? { avatarUrl } : {}) } });
  await db.trainerProfile.update({
    where: { id: user.trainerProfile.id },
    data: {
      headline, bio: String(fd.get("bio") ?? "").trim(), cities: parseList(fd.get("cities")), languages: parseList(fd.get("languages")), deliveryModes: modes,
      yearsExperience: Number(fd.get("yearsExperience") || 0), dayRateMin: min, dayRateMax: max, currency: String(fd.get("currency") || "INR"),
      availabilityNote: String(fd.get("availabilityNote") ?? "").trim() || null,
      videoUrl: String(fd.get("videoUrl") ?? "").trim() || null, gstin: String(fd.get("gstin") ?? "").trim() || null, paymentDetails: String(fd.get("paymentDetails") ?? "").trim() || null,
      skills: { set: fd.getAll("skills").map((s) => ({ slug: String(s) })) },
    },
  });
  await alertTrainerSearches(user.trainerProfile.id);
  revalidatePath("/settings"); revalidatePath(`/trainers/${user.trainerProfile.slug}`); revalidatePath("/trainers");
  return { ok: "Profile saved." };
}

export async function addCertification(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "No trainer profile." };
  const name = String(fd.get("name") ?? "").trim(), issuer = String(fd.get("issuer") ?? "").trim();
  if (!name || !issuer) return { error: "Certification name and issuer are required." };
  let fileUrl: string | null = null;
  try { fileUrl = await saveUpload(fd.get("file") as File | null, "certs", ["image", "doc"]); } catch (e) { return { error: (e as Error).message }; }
  const issuedOn = String(fd.get("issuedOn") || ""), expiresOn = String(fd.get("expiresOn") || "");
  await db.certification.create({ data: { trainerId: user.trainerProfile.id, name, issuer, credentialId: String(fd.get("credentialId") ?? "").trim() || null, issuedOn: issuedOn ? new Date(issuedOn) : null, expiresOn: expiresOn ? new Date(expiresOn) : null, fileUrl } });
  const staff = await db.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true } });
  await notify(staff.map((s) => s.id), "verification", "Certification submitted for review", `${user.name}: ${name} (${issuer})`, "/admin");
  revalidatePath("/settings");
  return { ok: "Submitted. An administrator will verify it, usually within two working days." };
}

export async function deleteCertification(fd: FormData) {
  const user = await requireUser();
  if (!user.trainerProfile) return;
  await db.certification.deleteMany({ where: { id: String(fd.get("id")), trainerId: user.trainerProfile.id } });
  revalidatePath("/settings");
}

export async function updateCompany(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.membership) return { error: "No company on this account." };
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Company name is required." };
  let logoUrl: string | null | undefined;
  try { logoUrl = await saveUpload(fd.get("logo") as File | null, "logos", ["image"]); } catch (e) { return { error: (e as Error).message }; }
  const website = String(fd.get("website") ?? "").trim();
  await db.company.update({
    where: { id: user.membership.company.id },
    data: { name, industry: String(fd.get("industry") ?? "").trim(), size: String(fd.get("size") ?? ""), website: website || null, cities: parseList(fd.get("cities")), description: String(fd.get("description") ?? "").trim(), type: String(fd.get("type")) === "TRAINING_PARTNER" ? "TRAINING_PARTNER" : "DIRECT", gstin: String(fd.get("gstin") ?? "").trim() || null, billingAddress: String(fd.get("billingAddress") ?? "").trim() || null, ...(logoUrl ? { logoUrl } : {}) },
  });
  await db.user.update({ where: { id: user.id }, data: { name: String(fd.get("memberName") ?? user.name).trim() || user.name } });
  revalidatePath("/settings"); revalidatePath(`/companies/${user.membership.company.slug}`);
  return { ok: "Company page saved." };
}

export async function inviteMember(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.membership || user.membership.role !== "OWNER") return { error: "Only the company owner can add members." };
  const parsed = z.object({ name: z.string().trim().min(2), email: z.string().trim().toLowerCase().email(), role: z.enum(["OWNER", "RECRUITER"]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Enter a name, a valid email and a role." };
  const { name, email, role } = parsed.data;
  const ent = await entitlementsFor(user);
  const members = await db.companyMember.count({ where: { companyId: user.membership.company.id } });
  if (members >= ent.memberLimit) return { error: `Your plan allows ${ent.memberLimit} team members. Upgrade on the Pricing page to add more.` };
  const existing = await db.user.findUnique({ where: { email }, include: { membership: true } });
  if (existing?.membership) return { error: "That person already belongs to a company." };
  if (existing && existing.role !== "COMPANY") return { error: "That email belongs to a trainer or staff account." };
  const temp = `Cg-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 6)}`;
  const member = existing ?? (await db.user.create({ data: { name, email, role: "COMPANY", passwordHash: await bcrypt.hash(temp, 10) } }));
  await db.companyMember.create({ data: { companyId: user.membership.company.id, userId: member.id, role } });
  await notify(member.id, "team", `You were added to ${user.membership.company.name}`, `${user.name} added you as ${role.toLowerCase()}.`, "/dashboard");
  revalidatePath("/settings");
  return { ok: existing ? `${name} added to your team.` : `${name} added. Temporary password: ${temp} — share it securely; they can change it in Settings.` };
}

export async function removeMember(fd: FormData) {
  const user = await requireUser();
  if (!user.membership || user.membership.role !== "OWNER") return;
  const id = String(fd.get("id"));
  const m = await db.companyMember.findFirst({ where: { id, companyId: user.membership.company.id } });
  if (!m || m.userId === user.id) return;
  await db.companyMember.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function uploadIdentity(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  let url: string | null = null;
  try { url = await savePrivateUpload(fd.get("document") as File | null, "identity"); } catch (e) { return { error: (e as Error).message }; }
  if (!url) return { error: "Choose a document." };
  await db.user.update({ where: { id: user.id }, data: { identityDocUrl: url, identityVerifiedAt: null, identityNote: null } });
  const staff = await db.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true } });
  await notify(staff.map((s) => s.id), "verification", "Identity document submitted", `${user.name} uploaded an ID for verification.`, "/admin");
  revalidatePath("/settings");
  return { ok: "Submitted. Staff review identity documents within two working days. The file is never shown publicly." };
}

export async function updateEmailPrefs(fd: FormData) {
  const user = await requireUser();
  const phone = String(fd.get("phone") ?? "").replace(/[^\d+]/g, "");
  await db.user.update({ where: { id: user.id }, data: { emailNotifications: String(fd.get("emailNotifications")) === "1", phone: phone || null, whatsappAlerts: String(fd.get("whatsappAlerts")) === "1" && !!phone } });
  revalidatePath("/settings");
}

export async function updateAccount(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const current = String(fd.get("current") ?? ""), next = String(fd.get("next") ?? "");
  const full = await db.user.findUnique({ where: { id: user.id } });
  if (!full) return { error: "Account not found." };
  if (full.passwordHash && !(await bcrypt.compare(current, full.passwordHash))) return { error: "Current password is incorrect." };
  if (next.length < 8) return { error: "New password needs at least 8 characters." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: full.passwordHash ? "Password updated." : "Password set. You can now sign in with email as well." };
}
