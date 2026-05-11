// GET /api/v1/partner/sources — list of upstream scrapers currently
// producing rows. Partners use this to render their "source" filter.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticatePartner, finalisePartnerResponse, handlePreflight } from "@/lib/b2b-auth";

export async function OPTIONS(req: NextRequest) {
  return handlePreflight(req) ?? new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const auth = await authenticatePartner(req, "jobs:read");
  if (!auth.ok) return auth.response;

  const sources = await prisma.jobSource.findMany({
    where: { enabled: true },
    orderBy: { displayName: "asc" },
    select: { id: true, slug: true, displayName: true, vertical: true },
  });

  const res = NextResponse.json({
    data: sources.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.displayName,
      logoUrl: null,
      vertical: s.vertical,
    })),
    version: "v1",
  });
  return finalisePartnerResponse(req, auth, res, started);
}
