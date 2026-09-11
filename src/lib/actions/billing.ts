"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BillingInterval, PlanCode } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify, audit } from "@/lib/notify";
import {
  ACTIVE_STATUSES, cancelRazorpaySubscription, createRazorpaySubscription, ensureRazorpayPlan, planByCode, planPrice, publicKeyId,
  razorpayConfigured, simulatorEnabled, subscriptionWhere, verifyCheckoutSignature,
} from "@/lib/billing";
import type { ActionState } from "@/lib/types";

const PLAN_CODES: PlanCode[] = ["TRAINER_PRO", "COMPANY_GROWTH", "PARTNER"];

function billingRefresh() {
  for (const p of ["/settings/billing", "/pricing", "/dashboard", "/trainers", "/admin/platform"]) revalidatePath(p);
}

/** Who may buy which plan: trainers buy Trainer Pro for themselves; company owners buy company plans for the company. */
async function subject(plan: PlanCode) {
  const user = await requireUser("/pricing");
  const def = planByCode(plan);
  if (def.audience === "TRAINER") {
    if (user.role !== "TRAINER") throw new Error("Trainer Pro is for trainer accounts.");
    return { user, where: { userId: user.id }, label: user.name };
  }
  if (!user.membership) throw new Error("Company plans need a company account.");
  if (user.membership.role !== "OWNER") throw new Error("Only the company owner can manage billing.");
  return { user, where: { companyId: user.membership.company.id }, label: user.membership.company.name };
}

export type CheckoutSession = { keyId: string; subscriptionId: string; name: string; description: string; prefill: { name: string; email: string }; localId: string } | { error: string };

/** Creates a Razorpay subscription and returns what Checkout.js needs. Called from the client before opening the Razorpay modal. */
export async function startCheckout(plan: PlanCode, interval: BillingInterval): Promise<CheckoutSession> {
  if (!PLAN_CODES.includes(plan)) return { error: "Unknown plan." };
  if (!razorpayConfigured()) return { error: "Payments are not configured yet. Add the Razorpay keys to .env." };
  let s;
  try { s = await subject(plan); } catch (e) { return { error: (e as Error).message }; }
  const existing = await db.subscription.findFirst({ where: { ...s.where, status: { in: ACTIVE_STATUSES } } });
  if (existing) return { error: `${s.label} already has an active ${planByCode(existing.plan).name} plan. Cancel it first to change plans.` };

  try {
    const planId = await ensureRazorpayPlan(plan, interval);
    const rs = await createRazorpaySubscription(planId, interval, { plan, interval, subject: s.label, userId: s.user.id, companyId: s.user.membership?.company.id ?? "" });
    const local = await db.subscription.create({ data: { ...s.where, plan, interval, amount: planPrice(plan, interval), razorpaySubscriptionId: rs.id, razorpayPlanId: planId, status: "CREATED" } });
    return { keyId: publicKeyId(), subscriptionId: rs.id, name: "CorpGurus", description: `${planByCode(plan).name} · ${interval === "YEARLY" ? "yearly" : "monthly"}`, prefill: { name: s.user.name, email: s.user.email }, localId: local.id };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Razorpay Checkout success handler posts the payment id and signature here. */
export async function confirmCheckout(fd: FormData): Promise<void> {
  const user = await requireUser();
  const paymentId = String(fd.get("razorpay_payment_id") ?? "");
  const subscriptionId = String(fd.get("razorpay_subscription_id") ?? "");
  const signature = String(fd.get("razorpay_signature") ?? "");
  const sub = await db.subscription.findUnique({ where: { razorpaySubscriptionId: subscriptionId } });
  if (!sub || !verifyCheckoutSignature(paymentId, subscriptionId, signature)) redirect("/settings/billing?error=signature");
  const mine = sub.userId === user.id || (!!user.membership && sub.companyId === user.membership.company.id);
  if (!mine) redirect("/settings/billing?error=owner");
  await db.subscription.update({ where: { id: sub.id }, data: { status: "AUTHENTICATED" } });
  await db.payment.upsert({ where: { razorpayPaymentId: paymentId }, create: { subscriptionId: sub.id, razorpayPaymentId: paymentId, amount: sub.amount, currency: sub.currency, status: "authorized" }, update: {} });
  await notify(user.id, "billing", `${planByCode(sub.plan).name} is being activated`, "Your first charge is confirmed. Benefits switch on as soon as Razorpay confirms the subscription (usually within a minute).", "/settings/billing");
  billingRefresh();
  redirect("/settings/billing?success=1");
}

export async function cancelSubscription(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const sub = await db.subscription.findFirst({ where: { id, ...subscriptionWhere(user) } });
  if (!sub) return { error: "Subscription not found." };
  if (sub.companyId && user.membership?.role !== "OWNER") return { error: "Only the company owner can cancel the plan." };
  if (!ACTIVE_STATUSES!.includes(sub.status)) return { error: "This subscription is not active." };
  try {
    if (sub.razorpaySubscriptionId && !sub.simulated) {
      const r = await cancelRazorpaySubscription(sub.razorpaySubscriptionId, true);
      await db.subscription.update({ where: { id }, data: { cancelAtPeriodEnd: true, currentPeriodEnd: r.current_end ? new Date(r.current_end * 1000) : sub.currentPeriodEnd } });
    } else {
      await db.subscription.update({ where: { id }, data: { cancelAtPeriodEnd: true } });
    }
  } catch (e) { return { error: (e as Error).message }; }
  await audit(user.id, "subscription.cancel", id, { plan: sub.plan });
  billingRefresh();
  return { ok: `Cancelled. ${planByCode(sub.plan).name} stays active until the end of the current billing period.` };
}

/* ---------- Development simulator (no Razorpay keys) ---------- */

export async function simulateCheckout(_p: ActionState, fd: FormData): Promise<ActionState> {
  if (!simulatorEnabled()) return { error: "The simulator is only available in development without Razorpay keys." };
  const plan = String(fd.get("plan")) as PlanCode;
  const interval = (String(fd.get("interval")) === "YEARLY" ? "YEARLY" : "MONTHLY") as BillingInterval;
  if (!PLAN_CODES.includes(plan)) return { error: "Unknown plan." };
  let s;
  try { s = await subject(plan); } catch (e) { return { error: (e as Error).message }; }
  if (await db.subscription.findFirst({ where: { ...s.where, status: { in: ACTIVE_STATUSES } } })) return { error: `${s.label} already has an active plan.` };
  const end = new Date(); end.setMonth(end.getMonth() + (interval === "YEARLY" ? 12 : 1));
  const sub = await db.subscription.create({ data: { ...s.where, plan, interval, amount: planPrice(plan, interval), status: "ACTIVE", simulated: true, currentPeriodEnd: end, razorpaySubscriptionId: `sim_${Date.now()}` } });
  await db.payment.create({ data: { subscriptionId: sub.id, razorpayPaymentId: `sim_pay_${Date.now()}`, amount: sub.amount, status: "captured", method: "simulator" } });
  await notify(s.user.id, "billing", `${planByCode(plan).name} activated (simulated)`, "This is a development simulation. No money moved.", "/settings/billing");
  await audit(s.user.id, "subscription.simulate", sub.id, { plan, interval });
  billingRefresh();
  redirect("/settings/billing?success=1&simulated=1");
}

export async function simulateExpire(fd: FormData) {
  if (!simulatorEnabled()) return;
  const user = await requireUser();
  const id = String(fd.get("id"));
  const sub = await db.subscription.findFirst({ where: { id, ...subscriptionWhere(user), simulated: true } });
  if (!sub) return;
  await db.subscription.update({ where: { id }, data: { status: "CANCELLED" } });
  billingRefresh();
}
