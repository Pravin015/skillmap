// POST /api/cron/retry-webhooks
// Header: x-cron-secret: <CRON_SECRET>
//
// Picks up B2BWebhookDelivery rows with status=PENDING and
// nextAttemptAt <= now() and retries them with HMAC-signed POST.
// Designed for a 1-minute Railway cron schedule, but works at any cadence
// (the backoff schedule is enforced by nextAttemptAt, not by the cron).
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { retryDueDeliveries } from "@/lib/b2b-webhooks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const headerVal =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const a = Buffer.from(headerVal);
  const b = Buffer.from(secret);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await retryDueDeliveries(100);
  return NextResponse.json({ ok: true, ...stats });
}
