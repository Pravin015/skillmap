import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const company = await prisma.mockCompany.findUnique({
    where: { slug },
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { interviews: true } },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Group questions by category
  const questionsByCategory: Record<string, typeof company.questions> = {};
  for (const q of company.questions) {
    if (!questionsByCategory[q.category]) questionsByCategory[q.category] = [];
    questionsByCategory[q.category].push(q);
  }

  return NextResponse.json({ company, questionsByCategory });
}
