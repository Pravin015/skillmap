"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { daysBetween } from "@/lib/utils";
import { entitlementsFor } from "@/lib/billing";
import type { ActionState } from "@/lib/types";

const reqSchema = z.object({
  title: z.string().trim().min(8, "Give the requirement a descriptive title"),
  description: z.string().trim().min(40, "Describe the audience, the outcome, and what you provide (at least 40 characters)"),
  categoryId: z.string().min(1, "Pick a domain"),
  mode: z.enum(["ONSITE", "VIRTUAL", "HYBRID"]),
  city: z.string().trim().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  participants: z.coerce.number().int().min(1, "How many participants?"),
  budgetMin: z.coerce.number().int().optional(),
  budgetMax: z.coerce.number().int().optional(),
  currency: z.enum(["INR", "USD"]).default("INR"),
  language: z.string().trim().default("English"),
  visibility: z.enum(["PUBLIC", "INVITE_ONLY"]).default("PUBLIC"),
});

async function companyContext() {
  const user = await requireUser();
  if (user.role !== "COMPANY" || !user.membership) return null;
  return { user, companyId: user.membership.company.id, companyName: user.membership.company.name };
}

export async function createRequirement(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await companyContext();
  if (!ctx) return { error: "Only company members can post requirements." };
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const parsed = reqSchema.safeParse({ ...raw, budgetMin: raw.budgetMin || undefined, budgetMax: raw.budgetMax || undefined, city: raw.city || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const start = new Date(d.startDate), end = new Date(d.endDate);
  if (end < start) return { error: "End date must be on or after the start date" };
  if (d.mode !== "VIRTUAL" && !d.city) return { error: "Onsite and hybrid requirements need a city" };
  if (d.budgetMin && d.budgetMax && d.budgetMax < d.budgetMin) return { error: "Budget max must be at least budget min" };

  const ent = await entitlementsFor(ctx.user);
  if (!ent.unlimitedRequirements) {
    const openFreeLimit = Number((await db.setting.findUnique({ where: { key: "free_open_requirements" } }))?.value ?? 2);
    const openCount = await db.requirement.count({ where: { companyId: ctx.companyId, status: { in: ["OPEN", "SHORTLISTING"] } } });
    if (openCount >= openFreeLimit) return { error: `The free plan allows ${openFreeLimit} open requirements. Close one, or upgrade to Company Growth for unlimited posts (see Pricing).` };
  }

  const skillSlugs = fd.getAll("skills").map(String).filter(Boolean);
  const req = await db.requirement.create({
    data: {
      companyId: ctx.companyId, postedById: ctx.user.id, title: d.title, description: d.description, categoryId: d.categoryId, mode: d.mode, city: d.city ?? null,
      startDate: start, endDate: end, days: daysBetween(start, end), participants: d.participants, budgetMin: d.budgetMin ?? null, budgetMax: d.budgetMax ?? null,
      currency: d.currency, language: d.language, visibility: d.visibility, skills: { connect: skillSlugs.map((slug) => ({ slug })) },
    },
  });

  const inviteTrainerId = String(fd.get("inviteTrainerId") || "");
  if (inviteTrainerId) {
    const tr = await db.trainerProfile.findUnique({ where: { id: inviteTrainerId }, select: { userId: true } });
    if (tr) {
      await db.requirement.update({ where: { id: req.id }, data: { invitedTrainers: { connect: { id: inviteTrainerId } } } });
      await notify(tr.userId, "invite", "A company requested one of your courses", `${ctx.companyName}: ${d.title}`, `/requirements/${req.id}`);
    }
  }
  if (d.visibility === "PUBLIC" && skillSlugs.length) {
    const matching = await db.trainerProfile.findMany({ where: { skills: { some: { slug: { in: skillSlugs } } } }, select: { userId: true } });
    await notify(matching.map((m) => m.userId), "requirement", "New requirement matches your skills", `${ctx.companyName}: ${d.title}`, `/requirements/${req.id}`);
  }
  redirect(`/requirements/${req.id}`);
}

export async function inviteTrainer(fd: FormData) {
  const ctx = await companyContext();
  if (!ctx) return;
  const requirementId = String(fd.get("requirementId"));
  const trainerId = String(fd.get("trainerId"));
  const req = await db.requirement.findFirst({ where: { id: requirementId, companyId: ctx.companyId }, select: { title: true } });
  const trainer = await db.trainerProfile.findUnique({ where: { id: trainerId }, select: { userId: true } });
  if (!req || !trainer) return;
  await db.requirement.update({ where: { id: requirementId }, data: { invitedTrainers: { connect: { id: trainerId } } } });
  await notify(trainer.userId, "invite", "You were invited to apply", `${ctx.companyName} invited you to: ${req.title}`, `/requirements/${requirementId}`);
  revalidatePath(`/requirements/${requirementId}`);
}

export async function setRequirementStatus(fd: FormData) {
  const ctx = await companyContext();
  if (!ctx) return;
  const id = String(fd.get("id"));
  const status = String(fd.get("status")) as "OPEN" | "SHORTLISTING" | "COMPLETED" | "CANCELLED";
  if (!["OPEN", "SHORTLISTING", "COMPLETED", "CANCELLED"].includes(status)) return;
  const req = await db.requirement.findFirst({ where: { id, companyId: ctx.companyId }, include: { applications: { where: { status: { in: ["APPLIED", "SHORTLISTED", "AWARDED"] } }, include: { trainer: { select: { userId: true } } } } } });
  if (!req) return;
  await db.requirement.update({ where: { id }, data: { status } });
  if (status === "CANCELLED") {
    await db.availabilityBlock.deleteMany({ where: { requirementId: id } });
    await notify(req.applications.map((a) => a.trainer.userId), "requirement", "Requirement cancelled", `${ctx.companyName} cancelled: ${req.title}`, `/requirements/${id}`);
  }
  if (status === "COMPLETED") {
    await notify(req.applications.filter((a) => a.status === "AWARDED").map((a) => a.trainer.userId), "rating", "Engagement completed — leave a rating", `How was working with ${ctx.companyName} on ${req.title}?`, `/requirements/${id}`);
  }
  revalidatePath(`/requirements/${id}`);
  revalidatePath("/dashboard");
}

export async function addComment(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const requirementId = String(fd.get("requirementId"));
  const parentId = String(fd.get("parentId") || "") || null;
  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 2) return { error: "Write something first." };
  const req = await db.requirement.findUnique({ where: { id: requirementId }, include: { company: { include: { members: { select: { userId: true } } } } } });
  if (!req) return { error: "Requirement not found." };
  await db.comment.create({ data: { requirementId, authorId: user.id, parentId, body } });
  const isMember = req.company.members.some((m) => m.userId === user.id);
  if (!isMember) {
    await notify(req.company.members.map((m) => m.userId), "comment", "New question on your requirement", `${user.name} on ${req.title}: ${body.slice(0, 90)}`, `/requirements/${requirementId}#comments`);
  } else if (parentId) {
    const parent = await db.comment.findUnique({ where: { id: parentId }, select: { authorId: true } });
    if (parent && parent.authorId !== user.id) await notify(parent.authorId, "comment", `${req.company.name} replied`, body.slice(0, 120), `/requirements/${requirementId}#comments`);
  }
  revalidatePath(`/requirements/${requirementId}`);
  return { ok: "Posted" };
}

export async function apply(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "TRAINER" || !user.trainerProfile) return { error: "Only trainers can apply." };
  const requirementId = String(fd.get("requirementId"));
  const coverNote = String(fd.get("coverNote") ?? "").trim();
  const proposedRate = Number(fd.get("proposedRate") || 0) || null;
  if (coverNote.length < 30) return { error: "Tell them why you fit in at least a couple of sentences." };
  const req = await db.requirement.findUnique({ where: { id: requirementId }, include: { company: { include: { members: { select: { userId: true } } } }, invitedTrainers: { select: { id: true } } } });
  if (!req || !["OPEN", "SHORTLISTING"].includes(req.status)) return { error: "This requirement is no longer accepting applications." };
  if (req.visibility === "INVITE_ONLY" && !req.invitedTrainers.some((t) => t.id === user.trainerProfile!.id)) return { error: "This requirement is invite-only." };
  if (await db.application.findUnique({ where: { requirementId_trainerId: { requirementId, trainerId: user.trainerProfile.id } } })) return { error: "You already applied." };

  const ent = await entitlementsFor(user);
  if (!ent.unlimitedApplications) {
    const limit = Number((await db.setting.findUnique({ where: { key: "free_applications_per_month" } }))?.value ?? 5);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const used = await db.application.count({ where: { trainerId: user.trainerProfile.id, createdAt: { gte: monthStart } } });
    if (used >= limit) return { error: `The free plan allows ${limit} applications a month. Upgrade to Trainer Pro for unlimited applications (see Pricing).` };
  }

  await db.application.create({ data: { requirementId, trainerId: user.trainerProfile.id, coverNote, proposedRate } });
  await notify(req.company.members.map((m) => m.userId), "application", "New application", `${user.name} applied to ${req.title}`, `/dashboard/requirements/${requirementId}/applicants`);
  revalidatePath(`/requirements/${requirementId}`);
  return { ok: "Application sent. The company can now message you directly." };
}

export async function withdrawApplication(fd: FormData) {
  const user = await requireUser();
  if (!user.trainerProfile) return;
  const id = String(fd.get("id"));
  const app = await db.application.findFirst({ where: { id, trainerId: user.trainerProfile.id } });
  if (!app || ["AWARDED", "WITHDRAWN"].includes(app.status)) return;
  await db.application.update({ where: { id }, data: { status: "WITHDRAWN", statusChangedAt: new Date() } });
  revalidatePath("/dashboard/applications");
  revalidatePath(`/requirements/${app.requirementId}`);
}

export async function decideApplication(fd: FormData) {
  const ctx = await companyContext();
  if (!ctx) return;
  const id = String(fd.get("id"));
  const decision = String(fd.get("decision")) as "SHORTLISTED" | "AWARDED" | "DECLINED" | "APPLIED";
  const reason = String(fd.get("reason") ?? "").trim() || null;
  const app = await db.application.findFirst({ where: { id, requirement: { companyId: ctx.companyId } }, include: { requirement: true, trainer: { select: { userId: true } } } });
  if (!app) return;
  await db.application.update({ where: { id }, data: { status: decision, declineReason: decision === "DECLINED" ? reason : null, statusChangedAt: new Date() } });

  const reqId = app.requirementId;
  if (decision === "SHORTLISTED") {
    if (app.requirement.status === "OPEN") await db.requirement.update({ where: { id: reqId }, data: { status: "SHORTLISTING" } });
    await notify(app.trainer.userId, "application", "You were shortlisted", `${ctx.companyName} shortlisted you for ${app.requirement.title}`, "/dashboard/applications");
  }
  if (decision === "AWARDED") {
    await db.requirement.update({ where: { id: reqId }, data: { status: "AWARDED" } });
    await db.availabilityBlock.create({ data: { trainerId: app.trainerId, startDate: app.requirement.startDate, endDate: app.requirement.endDate, kind: "BOOKED", requirementId: reqId, note: app.requirement.title } });
    const others = await db.application.findMany({ where: { requirementId: reqId, id: { not: id }, status: { in: ["APPLIED", "SHORTLISTED"] } }, include: { trainer: { select: { userId: true } } } });
    await db.application.updateMany({ where: { requirementId: reqId, id: { not: id }, status: { in: ["APPLIED", "SHORTLISTED"] } }, data: { status: "DECLINED", declineReason: "The requirement was awarded to another trainer.", statusChangedAt: new Date() } });
    await notify(app.trainer.userId, "application", "🎉 You were awarded the engagement", `${ctx.companyName}: ${app.requirement.title}. Check messages for next steps.`, "/dashboard/applications");
    await notify(others.map((o) => o.trainer.userId), "application", "Requirement awarded to another trainer", `${ctx.companyName} closed ${app.requirement.title}. Thank you for applying.`, "/dashboard/applications");
  }
  if (decision === "DECLINED") {
    await notify(app.trainer.userId, "application", "Application not selected", `${ctx.companyName} · ${app.requirement.title}${reason ? `: ${reason}` : ""}`, "/dashboard/applications");
  }
  revalidatePath(`/dashboard/requirements/${reqId}/applicants`);
  revalidatePath(`/requirements/${reqId}`);
}

export async function rateCounterparty(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const requirementId = String(fd.get("requirementId"));
  const toUserId = String(fd.get("toUserId"));
  const score = Number(fd.get("score"));
  const review = String(fd.get("review") ?? "").trim() || null;
  if (!(score >= 1 && score <= 5)) return { error: "Pick a score from 1 to 5." };
  const req = await db.requirement.findUnique({ where: { id: requirementId }, include: { company: { include: { members: true } }, applications: { where: { status: "AWARDED" }, include: { trainer: true } } } });
  if (!req || req.status !== "COMPLETED") return { error: "Ratings open once the requirement is marked completed." };
  const awarded = req.applications[0];
  const isMember = req.company.members.some((m) => m.userId === user.id);
  const isAwardedTrainer = awarded?.trainer.userId === user.id;
  if (!isMember && !isAwardedTrainer) return { error: "Only the company and the awarded trainer can rate." };
  await db.rating.upsert({ where: { requirementId_fromUserId_toUserId: { requirementId, fromUserId: user.id, toUserId } }, create: { requirementId, fromUserId: user.id, toUserId, score, review }, update: { score, review } });
  revalidatePath(`/requirements/${requirementId}`);
  return { ok: "Rating saved." };
}
