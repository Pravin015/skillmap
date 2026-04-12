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

  const { plan, customAmount, customDesc } = await req.json();

  let amount: number;
  let currency = "INR";
  let description: string;

  if (customAmount && customAmount > 0) {
    // Custom amount for events, sessions, etc.
    amount = customAmount;
    description = customDesc || "SkillMap Payment";
  } else if (plan === "CAREER_READY") {
    const planDetails = PLANS.CAREER_READY;
    amount = planDetails.amount;
    currency = planDetails.currency;
    description = planDetails.description;
  } else {
    return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
  }

  try {
    const order = await getRazorpay().orders.create({
      amount,
      currency,
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan: plan || "CUSTOM",
        email: session.user.email || "",
      },
    });

    // Save order in DB
    await prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: order.id,
        amount,
        currency,
        status: "CREATED",
        plan: plan === "CAREER_READY" ? "CAREER_READY" : "FREE",
        description,
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
