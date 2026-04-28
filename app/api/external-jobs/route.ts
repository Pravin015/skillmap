import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

// Public endpoint — no auth needed. Listing-only (users are redirected to source portal to apply).
// Also consumed by the Ashpranix internship portal via ?vertical=INTERNSHIP.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vertical = searchParams.get("vertical"); // "INTERNSHIP" | "FULLTIME"
  const q = searchParams.get("q")?.trim();
  const location = searchParams.get("location")?.trim();
  const workMode = searchParams.get("workMode");
  const domain = searchParams.get("domain");
  const source = searchParams.get("source");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Prisma.ExternalJobWhereInput = { isActive: true };
  if (vertical === "INTERNSHIP" || vertical === "FULLTIME") where.vertical = vertical;
  if (workMode) where.workMode = workMode;
  if (domain) where.domain = domain;
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (source) where.source = { slug: source };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { skills: { has: q } },
    ];
  }

  const [jobs, total] = await Promise.all([
    prisma.externalJob.findMany({
      where,
      include: { source: { select: { slug: true, displayName: true } } },
      orderBy: [{ postedAt: "desc" }, { firstSeenAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.externalJob.count({ where }),
  ]);

  return NextResponse.json({ jobs, total, limit, offset });
}
