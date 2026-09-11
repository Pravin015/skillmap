"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/types";

const KEYS: Record<"TRAINERS" | "REQUIREMENTS", string[]> = { TRAINERS: ["q", "skill", "city", "mode", "verified"], REQUIREMENTS: ["q", "category", "mode", "source"] };

export async function saveSearch(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const kind = String(fd.get("kind")) === "TRAINERS" ? "TRAINERS" : "REQUIREMENTS";
  const params: Record<string, string> = {};
  for (const k of KEYS[kind]) { const v = String(fd.get(`p_${k}`) ?? "").trim(); if (v) params[k] = v; }
  const name = String(fd.get("name") ?? "").trim() || Object.values(params).join(" · ") || (kind === "TRAINERS" ? "All trainers" : "All requirements");
  if ((await db.savedSearch.count({ where: { userId: user.id } })) >= 20) return { error: "You can keep up to 20 saved searches. Remove one first." };
  await db.savedSearch.create({ data: { userId: user.id, kind, name, params, alerts: String(fd.get("alerts")) !== "0" } });
  revalidatePath("/dashboard/saved-searches");
  return { ok: `Saved “${name}”. You will be notified about new matches.` };
}

export async function toggleSearchAlerts(fd: FormData) {
  const user = await requireUser();
  const s = await db.savedSearch.findFirst({ where: { id: String(fd.get("id")), userId: user.id } });
  if (!s) return;
  await db.savedSearch.update({ where: { id: s.id }, data: { alerts: !s.alerts } });
  revalidatePath("/dashboard/saved-searches");
}

export async function deleteSearch(fd: FormData) {
  const user = await requireUser();
  await db.savedSearch.deleteMany({ where: { id: String(fd.get("id")), userId: user.id } });
  revalidatePath("/dashboard/saved-searches");
}
