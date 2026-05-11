import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // AI, SELF, MENTOR, or null for all

  const where: Record<string, unknown> = { userId };
  if (type) where.type = type;

  const interviews = await prisma.mockInterview.findMany({
    where,
    include: {
      company: true,
      responses: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Stats
  const stats = {
    total: interviews.length,
    completed: interviews.filter((i) => i.status === "COMPLETED").length,
    avgScore: 0,
    bestScore: 0,
  };
  const completed = interviews.filter((i) => i.status === "COMPLETED" && i.score != null);
  if (completed.length > 0) {
    stats.avgScore = Math.round(completed.reduce((s, i) => s + (i.score || 0), 0) / completed.length);
    stats.bestScore = Math.max(...completed.map((i) => i.score || 0));
  }

  return NextResponse.json({ interviews, stats });
}
