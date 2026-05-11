// POST /api/cron/remind-pending-labs
// Header: x-cron-secret: $CRON_SECRET
//
// Fires NEW_JOB_MATCH-style reminders to students with a PendingApplyIntent
// whose lab gate isn't cleared yet. Re-fires every 3h while the intent is
// open AND the job is still active AND the deadline hasn't passed.
//
// Idempotent — `lastRemindedAt < now - 3h` is the only condition that
// triggers a new notification, so running the cron more often than every
// 3h is harmless (extra ticks no-op).
//
// Designed for a Railway hourly schedule. Bumped to hourly (not 3h) so a
// student who triggers an intent at 14:55 still gets their first reminder
// at ~17:00 instead of ~20:00.
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REMIND_EVERY_MS = 3 * 60 * 60 * 1000;
const MAX_REMINDERS = 6;       // ~18 hours of reminders; stop nagging after that

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
  const dueBefore = new Date(now.getTime() - REMIND_EVERY_MS);

  // Pull intents that are either fresh (never reminded) OR last reminded
  // more than 3h ago. Cap reminder count so we don't spam someone who
  // genuinely gave up on the lab.
  const intents = await prisma.pendingApplyIntent.findMany({
    where: {
      OR: [
        { lastRemindedAt: null },
        { lastRemindedAt: { lt: dueBefore } },
      ],
      remindersSent: { lt: MAX_REMINDERS },
    },
    include: {
      job: {
        select: {
          id: true, slug: true, title: true, company: true,
          status: true, deadline: true,
          gamifyLabSlug: true, gamifyLabSlugs: true, gamifyMinScore: true,
        },
      },
    },
    take: 500,
  });

  let sent = 0;
  let cleaned = 0;

  for (const intent of intents) {
    // Skip + clean if job is no longer applicable.
    if (intent.job.status !== "ACTIVE" || (intent.job.deadline && intent.job.deadline < now)) {
      await prisma.pendingApplyIntent.delete({ where: { id: intent.id } }).catch(() => {});
      cleaned++;
      continue;
    }

    // Skip + clean if the student has already cleared every required lab —
    // they just haven't clicked Apply yet. Still annoying to nag them.
    const slugs = intent.job.gamifyLabSlugs?.length ? intent.job.gamifyLabSlugs : (intent.job.gamifyLabSlug ? [intent.job.gamifyLabSlug] : []);
    if (slugs.length > 0) {
      const attempts = await prisma.externalLabAttempt.findMany({
        where: { userId: intent.userId, labSlug: { in: slugs }, status: { in: ["COMPLETED", "FLAG_CAPTURED"] } },
        select: { labSlug: true, score: true },
      });
      const bestPerSlug = new Map<string, number>();
      for (const a of attempts) {
        const cur = bestPerSlug.get(a.labSlug) ?? -1;
        if ((a.score ?? 0) > cur) bestPerSlug.set(a.labSlug, a.score ?? 0);
      }
      const remaining = slugs.filter((s) => {
        const best = bestPerSlug.get(s);
        if (best === undefined) return true;
        if (intent.job.gamifyMinScore && best < intent.job.gamifyMinScore) return true;
        return false;
      });
      if (remaining.length === 0) continue; // student is ready — banner still shows but no DM

      const labLabel = remaining.length === 1 ? remaining[0] : `${remaining.length} labs`;
      await createNotification({
        userId: intent.userId,
        type: "NEW_JOB_MATCH",
        title: `Reminder: complete ${labLabel} for ${intent.job.title}`,
        message: `You started applying to ${intent.job.title} at ${intent.job.company} but still need to clear ${remaining.length} hands-on lab${remaining.length === 1 ? "" : "s"}. Finish ${labLabel} to unlock the apply button${intent.job.deadline ? ` — deadline ${new Date(intent.job.deadline).toLocaleDateString()}.` : "."}`,
        data: { jobId: intent.job.id, jobSlug: intent.job.slug || intent.job.id, remainingLabs: remaining.join(",") },
      }).catch(() => {});

      await prisma.pendingApplyIntent.update({
        where: { id: intent.id },
        data: { remindersSent: { increment: 1 }, lastRemindedAt: now },
      }).catch(() => {});
      sent++;
    } else {
      // Intent for a job with no lab gate? Shouldn't happen, but clean.
      await prisma.pendingApplyIntent.delete({ where: { id: intent.id } }).catch(() => {});
      cleaned++;
    }
  }

  return NextResponse.json({ ok: true, scanned: intents.length, sent, cleaned });
}
