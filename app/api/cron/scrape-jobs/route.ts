// Cron endpoint — POST /api/cron/scrape-jobs
// Auth: header `x-cron-secret` must match CRON_SECRET env var.
// Also accepts `?slug=adzuna-in` query param to run a single source.
//
// Wire this up in Railway:
//   URL: https://astraahire.com/api/cron/scrape-jobs
//   Method: POST
//   Header: x-cron-secret: <value of CRON_SECRET>
//   Schedule: every 6h
import { NextRequest, NextResponse } from "next/server";
import { runSource } from "@/scripts/job-scraper/lib/run";
import type { SourceAdapter } from "@/scripts/job-scraper/lib/types";
import { prisma } from "@/lib/prisma";

import { internshala } from "@/scripts/job-scraper/sources/internshala";
import { indeedRss } from "@/scripts/job-scraper/sources/indeed-rss";
import { remotive } from "@/scripts/job-scraper/sources/remotive";
import { linkedinGuest } from "@/scripts/job-scraper/sources/linkedin-guest";
import { adzuna } from "@/scripts/job-scraper/sources/adzuna";
import { arbeitnow } from "@/scripts/job-scraper/sources/arbeitnow";

const ALL: SourceAdapter[] = [internshala, indeedRss, remotive, linkedinGuest, adzuna, arbeitnow];

// Disable all caching — this is a mutation endpoint.
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — long-running scrape

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const header = req.headers.get("x-cron-secret");
  if (header !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const force = searchParams.get("force") === "1";

  let adapters = ALL;
  if (slug) {
    adapters = ALL.filter((a) => a.slug === slug);
    if (adapters.length === 0) {
      return NextResponse.json({ error: `unknown slug: ${slug}` }, { status: 400 });
    }
  }

  // Respect enabled + min interval like the CLI does.
  const sources = await prisma.jobSource.findMany({ where: { slug: { in: adapters.map((a) => a.slug) } } });
  const bySlug = new Map(sources.map((s) => [s.slug, s]));

  const results: Array<{ slug: string; status: string; found: number; inserted: number; updated: number; skipped: number; durationMs: number; error?: string }> = [];

  for (const a of adapters) {
    const cfg = bySlug.get(a.slug);
    if (cfg && !cfg.enabled) {
      results.push({ slug: a.slug, status: "DISABLED", found: 0, inserted: 0, updated: 0, skipped: 0, durationMs: 0 });
      continue;
    }
    if (!force && cfg?.lastRunAt) {
      const gap = (Date.now() - cfg.lastRunAt.getTime()) / 60000;
      if (gap < cfg.minIntervalMin) {
        results.push({ slug: a.slug, status: "THROTTLED", found: 0, inserted: 0, updated: 0, skipped: 0, durationMs: 0 });
        continue;
      }
    }
    const summary = await runSource(a, { triggeredBy: "cron" });
    results.push({
      slug: a.slug,
      status: summary.status,
      found: summary.itemsFound,
      inserted: summary.itemsInserted,
      updated: summary.itemsUpdated,
      skipped: summary.itemsSkipped,
      durationMs: summary.durationMs,
      error: summary.error,
    });
  }

  // Soft-deactivate stale jobs (unseen > 30 days)
  const staleCutoff = new Date(Date.now() - 30 * 86400_000);
  const { count: deactivated } = await prisma.externalJob.updateMany({
    where: { lastSeenAt: { lt: staleCutoff }, isActive: true },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true, results, deactivated });
}

// GET returns a dry status summary — safe to hit without secret (read-only).
export async function GET() {
  const sources = await prisma.jobSource.findMany({
    orderBy: { slug: "asc" },
    include: { _count: { select: { jobs: true } } },
  });
  return NextResponse.json({
    sources: sources.map((s) => ({
      slug: s.slug,
      displayName: s.displayName,
      enabled: s.enabled,
      lastRunAt: s.lastRunAt,
      lastStatus: s.lastStatus,
      minIntervalMin: s.minIntervalMin,
      jobCount: s._count.jobs,
    })),
  });
}
