import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { companyId, interviewType, difficulty, totalQuestions, type } = await req.json();

  if (!companyId || !interviewType || !difficulty) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Abandon any existing in-progress interview
  await prisma.mockInterview.updateMany({
    where: { userId, status: "IN_PROGRESS" },
    data: { status: "ABANDONED" },
  });

  const interview = await prisma.mockInterview.create({
    data: {
      userId,
      companyId,
      type: type || "AI",
      interviewType,
      difficulty,
      totalQuestions: totalQuestions || 5,
      status: "IN_PROGRESS",
    },
    include: { company: true },
  });

  return NextResponse.json({ interview }, { status: 201 });
}
