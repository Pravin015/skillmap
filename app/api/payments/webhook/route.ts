import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Razorpay webhook — handles payment.captured, payment.failed events
// This is called by Razorpay servers, NOT by the browser
// Configure webhook URL in Razorpay Dashboard → Settings → Webhooks
// URL: https://yourdomain.com/api/payments/webhook
// Events: payment.captured, payment.failed
// Secret: set RAZORPAY_WEBHOOK_SECRET in .env

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload?.payment?.entity;

    if (!payload) {
      return NextResponse.json({ error: "No payment entity in payload" }, { status: 400 });
    }

    const orderId = payload.order_id;
    const paymentId = payload.id;
    const status = payload.status; // captured, failed, refunded

    if (!orderId) {
      return NextResponse.json({ error: "No order_id in payment" }, { status: 400 });
    }

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (!payment) {
      // Payment not in our DB — might be from a different source
      return NextResponse.json({ status: "ignored", reason: "Order not found in DB" });
    }

    if (eventType === "payment.captured") {
      // Payment successful — update record
      await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: {
          razorpayPaymentId: paymentId,
          status: "CAPTURED",
        },
      });

      // Activate subscription if it's a plan payment
      if (payment.plan === "CAREER_READY") {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await prisma.subscription.upsert({
          where: { userId: payment.userId },
          update: { plan: "CAREER_READY", active: true, expiresAt },
          create: { userId: payment.userId, plan: "CAREER_READY", active: true, expiresAt },
        });
      }

      return NextResponse.json({ status: "ok", event: "payment.captured" });
    }

    if (eventType === "payment.failed") {
      await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ status: "ok", event: "payment.failed" });
    }

    // Handle refund
    if (eventType === "refund.created" || eventType === "payment.refunded") {
      await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: { status: "REFUNDED" },
      });

      // Deactivate subscription if refunded
      if (payment.plan === "CAREER_READY") {
        await prisma.subscription.update({
          where: { userId: payment.userId },
          data: { active: false },
        }).catch(() => {});
      }

      return NextResponse.json({ status: "ok", event: eventType });
    }

    return NextResponse.json({ status: "ignored", event: eventType });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
