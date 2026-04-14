import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  if (userRole !== "ADMIN") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const interviews = await prisma.mockInterview.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true } },
      company: { select: { name: true } },
    },
  });

  return NextResponse.json({
    interviews: interviews.map((i) => ({
      id: i.id, userId: i.userId, userName: i.user.name,
      companyName: i.company.name, interviewType: i.interviewType,
      difficulty: i.difficulty, status: i.status, score: i.score,
      totalQuestions: i.totalQuestions, createdAt: i.createdAt,
    })),
  });
}
