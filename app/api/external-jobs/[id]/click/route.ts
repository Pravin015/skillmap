import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fire-and-forget click recorder. Returns the external URL so the client can window.open it.
// We increment clickCount for coarse analytics — which sources drive traffic.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.externalJob.findUnique({ where: { id }, select: { id: true, externalUrl: true } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Non-blocking: don't await the increment.
  prisma.externalJob.update({ where: { id }, data: { clickCount: { increment: 1 } } }).catch(() => {});
  return NextResponse.json({ externalUrl: job.externalUrl });
}
