"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify, audit } from "@/lib/notify";
import type { ActionState } from "@/lib/types";
import { companyCan, memberCan } from "@/lib/permissions";
import { dispatchWebhook } from "@/lib/webhooks";
import { invoiceSelect, shapeInvoice } from "@/lib/api-shapes";
import { computeTax, docNumber, financialYear, parseLines, SAC_CODES, STATE_CODES, stateCodeFromGstin, suggestPrefix, sumLines } from "@/lib/gst";
import { decrypt } from "@/lib/crypto";
import { invoicePdf } from "@/lib/documents";
import { dateRange } from "@/lib/utils";

async function emitInvoice(id: string, event: "invoice.created" | "invoice.paid") {
  const i = await db.invoice.findUnique({ where: { id }, select: { ...invoiceSelect, companyId: true } });
  if (i) await dispatchWebhook(i.companyId, event, { invoice: shapeInvoice(i) });
}

function refresh(id?: string, poId?: string | null) {
  revalidatePath("/dashboard/invoices"); revalidatePath("/dashboard"); revalidatePath("/dashboard/analytics"); revalidatePath("/dashboard/purchase-orders");
  if (id) revalidatePath(`/invoices/${id}`);
  if (poId) revalidatePath(`/purchase-orders/${poId}`);
}

/** Bank details block printed on the invoice, from the encrypted account on file. */
function bankBlock(p: { bankHolder: string | null; bankAccountEnc: string | null; bankIfsc: string | null; gstin: string | null; pan: string | null }) {
  const acct = decrypt(p.bankAccountEnc);
  if (!p.bankHolder || !acct || !p.bankIfsc) return null;
  return [`Account name: ${p.bankHolder}`, `Account number: ${acct}`, `IFSC code: ${p.bankIfsc}`, `Bank: ${p.bankIfsc.slice(0, 4)}`, p.gstin ? `GSTIN: ${p.gstin}` : null, p.pan ? `PAN: ${p.pan}` : null].filter(Boolean).join("\n");
}

/** Trainer raises a tax invoice against an accepted work order, optionally under an accepted purchase order. */
export async function raiseInvoice(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Only trainers raise invoices." };
  const workOrderId = String(fd.get("workOrderId"));
  const purchaseOrderId = String(fd.get("purchaseOrderId") ?? "").trim() || null;
  const wo = await db.workOrder.findUnique({ where: { id: workOrderId }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, requirement: { select: { id: true, title: true } }, invoices: { where: { status: { in: ["SENT", "PAID"] } }, select: { amount: true, purchaseOrderId: true } } } });
  if (!wo || wo.trainerId !== user.trainerProfile.id) return { error: "Work order not found." };
  if (wo.status !== "ACCEPTED") return { error: "The work order must be accepted before invoicing." };
  const po = purchaseOrderId ? await db.purchaseOrder.findUnique({ where: { id: purchaseOrderId } }) : null;
  if (purchaseOrderId && (!po || po.workOrderId !== wo.id)) return { error: "That purchase order does not belong to this work order." };
  if (po && po.status !== "ACCEPTED") return { error: po.status === "ISSUED" ? "Accept the purchase order first, then invoice against it." : `The purchase order is ${po.status.toLowerCase().replace("_", " ")}; it cannot be invoiced.` };
  const lines = parseLines(String(fd.get("lines") ?? ""));
  if (typeof lines === "string") return { error: lines };
  const subtotal = sumLines(lines);
  if (!(subtotal > 0)) return { error: "The invoice total must be more than zero." };
  if (po) {
    const billed = wo.invoices.filter((i) => i.purchaseOrderId === po.id).reduce((n, i) => n + i.amount, 0);
    if (billed + subtotal > po.subtotal) return { error: `This would bill ${wo.currency} ${(billed + subtotal).toLocaleString("en-IN")} against a purchase order of ${wo.currency} ${po.subtotal.toLocaleString("en-IN")} (${wo.currency} ${(po.subtotal - billed).toLocaleString("en-IN")} remaining). Ask the company to revise the PO for extra charges.` };
  }
  const gstRate = Number(fd.get("gstRate") ?? 18);
  if (![0, 5, 12, 18, 28].includes(gstRate)) return { error: "Choose a valid GST rate." };
  const sacCode = String(fd.get("sacCode") ?? "999293");
  if (!SAC_CODES.some((s) => s.code === sacCode)) return { error: "Choose a SAC code." };
  const dueDate = new Date(String(fd.get("dueDate") || "") || Date.now() + 30 * 86400000);
  if (isNaN(dueDate.getTime())) return { error: "Check the due date." };
  const profile = await db.trainerProfile.findUniqueOrThrow({ where: { id: wo.trainerId }, include: { user: { select: { name: true, email: true, phone: true } } } });
  const trainerGstin = (String(fd.get("trainerGstin") ?? "").trim() || profile.gstin || "").toUpperCase() || null;
  if (trainerGstin && !stateCodeFromGstin(trainerGstin)) return { error: "Your GSTIN does not look valid (15 characters, e.g. 27ABCDE1234F1Z5)." };
  if (gstRate > 0 && !trainerGstin) return { error: "Add your GSTIN to charge GST, or set the GST rate to 0%." };
  const supplierStateCode = profile.stateCode || stateCodeFromGstin(trainerGstin);
  const customerName = po?.buyerName ?? wo.company.gstLegalName ?? wo.company.name;
  const customerAddress = po?.buyerAddress ?? wo.company.billingAddress;
  const companyGstin = po?.buyerGstin ?? wo.company.gstin?.toUpperCase() ?? null;
  const customerStateCode = po?.buyerStateCode ?? wo.company.stateCode ?? stateCodeFromGstin(companyGstin);
  const tax = computeTax(subtotal, gstRate, supplierStateCode, customerStateCode);

  // Numbering: use the typed number, else the trainer's running series for the financial year.
  let invoiceNumber = String(fd.get("invoiceNumber") ?? "").trim().slice(0, 40);
  if (!invoiceNumber) {
    const fy = financialYear();
    const seq = profile.invoiceSeqFy === fy ? profile.invoiceSeq + 1 : 1;
    await db.trainerProfile.update({ where: { id: profile.id }, data: { invoiceSeq: seq, invoiceSeqFy: fy } });
    invoiceNumber = docNumber(profile.invoicePrefix || suggestPrefix(profile.legalName || profile.user.name, "initials"), fy, seq);
  }
  if (await db.invoice.findFirst({ where: { trainerId: profile.id, invoiceNumber, status: { not: "CANCELLED" } }, select: { id: true } })) return { error: `You already have an invoice numbered ${invoiceNumber}.` };

  const includeBank = String(fd.get("includeBank") ?? "1") === "1";
  const paymentDetails = (includeBank ? bankBlock(profile) : null) ?? String(fd.get("paymentDetails") ?? "").trim() ?? profile.paymentDetails ?? "";
  const participantsRaw = String(fd.get("participants") ?? "").trim();
  const s = (k: string) => String(fd.get(k) ?? "").trim();
  const inv = await db.invoice.create({ data: {
    invoiceNumber, workOrderId, purchaseOrderId: po?.id ?? null, poNumber: po?.poNumber ?? (s("poNumber").slice(0, 60) || null), poDate: po?.poDate ?? null,
    trainerId: wo.trainerId, companyId: wo.companyId, issuedById: user.id,
    description: lines[0].description, amount: subtotal, gstRate, gstAmount: tax.gstAmount, total: tax.total, currency: wo.currency,
    taxType: tax.taxType, cgstAmount: tax.cgst, sgstAmount: tax.sgst, igstAmount: tax.igst, sacCode,
    placeOfSupply: s("placeOfSupply").slice(0, 300) || po?.placeOfSupply || "", periodText: s("periodText").slice(0, 200) || po?.periodText || dateRange(wo.startDate, wo.endDate), participants: participantsRaw ? Number(participantsRaw) || null : po?.participants ?? wo.participants, endClientRef: s("endClientRef").slice(0, 200) || po?.endClientRef || null,
    trainerGstin, companyGstin, supplierName: profile.legalName || profile.user.name, supplierAddress: profile.billingAddress, supplierPan: profile.pan, supplierStateCode, supplierContact: [profile.user.email, profile.user.phone].filter(Boolean).join(" | "),
    customerName, customerAddress, customerStateCode, trainerName: profile.user.name, signatoryName: s("signatoryName").slice(0, 80) || profile.signatoryName || profile.user.name,
    paymentDetails, notes: s("notes"), dueDate,
    lines: { create: lines },
  } });
  if (String(fd.get("trainerGstin") ?? "").trim() && trainerGstin !== profile.gstin) await db.trainerProfile.update({ where: { id: profile.id }, data: { gstin: trainerGstin } });
  await audit(user.id, "invoice.create", inv.id, { invoiceNumber, total: tax.total, purchaseOrderId: po?.id });
  await emitInvoice(inv.id, "invoice.created");
  const pdf = await invoicePdf(inv.id).catch((e) => { console.error("[invoice pdf]", (e as Error).message); return null; });
  const recipients = wo.company.members.filter((m) => companyCan(m.role, "pay_invoice") || companyCan(m.role, "sign_work_order")).map((m) => m.userId);
  await notify(recipients, "invoice", `Invoice ${invoiceNumber} from ${profile.user.name}`, `${wo.title}${po ? ` · against ${po.poNumber}` : ""} · total ${wo.currency} ${tax.total.toLocaleString("en-IN")} · due ${dueDate.toDateString()}`, `/invoices/${inv.id}`, pdf ? { attachments: [{ filename: pdf.filename, content: pdf.buffer }] } : undefined);
  refresh(inv.id, po?.id);
  redirect(`/invoices/${inv.id}?sent=1`);
}

export async function markInvoicePaid(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const reference = String(fd.get("reference") ?? "").trim();
  const tdsRate = Number(fd.get("tdsRate") ?? 0);
  if (![0, 1, 2, 5, 10].includes(tdsRate)) return { error: "Choose a valid TDS rate." };
  const inv = await db.invoice.findUnique({ where: { id }, include: { trainer: { select: { userId: true } }, company: { include: { members: { select: { userId: true, role: true } } } }, creditNotes: { select: { total: true } } } });
  if (!inv || !memberCan(inv.company.members, user.id, "pay_invoice")) return { error: "Only the billed company can mark an invoice paid." };
  if (inv.status !== "SENT") return { error: "This invoice is not awaiting payment." };
  // TDS under section 194J applies to the taxable value, not to GST.
  const tdsAmount = Math.round((inv.amount * tdsRate) / 100);
  const credits = inv.creditNotes.reduce((n, c) => n + c.total, 0);
  const amountReceived = Math.max(0, inv.total - credits - tdsAmount);
  await db.invoice.update({ where: { id }, data: { status: "PAID", paidAt: new Date(), paidReference: reference || null, tdsRate, tdsAmount, amountReceived } });
  await notify(inv.trainer.userId, "invoice", `Invoice ${inv.invoiceNumber} marked paid`, `${inv.company.name} recorded ${inv.currency} ${amountReceived.toLocaleString("en-IN")}${tdsAmount ? ` after ${tdsRate}% TDS (${inv.currency} ${tdsAmount.toLocaleString("en-IN")})` : ""}${reference ? ` · ref ${reference}` : ""}.`, `/invoices/${id}`);
  await audit(user.id, "invoice.paid", id, { reference, tdsRate, tdsAmount, amountReceived });
  await emitInvoice(id, "invoice.paid");
  let closed = false;
  if (inv.purchaseOrderId) {
    const po = await db.purchaseOrder.findUnique({ where: { id: inv.purchaseOrderId }, select: { status: true, subtotal: true, invoices: { where: { status: "PAID" }, select: { amount: true } } } });
    if (po?.status === "ACCEPTED" && po.invoices.reduce((n, i) => n + i.amount, 0) >= po.subtotal) {
      await db.purchaseOrder.update({ where: { id: inv.purchaseOrderId }, data: { status: "CLOSED", closedAt: new Date() } });
      closed = true;
    }
  }
  refresh(id, inv.purchaseOrderId);
  return { ok: `Marked as paid. The trainer has been notified.${closed ? " The purchase order is fully settled and now closed." : ""}` };
}

/** Trainer issues a credit note against a sent or paid invoice (short delivery, agreed discount). Reduces what the company owes. */
export async function issueCreditNote(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Only the trainer who raised the invoice can issue a credit note." };
  const invoiceId = String(fd.get("invoiceId"));
  const amount = Math.round(Number(fd.get("amount")));
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 300);
  const inv = await db.invoice.findUnique({ where: { id: invoiceId }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, creditNotes: { select: { amount: true } } } });
  if (!inv || inv.trainerId !== user.trainerProfile.id) return { error: "Invoice not found." };
  if (!["SENT", "PAID"].includes(inv.status)) return { error: "Credit notes apply to sent or paid invoices only." };
  if (!(amount > 0)) return { error: "Enter the taxable amount to credit." };
  const already = inv.creditNotes.reduce((n, c) => n + c.amount, 0);
  if (already + amount > inv.amount) return { error: `Credit notes cannot exceed the invoice value (${inv.currency} ${(inv.amount - already).toLocaleString("en-IN")} left to credit).` };
  if (reason.length < 5) return { error: "Give a short reason; it prints on the credit note and the ledger." };
  const gstAmount = Math.round((amount * inv.gstRate) / 100);
  const seq = (await db.creditNote.count({ where: { trainerId: inv.trainerId } })) + 1;
  const creditNumber = `CN-${inv.invoiceNumber}-${String(seq).padStart(2, "0")}`;
  const cn = await db.creditNote.create({ data: { creditNumber, invoiceId, trainerId: inv.trainerId, companyId: inv.companyId, issuedById: user.id, amount, gstAmount, total: amount + gstAmount, reason } });
  await audit(user.id, "credit_note.issue", cn.id, { invoiceId, amount, total: amount + gstAmount });
  const recipients = inv.company.members.filter((m) => companyCan(m.role, "pay_invoice") || companyCan(m.role, "sign_work_order")).map((m) => m.userId);
  await notify(recipients, "invoice", `Credit note ${creditNumber} against ${inv.invoiceNumber}`, `${user.name} credited ${inv.currency} ${(amount + gstAmount).toLocaleString("en-IN")} incl. GST: ${reason}`, `/invoices/${invoiceId}`);
  refresh(invoiceId, inv.purchaseOrderId);
  return { ok: `Credit note ${creditNumber} issued for ${inv.currency} ${(amount + gstAmount).toLocaleString("en-IN")} incl. GST.` };
}

export async function cancelInvoice(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const inv = await db.invoice.findUnique({ where: { id }, include: { company: { include: { members: { select: { userId: true, role: true } } } } } });
  if (!inv || inv.status !== "SENT" || inv.issuedById !== user.id) return;
  await db.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
  await notify(inv.company.members.map((m) => m.userId), "invoice", `Invoice ${inv.invoiceNumber} cancelled`, "The trainer withdrew this invoice.", `/invoices/${id}`);
  refresh(id, inv.purchaseOrderId);
}

/** Trainer settings: the legal identity and numbering series printed on invoices. */
export async function saveInvoiceIdentity(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Trainer accounts only." };
  const stateCode = String(fd.get("stateCode") ?? "");
  if (stateCode && !STATE_CODES[stateCode]) return { error: "Choose a state." };
  const gstin = String(fd.get("gstin") ?? "").trim().toUpperCase();
  if (gstin && !stateCodeFromGstin(gstin)) return { error: "GSTIN should be 15 characters, e.g. 27ABCDE1234F1Z5." };
  if (gstin && stateCode && stateCodeFromGstin(gstin) !== stateCode) return { error: `That GSTIN is registered in ${STATE_CODES[stateCodeFromGstin(gstin)!]}; pick the same state.` };
  const invoicePrefix = String(fd.get("invoicePrefix") ?? "").trim().toUpperCase().replace(/[^A-Z0-9/-]/g, "").slice(0, 24);
  await db.trainerProfile.update({ where: { id: user.trainerProfile.id }, data: { legalName: String(fd.get("legalName") ?? "").trim().slice(0, 120) || null, billingAddress: String(fd.get("billingAddress") ?? "").trim().slice(0, 400) || null, stateCode: stateCode || null, gstin: gstin || null, invoicePrefix: invoicePrefix || null, signatoryName: String(fd.get("signatoryName") ?? "").trim().slice(0, 80) || null } });
  await audit(user.id, "trainer.invoice_identity", user.trainerProfile.id);
  revalidatePath("/settings");
  return { ok: "Invoice details saved. They print on every invoice you raise from now on." };
}
