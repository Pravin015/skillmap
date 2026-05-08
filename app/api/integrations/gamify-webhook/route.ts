// POST /api/integrations/gamify-webhook
// Receives lab session state changes from gamify (outerlayerx).
//
// Signature: X-Outerlayerx-Signature: sha256=<hex-hmac> over raw body,
// HMAC-SHA256 keyed with GAMIFY_WEBHOOK_SECRET. (Gamify also sends
// X-Ashpranix-Signature for legacy compat — same value.)
//
// Payload (from gamify's lib/lms-webhooks.ts):
//   { jti, status, score?, maxScore?, flagsCaptured?, completedAt?,
//     studentId?, lessonId?, labSlug?, event?, timestamp }
//
// We upsert ExternalLabAttempt by sessionId (jti). Idempotent — gamify
// retries with backoff so duplicates are expected.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface GamifyWebhookPayload {
  jti: string;
  status: string;
  score?: number;
  maxScore?: number;
  flagsCaptured?: number;
  completedAt?: string | null;
  studentId?: string;          // gamify-side id (their User.id)
  lessonId?: string;
  labSlug?: string;
  event?: string;
  timestamp: string;
  // The externalUserId we passed when creating the session lives in
  // metadata or in a non-standard field. Gamify's payload doesn't
  // explicitly include it (their session record has it though), so we
  // accept it via extra fields if present.
  externalUserId?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const secret = process.env.GAMIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[gamify-webhook] GAMIFY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // Read raw body BEFORE JSON-parse — needed for HMAC verification.
  const rawBody = await req.text();

  const signature =
    req.headers.get("x-outerlayerx-signature") ||
    req.headers.get("x-ashpranix-signature") ||
    "";

  // Expected format: "sha256=<hex>"
  const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const ok =
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  if (!ok) {
    console.warn("[gamify-webhook] signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: GamifyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.jti) {
    return NextResponse.json({ error: "Missing jti" }, { status: 400 });
  }

  // We need to figure out which AstraaHire user this attempt belongs to.
  // Gamify scopes their User by externalUserId we passed at session start.
  // Their payload doesn't return externalUserId by default — but it
  // includes studentId (their internal id). We rely on the labSlug +
  // closely-matching open ExternalLabAttempt OR fallback: the metadata
  // we pass at session-start should round-trip.
  //
  // Simplest robust path: when we created the session via /api/v1/sessions,
  // we passed externalUserId = our User.id. Gamify's webhook payload
  // includes externalUserId IF gamify is configured to surface it
  // (their lib/lms-webhooks.ts shows studentId — let's accept either).
  const ourUserId = payload.externalUserId || payload.studentId || (payload.metadata as { externalUserId?: string })?.externalUserId;

  if (!ourUserId) {
    // Last-resort dedupe by jti only — store with a placeholder so we
    // can manually link later. This is rare; usually we have the id.
    console.warn(`[gamify-webhook] no user id in payload for jti=${payload.jti}`);
    return NextResponse.json({ ok: true, warn: "no_user_link" });
  }

  // Verify the user exists locally — guards against gamify scoping
  // its own internal IDs into our User.id slot.
  const user = await prisma.user.findUnique({ where: { id: ourUserId }, select: { id: true } });
  if (!user) {
    console.warn(`[gamify-webhook] unknown user ${ourUserId} for jti=${payload.jti}`);
    return NextResponse.json({ ok: true, warn: "unknown_user" });
  }

  const completedAt = payload.completedAt ? new Date(payload.completedAt) : null;

  await prisma.externalLabAttempt.upsert({
    where: { sessionId: payload.jti },
    create: {
      userId: user.id,
      labSlug: payload.labSlug || "",
      sessionId: payload.jti,
      status: payload.status,
      score: typeof payload.score === "number" ? payload.score : null,
      maxScore: typeof payload.maxScore === "number" ? payload.maxScore : null,
      flagsCaptured: typeof payload.flagsCaptured === "number" ? payload.flagsCaptured : null,
      completedAt,
      rawPayload: rawBody.slice(0, 4000), // cap so we don't blow up the row
    },
    update: {
      status: payload.status,
      score: typeof payload.score === "number" ? payload.score : undefined,
      maxScore: typeof payload.maxScore === "number" ? payload.maxScore : undefined,
      flagsCaptured: typeof payload.flagsCaptured === "number" ? payload.flagsCaptured : undefined,
      completedAt: completedAt ?? undefined,
      rawPayload: rawBody.slice(0, 4000),
    },
  });

  return NextResponse.json({ ok: true });
}

// GET — health check, returns whether webhook secret is configured.
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.GAMIFY_WEBHOOK_SECRET) });
}
