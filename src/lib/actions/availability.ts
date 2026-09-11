"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/types";

const KINDS = ["BOOKED", "UNAVAILABLE", "TENTATIVE"] as const;

function refresh(slug: string) {
  revalidatePath("/settings/availability");
  revalidatePath(`/trainers/${slug}`);
  revalidatePath("/dashboard");
}

export async function addBlock(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Only trainers have an availability calendar." };
  const start = new Date(String(fd.get("startDate") || ""));
  const end = new Date(String(fd.get("endDate") || "") || String(fd.get("startDate") || ""));
  const kind = String(fd.get("kind")) as (typeof KINDS)[number];
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: "Pick valid dates." };
  if (end < start) return { error: "End date must be on or after the start date." };
  if (!KINDS.includes(kind)) return { error: "Choose a block type." };
  await db.availabilityBlock.create({ data: { trainerId: user.trainerProfile.id, startDate: start, endDate: end, kind, note: String(fd.get("note") ?? "").trim() || null } });
  refresh(user.trainerProfile.slug);
  return { ok: "Dates blocked." };
}

export async function deleteBlock(fd: FormData) {
  const user = await requireUser();
  if (!user.trainerProfile) return;
  await db.availabilityBlock.deleteMany({ where: { id: String(fd.get("id")), trainerId: user.trainerProfile.id } });
  refresh(user.trainerProfile.slug);
}
