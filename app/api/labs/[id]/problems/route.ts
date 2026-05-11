import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — add/replace all problems for a lab
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { problems } = await req.json();
  if (!problems || !Array.isArray(problems)) return NextResponse.json({ error: "Problems array required" }, { status: 400 });

  // Delete existing and recreate
  await prisma.labProblem.deleteMany({ where: { labTemplateId: id } });

  const created = await Promise.all(
    problems.map((p: { question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; explanation?: string }, i: number) =>
      prisma.labProblem.create({
        data: {
          labTemplateId: id, question: p.question,
          optionA: p.optionA, optionB: p.optionB, optionC: p.optionC, optionD: p.optionD,
          correctAnswer: p.correctAnswer, explanation: p.explanation || null, order: i + 1,
        },
      })
    )
  );

  return NextResponse.json({ problems: created });
}
