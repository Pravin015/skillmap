import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpay, PLANS } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please login first" }, { status: 401 });
  }

  const userId = (session.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 400 });

  const { plan } = await req.json();

  if (plan !== "CAREER_READY") {
    return NextResponse.json({ error: "Invalid plan. Contact us for Institution pricing." }, { status: 400 });
  }

  const planDetails = PLANS.CAREER_READY;

  try {
    const order = await getRazorpay().orders.create({
      amount: planDetails.amount,
      currency: planDetails.currency,
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan,
        email: session.user.email || "",
      },
    });

    // Save order in DB
    await prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: order.id,
        amount: planDetails.amount,
        currency: planDetails.currency,
        status: "CREATED",
        plan: "CAREER_READY",
        description: planDetails.description,
        receipt: order.receipt as string || null,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      name: session.user.name,
      email: session.user.email,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json({ error: "Failed to create payment order. Please check Razorpay configuration." }, { status: 500 });
  }
}
