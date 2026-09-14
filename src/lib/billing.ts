import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { BillingInterval, PlanCode, Prisma, Role } from "@prisma/client";
import { db } from "./db";

/* ---------- Plan catalogue (prices in INR paise) ---------- */

export type PlanDef = {
  code: PlanCode;
  name: string;
  audience: "TRAINER" | "COMPANY";
  tagline: string;
  monthly: number;
  yearly: number;
  features: string[];
};

export const PLANS: PlanDef[] = [
  {
    code: "TRAINER_PRO", name: "Trainer Pro", audience: "TRAINER", tagline: "For trainers who want every batch they qualify for.",
    monthly: 99900, yearly: 999000,
    features: ["Unlimited applications", "Featured placement in trainer search", "Pro badge on your profile", "Early notifications for matching requirements", "Priority verification of certifications"],
  },
  {
    code: "COMPANY_GROWTH", name: "Company Growth", audience: "COMPANY", tagline: "For L&D teams that hire trainers every month.",
    monthly: 499900, yearly: 4999000,
    features: ["Unlimited open requirements", "Message any trainer directly", "Saved shortlists and invite-only posts", "Up to 10 team members", "Verified company badge fast-track"],
  },
  {
    code: "PARTNER", name: "Training Partner", audience: "COMPANY", tagline: "For partners staffing dozens of batches a quarter.",
    monthly: 1499900, yearly: 14999000,
    features: ["Everything in Growth", "Unlimited team members", "Partner badge on requirements", "Bench view of every trainer you have awarded", "Priority support"],
  },
];

export const planByCode = (code: PlanCode) => PLANS.find((p) => p.code === code)!;
export const planPrice = (code: PlanCode, interval: BillingInterval) => (interval === "YEARLY" ? planByCode(code).yearly : planByCode(code).monthly);
export const fmtAmount = (minor: number, currency: string) => new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
export const inr = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

/* ---------- Razorpay client ---------- */

const keyId = () => process.env.RAZORPAY_KEY_ID ?? "";
const keySecret = () => process.env.RAZORPAY_KEY_SECRET ?? "";
export const razorpayConfigured = () => !!keyId() && !!keySecret();
export const publicKeyId = () => keyId();
export const simulatorEnabled = () => !razorpayConfigured() && process.env.NODE_ENV !== "production";
export const usdSimulatorEnabled = () => !process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production";

async function rzp<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString("base64")}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) throw new Error(json.error?.description || `Razorpay ${path} failed (${res.status})`);
  return json;
}

/** One-off payment link for escrow deposits. https://razorpay.com/docs/api/payments/payment-links/ */
export async function createRazorpayPaymentLink(p: { amountMinor: number; currency: string; description: string; referenceId: string; callbackUrl: string; customer?: { name?: string; email?: string } }) {
  return rzp<{ id: string; short_url: string; status: string }>("/payment_links", { method: "POST", body: { amount: p.amountMinor, currency: p.currency, description: p.description, reference_id: p.referenceId, callback_url: p.callbackUrl, callback_method: "get", customer: p.customer, notes: { kind: "escrow", escrowId: p.referenceId } } });
}
export async function fetchRazorpayPaymentLink(id: string) {
  return rzp<{ id: string; status: string; reference_id?: string; payments?: { payment_id: string; status: string }[] }>(`/payment_links/${id}`);
}

/** Razorpay plan ids are created once per (plan, interval) and cached in the Setting table. */
export async function ensureRazorpayPlan(code: PlanCode, interval: BillingInterval) {
  const key = `rzp_plan_${code}_${interval}`;
  const cached = await db.setting.findUnique({ where: { key } });
  if (cached) return cached.value;
  const def = planByCode(code);
  const created = await rzp<{ id: string }>("/plans", {
    method: "POST",
    body: { period: interval === "YEARLY" ? "yearly" : "monthly", interval: 1, item: { name: `CorpGurus ${def.name} (${interval === "YEARLY" ? "yearly" : "monthly"})`, amount: planPrice(code, interval), currency: "INR", description: def.tagline } },
  });
  await db.setting.upsert({ where: { key }, create: { key, value: created.id }, update: { value: created.id } });
  return created.id;
}

export async function createRazorpaySubscription(planId: string, interval: BillingInterval, notes: Record<string, string>) {
  return rzp<{ id: string; status: string; short_url?: string }>("/subscriptions", {
    method: "POST",
    body: { plan_id: planId, total_count: interval === "YEARLY" ? 10 : 120, quantity: 1, customer_notify: 1, notes },
  });
}

export async function cancelRazorpaySubscription(id: string, atCycleEnd = true) {
  return rzp<{ id: string; status: string; current_end?: number }>(`/subscriptions/${id}/cancel`, { method: "POST", body: { cancel_at_cycle_end: atCycleEnd ? 1 : 0 } });
}

export async function fetchRazorpaySubscription(id: string) {
  return rzp<{ id: string; status: string; current_end?: number | null; plan_id: string; customer_id?: string }>(`/subscriptions/${id}`);
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Checkout success: signature = HMAC_SHA256(payment_id + "|" + subscription_id, key_secret). */
export function verifyCheckoutSignature(paymentId: string, subscriptionId: string, signature: string) {
  const expected = createHmac("sha256", keySecret()).update(`${paymentId}|${subscriptionId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhook: signature = HMAC_SHA256(raw body, webhook_secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

export const mapRazorpayStatus = (s: string) =>
  (({ created: "CREATED", authenticated: "AUTHENTICATED", active: "ACTIVE", pending: "PENDING", halted: "HALTED", cancelled: "CANCELLED", completed: "COMPLETED", expired: "EXPIRED" } as const)[s] ?? "CREATED");

/* ---------- Entitlements ---------- */

export const ACTIVE_STATUSES: Prisma.EnumSubStatusFilter["in"] = ["ACTIVE", "AUTHENTICATED", "PENDING"];

/** Minimal shape needed to resolve a subscription subject. */
export type BillingSubject = { id: string; role?: Role; membership?: { company: { id: string } } | null };

export function subscriptionWhere(user: BillingSubject) {
  return user.membership ? { companyId: user.membership.company.id } : { userId: user.id };
}

/** The subscription that currently grants benefits for this user (their own for trainers, the company's for members). */
export async function activeSubscription(user: BillingSubject | null) {
  if (!user) return null;
  return db.subscription.findFirst({ where: { ...subscriptionWhere(user), status: { in: ACTIVE_STATUSES } }, orderBy: { createdAt: "desc" } });
}

export type Entitlements = {
  plan: PlanCode | null;
  planName: string;
  unlimitedApplications: boolean;
  unlimitedRequirements: boolean;
  messageAnyTrainer: boolean;
  featured: boolean;
  memberLimit: number;
};

export async function entitlementsFor(user: BillingSubject | null): Promise<Entitlements> {
  const sub = await activeSubscription(user);
  const plan = sub?.plan ?? null;
  return {
    plan,
    planName: plan ? planByCode(plan).name : user?.role === "COMPANY" ? "Company Starter (free)" : "Free",
    unlimitedApplications: plan === "TRAINER_PRO",
    unlimitedRequirements: plan === "COMPANY_GROWTH" || plan === "PARTNER",
    messageAnyTrainer: plan === "COMPANY_GROWTH" || plan === "PARTNER",
    featured: plan === "TRAINER_PRO",
    memberLimit: plan === "PARTNER" ? Infinity : plan === "COMPANY_GROWTH" ? 10 : 2,
  };
}

/** Trainer ids with an active Pro subscription, for featured placement in search. */
export async function proTrainerUserIds() {
  const subs = await db.subscription.findMany({ where: { plan: "TRAINER_PRO", status: { in: ACTIVE_STATUSES }, userId: { not: null } }, select: { userId: true } });
  return new Set(subs.map((s) => s.userId!));
}
