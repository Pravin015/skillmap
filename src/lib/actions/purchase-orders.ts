"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify, audit } from "@/lib/notify";
import type { ActionState } from "@/lib/types";
import { companyCan, memberCan } from "@/lib/permissions";
import { dispatchWebhook } from "@/lib/webhooks";
import { purchaseOrderSelect, shapePurchaseOrder } from "@/lib/api-shapes";
import { computeTax, docNumber, financialYear, parseLines, SAC_CODES, STATE_CODES, stateCodeFromGstin, suggestPrefix, sumLines } from "@/lib/gst";
import { dateRange, modeLabel } from "@/lib/utils";
import { purchaseOrderPdf, poNumberOf, woNumber } from "@/lib/documents";

const DEFAULT_TERMS = `Invoice to be raised after successful completion of the training, quoting this purchase order number.
Payment within 30 days of receipt of a correct invoice, by bank transfer.
GST extra at the applicable rate; TDS deducted as per the Income Tax Act, 1961 and a certificate issued.
Attendance records, participant feedback and assessment results to be shared along with the invoice.
Reschedule and cancellation as per the signed work order.`;

function refresh(po: { id: string; workOrder?: { requirementId: string } | null }) {
  revalidatePath(`/purchase-orders/${po.id}`); revalidatePath("/dashboard/purchase-orders"); revalidatePath("/dashboard/invoices"); revalidatePath("/dashboard");
  if (po.workOrder) revalidatePath(`/requirements/${po.workOrder.requirementId}/work-order`);
}

async function emit(id: string, event: "purchase_order.issued" | "purchase_order.accepted") {
  const po = await db.purchaseOrder.findUnique({ where: { id }, select: { ...purchaseOrderSelect, companyId: true } });
  if (po) await dispatchWebhook(po.companyId, event, { purchase_order: shapePurchaseOrder(po) });
}

/** Snapshot of both parties, taken when the PO is created and refreshed on every issue so the document matches the settings at that time. */
async function partySnapshot(companyId: string, trainerId: string, issuerEmail: string) {
  const [c, t] = await Promise.all([
    db.company.findUniqueOrThrow({ where: { id: companyId }, select: { name: true, gstLegalName: true, billingAddress: true, gstin: true, stateCode: true, billingEmail: true, poTerms: true, poPrefix: true, poSeq: true, poSeqFy: true } }),
    db.trainerProfile.findUniqueOrThrow({ where: { id: trainerId }, select: { legalName: true, billingAddress: true, gstin: true, pan: true, stateCode: true, user: { select: { name: true } } } }),
  ]);
  const buyerStateCode = c.stateCode || stateCodeFromGstin(c.gstin);
  const vendorStateCode = t.stateCode || stateCodeFromGstin(t.gstin);
  return {
    buyerName: c.gstLegalName || c.name, buyerAddress: c.billingAddress, buyerGstin: c.gstin?.toUpperCase() || null, buyerStateCode, buyerContact: c.billingEmail || issuerEmail,
    vendorName: t.legalName || t.user.name, vendorAddress: t.billingAddress, vendorGstin: t.gstin?.toUpperCase() || null, vendorPan: t.pan, vendorStateCode,
    company: c,
  };
}

/** Company creates a draft PO from an accepted work order, prefilled with one line per batch or the whole engagement. */
export async function createPurchaseOrder(fd: FormData) {
  const user = await requireUser();
  const workOrderId = String(fd.get("workOrderId"));
  const wo = await db.workOrder.findUnique({ where: { id: workOrderId }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, batches: { orderBy: { position: "asc" } }, purchaseOrders: { where: { status: { not: "CANCELLED" } }, select: { id: true } } } });
  if (!wo || !memberCan(wo.company.members, user.id, "sign_work_order")) redirect("/dashboard/purchase-orders?err=perm");
  if (wo.purchaseOrders[0]) redirect(`/purchase-orders/${wo.purchaseOrders[0].id}`);
  if (wo.status !== "ACCEPTED") redirect(`/requirements/${wo.requirementId}/work-order?err=po-needs-accepted`);
  const snap = await partySnapshot(wo.companyId, wo.trainerId, user.email);
  const lines = wo.batches.length
    ? wo.batches.map((b, i) => ({ description: `Training delivery · ${wo.title} · ${b.label}${b.city ? ` (${b.city})` : ""} · ${dateRange(b.startDate, b.endDate)} · ${b.participants} participants`, qty: b.days, unit: "day", rate: wo.dayRate, amount: b.days * wo.dayRate, position: i }))
    : [{ description: `Training delivery charges · ${wo.title} (${modeLabel[wo.mode]}) as per ${woNumber(wo.number)} · ${dateRange(wo.startDate, wo.endDate)} · ${wo.participants} participants`, qty: wo.days, unit: "day", rate: wo.dayRate, amount: wo.days * wo.dayRate, position: 0 }];
  const subtotal = sumLines(lines);
  const gstRate = wo.currency === "INR" ? 18 : 0;
  const tax = computeTax(subtotal, gstRate, snap.vendorStateCode, snap.buyerStateCode);
  const { company, vendorStateCode: _v, ...parties } = snap; void _v;
  const po = await db.purchaseOrder.create({ data: {
    workOrderId: wo.id, companyId: wo.companyId, trainerId: wo.trainerId, issuedById: user.id, title: wo.title, currency: wo.currency,
    subtotal, gstRate, gstAmount: tax.gstAmount, total: tax.total, taxType: tax.taxType,
    placeOfSupply: wo.mode === "VIRTUAL" ? "Virtual instructor-led training (VILT)" : wo.venue.split("\n")[0]?.slice(0, 200) || "",
    supplyMode: modeLabel[wo.mode], periodText: dateRange(wo.startDate, wo.endDate), participants: wo.participants,
    paymentTerms: wo.paymentTerms || "Payment within 30 days of receipt of a correct invoice, after successful completion.",
    deliverables: wo.deliverables, terms: company.poTerms || DEFAULT_TERMS, validUntil: new Date(wo.endDate.getTime() + 60 * 86400000),
    ...parties, lines: { create: lines },
  } });
  await audit(user.id, "po.create", po.id, { workOrderId: wo.id });
  refresh({ id: po.id, workOrder: { requirementId: wo.requirementId } });
  redirect(`/purchase-orders/${po.id}?edit=1`);
}

/** Save the editable parts of a PO. `issue=1` numbers it (first time), sends it to the trainer and bumps the version if it was already issued. */
export async function savePurchaseOrder(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const po = await db.purchaseOrder.findUnique({ where: { id }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, trainer: { select: { userId: true, user: { select: { name: true } } } }, workOrder: { select: { requirementId: true, number: true } } } });
  if (!po || !memberCan(po.company.members, user.id, "sign_work_order")) return { error: "Only owners, admins and hiring managers edit purchase orders." };
  if (po.status === "ACCEPTED" || po.status === "CLOSED" || po.status === "CANCELLED") return { error: "This purchase order can no longer be edited. Cancel it and issue a new one." };
  const lines = parseLines(String(fd.get("lines") ?? ""));
  if (typeof lines === "string") return { error: lines };
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 4) return { error: "Give the purchase order a title." };
  const gstRate = Number(fd.get("gstRate") ?? 18);
  if (![0, 5, 12, 18, 28].includes(gstRate)) return { error: "Choose a valid GST rate." };
  const sacCode = String(fd.get("sacCode") ?? "999293");
  if (!SAC_CODES.some((s) => s.code === sacCode)) return { error: "Choose a SAC code." };
  const poDate = new Date(String(fd.get("poDate") || "") || po.poDate);
  const validRaw = String(fd.get("validUntil") ?? "");
  const validUntil = validRaw ? new Date(validRaw) : null;
  if (isNaN(poDate.getTime()) || (validUntil && isNaN(validUntil.getTime()))) return { error: "Check the dates." };
  const participantsRaw = String(fd.get("participants") ?? "").trim();
  const participants = participantsRaw ? Number(participantsRaw) : null;
  if (participants !== null && (!Number.isInteger(participants) || participants < 1)) return { error: "Participants must be a whole number." };
  const issuing = String(fd.get("issue") ?? "") === "1";
  const snap = await partySnapshot(po.companyId, po.trainerId, user.email);
  const subtotal = sumLines(lines);
  const tax = computeTax(subtotal, gstRate, snap.vendorStateCode, snap.buyerStateCode);
  const wasIssued = !!po.issuedAt;
  let poNumber = po.poNumber;
  if (issuing && !poNumber) {
    const fy = financialYear(poDate);
    const seq = snap.company.poSeqFy === fy ? snap.company.poSeq + 1 : 1;
    await db.company.update({ where: { id: po.companyId }, data: { poSeq: seq, poSeqFy: fy } });
    poNumber = docNumber(snap.company.poPrefix || suggestPrefix(snap.company.name, "word"), fy, seq, 4);
  }
  const { company: _c, vendorStateCode: _v, ...parties } = snap; void _c; void _v;
  const s = (k: string) => String(fd.get(k) ?? "").trim();
  await db.purchaseOrder.update({ where: { id }, data: {
    title, poDate, validUntil, gstRate, sacCode, subtotal, gstAmount: tax.gstAmount, total: tax.total, taxType: tax.taxType, participants,
    placeOfSupply: s("placeOfSupply").slice(0, 300), supplyMode: s("supplyMode").slice(0, 80), periodText: s("periodText").slice(0, 200), endClientRef: s("endClientRef").slice(0, 200) || null,
    paymentTerms: s("paymentTerms"), deliverables: s("deliverables"), terms: s("terms"), notes: s("notes"),
    ...parties,
    ...(issuing ? { poNumber, status: "ISSUED", issuedAt: new Date(), issuedById: user.id, version: wasIssued ? { increment: 1 } : undefined, acceptedAt: null, acceptedByName: null, changeNote: null } : {}),
    lines: { deleteMany: {}, create: lines },
  } });
  if (issuing) {
    const fresh = await db.purchaseOrder.findUniqueOrThrow({ where: { id }, select: { version: true, total: true, currency: true } });
    const pdf = await purchaseOrderPdf(id).catch((e) => { console.error("[po pdf]", (e as Error).message); return null; });
    await notify(po.trainer.userId, "purchaseorder", wasIssued ? `Purchase order ${poNumber} revised (v${fresh.version})` : `Purchase order ${poNumber} from ${po.company.name}`, `${title} · ${fresh.currency} ${fresh.total.toLocaleString("en-IN")} incl. GST · review and accept, then invoice against it.`, `/purchase-orders/${id}`, pdf ? { attachments: [{ filename: pdf.filename, content: pdf.buffer }] } : undefined);
    await audit(user.id, wasIssued ? "po.revise" : "po.issue", id, { poNumber });
    await emit(id, "purchase_order.issued");
  } else await audit(user.id, "po.edit", id);
  refresh(po);
  if (issuing) redirect(`/purchase-orders/${id}?sent=1`);
  return { ok: "Draft saved. Issue it when ready." };
}

/** Trainer accepts the PO (typed name recorded) or sends it back with a note. */
export async function respondPurchaseOrder(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const decision = String(fd.get("decision")) as "ACCEPT" | "CHANGES";
  const note = String(fd.get("note") ?? "").trim();
  const signedName = String(fd.get("signedName") ?? "").trim();
  const po = await db.purchaseOrder.findUnique({ where: { id }, include: { trainer: { select: { userId: true } }, company: { include: { members: { select: { userId: true, role: true } } } }, workOrder: { select: { requirementId: true } } } });
  if (!po || po.trainer.userId !== user.id) return { error: "Only the trainer named on the purchase order can respond." };
  if (po.status !== "ISSUED") return { error: "This purchase order is not awaiting your response." };
  if (decision === "CHANGES" && note.length < 5) return { error: "Tell the company what to change." };
  if (decision === "ACCEPT" && signedName.length < 3) return { error: "Type your full name to accept." };
  await db.purchaseOrder.update({ where: { id }, data: decision === "ACCEPT" ? { status: "ACCEPTED", acceptedAt: new Date(), acceptedByName: signedName, changeNote: null } : { status: "CHANGES_REQUESTED", changeNote: note } });
  const recipients = po.company.members.filter((m) => companyCan(m.role, "sign_work_order")).map((m) => m.userId);
  await notify(recipients, "purchaseorder", decision === "ACCEPT" ? `${user.name} accepted ${poNumberOf(po)}` : `${user.name} asked for changes to ${poNumberOf(po)}`, decision === "ACCEPT" ? `${po.title} · the trainer can now invoice against it.` : note, `/purchase-orders/${id}`);
  await audit(user.id, decision === "ACCEPT" ? "po.accept" : "po.changes", id, { note });
  if (decision === "ACCEPT") await emit(id, "purchase_order.accepted");
  refresh(po);
  return { ok: decision === "ACCEPT" ? "Accepted. Raise invoices against this purchase order from the Invoices page." : "Sent back with your notes." };
}

export async function cancelPurchaseOrder(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const po = await db.purchaseOrder.findUnique({ where: { id }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, trainer: { select: { userId: true } }, workOrder: { select: { requirementId: true } }, invoices: { where: { status: { in: ["SENT", "PAID"] } }, select: { id: true } } } });
  if (!po || !memberCan(po.company.members, user.id, "sign_work_order") || po.status === "CANCELLED" || po.status === "CLOSED") return;
  if (po.invoices.length) redirect(`/purchase-orders/${id}?err=has-invoices`);
  await db.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED" } });
  await audit(user.id, "po.cancel", id);
  if (po.issuedAt) await notify(po.trainer.userId, "purchaseorder", `${poNumberOf(po)} cancelled`, `${po.company.name} withdrew the purchase order for ${po.title}.`, `/purchase-orders/${id}`);
  refresh(po);
}

/** Company closes an accepted PO once everything under it is billed and settled. Also called automatically when the paid invoices cover the PO value. */
export async function closePurchaseOrder(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const po = await db.purchaseOrder.findUnique({ where: { id }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, workOrder: { select: { requirementId: true } } } });
  if (!po || !memberCan(po.company.members, user.id, "sign_work_order") || po.status !== "ACCEPTED") return;
  await db.purchaseOrder.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } });
  await audit(user.id, "po.close", id);
  refresh(po);
}

/** Company settings: legal/state details and PO numbering. */
export async function savePoSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.membership || !companyCan(user.membership.role, "company_settings")) return { error: "Only owners and admins change purchase order settings." };
  const stateCode = String(fd.get("stateCode") ?? "");
  if (stateCode && !STATE_CODES[stateCode]) return { error: "Choose a state." };
  const poPrefix = String(fd.get("poPrefix") ?? "").trim().toUpperCase().replace(/[^A-Z0-9/-]/g, "").slice(0, 24);
  const billingEmail = String(fd.get("billingEmail") ?? "").trim().toLowerCase();
  if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) return { error: "Billing email looks wrong." };
  await db.company.update({ where: { id: user.membership.company.id }, data: { stateCode: stateCode || null, poPrefix: poPrefix || null, billingEmail: billingEmail || null, poTerms: String(fd.get("poTerms") ?? "").trim(), gstLegalName: String(fd.get("legalName") ?? "").trim() || null } });
  await audit(user.id, "company.po_settings", user.membership.company.id);
  revalidatePath("/settings");
  return { ok: "Purchase order settings saved." };
}
