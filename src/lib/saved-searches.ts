import "server-only";
import type { DeliveryMode } from "@prisma/client";
import { db } from "./db";
import { notify } from "./notify";

export type TrainerSearch = { q?: string; skill?: string; city?: string; mode?: string; verified?: string };
export type RequirementSearch = { q?: string; category?: string; mode?: string; source?: string };

const has = (hay: string, needle?: string) => !needle || hay.toLowerCase().includes(needle.toLowerCase());

export function describeSearch(kind: "TRAINERS" | "REQUIREMENTS", p: Record<string, string | undefined>) {
  const parts = Object.entries(p).filter(([, v]) => v).map(([k, v]) => (k === "q" ? `“${v}”` : k === "verified" ? "verified only" : `${k}: ${v}`));
  return parts.length ? parts.join(" · ") : kind === "TRAINERS" ? "All trainers" : "All requirements";
}

export function searchHref(kind: "TRAINERS" | "REQUIREMENTS", p: Record<string, string | undefined>) {
  const q = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]);
  return `/${kind === "TRAINERS" ? "trainers" : "requirements"}${q.toString() ? `?${q}` : ""}`;
}

/** A new public requirement was posted: alert members whose saved requirement searches match it. */
export async function alertRequirementSearches(requirementId: string) {
  const r = await db.requirement.findUnique({ where: { id: requirementId }, include: { category: true, skills: true, company: { select: { name: true, type: true } } } });
  if (!r || r.visibility !== "PUBLIC") return;
  const searches = await db.savedSearch.findMany({ where: { kind: "REQUIREMENTS", alerts: true }, include: { user: { select: { id: true, role: true, trainerProfile: { select: { id: true } } } } } });
  const hay = `${r.title} ${r.description} ${r.skills.map((s) => s.name).join(" ")} ${r.company.name}`;
  const hits = searches.filter((s) => {
    const p = s.params as RequirementSearch;
    if (!has(hay, p.q)) return false;
    if (p.category && r.category.slug !== p.category) return false;
    if (p.mode && r.mode !== p.mode) return false;
    if (p.source === "partner" && r.company.type !== "TRAINING_PARTNER") return false;
    if (p.source === "direct" && r.company.type !== "DIRECT") return false;
    return true;
  });
  const byUser = new Map<string, string>();
  for (const s of hits) if (!byUser.has(s.userId)) byUser.set(s.userId, s.name);
  await Promise.all([...byUser.entries()].map(([userId, name]) => notify(userId, "alert", `New match for “${name}”`, `${r.company.name}: ${r.title}`, `/requirements/${r.id}`)));
  if (hits.length) await db.savedSearch.updateMany({ where: { id: { in: hits.map((h) => h.id) } }, data: { lastNotifiedAt: new Date() } });
}

/** A trainer profile was created or changed: alert companies whose saved trainer searches now match it. Throttled to once a day per search. */
export async function alertTrainerSearches(trainerId: string) {
  const t = await db.trainerProfile.findUnique({ where: { id: trainerId }, include: { skills: true, user: { select: { name: true, status: true } } } });
  if (!t || t.user.status !== "ACTIVE") return;
  const dayAgo = new Date(Date.now() - 86400000);
  const searches = await db.savedSearch.findMany({ where: { kind: "TRAINERS", alerts: true, OR: [{ lastNotifiedAt: null }, { lastNotifiedAt: { lt: dayAgo } }] } });
  const hay = `${t.user.name} ${t.headline} ${t.bio} ${t.skills.map((s) => s.name).join(" ")}`;
  const hits = searches.filter((s) => {
    const p = s.params as TrainerSearch;
    if (!has(hay, p.q)) return false;
    if (p.skill && !t.skills.some((k) => k.slug === p.skill)) return false;
    if (p.city && !t.cities.includes(p.city)) return false;
    if (p.mode && !t.deliveryModes.includes(p.mode as DeliveryMode)) return false;
    if (p.verified && !t.verifiedAt) return false;
    return true;
  });
  const byUser = new Map<string, string>();
  for (const s of hits) if (!byUser.has(s.userId)) byUser.set(s.userId, s.name);
  await Promise.all([...byUser.entries()].map(([userId, name]) => notify(userId, "alert", `Trainer match for “${name}”`, `${t.user.name} · ${t.headline}`, `/trainers/${t.slug}`)));
  if (hits.length) await db.savedSearch.updateMany({ where: { id: { in: hits.map((h) => h.id) } }, data: { lastNotifiedAt: new Date() } });
}
