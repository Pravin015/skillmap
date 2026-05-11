// GET /api/v1/partner/jobs — paginated, filtered catalog
//
// Query params (all optional):
//   vertical = INTERNSHIP | FULLTIME | ALL  (default ALL)
//   q                                      free-text on title/company/skills
//   location                               substring match
//   workMode = Remote | On-site | Hybrid
//   domain                                 exact match
//   source                                 source slug filter
//   experienceLevel                        substring match
//   minSalary, maxSalary                   LPA bounds (inclusive)
//   postedAfter | since                    ISO timestamp, lower bound on postedAt
//   includeInactive = true | false         default false
//   limit  1-200                           default 50
//   offset                                 default 0
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticatePartner, finalisePartnerResponse, handlePreflight, b2bError } from "@/lib/b2b-auth";
import { shapeExternalJob } from "@/lib/b2b-job-shape";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function OPTIONS(req: NextRequest) {
  return handlePreflight(req) ?? new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const auth = await authenticatePartner(req, "jobs:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);

  const vertical = (searchParams.get("vertical") || "ALL").toUpperCase();
  const q = searchParams.get("q")?.trim();
  const location = searchParams.get("location")?.trim();
  const workMode = searchParams.get("workMode")?.trim();
  const domain = searchParams.get("domain")?.trim();
  const sourceSlug = searchParams.get("source")?.trim();
  const experienceLevel = searchParams.get("experienceLevel")?.trim();
  const minSalary = parseIntOrNull(searchParams.get("minSalary"));
  const maxSalary = parseIntOrNull(searchParams.get("maxSalary"));
  const postedAfter = searchParams.get("postedAfter") || searchParams.get("since");
  const includeInactive = searchParams.get("includeInactive") === "true";
  const limit = clamp(parseIntOrNull(searchParams.get("limit")) ?? 50, 1, 200);
  const offset = Math.max(0, parseIntOrNull(searchParams.get("offset")) ?? 0);

  const where: Prisma.ExternalJobWhereInput = {};

  if (!includeInactive) where.isActive = true;
  if (vertical === "INTERNSHIP" || vertical === "FULLTIME") {
    where.vertical = vertical;
  } else if (vertical !== "ALL") {
    return b2bError("BAD_REQUEST", "Invalid vertical (use INTERNSHIP | FULLTIME | ALL)", 400);
  }
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (workMode) where.workMode = workMode;
  if (domain) where.domain = domain;
  if (experienceLevel) where.experienceLevel = { contains: experienceLevel, mode: "insensitive" };
  if (sourceSlug) where.source = { slug: sourceSlug };
  if (minSalary !== null) where.salaryMin = { gte: minSalary };
  if (maxSalary !== null) where.salaryMax = { lte: maxSalary };

  if (postedAfter) {
    const d = new Date(postedAfter);
    if (Number.isNaN(d.getTime())) {
      return b2bError("BAD_REQUEST", "postedAfter/since must be a valid ISO timestamp", 400);
    }
    where.postedAt = { gte: d };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { skills: { has: q } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.externalJob.count({ where }),
    prisma.externalJob.findMany({
      where,
      include: { source: true },
      orderBy: [{ postedAt: "desc" }, { firstSeenAt: "desc" }],
      take: limit,
      skip: offset,
    }),
  ]);

  const data = rows.map(shapeExternalJob);

  const res = NextResponse.json({
    data,
    meta: {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    },
    version: "v1",
  });
  return finalisePartnerResponse(req, auth, res, started);
}

function parseIntOrNull(s: string | null): number | null {
  if (s === null || s === "") return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
