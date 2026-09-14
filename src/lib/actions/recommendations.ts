"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import type { ActionState } from "@/lib/types";

/** Who may recommend a trainer: a company member whose company awarded them, or an accepted connection. */
async function eligibility(authorId: string, trainerId: string) {
  const [trainer, me] = await Promise.all([
    db.trainerProfile.findUnique({ where: { id: trainerId }, select: { userId: true, slug: true, user: { select: { name: true } } } }),
    db.user.findUnique({ where: { id: authorId }, select: { memberships: { select: { companyId: true, company: { select: { name: true } } } } } }),
  ]);
  if (!trainer || trainer.userId === authorId) return null;
  const awarded = me?.memberships[0] ? await db.application.findFirst({ where: { trainerId, status: "AWARDED", requirement: { companyId: me.memberships[0].companyId } }, include: { requirement: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" } }) : null;
  const connected = await db.connection.findFirst({ where: { status: "ACCEPTED", OR: [{ requesterId: authorId, addresseeId: trainer.userId }, { requesterId: trainer.userId, addresseeId: authorId }] } });
  if (!awarded && !connected) return null;
  return { trainer, companyId: me?.memberships[0]?.companyId ?? null, companyName: me?.memberships[0]?.company.name ?? null, awarded };
}

export async function writeRecommendation(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const trainerId = String(fd.get("trainerId"));
  const body = String(fd.get("body") ?? "").trim();
  const relationship = String(fd.get("relationship") ?? "").trim();
  if (body.length < 40) return { error: "Say a little more. A useful recommendation is at least a couple of sentences." };
  if (!relationship) return { error: "Tell readers how you know this trainer." };
  const e = await eligibility(user.id, trainerId);
  if (!e) return { error: "You can recommend trainers your company has hired, or trainers you are connected with." };
  await db.recommendation.upsert({
    where: { trainerId_authorId: { trainerId, authorId: user.id } },
    create: { trainerId, authorId: user.id, companyId: e.companyId, requirementId: e.awarded?.requirementId ?? null, relationship, body },
    update: { relationship, body, visible: true },
  });
  await notify(e.trainer.userId, "recommendation", `${user.name} recommended you`, body.slice(0, 120), `/trainers/${e.trainer.slug}#recommendations`);
  revalidatePath(`/trainers/${e.trainer.slug}`);
  return { ok: "Recommendation published on their profile." };
}

export async function toggleRecommendation(fd: FormData) {
  const user = await requireUser();
  if (!user.trainerProfile) return;
  const r = await db.recommendation.findFirst({ where: { id: String(fd.get("id")), trainerId: user.trainerProfile.id } });
  if (!r) return;
  await db.recommendation.update({ where: { id: r.id }, data: { visible: !r.visible } });
  revalidatePath(`/trainers/${user.trainerProfile.slug}`);
}

export async function deleteRecommendation(fd: FormData) {
  const user = await requireUser();
  const r = await db.recommendation.findFirst({ where: { id: String(fd.get("id")), authorId: user.id }, include: { trainer: { select: { slug: true } } } });
  if (!r) return;
  await db.recommendation.delete({ where: { id: r.id } });
  revalidatePath(`/trainers/${r.trainer.slug}`);
}

/** Trainer asks a company contact for a recommendation. */
export async function requestRecommendation(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Only trainers can request recommendations." };
  const toUserId = String(fd.get("userId"));
  const message = String(fd.get("message") ?? "").trim();
  const e = await eligibility(toUserId, user.trainerProfile.id);
  if (!e) return { error: "You can only ask people who hired you or are connected with you." };
  await notify(toUserId, "recommendation", `${user.name} asked for a recommendation`, message || "Would you write a few lines about working together?", `/trainers/${user.trainerProfile.slug}?recommend=1#recommendations`);
  return { ok: "Request sent." };
}
