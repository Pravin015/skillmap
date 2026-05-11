import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  if (userRole !== "ADMIN") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    payments: payments.map((p) => ({
      id: p.id, userName: p.user.name, userEmail: p.user.email,
      amount: p.amount, currency: p.currency, status: p.status,
      plan: p.plan, description: p.description,
      razorpayPaymentId: p.razorpayPaymentId, createdAt: p.createdAt,
    })),
  });
}
