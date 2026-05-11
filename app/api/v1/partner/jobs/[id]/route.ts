// GET /api/v1/partner/jobs/:id — single job in the same shape as the list row.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticatePartner, finalisePartnerResponse, handlePreflight, b2bError } from "@/lib/b2b-auth";
import { shapeExternalJob } from "@/lib/b2b-job-shape";

export async function OPTIONS(req: NextRequest) {
  return handlePreflight(req) ?? new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const started = Date.now();
  const auth = await authenticatePartner(req, "jobs:read");
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const job = await prisma.externalJob.findUnique({
    where: { id },
    include: { source: true },
  });
  if (!job) return b2bError("NOT_FOUND", "Job not found", 404);

  const res = NextResponse.json({ data: shapeExternalJob(job), version: "v1" });
  return finalisePartnerResponse(req, auth, res, started);
}
