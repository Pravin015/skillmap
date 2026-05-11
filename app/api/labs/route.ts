import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list lab templates
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (domain) where.domain = domain;
  // HR/Student only see published labs
  if (userRole !== "ADMIN") where.status = "PUBLISHED";
  if (status) where.status = status;

  const labs = await prisma.labTemplate.findMany({
    where,
    include: { _count: { select: { problems: true, attempts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ labs });
}

// POST — admin creates lab template
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (userRole !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { title, domain, description, difficulty, timeLimit, passingScore } = await req.json();
  if (!title || !domain) return NextResponse.json({ error: "Title and domain required" }, { status: 400 });

  const lab = await prisma.labTemplate.create({
    data: {
      title, domain, description: description || null,
      difficulty: difficulty || "MEDIUM",
      timeLimit: timeLimit ? parseInt(timeLimit) : 30,
      passingScore: passingScore ? parseInt(passingScore) : 60,
      createdById: userId!,
    },
  });

  return NextResponse.json({ lab }, { status: 201 });
}
