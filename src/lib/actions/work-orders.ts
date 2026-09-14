"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify, audit } from "@/lib/notify";
import { daysBetween } from "@/lib/utils";
import type { ActionState } from "@/lib/types";
import { createHash } from "node:crypto";
import { clientIp } from "@/lib/ratelimit";
import { dispatchWebhook } from "@/lib/webhooks";
import { shapeWorkOrder, workOrderSelect } from "@/lib/api-shapes";

type BatchIn = { label: string; startDate: string; endDate: string; participants: string | number; city?: string };
/** Parse the JSON batch list posted by the form. Returns null when there are no batches, or an error string. */
function parseBatches(raw: string | undefined) {
  if (!raw) return null;
  let list: BatchIn[];
  try { list = JSON.parse(raw); } catch { return "Batches are malformed."; }
  if (!Array.isArray(list) || !list.length) return null;
  if (list.length > 30) return "Up to 30 batches per work order.";
  const out: { label: string; startDate: Date; endDate: Date; days: number; participants: number; city: string | null; position: number }[] = [];
  for (const [i, b] of list.entries()) {
    const s = new Date(String(b.startDate)), e = new Date(String(b.endDate));
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return `Batch ${i + 1}: set both dates.`;
    if (e < s) return `Batch ${i + 1}: end date must be on or after the start date.`;
    const participants = Number(b.participants);
    if (!Number.isInteger(participants) || participants < 1) return `Batch ${i + 1}: how many participants?`;
    out.push({ label: String(b.label ?? "").trim().slice(0, 80) || `Batch ${i + 1}`, startDate: s, endDate: e, days: daysBetween(s, e), participants, city: String(b.city ?? "").trim().slice(0, 80) || null, position: i });
  }
  return out;
}

async function emitWorkOrder(id: string, event: "work_order.sent" | "work_order.accepted") {
  const wo = await db.workOrder.findUnique({ where: { id }, select: { ...workOrderSelect, companyId: true } });
  if (wo) await dispatchWebhook(wo.companyId, event, { work_order: shapeWorkOrder(wo) });
}

const schema = z.object({
  requirementId: z.string().min(1),
  title: z.string().trim().min(4, "Give the work order a title"),
  startDate: z.string().min(1, "Start date"),
  endDate: z.string().min(1, "End date"),
  dayRate: z.coerce.number().int().min(0, "Day rate"),
  currency: z.enum(["INR", "USD"]).default("INR"),
  participants: z.coerce.number().int().min(1),
  mode: z.enum(["ONSITE", "VIRTUAL", "HYBRID"]),
  venue: z.string().trim().optional(),
  deliverables: z.string().trim().optional(),
  provided: z.string().trim().optional(),
  paymentTerms: z.string().trim().optional(),
  cancellationTerms: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  batches: z.string().optional(),
  send: z.string().optional(),
  signedName: z.string().trim().optional(),
});

function refresh(requirementId: string) {
  revalidatePath(`/requirements/${requirementId}`);
  revalidatePath(`/requirements/${requirementId}/work-order`);
  revalidatePath("/dashboard");
}

async function engagement(requirementId: string) {
  return db.requirement.findUnique({ where: { id: requirementId }, include: { company: { include: { members: { select: { userId: true } } } }, applications: { where: { status: "AWARDED" }, include: { trainer: { select: { id: true, userId: true, user: { select: { name: true } } } } } }, workOrder: true } });
}

/** Company members create or revise the work order. "send" transitions it to SENT and bumps the version when it was already sent. */
export async function saveWorkOrder(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const req = await engagement(d.requirementId);
  if (!req) return { error: "Requirement not found." };
  if (!req.company.members.some((m) => m.userId === user.id)) return { error: "Only the company that posted the requirement can issue a work order." };
  const awarded = req.applications[0];
  if (!awarded) return { error: "Award the requirement to a trainer first." };
  if (req.workOrder?.status === "ACCEPTED") return { error: "This work order is accepted. Cancel it to issue a new one." };
  const batches = parseBatches(d.batches);
  if (typeof batches === "string") return { error: batches };
  const start = batches ? new Date(Math.min(...batches.map((b) => b.startDate.getTime()))) : new Date(d.startDate);
  const end = batches ? new Date(Math.max(...batches.map((b) => b.endDate.getTime()))) : new Date(d.endDate);
  if (end < start) return { error: "End date must be on or after the start date." };
  const days = batches ? batches.reduce((n, b) => n + b.days, 0) : daysBetween(start, end);
  const participants = batches ? batches.reduce((n, b) => n + b.participants, 0) : d.participants;
  const sending = d.send === "1";
  if (sending && (!d.signedName || d.signedName.length < 3)) return { error: "Type your full name to sign the work order before sending." };
  const wasSent = !!req.workOrder && req.workOrder.status !== "DRAFT";
  const data = {
    title: d.title, startDate: start, endDate: end, days, dayRate: d.dayRate, currency: d.currency, total: days * d.dayRate, participants, mode: d.mode,
    venue: d.venue ?? "", deliverables: d.deliverables ?? "", provided: d.provided ?? "", paymentTerms: d.paymentTerms ?? "", cancellationTerms: d.cancellationTerms ?? "", notes: d.notes ?? "",
  };
  const wo = req.workOrder
    ? await db.workOrder.update({ where: { id: req.workOrder.id }, data: { ...data, status: sending ? "SENT" : req.workOrder.status === "CHANGES_REQUESTED" ? "CHANGES_REQUESTED" : "DRAFT", version: sending && wasSent ? { increment: 1 } : undefined, sentAt: sending ? new Date() : req.workOrder.sentAt, companySignedName: sending ? d.signedName : req.workOrder.companySignedName, companySignedAt: sending ? new Date() : req.workOrder.companySignedAt, trainerSignedName: sending ? null : req.workOrder.trainerSignedName, trainerSignedAt: sending ? null : req.workOrder.trainerSignedAt, signatureHash: sending ? null : req.workOrder.signatureHash } })
    : await db.workOrder.create({ data: { ...data, requirementId: req.id, trainerId: awarded.trainer.id, companyId: req.companyId, createdById: user.id, status: sending ? "SENT" : "DRAFT", sentAt: sending ? new Date() : null, companySignedName: sending ? d.signedName : null, companySignedAt: sending ? new Date() : null } });
  await db.workOrderBatch.deleteMany({ where: { workOrderId: wo.id } });
  if (batches) await db.workOrderBatch.createMany({ data: batches.map((b) => ({ ...b, workOrderId: wo.id })) });
  await db.workOrderEvent.create({ data: { workOrderId: wo.id, actorId: user.id, type: sending ? (wasSent ? "revised" : "sent") : req.workOrder ? "edited" : "created", version: wo.version } });
  if (sending) await emitWorkOrder(wo.id, "work_order.sent");
  if (sending) await notify(awarded.trainer.userId, "workorder", wasSent ? `Work order revised (v${wo.version})` : "Work order received", `${req.company.name}: ${d.title} · ${days} day${days > 1 ? "s" : ""} · review and accept`, `/requirements/${req.id}/work-order`);
  refresh(req.id);
  if (sending) redirect(`/requirements/${req.id}/work-order?sent=1`);
  return { ok: "Draft saved. Send it when ready." };
}

export async function respondWorkOrder(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const decision = String(fd.get("decision")) as "ACCEPT" | "CHANGES";
  const note = String(fd.get("note") ?? "").trim();
  const signedName = String(fd.get("signedName") ?? "").trim();
  const wo = await db.workOrder.findUnique({ where: { id }, include: { trainer: { select: { userId: true } }, company: { include: { members: { select: { userId: true } } } }, requirement: { select: { id: true, title: true } } } });
  if (!wo || wo.trainer.userId !== user.id) return { error: "Only the awarded trainer can respond." };
  if (wo.status !== "SENT") return { error: "This work order is not awaiting your response." };
  if (decision === "CHANGES" && note.length < 5) return { error: "Tell the company what to change." };
  if (decision === "ACCEPT" && signedName.length < 3) return { error: "Type your full name to sign and accept." };
  const ip = await clientIp();
  const signatureHash = decision === "ACCEPT" ? createHash("sha256").update(`${wo.id}|v${wo.version}|${wo.companySignedName ?? ""}|${signedName}|${new Date().toISOString()}|${ip}`).digest("hex").slice(0, 32) : null;
  await db.workOrder.update({ where: { id }, data: { status: decision === "ACCEPT" ? "ACCEPTED" : "CHANGES_REQUESTED", acceptedAt: decision === "ACCEPT" ? new Date() : null, trainerSignedName: decision === "ACCEPT" ? signedName : null, trainerSignedAt: decision === "ACCEPT" ? new Date() : null, signatureHash } });
  await db.workOrderEvent.create({ data: { workOrderId: id, actorId: user.id, type: decision === "ACCEPT" ? "accepted" : "changes_requested", note: note || null, version: wo.version } });
  await notify(wo.company.members.map((m) => m.userId), "workorder", decision === "ACCEPT" ? `${user.name} accepted the work order` : `${user.name} requested changes`, decision === "ACCEPT" ? `${wo.title} v${wo.version} is confirmed.` : note, `/requirements/${wo.requirementId}/work-order`);
  if (decision === "ACCEPT") await emitWorkOrder(id, "work_order.accepted");
  refresh(wo.requirementId);
  return { ok: decision === "ACCEPT" ? "Accepted. Both sides now have a confirmed work order." : "Sent back with your notes." };
}

export async function cancelWorkOrder(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const wo = await db.workOrder.findUnique({ where: { id }, include: { company: { include: { members: { select: { userId: true } } } }, trainer: { select: { userId: true } } } });
  if (!wo || !wo.company.members.some((m) => m.userId === user.id)) return;
  await db.workOrder.update({ where: { id }, data: { status: "CANCELLED" } });
  await db.workOrderEvent.create({ data: { workOrderId: id, actorId: user.id, type: "cancelled", version: wo.version } });
  await audit(user.id, "workorder.cancel", id);
  await notify(wo.trainer.userId, "workorder", "Work order cancelled", `${wo.title} was cancelled by the company.`, `/requirements/${wo.requirementId}/work-order`);
  refresh(wo.requirementId);
}

export async function reopenWorkOrder(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const wo = await db.workOrder.findUnique({ where: { id }, include: { company: { include: { members: { select: { userId: true } } } } } });
  if (!wo || wo.status !== "CANCELLED" || !wo.company.members.some((m) => m.userId === user.id)) return;
  await db.workOrder.update({ where: { id }, data: { status: "DRAFT" } });
  await db.workOrderEvent.create({ data: { workOrderId: id, actorId: user.id, type: "reopened", version: wo.version } });
  refresh(wo.requirementId);
}
