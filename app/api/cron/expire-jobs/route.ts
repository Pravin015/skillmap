// POST /api/cron/expire-jobs
// Header: x-cron-secret: <CRON_SECRET>
//
// Sweeps ExternalJob rows and flips isActive=false when:
//   1. expiresAt is in the past, OR
//   2. lastSeenAt is more than 30 days ago (scraper hasn't seen it).
// For every row flipped, fires a `job.expired` webhook to subscribed partners.
//
// Designed for a daily Railway cron schedule.
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { fireJobEvent } from "@/lib/b2b-webhooks";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const STALE_DAYS = 30;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const headerVal =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const a = Buffer.from(headerVal);
  const b = Buffer.from(secret);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const staleCutoff = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);

  const expiring = await prisma.externalJob.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: { lt: now } },
        { lastSeenAt: { lt: staleCutoff } },
      ],
    },
    select: {
      id: true, title: true, company: true, location: true, isActive: true,
      expiresAt: true, lastSeenAt: true,
    },
    take: 500, // cap per run to avoid runaway
  });

  if (expiring.length === 0) {
    return NextResponse.json({ ok: true, expired: 0, webhooksQueued: 0 });
  }

  await prisma.externalJob.updateMany({
    where: { id: { in: expiring.map((j) => j.id) } },
    data: { isActive: false },
  });

  let queued = 0;
  for (const j of expiring) {
    const count = await fireJobEvent({
      event: "job.expired",
      data: {
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        isActive: false,
        expiresAt: j.expiresAt ? j.expiresAt.toISOString() : null,
        lastSeenAt: j.lastSeenAt.toISOString(),
      },
    });
    queued += count;
  }

  return NextResponse.json({ ok: true, expired: expiring.length, webhooksQueued: queued });
}
