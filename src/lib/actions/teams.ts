"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

async function trainerOf() {
  const user = await requireUser();
  if (!user.trainerProfile) return null;
  return { user, trainerId: user.trainerProfile.id };
}
function refresh(slug?: string) {
  revalidatePath("/settings/teams");
  if (slug) revalidatePath(`/teams/${slug}`);
}

/** A trainer creates a team they lead. Teams apply jointly to requirements; the lead signs the work order and raises the invoice. */
export async function createTeam(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await trainerOf();
  if (!ctx) return { error: "Only trainers can create teams." };
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 3) return { error: "Give the team a name." };
  const led = await db.trainerTeam.count({ where: { leadId: ctx.trainerId } });
  if (led >= 5) return { error: "You can lead up to 5 teams." };
  let slug = slugify(name).slice(0, 50) || "team";
  if (await db.trainerTeam.findUnique({ where: { slug } })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const team = await db.trainerTeam.create({ data: { slug, name: name.slice(0, 80), tagline: String(fd.get("tagline") ?? "").trim().slice(0, 160), description: String(fd.get("description") ?? "").trim().slice(0, 2000), leadId: ctx.trainerId } });
  refresh(team.slug);
  redirect(`/settings/teams?team=${team.id}`);
}

export async function updateTeam(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await trainerOf();
  if (!ctx) return { error: "Not allowed." };
  const team = await db.trainerTeam.findFirst({ where: { id: String(fd.get("id")), leadId: ctx.trainerId } });
  if (!team) return { error: "Only the team lead can edit the team." };
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 3) return { error: "Give the team a name." };
  await db.trainerTeam.update({ where: { id: team.id }, data: { name: name.slice(0, 80), tagline: String(fd.get("tagline") ?? "").trim().slice(0, 160), description: String(fd.get("description") ?? "").trim().slice(0, 2000) } });
  refresh(team.slug);
  return { ok: "Team saved." };
}

/** Invite another trainer by the email they signed up with. */
export async function inviteTeamMember(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await trainerOf();
  if (!ctx) return { error: "Not allowed." };
  const team = await db.trainerTeam.findFirst({ where: { id: String(fd.get("teamId")), leadId: ctx.trainerId }, include: { _count: { select: { members: true } } } });
  if (!team) return { error: "Only the team lead can invite members." };
  if (team._count.members >= 12) return { error: "Up to 12 members per team." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const target = await db.trainerProfile.findFirst({ where: { user: { email } }, select: { id: true, userId: true, user: { select: { name: true } } } });
  if (!target) return { error: "No trainer account with that email. They need to sign up as a trainer first." };
  if (target.id === ctx.trainerId) return { error: "You lead this team already." };
  const existing = await db.trainerTeamMember.findUnique({ where: { teamId_trainerId: { teamId: team.id, trainerId: target.id } } });
  if (existing?.status === "ACCEPTED") return { error: `${target.user.name} is already on the team.` };
  const role = String(fd.get("role") ?? "").trim().slice(0, 60) || "Co-trainer";
  await db.trainerTeamMember.upsert({ where: { teamId_trainerId: { teamId: team.id, trainerId: target.id } }, create: { teamId: team.id, trainerId: target.id, role }, update: { status: "INVITED", role } });
  await notify(target.userId, "team", `${ctx.user.name} invited you to join ${team.name}`, `Role: ${role}. Accept from Settings → Teams.`, "/settings/teams");
  refresh(team.slug);
  return { ok: `Invitation sent to ${target.user.name}.` };
}

export async function respondTeamInvite(fd: FormData) {
  const ctx = await trainerOf();
  if (!ctx) return;
  const m = await db.trainerTeamMember.findFirst({ where: { id: String(fd.get("id")), trainerId: ctx.trainerId, status: "INVITED" }, include: { team: { include: { lead: { select: { userId: true } } } } } });
  if (!m) return;
  const accept = String(fd.get("decision")) === "accept";
  await db.trainerTeamMember.update({ where: { id: m.id }, data: { status: accept ? "ACCEPTED" : "DECLINED" } });
  await notify(m.team.lead.userId, "team", accept ? `${ctx.user.name} joined ${m.team.name}` : `${ctx.user.name} declined the ${m.team.name} invitation`, "", "/settings/teams");
  refresh(m.team.slug);
}

/** Lead removes a member, or a member leaves. */
export async function removeTeamMember(fd: FormData) {
  const ctx = await trainerOf();
  if (!ctx) return;
  const m = await db.trainerTeamMember.findUnique({ where: { id: String(fd.get("id")) }, include: { team: true } });
  if (!m) return;
  if (m.team.leadId !== ctx.trainerId && m.trainerId !== ctx.trainerId) return;
  await db.trainerTeamMember.delete({ where: { id: m.id } });
  refresh(m.team.slug);
}

export async function deleteTeam(fd: FormData) {
  const ctx = await trainerOf();
  if (!ctx) return;
  const team = await db.trainerTeam.findFirst({ where: { id: String(fd.get("id")), leadId: ctx.trainerId } });
  if (!team) return;
  await db.trainerTeam.delete({ where: { id: team.id } });
  refresh(team.slug);
  redirect("/settings/teams");
}
