"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify, audit } from "@/lib/notify";
import type { ActionState } from "@/lib/types";
import { dispatchWebhook } from "@/lib/webhooks";

async function emitInvoice(id: string, event: "invoice.created" | "invoice.paid") {
  const i = await db.invoice.findUnique({ where: { id }, select: { id: true, invoiceNumber: true, status: true, amount: true, gstRate: true, gstAmount: true, total: true, currency: true, dueDate: true, paidAt: true, paidReference: true, workOrderId: true, companyId: true, createdAt: true, trainer: { select: { id: true, slug: true, user: { select: { name: true } } } } } });
  if (i) await dispatchWebhook(i.companyId, event, { invoice: { id: i.id, number: i.invoiceNumber, status: i.status, amount: i.amount, gst_rate: i.gstRate, gst_amount: i.gstAmount, total: i.total, currency: i.currency, due_date: i.dueDate, paid_at: i.paidAt, paid_reference: i.paidReference, work_order_id: i.workOrderId, trainer: { id: i.trainer.id, slug: i.trainer.slug, name: i.trainer.user.name }, created_at: i.createdAt } });
}

function refresh(id?: string) {
  revalidatePath("/dashboard/invoices"); revalidatePath("/dashboard"); revalidatePath("/dashboard/analytics");
  if (id) revalidatePath(`/invoices/${id}`);
}

/** Trainer raises an invoice against an accepted work order. */
export async function raiseInvoice(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Only trainers raise invoices." };
  const workOrderId = String(fd.get("workOrderId"));
  const wo = await db.workOrder.findUnique({ where: { id: workOrderId }, include: { company: { include: { members: { select: { userId: true } } } }, requirement: { select: { id: true, title: true } }, invoices: { where: { status: { in: ["SENT", "PAID"] } } } } });
  if (!wo || wo.trainerId !== user.trainerProfile.id) return { error: "Work order not found." };
  if (wo.status !== "ACCEPTED") return { error: "The work order must be accepted before invoicing." };
  if (wo.invoices.length) return { error: "An invoice already exists for this work order." };
  const amount = Number(fd.get("amount") || wo.total);
  if (!(amount > 0)) return { error: "Enter the amount." };
  const gstRate = Number(fd.get("gstRate") ?? 18);
  if (![0, 5, 12, 18, 28].includes(gstRate)) return { error: "Choose a valid GST rate." };
  const invoiceNumber = String(fd.get("invoiceNumber") ?? "").trim();
  if (!invoiceNumber) return { error: "Enter your invoice number." };
  const dueDate = new Date(String(fd.get("dueDate") || "") || Date.now() + 30 * 86400000);
  const trainerGstin = String(fd.get("trainerGstin") ?? "").trim() || null;
  const paymentDetails = String(fd.get("paymentDetails") ?? "").trim();
  const gstAmount = Math.round((amount * gstRate) / 100);
  const inv = await db.invoice.create({ data: {
    invoiceNumber, workOrderId, trainerId: wo.trainerId, companyId: wo.companyId, issuedById: user.id, description: String(fd.get("description") ?? "").trim() || `${wo.title} · ${wo.days} day${wo.days > 1 ? "s" : ""} × ${wo.dayRate}`,
    amount, gstRate, gstAmount, total: amount + gstAmount, currency: wo.currency, trainerGstin, companyGstin: wo.company.gstin, paymentDetails, notes: String(fd.get("notes") ?? "").trim(), dueDate,
  } });
  await db.trainerProfile.update({ where: { id: wo.trainerId }, data: { gstin: trainerGstin ?? undefined, paymentDetails: paymentDetails || undefined } });
  await emitInvoice(inv.id, "invoice.created");
  await notify(wo.company.members.map((m) => m.userId), "invoice", `Invoice ${invoiceNumber} from ${user.name}`, `${wo.title} · total ${wo.currency} ${(amount + gstAmount).toLocaleString("en-IN")} · due ${dueDate.toDateString()}`, `/invoices/${inv.id}`);
  refresh(inv.id);
  redirect(`/invoices/${inv.id}?sent=1`);
}

export async function markInvoicePaid(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const reference = String(fd.get("reference") ?? "").trim();
  const inv = await db.invoice.findUnique({ where: { id }, include: { trainer: { select: { userId: true } }, company: { include: { members: { select: { userId: true } } } } } });
  if (!inv || !inv.company.members.some((m) => m.userId === user.id)) return { error: "Only the billed company can mark an invoice paid." };
  if (inv.status !== "SENT") return { error: "This invoice is not awaiting payment." };
  await db.invoice.update({ where: { id }, data: { status: "PAID", paidAt: new Date(), paidReference: reference || null } });
  await notify(inv.trainer.userId, "invoice", `Invoice ${inv.invoiceNumber} marked paid`, `${inv.company.name} recorded payment${reference ? ` · ref ${reference}` : ""}.`, `/invoices/${id}`);
  await audit(user.id, "invoice.paid", id, { reference });
  await emitInvoice(id, "invoice.paid");
  refresh(id);
  return { ok: "Marked as paid. The trainer has been notified." };
}

export async function cancelInvoice(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const inv = await db.invoice.findUnique({ where: { id }, include: { company: { include: { members: { select: { userId: true } } } } } });
  if (!inv || inv.status !== "SENT" || inv.issuedById !== user.id) return;
  await db.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
  await notify(inv.company.members.map((m) => m.userId), "invoice", `Invoice ${inv.invoiceNumber} cancelled`, "The trainer withdrew this invoice.", `/invoices/${id}`);
  refresh(id);
}
