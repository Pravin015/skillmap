import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  const pricing = searchParams.get("pricing");
  const mine = searchParams.get("mine");

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;

  const where: Record<string, unknown> = {};

  if (mine === "true" && userId) {
    where.createdById = userId;
  } else if (userRole === "ADMIN" && status) {
    where.status = status;
  } else {
    where.status = "PUBLISHED";
  }

  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;
  if (pricing) where.pricing = pricing;

  const courses = await prisma.course.findMany({
    where,
    include: {
      createdBy: { select: { name: true, organisation: true } },
      _count: { select: { modules: true, enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userRole !== "ADMIN" && userRole !== "INSTITUTION") {
    return NextResponse.json({ error: "Only Admin and Institutions can create courses" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, coverImageUrl, duration, difficulty, skills, category, tags, pricing, price, videoUrl, modules, sequentialUnlock } = body;

  if (!title || !description) return NextResponse.json({ error: "Title and description required" }, { status: 400 });

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + Date.now().toString(36);

  const course = await prisma.course.create({
    data: {
      slug,
      title,
      description,
      coverImageUrl,
      duration,
      difficulty: difficulty || "Beginner",
      skills: skills || [],
      category,
      tags: tags || [],
      pricing: pricing || "FREE",
      price: price ? parseInt(price) : null,
      videoUrl,
      createdById: userId,
      creatorRole: userRole,
      sequentialUnlock: sequentialUnlock || false,
      status: userRole === "ADMIN" ? "PUBLISHED" : "PENDING_REVIEW",
      publishedAt: userRole === "ADMIN" ? new Date() : null,
    },
  });

  // Create modules if provided
  if (modules && Array.isArray(modules) && modules.length > 0) {
    await prisma.courseModule.createMany({
      data: modules.map((m: { title: string; content: string; videoUrl?: string; duration?: string; hasQuiz?: boolean; quizQuestions?: string }, i: number) => ({
        courseId: course.id,
        title: m.title,
        content: m.content || "",
        videoUrl: m.videoUrl || null,
        duration: m.duration || null,
        order: i + 1,
        hasQuiz: m.hasQuiz || false,
        quizQuestions: m.hasQuiz && m.quizQuestions ? m.quizQuestions : null,
      })),
    });
  }

  return NextResponse.json({ course }, { status: 201 });
}
