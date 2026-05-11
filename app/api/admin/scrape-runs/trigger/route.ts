import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runSource } from "@/scripts/job-scraper/lib/run";
import { internshala } from "@/scripts/job-scraper/sources/internshala";
import { indeedRss } from "@/scripts/job-scraper/sources/indeed-rss";
import { remotive } from "@/scripts/job-scraper/sources/remotive";
import { linkedinGuest } from "@/scripts/job-scraper/sources/linkedin-guest";
import { adzuna } from "@/scripts/job-scraper/sources/adzuna";
import { arbeitnow } from "@/scripts/job-scraper/sources/arbeitnow";
import type { SourceAdapter } from "@/scripts/job-scraper/lib/types";

export const runtime = "nodejs"; // cheerio + fetch need node, not edge
export const maxDuration = 60;   // scraping can take up to ~60s per source

const ADAPTERS: Record<string, SourceAdapter> = {
  internshala,
  "indeed-in": indeedRss,
  remotive,
  "linkedin-guest": linkedinGuest,
  "adzuna-in": adzuna,
  arbeitnow,
};

// Manual trigger from the admin UI. Runs one source synchronously and returns the summary.
// For bulk/cron use `npm run scrape` via Railway cron instead.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!session || role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const slug: string | undefined = body.source;
  const maxItems: number = Math.min(Number(body.maxItems) || 40, 100);
  const query: Record<string, unknown> | undefined = body.query;

  if (!slug) return NextResponse.json({ error: "source is required" }, { status: 400 });
  const adapter = ADAPTERS[slug];
  if (!adapter) return NextResponse.json({ error: `unknown source: ${slug}` }, { status: 400 });

  const summary = await runSource(adapter, { triggeredBy: `admin:${userId}`, maxItems, query });
  return NextResponse.json({ summary });
}
