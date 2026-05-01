import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 400 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    // Update payment as failed
    await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // Payment verified — update payment record
  const payment = await prisma.payment.update({
    where: { razorpayOrderId: razorpay_order_id },
    data: {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "CAPTURED",
    },
  });

  // Activate subscription
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30-day subscription

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan: payment.plan,
      active: true,
      expiresAt,
    },
    create: {
      userId,
      plan: payment.plan,
      active: true,
      expiresAt,
    },
  });

  return NextResponse.json({ success: true, plan: payment.plan });
}
