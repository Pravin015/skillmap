"use server";

import { revalidatePath } from "next/cache";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/ratelimit";
import type { ActionState } from "@/lib/types";

/** Company members or the awarded trainer create one link per engagement. Learners open it without an account. */
export async function createFeedbackLink(fd: FormData) {
  const user = await requireUser();
  const requirementId = String(fd.get("requirementId"));
  const req = await db.requirement.findUnique({ where: { id: requirementId }, include: { company: { include: { members: { select: { userId: true } } } }, applications: { where: { status: "AWARDED" }, include: { trainer: { select: { id: true, userId: true } } } } } });
  if (!req || !["AWARDED", "COMPLETED"].includes(req.status)) return;
  const awarded = req.applications[0];
  if (!awarded) return;
  const allowed = req.company.members.some((m) => m.userId === user.id) || awarded.trainer.userId === user.id;
  if (!allowed) return;
  const existing = await db.feedbackLink.findFirst({ where: { requirementId, trainerId: awarded.trainer.id } });
  if (existing) return;
  const expires = new Date(Math.max(Date.now(), req.endDate.getTime()) + 30 * 86400000);
  await db.feedbackLink.create({ data: { token: randomBytes(18).toString("base64url"), requirementId, trainerId: awarded.trainer.id, createdById: user.id, expiresAt: expires } });
  if (awarded.trainer.userId !== user.id) await notify(awarded.trainer.userId, "feedback", "Participant feedback link created", `${req.company.name} created a learner feedback link for ${req.title}.`, `/requirements/${requirementId}`);
  revalidatePath(`/requirements/${requirementId}`);
}

export async function submitFeedback(_p: ActionState, fd: FormData): Promise<ActionState> {
  if (!(await rateLimit("feedback", 30, 60 * 60 * 1000))) return { error: "Too many submissions from this network. Try again later." };
  const token = String(fd.get("token") ?? "");
  const score = Number(fd.get("score"));
  const wouldRecommend = String(fd.get("wouldRecommend")) === "yes";
  const comment = String(fd.get("comment") ?? "").trim().slice(0, 1000) || null;
  if (!(score >= 1 && score <= 5)) return { error: "Pick a rating from 1 to 5." };
  const link = await db.feedbackLink.findUnique({ where: { token }, include: { _count: { select: { responses: true } }, trainer: { select: { userId: true, slug: true } }, requirement: { select: { title: true } } } });
  if (!link) return { error: "This feedback link is not valid." };
  if (link.expiresAt < new Date()) return { error: "This feedback link has expired." };
  if (link._count.responses >= link.maxResponses) return { error: "This session has already collected the maximum number of responses." };
  // Soft duplicate guard: one response per browser/IP per link.
  const h = await headers();
  const fingerprint = createHash("sha256").update(`${link.id}|${h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? ""}|${h.get("user-agent") ?? ""}`).digest("hex").slice(0, 32);
  if (await db.feedbackResponse.findFirst({ where: { linkId: link.id, fingerprint } })) return { error: "Looks like you already submitted feedback for this session. Thank you." };
  await db.feedbackResponse.create({ data: { linkId: link.id, score, wouldRecommend, comment, fingerprint } });
  if ((link._count.responses + 1) % 5 === 1) await notify(link.trainer.userId, "feedback", "New participant feedback", `${link.requirement.title}: ${score}/5${comment ? ` · “${comment.slice(0, 80)}”` : ""}`, `/trainers/${link.trainer.slug}`);
  revalidatePath(`/trainers/${link.trainer.slug}`);
  return { ok: "Thank you. Your feedback is anonymous and helps trainers improve." };
}
