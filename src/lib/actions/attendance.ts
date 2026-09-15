"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { memberCan } from "@/lib/permissions";
import { audit, notify } from "@/lib/notify";
import type { ActionState } from "@/lib/types";

/** Company members and the awarded trainer manage the roster and mark attendance. */
async function access(workOrderId: string, userId: string) {
  const wo = await db.workOrder.findUnique({ where: { id: workOrderId }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, trainer: { select: { userId: true } }, batches: { select: { id: true } } } });
  if (!wo) return null;
  const isTrainer = wo.trainer.userId === userId;
  const isMember = memberCan(wo.company.members, userId, "view");
  return isTrainer || isMember ? { wo, isTrainer, isMember } : null;
}
const refresh = (requirementId: string) => { revalidatePath(`/requirements/${requirementId}/work-order/attendance`); revalidatePath(`/requirements/${requirementId}/work-order`); };

/** Paste "Name, email, employee id" lines; duplicates by name+email are skipped. */
export async function addParticipants(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const workOrderId = String(fd.get("workOrderId"));
  const batchId = String(fd.get("batchId") ?? "").trim() || null;
  const a = await access(workOrderId, user.id);
  if (!a) return { error: "Not your work order." };
  if (batchId && !a.wo.batches.some((b) => b.id === batchId)) return { error: "Choose a batch of this work order." };
  const lines = String(fd.get("participants") ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { error: "Paste at least one participant, one per line." };
  if (lines.length > 500) return { error: "Up to 500 participants at a time." };
  const existing = await db.participant.findMany({ where: { workOrderId }, select: { name: true, email: true } });
  const have = new Set(existing.map((e) => `${e.name.toLowerCase()}|${e.email ?? ""}`));
  let added = 0;
  for (const line of lines) {
    const [name, email, employeeId] = line.split(/[,\t;]/).map((x) => x.trim());
    if (!name) continue;
    const mail = email && /@/.test(email) ? email.toLowerCase() : null;
    const key = `${name.toLowerCase()}|${mail ?? ""}`;
    if (have.has(key)) continue;
    have.add(key);
    await db.participant.create({ data: { workOrderId, batchId, name: name.slice(0, 120), email: mail, employeeId: employeeId?.slice(0, 40) || null } });
    added++;
  }
  await audit(user.id, "attendance.roster_add", workOrderId, { added });
  refresh(a.wo.requirementId);
  return { ok: `${added} participant${added === 1 ? "" : "s"} added${lines.length - added ? `, ${lines.length - added} skipped as duplicates or blank` : ""}.` };
}

/** Bound per row (`removeParticipant.bind(null, id)`) so the button can sit inside the attendance form. */
export async function removeParticipant(id: string) {
  const user = await requireUser();
  const p = await db.participant.findUnique({ where: { id }, select: { workOrderId: true } });
  if (!p) return;
  const a = await access(p.workOrderId, user.id);
  if (!a) return;
  await db.participant.delete({ where: { id } });
  refresh(a.wo.requirementId);
}

/** The whole grid posts at once: `att` values are "participantId|YYYY-MM-DD" for ticked cells; everything else in the grid is absent. */
export async function saveAttendance(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const workOrderId = String(fd.get("workOrderId"));
  const a = await access(workOrderId, user.id);
  if (!a) return { error: "Not your work order." };
  const dates = String(fd.get("dates") ?? "").split(",").filter(Boolean);
  const ticked = new Set(fd.getAll("att").map(String));
  const roster = await db.participant.findMany({ where: { workOrderId }, select: { id: true } });
  let present = 0;
  for (const p of roster) for (const d of dates) {
    const isPresent = ticked.has(`${p.id}|${d}`);
    if (isPresent) present++;
    await db.attendance.upsert({ where: { participantId_date: { participantId: p.id, date: new Date(d) } }, update: { present: isPresent, markedById: user.id }, create: { participantId: p.id, date: new Date(d), present: isPresent, markedById: user.id } });
  }
  await audit(user.id, "attendance.save", workOrderId, { cells: roster.length * dates.length, present });
  if (a.isTrainer) await notify(a.wo.company.members.filter((m) => m.role !== "VIEWER").map((m) => m.userId), "workorder", "Attendance updated", `${a.wo.title}: ${present} of ${roster.length * dates.length} attendance marks recorded.`, `/requirements/${a.wo.requirementId}/work-order/attendance`);
  refresh(a.wo.requirementId);
  return { ok: `Attendance saved: ${present} present out of ${roster.length * dates.length} participant-days.` };
}
