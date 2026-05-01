import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (domain && domain !== "ALL") where.domain = domain;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const companies = await prisma.mockCompany.findMany({
    where,
    include: { _count: { select: { questions: true, interviews: true } } },
    orderBy: { name: "asc" },
  });

  // Get unique domains for filter
  const domains = await prisma.mockCompany.findMany({
    select: { domain: true },
    distinct: ["domain"],
    orderBy: { domain: "asc" },
  });

  return NextResponse.json({
    companies,
    domains: domains.map((d) => d.domain),
  });
}
