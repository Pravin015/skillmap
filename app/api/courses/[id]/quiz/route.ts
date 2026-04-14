import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — submit quiz answers for a module
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;
  const { moduleId, answers } = await req.json();
  // answers: number[] — index of selected option per question

  if (!moduleId || !answers || !Array.isArray(answers)) {
    return NextResponse.json({ error: "moduleId and answers required" }, { status: 400 });
  }

  // Check enrollment
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 400 });

  // Get module with quiz
  const mod = await prisma.courseModule.findUnique({ where: { id: moduleId } });
  if (!mod || !mod.hasQuiz || !mod.quizQuestions) {
    return NextResponse.json({ error: "This module has no quiz" }, { status: 400 });
  }

  // Parse questions and grade
  let questions: { question: string; options: string[]; correctAnswer: number }[];
  try {
    questions = JSON.parse(mod.quizQuestions);
  } catch {
    return NextResponse.json({ error: "Invalid quiz data" }, { status: 500 });
  }

  let correct = 0;
  const results = questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctAnswer;
    if (isCorrect) correct++;
    return { question: q.question, selected: answers[i], correct: q.correctAnswer, isCorrect };
  });

  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  const passed = score >= mod.quizPassScore;

  // If passed, mark module as complete
  if (passed) {
    const completedModules = [...enrollment.completedModules];
    if (!completedModules.includes(moduleId)) {
      completedModules.push(moduleId);
    }
    const totalModules = await prisma.courseModule.count({ where: { courseId } });
    const progress = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0;

    await prisma.courseEnrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { completedModules, progress: Math.min(100, progress), lastAccessedAt: new Date() },
    });
  }

  return NextResponse.json({ score, passed, correct, total: questions.length, passScore: mod.quizPassScore, results });
}
