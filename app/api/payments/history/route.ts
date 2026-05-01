import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 400 });

  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      razorpayPaymentId: true,
      amount: true,
      currency: true,
      status: true,
      plan: true,
      description: true,
      createdAt: true,
    },
  });

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  return NextResponse.json({ payments, subscription });
}
