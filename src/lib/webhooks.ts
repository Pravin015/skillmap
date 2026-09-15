import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";

/** Events a training partner can subscribe to. */
export const WEBHOOK_EVENTS = [
  "application.created",
  "application.status_changed",
  "requirement.status_changed",
  "work_order.sent",
  "work_order.accepted",
  "purchase_order.issued",
  "purchase_order.accepted",
  "invoice.created",
  "invoice.paid",
  "test",
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function signPayload(secret: string, timestamp: number, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/**
 * Deliver an event to every active endpoint of the company that subscribed to it (or to "*").
 * Never throws: failures are recorded on WebhookDelivery so the calling action is unaffected.
 */
export async function dispatchWebhook(companyId: string, event: WebhookEvent, data: Record<string, unknown>) {
  try {
    const endpoints = await db.webhookEndpoint.findMany({ where: { companyId, active: true } });
    const targets = endpoints.filter((e) => e.events.includes("*") || e.events.includes(event));
    if (!targets.length) return;
    const timestamp = Date.now();
    const id = `evt_${timestamp.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const body = JSON.stringify({ id, event, createdAt: new Date(timestamp).toISOString(), data });
    await Promise.all(targets.map((ep) => deliver(ep.id, ep.url, ep.secret, event, body, timestamp)));
  } catch (e) {
    console.error("[webhook]", (e as Error).message);
  }
}

async function deliver(endpointId: string, url: string, secret: string, event: string, body: string, timestamp: number) {
  const signature = signPayload(secret, timestamp, body);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let status = "failed", responseCode: number | null = null, error: string | null = null;
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "CorpGurus-Webhooks/1.0", "X-CorpGurus-Event": event, "X-CorpGurus-Timestamp": String(timestamp), "X-CorpGurus-Signature": `sha256=${signature}` }, body, signal: controller.signal });
    responseCode = res.status;
    status = res.ok ? "delivered" : "failed";
    if (!res.ok) error = `HTTP ${res.status}`;
  } catch (e) {
    error = (e as Error).name === "AbortError" ? "Timed out after 8s" : (e as Error).message;
  } finally {
    clearTimeout(timer);
  }
  await db.webhookDelivery.create({ data: { endpointId, event, payload: JSON.parse(body), status, responseCode, error } });
  // Keep the last 200 deliveries per endpoint.
  const old = await db.webhookDelivery.findMany({ where: { endpointId }, orderBy: { createdAt: "desc" }, skip: 200, select: { id: true } });
  if (old.length) await db.webhookDelivery.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
}

/** Verify a signature the way a partner should (documented on /settings/developers). Tolerates 5 minutes of clock drift. */
export function verifySignature(secret: string, timestamp: string | number, body: string, header: string) {
  const ts = Number(timestamp);
  if (!ts || Math.abs(Date.now() - ts) > 5 * 60 * 1000) return false;
  return header === `sha256=${signPayload(secret, ts, body)}`;
}
