import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

  const [sources, runs, jobStats] = await Promise.all([
    prisma.jobSource.findMany({ orderBy: { slug: "asc" } }),
    prisma.scrapeRun.findMany({
      include: { source: { select: { slug: true, displayName: true } } },
      orderBy: { startedAt: "desc" },
      take: limit,
    }),
    prisma.externalJob.groupBy({
      by: ["sourceId", "vertical"],
      _count: { _all: true },
      where: { isActive: true },
    }),
  ]);

  return NextResponse.json({ sources, runs, jobStats });
}
