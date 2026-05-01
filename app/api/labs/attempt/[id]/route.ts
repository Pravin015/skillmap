import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — attempt results
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = await prisma.labAttempt.findUnique({
    where: { id },
    include: { answers: { include: { problem: true } }, labTemplate: true },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  return NextResponse.json({ attempt });
}

// POST — submit answers
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const attempt = await prisma.labAttempt.findUnique({ where: { id }, include: { labTemplate: true } });
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  if (attempt.completedAt) return NextResponse.json({ error: "Already submitted" }, { status: 400 });

  // Check if time expired
  const elapsed = (Date.now() - new Date(attempt.startedAt).getTime()) / 60000;
  const timeExpired = elapsed > attempt.labTemplate.timeLimit + 1; // 1 min grace

  const { answers } = await req.json(); // [{ problemId, selectedAnswer }]
  if (!answers || !Array.isArray(answers)) return NextResponse.json({ error: "Answers required" }, { status: 400 });

  // Get correct answers
  const problems = await prisma.labProblem.findMany({ where: { labTemplateId: attempt.labTemplateId } });
  const correctMap = new Map(problems.map((p) => [p.id, p.correctAnswer]));

  // Save answers and calculate score
  let correct = 0;
  for (const ans of answers) {
    const isCorrect = correctMap.get(ans.problemId) === ans.selectedAnswer;
    if (isCorrect) correct++;
    await prisma.labAnswer.create({
      data: { attemptId: id, problemId: ans.problemId, selectedAnswer: ans.selectedAnswer, isCorrect },
    });
  }

  const total = problems.length;
  const percentage = Math.round((correct / total) * 100);
  const passed = percentage >= attempt.labTemplate.passingScore;

  const updated = await prisma.labAttempt.update({
    where: { id },
    data: { completedAt: new Date(), timeExpired, score: correct, percentage, passed },
  });

  return NextResponse.json({ attempt: updated, score: correct, total, percentage, passed });
}
