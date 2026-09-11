"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveUpload } from "@/lib/uploads";
import type { ActionState } from "@/lib/types";

const schema = z.object({
  title: z.string().trim().min(4, "Give the course a title"),
  summary: z.string().trim().min(20, "Summarise the course in a sentence or two"),
  outline: z.string().trim().optional(),
  level: z.enum(["FOUNDATION", "INTERMEDIATE", "ADVANCED"]),
  durationDays: z.coerce.number().int().min(1, "Duration in days").max(60),
  maxParticipants: z.coerce.number().int().min(1).optional(),
  indicativeRate: z.coerce.number().int().min(0).optional(),
  currency: z.enum(["INR", "USD"]).default("INR"),
  categoryId: z.string().optional(),
});

function refresh(slug: string) {
  revalidatePath("/settings/courses");
  revalidatePath(`/trainers/${slug}`);
  revalidatePath("/search");
}

export async function saveCourse(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Only trainers can list courses." };
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const parsed = schema.safeParse({ ...raw, maxParticipants: raw.maxParticipants || undefined, indicativeRate: raw.indicativeRate || undefined, categoryId: raw.categoryId || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const modes = fd.getAll("modes").map(String) as Array<"ONSITE" | "VIRTUAL" | "HYBRID">;
  const skills = fd.getAll("skills").map(String).filter(Boolean);
  let outlineUrl: string | null = null;
  try { outlineUrl = await saveUpload(fd.get("outlineFile") as File | null, "courses", ["doc"], 10); } catch (e) { return { error: (e as Error).message }; }
  const id = String(fd.get("id") || "");
  const data = {
    title: d.title, summary: d.summary, outline: d.outline ?? "", level: d.level, durationDays: d.durationDays, modes, maxParticipants: d.maxParticipants ?? null,
    indicativeRate: d.indicativeRate ?? null, currency: d.currency, categoryId: d.categoryId ?? null, skills: { set: skills.map((slug) => ({ slug })) }, ...(outlineUrl ? { outlineUrl } : {}),
  };
  if (id) {
    const existing = await db.course.findFirst({ where: { id, trainerId: user.trainerProfile.id } });
    if (!existing) return { error: "Course not found." };
    await db.course.update({ where: { id }, data });
  } else {
    await db.course.create({ data: { ...data, trainerId: user.trainerProfile.id, skills: { connect: skills.map((slug) => ({ slug })) } } });
  }
  refresh(user.trainerProfile.slug);
  return { ok: id ? "Course updated." : "Course added to your catalogue." };
}

export async function deleteCourse(fd: FormData) {
  const user = await requireUser();
  if (!user.trainerProfile) return;
  await db.course.deleteMany({ where: { id: String(fd.get("id")), trainerId: user.trainerProfile.id } });
  refresh(user.trainerProfile.slug);
}

export async function toggleCourse(fd: FormData) {
  const user = await requireUser();
  if (!user.trainerProfile) return;
  const c = await db.course.findFirst({ where: { id: String(fd.get("id")), trainerId: user.trainerProfile.id } });
  if (!c) return;
  await db.course.update({ where: { id: c.id }, data: { published: !c.published } });
  refresh(user.trainerProfile.slug);
}
