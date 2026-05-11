// B2B webhook dispatcher.
//
// Fires lifecycle events to every B2BPartner with a webhookUrl + the event
// in their webhookEvents. Each event:
//   1. Creates a B2BWebhookDelivery row (per-partner, per-event).
//   2. Tries to deliver immediately.
//   3. On non-2xx (or network error), schedules a retry via nextAttemptAt.
//      The /api/cron/retry-webhooks endpoint picks up due rows and retries.
//
// Retry schedule (in minutes after the previous attempt):
//   attempt 1 → immediate
//   attempt 2 → +1m
//   attempt 3 → +5m
//   attempt 4 → +30m
//   attempt 5 → +2h
//   attempt 6 → +12h
//   then mark FAILED and stop.
//
// Signature format (Stripe-style):
//   X-AstraaHire-Signature: t=<unix-seconds>,v1=<hex hmac-sha256>
//   where the signed payload is `${t}.${rawBody}`.
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export type WebhookEvent =
  | "job.expired"
  | "job.closed"
  | "job.updated"
  | "job.deleted";

interface FireOptions {
  event: WebhookEvent;
  data: Record<string, unknown>; // event-specific payload
}

const BACKOFF_MIN = [0, 1, 5, 30, 120, 720]; // index = attemptCount (0..5)
const MAX_ATTEMPTS = BACKOFF_MIN.length;
const DELIVERY_TIMEOUT_MS = 10_000;

/**
 * Enqueue + deliver a lifecycle event to all subscribed partners.
 * Returns the number of partners the event was queued for.
 */
export async function fireJobEvent(opts: FireOptions): Promise<number> {
  const { event, data } = opts;

  const partners = await prisma.b2BPartner.findMany({
    where: {
      isActive: true,
      webhookUrl: { not: null },
      webhookSecret: { not: null },
    },
  });

  const subscribed = partners.filter((p) => p.webhookEvents.includes(event));
  if (subscribed.length === 0) return 0;

  const occurredAt = new Date().toISOString();
  const body = JSON.stringify({ event, occurredAt, data });

  for (const p of subscribed) {
    if (!p.webhookUrl || !p.webhookSecret) continue;
    const deliveryId = crypto.randomUUID();
    let delivery;
    try {
      delivery = await prisma.b2BWebhookDelivery.create({
        data: {
          partnerId: p.id,
          event,
          deliveryId,
          payload: body,
          url: p.webhookUrl,
          status: "PENDING",
        },
      });
    } catch (e) {
      console.error("[b2b-webhook] failed to create delivery row:", e);
      continue;
    }

    // First attempt synchronous — don't await across partners though, run
    // them in parallel (sometimes one is slow / down).
    attemptDelivery(delivery.id, body, deliveryId, event, p.webhookUrl, p.webhookSecret).catch((e) => {
      console.error("[b2b-webhook] dispatch error:", e);
    });
  }

  return subscribed.length;
}

/**
 * Run one delivery attempt for a B2BWebhookDelivery row. Updates the
 * row with status/attemptCount/lastError. Called by both fireJobEvent
 * (immediately on event) and the cron retry endpoint.
 */
export async function attemptDelivery(
  deliveryRowId: string,
  body: string,
  deliveryId: string,
  event: string,
  url: string,
  secret: string
): Promise<void> {
  const t = Math.floor(Date.now() / 1000);
  const signed = `${t}.${body}`;
  const sig = crypto.createHmac("sha256", secret).update(signed).digest("hex");

  let httpStatus: number | null = null;
  let errorMsg: string | null = null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AstraaHire-Signature": `t=${t},v1=${sig}`,
        "X-AstraaHire-Event": event,
        "X-AstraaHire-Delivery": deliveryId,
        "User-Agent": "AstraaHire-Webhook/v1",
      },
      body,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    httpStatus = res.status;
    if (!res.ok) {
      errorMsg = `HTTP ${res.status}`;
      try {
        const txt = await res.text();
        if (txt) errorMsg += ` — ${txt.slice(0, 200)}`;
      } catch { /* ignore */ }
    }
  } catch (e) {
    errorMsg = `Network: ${(e as Error).message}`;
  }

  // Re-read the row to get current attemptCount (might've been incremented
  // by a parallel retry).
  const current = await prisma.b2BWebhookDelivery.findUnique({ where: { id: deliveryRowId } });
  if (!current) return;

  const attemptCount = current.attemptCount + 1;
  const delivered = httpStatus !== null && httpStatus >= 200 && httpStatus < 300;

  if (delivered) {
    await prisma.b2BWebhookDelivery.update({
      where: { id: deliveryRowId },
      data: {
        attemptCount,
        status: "DELIVERED",
        lastStatus: httpStatus,
        lastError: null,
        nextAttemptAt: null,
        deliveredAt: new Date(),
      },
    });
    return;
  }

  // Failed. Decide whether to retry.
  if (attemptCount >= MAX_ATTEMPTS) {
    await prisma.b2BWebhookDelivery.update({
      where: { id: deliveryRowId },
      data: {
        attemptCount,
        status: "FAILED",
        lastStatus: httpStatus,
        lastError: errorMsg?.slice(0, 500) || null,
        nextAttemptAt: null,
      },
    });
    return;
  }

  const minutesUntilNext = BACKOFF_MIN[attemptCount]; // index = nextAttempt
  const nextAttemptAt = new Date(Date.now() + minutesUntilNext * 60_000);
  await prisma.b2BWebhookDelivery.update({
    where: { id: deliveryRowId },
    data: {
      attemptCount,
      status: "PENDING",
      lastStatus: httpStatus,
      lastError: errorMsg?.slice(0, 500) || null,
      nextAttemptAt,
    },
  });
}

/**
 * Worker entrypoint — picks up to N due deliveries and retries them.
 * Designed to be invoked by /api/cron/retry-webhooks at a regular cadence.
 */
export async function retryDueDeliveries(batchSize = 50): Promise<{ attempted: number; delivered: number; stillPending: number; failed: number }> {
  const due = await prisma.b2BWebhookDelivery.findMany({
    where: {
      status: "PENDING",
      nextAttemptAt: { lte: new Date() },
    },
    orderBy: { nextAttemptAt: "asc" },
    take: batchSize,
    include: { partner: true },
  });

  let delivered = 0, stillPending = 0, failed = 0;
  await Promise.all(due.map(async (d) => {
    if (!d.partner.isActive || !d.partner.webhookUrl || !d.partner.webhookSecret) return;
    await attemptDelivery(d.id, d.payload, d.deliveryId, d.event, d.partner.webhookUrl, d.partner.webhookSecret);
    const after = await prisma.b2BWebhookDelivery.findUnique({ where: { id: d.id }, select: { status: true } });
    if (after?.status === "DELIVERED") delivered++;
    else if (after?.status === "FAILED") failed++;
    else stillPending++;
  }));

  return { attempted: due.length, delivered, stillPending, failed };
}
