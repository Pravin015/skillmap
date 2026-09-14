"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isStaff, requireUser } from "@/lib/auth";
import { audit, notify } from "@/lib/notify";
import { createRazorpayPaymentLink, razorpayConfigured } from "@/lib/billing";
import { appUrl } from "@/lib/oauth";
import type { ActionState } from "@/lib/types";
import { memberCan } from "@/lib/permissions";

function refresh(requirementId: string) {
  revalidatePath(`/requirements/${requirementId}/work-order`);
  revalidatePath("/admin/escrow");
  revalidatePath("/dashboard");
}

async function feePercent() {
  const s = await db.setting.findUnique({ where: { key: "escrow_fee_percent" } });
  const n = Number(s?.value ?? 5);
  return Number.isFinite(n) && n >= 0 && n <= 30 ? n : 5;
}

/**
 * Company secures the work-order amount with CorpGurus before delivery. With Razorpay keys a payment link is created and the
 * member is redirected to pay; without keys (development) the deposit is marked funded immediately.
 */
export async function fundEscrow(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const wo = await db.workOrder.findUnique({ where: { id: String(fd.get("workOrderId")) }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, trainer: { select: { id: true, userId: true, user: { select: { name: true } } } }, escrow: true } });
  if (!wo || !memberCan(wo.company.members, user.id, "fund_escrow")) return { error: "Only the company on this work order can fund it." };
  if (wo.status !== "ACCEPTED") return { error: "Fund the deposit once the trainer has accepted the work order." };
  if (wo.escrow && wo.escrow.status !== "PENDING" && wo.escrow.status !== "REFUNDED") return { error: "This work order is already funded." };
  if (wo.total <= 0) return { error: "The work order total is zero." };
  const pct = await feePercent();
  const fee = Math.round((wo.total * pct) / 100);
  const base = { workOrderId: wo.id, companyId: wo.companyId, trainerId: wo.trainer.id, amount: wo.total, feePercent: pct, fee, currency: wo.currency };

  if (razorpayConfigured() && wo.currency === "INR") {
    const esc = wo.escrow
      ? await db.escrowDeposit.update({ where: { id: wo.escrow.id }, data: { ...base, status: "PENDING", provider: "razorpay", providerRef: null, fundedAt: null, refundedAt: null } })
      : await db.escrowDeposit.create({ data: { ...base, provider: "razorpay" } });
    const link = await createRazorpayPaymentLink({ amountMinor: wo.total * 100, currency: "INR", description: `Escrow deposit · WO-${String(wo.number).padStart(4, "0")} · ${wo.title}`, referenceId: esc.id, callbackUrl: `${appUrl()}/api/escrow/return?id=${esc.id}`, customer: { name: user.name, email: user.email } });
    await db.escrowDeposit.update({ where: { id: esc.id }, data: { providerRef: link.id } });
    redirect(link.short_url);
  }

  const esc = wo.escrow
    ? await db.escrowDeposit.update({ where: { id: wo.escrow.id }, data: { ...base, status: "FUNDED", provider: "simulated", providerRef: `sim_${Date.now().toString(36)}`, fundedAt: new Date(), refundedAt: null } })
    : await db.escrowDeposit.create({ data: { ...base, status: "FUNDED", provider: "simulated", providerRef: `sim_${Date.now().toString(36)}`, fundedAt: new Date() } });
  await audit(user.id, "escrow.fund", esc.id, { amount: wo.total, currency: wo.currency, simulated: true });
  await notify(wo.trainer.userId, "workorder", "Payment secured in escrow", `${wo.company.name} deposited ${wo.currency} ${wo.total.toLocaleString("en-IN")} for ${wo.title}. It is released to you after delivery.`, `/requirements/${wo.requirementId}/work-order`);
  refresh(wo.requirementId);
  return { ok: "Deposit funded (simulated; connect Razorpay keys for live payments). The trainer has been notified." };
}

/** Company releases the funds to the trainer once the training is delivered. */
export async function releaseEscrow(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const esc = await db.escrowDeposit.findUnique({ where: { id: String(fd.get("id")) }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, trainer: { select: { userId: true } }, workOrder: { select: { title: true, requirementId: true } } } });
  if (!esc || !memberCan(esc.company.members, user.id, "fund_escrow")) return { error: "Only the company can release the deposit." };
  if (esc.status !== "FUNDED") return { error: "This deposit is not funded." };
  const note = String(fd.get("note") ?? "").trim().slice(0, 300) || null;
  await db.escrowDeposit.update({ where: { id: esc.id }, data: { status: "RELEASED", releasedAt: new Date(), note } });
  await audit(user.id, "escrow.release", esc.id, { note });
  const staff = await db.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true } });
  await notify(esc.trainer.userId, "invoice", "Escrow released", `${esc.company.name} released ${esc.currency} ${(esc.amount - esc.fee).toLocaleString("en-IN")} for ${esc.workOrder.title}. CorpGurus will pay it out to your bank details on file.`, `/requirements/${esc.workOrder.requirementId}/work-order`);
  await notify(staff.map((s) => s.id), "moderation", "Escrow payout due", `${esc.company.name} released ${esc.currency} ${esc.amount.toLocaleString("en-IN")} (fee ${esc.fee}) for ${esc.workOrder.title}.`, "/admin/escrow");
  refresh(esc.workOrder.requirementId);
  return { ok: "Released. CorpGurus pays the trainer out within 2 working days." };
}

/** Trainer nudges the company after delivery. */
export async function requestEscrowRelease(fd: FormData) {
  const user = await requireUser();
  const esc = await db.escrowDeposit.findUnique({ where: { id: String(fd.get("id")) }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, trainer: { select: { userId: true } }, workOrder: { select: { title: true, requirementId: true } } } });
  if (!esc || esc.trainer.userId !== user.id || esc.status !== "FUNDED") return;
  await notify(esc.company.members.map((m) => m.userId), "workorder", `${user.name} requested release of the escrow deposit`, `${esc.workOrder.title} · release from the work order page once delivery is complete.`, `/requirements/${esc.workOrder.requirementId}/work-order`);
  refresh(esc.workOrder.requirementId);
}

/** Staff records the bank payout to the trainer. */
export async function markEscrowPaidOut(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!isStaff(user)) return { error: "Staff only." };
  const esc = await db.escrowDeposit.findUnique({ where: { id: String(fd.get("id")) }, include: { trainer: { select: { userId: true } }, workOrder: { select: { title: true, requirementId: true } } } });
  if (!esc || esc.status !== "RELEASED") return { error: "This deposit is not awaiting payout." };
  const payoutRef = String(fd.get("payoutRef") ?? "").trim().slice(0, 120);
  if (!payoutRef) return { error: "Enter the bank transfer / UTR reference." };
  await db.escrowDeposit.update({ where: { id: esc.id }, data: { status: "PAID_OUT", paidOutAt: new Date(), payoutRef } });
  await audit(user.id, "escrow.payout", esc.id, { payoutRef });
  await notify(esc.trainer.userId, "invoice", "Payout sent", `${esc.currency} ${(esc.amount - esc.fee).toLocaleString("en-IN")} for ${esc.workOrder.title} · ref ${payoutRef}.`, `/requirements/${esc.workOrder.requirementId}/work-order`);
  refresh(esc.workOrder.requirementId);
  return { ok: "Payout recorded and the trainer notified." };
}

/** Company (while funded) or staff refunds the deposit, e.g. a cancelled engagement. */
export async function refundEscrow(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const esc = await db.escrowDeposit.findUnique({ where: { id: String(fd.get("id")) }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, trainer: { select: { userId: true } }, workOrder: { select: { title: true, requirementId: true, status: true } } } });
  if (!esc) return { error: "Deposit not found." };
  const allowed = isStaff(user) || memberCan(esc.company.members, user.id, "fund_escrow");
  if (!allowed) return { error: "Not allowed." };
  if (esc.status !== "FUNDED") return { error: "Only funded deposits can be refunded." };
  if (!isStaff(user) && esc.workOrder.status !== "CANCELLED") return { error: "Cancel the work order first, or ask CorpGurus support to refund." };
  const note = String(fd.get("note") ?? "").trim().slice(0, 300) || null;
  await db.escrowDeposit.update({ where: { id: esc.id }, data: { status: "REFUNDED", refundedAt: new Date(), note } });
  await audit(user.id, "escrow.refund", esc.id, { note });
  await notify([...esc.company.members.map((m) => m.userId), esc.trainer.userId], "workorder", "Escrow deposit refunded", `${esc.workOrder.title} · ${esc.currency} ${esc.amount.toLocaleString("en-IN")} returned to ${esc.company.name}.`, `/requirements/${esc.workOrder.requirementId}/work-order`);
  refresh(esc.workOrder.requirementId);
  return { ok: "Refunded." };
}
