// POST /api/payments/verify
// Called by the Razorpay frontend SDK after the user completes checkout.
// Confirms the signature, marks Payment captured, activates Subscription.
//
// Original implementation had four issues:
//   1. RACE: prisma.payment.update on a missing order threw — leaked
//      whether the order existed.
//   2. NO OWNERSHIP CHECK: logged-in attacker could submit someone else's
//      orderId+valid signature and activate the subscription on their own
//      account, redirecting the paid plan from the legitimate buyer.
//   3. NOT IDEMPOTENT: a duplicate verify call would re-extend the
//      subscription period (free 30 days every time the SDK retried).
//   4. HARDCODED 30-DAY: any plan with a different period (annual etc.)
//      would still get 30 days.
//
// All four resolved below.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import crypto from "crypto";

const PLAN_PERIOD_DAYS: Record<string, number> = {
  CAREER_READY: 30,        // Monthly
  CAREER_READY_ANNUAL: 365, // Annual (when we add it)
  PRO: 30,
  PRO_ANNUAL: 365,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json().catch(() => ({}));

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  // ─── 1. Lookup payment FIRST ──────────────────────────────────────
  // If we can't find it, we return a generic 400 (not 404) so an attacker
  // can't probe valid order IDs.
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: razorpay_order_id },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 400 });
  }

  // ─── 2. Ownership check ───────────────────────────────────────────
  // Caller must own this payment. Defeats the cross-user activation attack.
  if (payment.userId !== userId) {
    // Log but don't reveal — same generic error as missing record.
    console.warn(`[payments/verify] User ${userId} tried to verify payment ${payment.id} owned by ${payment.userId}`);
    return NextResponse.json({ error: "Payment not found" }, { status: 400 });
  }

  // ─── 3. Idempotency check ─────────────────────────────────────────
  // If already captured, return success without re-doing anything.
  // This handles double-submits from flaky network or SDK retries.
  if (payment.status === "CAPTURED") {
    return NextResponse.json({ success: true, plan: payment.plan, idempotent: true });
  }

  // ─── 4. Verify signature ──────────────────────────────────────────
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // Constant-time comparison defeats timing-based brute-forcing of the
  // signature. randomBytes is overkill but standard for HMAC checks.
  const sigOk =
    expectedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

  if (!sigOk) {
    // Mark as FAILED — safe now because the lookup above proved the
    // record exists and belongs to this user.
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // ─── 5. Mark captured + activate subscription ────────────────────
  // Use a transaction so we don't end up with payment captured but
  // subscription not activated (or vice versa).
  const periodDays = PLAN_PERIOD_DAYS[payment.plan] ?? 30;
  const expiresAt = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "CAPTURED",
      },
    }),
    prisma.subscription.upsert({
      where: { userId },
      update: { plan: payment.plan, active: true, expiresAt },
      create: { userId, plan: payment.plan, active: true, expiresAt },
    }),
  ]);

  // Email + in-app receipt for the user. Best-effort — don't fail the
  // request if Resend has an outage.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  createNotification({
    userId,
    type: "PAYMENT_SUCCESS",
    title: `Payment received — ${payment.plan} active`,
    message: `Your payment of ₹${(payment.amount / 100).toFixed(0)} was successful. Premium features are unlocked until ${expiresAt.toLocaleDateString()}.`,
    data: {
      name: user?.name || "there",
      amount: (payment.amount / 100).toFixed(0),
      plan: payment.plan,
      expiresAt: expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, plan: payment.plan });
}
