import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  if (userRole !== "ADMIN") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const checks = await prisma.offerVerification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, companyName: true, trustScore: true, verdict: true,
      riskLevel: true, redFlags: true, createdAt: true, userId: true,
    },
  });

  return NextResponse.json({ checks });
}
