// GET /api/pending-applications
// Returns the signed-in student's open "I tried to apply but the lab gate
// blocked me" intents. Powers the red reminder banner on the dashboard.
//
// Each row carries enough context for the banner CTA: which job, which lab,
// when the deadline is, and how many labs are still outstanding (we recheck
// against the live student's lab attempts so the count is always accurate,
// even if the cron hasn't ticked recently).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ pending: [] });

  const intents = await prisma.pendingApplyIntent.findMany({
    where: { userId },
    include: {
      job: {
        select: {
          id: true, slug: true, title: true, company: true,
          gamifyLabSlug: true, gamifyLabSlugs: true, gamifyMinScore: true,
          status: true, deadline: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Drop intents whose underlying job is no longer applicable. Clean as we go
  // so the table doesn't accumulate orphan rows.
  const stillOpen = intents.filter((i) => {
    if (i.job.status !== "ACTIVE") return false;
    if (i.job.deadline && i.job.deadline < new Date()) return false;
    return true;
  });
  const expiredIds = intents.filter((i) => !stillOpen.includes(i)).map((i) => i.id);
  if (expiredIds.length > 0) {
    prisma.pendingApplyIntent.deleteMany({ where: { id: { in: expiredIds } } }).catch(() => {});
  }

  if (stillOpen.length === 0) return NextResponse.json({ pending: [] });

  // Cross-check: how many of each intent's required labs has the student
  // actually completed since the intent was created? If they've cleared
  // all of them, the intent is dead — they just need to click Apply again.
  const allSlugs = Array.from(new Set(stillOpen.flatMap((i) => i.job.gamifyLabSlugs?.length ? i.job.gamifyLabSlugs : (i.job.gamifyLabSlug ? [i.job.gamifyLabSlug] : []))));
  const attempts = allSlugs.length > 0
    ? await prisma.externalLabAttempt.findMany({
        where: {
          userId,
          labSlug: { in: allSlugs },
          status: { in: ["COMPLETED", "FLAG_CAPTURED"] },
        },
        select: { labSlug: true, score: true },
      })
    : [];

  const bestScorePerSlug = new Map<string, number>();
  for (const a of attempts) {
    const cur = bestScorePerSlug.get(a.labSlug) ?? -1;
    if ((a.score ?? 0) > cur) bestScorePerSlug.set(a.labSlug, a.score ?? 0);
  }

  const enriched = stillOpen.map((i) => {
    const slugs = i.job.gamifyLabSlugs?.length ? i.job.gamifyLabSlugs : (i.job.gamifyLabSlug ? [i.job.gamifyLabSlug] : []);
    const remaining = slugs.filter((slug) => {
      const best = bestScorePerSlug.get(slug);
      if (best === undefined) return true; // never attempted
      if (i.job.gamifyMinScore && best < i.job.gamifyMinScore) return true; // below threshold
      return false;
    });
    return {
      id: i.id,
      jobId: i.job.id,
      jobSlug: i.job.slug,
      jobTitle: i.job.title,
      company: i.job.company,
      deadline: i.job.deadline,
      requiredLabs: slugs,
      remainingLabs: remaining,
      readyToApply: remaining.length === 0,
      lastBlockedLab: i.lastBlockedLab,
      createdAt: i.createdAt,
    };
  });

  return NextResponse.json({ pending: enriched });
}
