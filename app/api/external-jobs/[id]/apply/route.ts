// GET /api/external-jobs/[id]/apply
// Increments click count, then 302-redirects to the external apply URL.
// Safe to hit from a plain <a href>; no auth required.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const job = await prisma.externalJob.findUnique({
    where: { id },
    select: { id: true, externalUrl: true, isActive: true },
  });

  if (!job || !job.isActive) {
    return NextResponse.redirect(new URL("/jobs/external?expired=1", _req.url));
  }

  // Fire-and-forget click increment. Don't block the redirect.
  prisma.externalJob
    .update({ where: { id }, data: { clickCount: { increment: 1 } } })
    .catch(() => { /* swallow — logging here would slow the redirect */ });

  return NextResponse.redirect(job.externalUrl, { status: 302 });
}
