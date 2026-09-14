"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/types";
import { companyCan } from "@/lib/permissions";

async function companyOf() {
  const user = await requireUser();
  if (!user.membership || !companyCan(user.membership.role, "company_settings")) return null;
  return { user, companyId: user.membership.company.id };
}
function refresh(id?: string) {
  revalidatePath("/dashboard/learning-paths");
  if (id) revalidatePath(`/dashboard/learning-paths/${id}`);
}

/** Company creates a learning path (a sequence of trainings for one audience). */
export async function createLearningPath(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await companyOf();
  if (!ctx) return { error: "Only company members can create learning paths." };
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 4) return { error: "Give the path a title." };
  const targetDate = String(fd.get("targetDate") || "");
  const path = await db.learningPath.create({ data: { companyId: ctx.companyId, createdById: ctx.user.id, title: title.slice(0, 120), description: String(fd.get("description") ?? "").trim().slice(0, 2000), audience: String(fd.get("audience") ?? "").trim().slice(0, 160) || null, targetDate: targetDate ? new Date(targetDate) : null } });
  refresh();
  redirect(`/dashboard/learning-paths/${path.id}`);
}

export async function updateLearningPath(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await companyOf();
  if (!ctx) return { error: "Not allowed." };
  const id = String(fd.get("id"));
  const path = await db.learningPath.findFirst({ where: { id, companyId: ctx.companyId } });
  if (!path) return { error: "Path not found." };
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 4) return { error: "Give the path a title." };
  const targetDate = String(fd.get("targetDate") || "");
  await db.learningPath.update({ where: { id }, data: { title: title.slice(0, 120), description: String(fd.get("description") ?? "").trim().slice(0, 2000), audience: String(fd.get("audience") ?? "").trim().slice(0, 160) || null, targetDate: targetDate ? new Date(targetDate) : null, archived: String(fd.get("archived")) === "1" } });
  refresh(id);
  return { ok: "Saved." };
}

export async function addLearningStep(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await companyOf();
  if (!ctx) return { error: "Not allowed." };
  const pathId = String(fd.get("pathId"));
  const path = await db.learningPath.findFirst({ where: { id: pathId, companyId: ctx.companyId }, include: { _count: { select: { steps: true } } } });
  if (!path) return { error: "Path not found." };
  if (path._count.steps >= 20) return { error: "Up to 20 steps per path." };
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 4) return { error: "Give the step a title." };
  const days = Math.max(1, Math.min(60, Number(fd.get("days") || 1)));
  const participants = Math.max(1, Math.min(5000, Number(fd.get("participants") || 10)));
  const skills = fd.getAll("skills").map(String).filter(Boolean).slice(0, 10);
  await db.learningPathStep.create({ data: { pathId, position: path._count.steps, title: title.slice(0, 120), description: String(fd.get("description") ?? "").trim().slice(0, 2000), days, participants, skills } });
  refresh(pathId);
  return { ok: "Step added." };
}

export async function deleteLearningStep(fd: FormData) {
  const ctx = await companyOf();
  if (!ctx) return;
  const step = await db.learningPathStep.findFirst({ where: { id: String(fd.get("id")), path: { companyId: ctx.companyId } } });
  if (!step) return;
  await db.learningPathStep.delete({ where: { id: step.id } });
  const rest = await db.learningPathStep.findMany({ where: { pathId: step.pathId }, orderBy: { position: "asc" }, select: { id: true } });
  await Promise.all(rest.map((s, i) => db.learningPathStep.update({ where: { id: s.id }, data: { position: i } })));
  refresh(step.pathId);
}

export async function moveLearningStep(fd: FormData) {
  const ctx = await companyOf();
  if (!ctx) return;
  const dir = String(fd.get("dir")) === "up" ? -1 : 1;
  const step = await db.learningPathStep.findFirst({ where: { id: String(fd.get("id")), path: { companyId: ctx.companyId } } });
  if (!step) return;
  const other = await db.learningPathStep.findFirst({ where: { pathId: step.pathId, position: step.position + dir } });
  if (!other) return;
  await db.$transaction([
    db.learningPathStep.update({ where: { id: step.id }, data: { position: other.position } }),
    db.learningPathStep.update({ where: { id: other.id }, data: { position: step.position } }),
  ]);
  refresh(step.pathId);
}

/** Detach a requirement from a step (e.g. it was cancelled and will be reposted). */
export async function unlinkLearningStep(fd: FormData) {
  const ctx = await companyOf();
  if (!ctx) return;
  const step = await db.learningPathStep.findFirst({ where: { id: String(fd.get("id")), path: { companyId: ctx.companyId } } });
  if (!step) return;
  await db.learningPathStep.update({ where: { id: step.id }, data: { requirementId: null } });
  refresh(step.pathId);
}

export async function deleteLearningPath(fd: FormData) {
  const ctx = await companyOf();
  if (!ctx) return;
  await db.learningPath.deleteMany({ where: { id: String(fd.get("id")), companyId: ctx.companyId } });
  refresh();
  redirect("/dashboard/learning-paths");
}
