import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { BillingInterval, PlanCode } from "@prisma/client";
import { db } from "./db";
import { planByCode } from "./billing";

/* USD prices in cents. Yearly = 10× monthly. */
export const USD_PRICES: Record<PlanCode, { monthly: number; yearly: number }> = {
  TRAINER_PRO: { monthly: 1500, yearly: 15000 },
  COMPANY_GROWTH: { monthly: 6900, yearly: 69000 },
  PARTNER: { monthly: 19900, yearly: 199000 },
};
export const usd = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
export const usdPrice = (code: PlanCode, interval: BillingInterval) => (interval === "YEARLY" ? USD_PRICES[code].yearly : USD_PRICES[code].monthly);

const key = () => process.env.STRIPE_SECRET_KEY ?? "";
export const stripeConfigured = () => !!key();

/** Stripe's API is form-encoded; nested objects use bracket notation. */
function encode(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const name = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) return [];
    if (Array.isArray(v)) return v.flatMap((x, i) => (typeof x === "object" ? encode(x as Record<string, unknown>, `${name}[${i}]`) : [`${encodeURIComponent(`${name}[${i}]`)}=${encodeURIComponent(String(x))}`]));
    if (typeof v === "object") return encode(v as Record<string, unknown>, name);
    return [`${encodeURIComponent(name)}=${encodeURIComponent(String(v))}`];
  });
}

async function stripe<T>(path: string, body?: Record<string, unknown>, method = body ? "POST" : "GET"): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method, headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: body ? encode(body).join("&") : undefined, cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message || `Stripe ${path} failed (${res.status})`);
  return json;
}

/** Products and prices are created once and cached in Setting, like the Razorpay plans. */
export async function ensureStripePrice(code: PlanCode, interval: BillingInterval) {
  const k = `stripe_price_${code}_${interval}`;
  const cached = await db.setting.findUnique({ where: { key: k } });
  if (cached) return cached.value;
  const def = planByCode(code);
  const productKey = `stripe_product_${code}`;
  let productId = (await db.setting.findUnique({ where: { key: productKey } }))?.value;
  if (!productId) {
    const p = await stripe<{ id: string }>("/products", { name: `CorpGurus ${def.name}`, description: def.tagline });
    productId = p.id;
    await db.setting.upsert({ where: { key: productKey }, create: { key: productKey, value: productId }, update: { value: productId } });
  }
  const price = await stripe<{ id: string }>("/prices", { product: productId, currency: "usd", unit_amount: usdPrice(code, interval), recurring: { interval: interval === "YEARLY" ? "year" : "month" } });
  await db.setting.upsert({ where: { key: k }, create: { key: k, value: price.id }, update: { value: price.id } });
  return price.id;
}

export async function createCheckoutSession(opts: { priceId: string; email: string; successUrl: string; cancelUrl: string; metadata: Record<string, string> }) {
  return stripe<{ id: string; url: string }>("/checkout/sessions", {
    mode: "subscription", customer_email: opts.email, success_url: opts.successUrl, cancel_url: opts.cancelUrl,
    line_items: [{ price: opts.priceId, quantity: 1 }], metadata: opts.metadata, subscription_data: { metadata: opts.metadata }, allow_promotion_codes: true,
  });
}

export async function retrieveCheckoutSession(id: string) {
  return stripe<{ id: string; subscription: string | null; customer: string | null; payment_status: string; status: string }>(`/checkout/sessions/${id}`);
}

export async function cancelStripeSubscription(id: string) {
  return stripe<{ id: string; cancel_at_period_end: boolean; current_period_end: number }>(`/subscriptions/${id}`, { cancel_at_period_end: true });
}

export async function retrieveStripeSubscription(id: string) {
  return stripe<{ id: string; status: string; current_period_end: number; customer: string; cancel_at_period_end: boolean }>(`/subscriptions/${id}`);
}

/** Stripe-Signature: t=<ts>,v1=<hmac>. HMAC_SHA256(`${t}.${rawBody}`, webhook secret). */
export function verifyStripeSignature(rawBody: string, header: string | null, toleranceSec = 300) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t, v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const mapStripeStatus = (s: string) =>
  (({ trialing: "ACTIVE", active: "ACTIVE", incomplete: "CREATED", incomplete_expired: "EXPIRED", past_due: "PENDING", unpaid: "HALTED", canceled: "CANCELLED", paused: "HALTED" } as const)[s] ?? "CREATED");
