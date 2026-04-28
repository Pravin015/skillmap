// Entry point for the job scraper.
//
// Usage:
//   npm run scrape                         -- run all enabled sources
//   npm run scrape:source -- internshala   -- run a single source by slug
//   npm run scrape -- --vertical INTERNSHIP -- only INTERNSHIP sources
//
// Meant to be invoked by Railway cron (e.g. every 6h) or manually from admin panel.

import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { runSource } from "./lib/run";
import type { SourceAdapter } from "./lib/types";

import { internshala } from "./sources/internshala";
import { indeedRss } from "./sources/indeed-rss";
import { remotive } from "./sources/remotive";
import { linkedinGuest } from "./sources/linkedin-guest";
import { adzuna } from "./sources/adzuna";
import { arbeitnow } from "./sources/arbeitnow";

const ALL: SourceAdapter[] = [internshala, indeedRss, remotive, linkedinGuest, adzuna, arbeitnow];

function parseArgs(argv: string[]): { source?: string; vertical?: string; maxItems?: number } {
  const out: { source?: string; vertical?: string; maxItems?: number } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--source") out.source = argv[++i];
    else if (a === "--vertical") out.vertical = argv[++i];
    else if (a === "--max") out.maxItems = Number(argv[++i]);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let adapters = ALL;

  if (args.source) {
    adapters = ALL.filter((a) => a.slug === args.source);
    if (adapters.length === 0) {
      console.error(`[scrape] unknown source: ${args.source}. known: ${ALL.map((a) => a.slug).join(", ")}`);
      process.exit(1);
    }
  }
  if (args.vertical) {
    adapters = adapters.filter((a) => a.vertical === args.vertical);
  }

  // Respect per-source `enabled` flag and minIntervalMin so cron calls can be cheap.
  const sources = await prisma.jobSource.findMany({ where: { slug: { in: adapters.map((a) => a.slug) } } });
  const bySlug = new Map(sources.map((s) => [s.slug, s]));

  const results = [];
  for (const a of adapters) {
    const cfg = bySlug.get(a.slug);
    if (cfg && !cfg.enabled) {
      console.log(`[${a.slug}] skipped (disabled)`);
      continue;
    }
    if (cfg?.lastRunAt && !args.source) {
      const elapsedMin = (Date.now() - cfg.lastRunAt.getTime()) / 60000;
      if (elapsedMin < cfg.minIntervalMin) {
        console.log(`[${a.slug}] skipped (last run ${Math.round(elapsedMin)}min ago, min ${cfg.minIntervalMin}min)`);
        continue;
      }
    }
    console.log(`[${a.slug}] starting...`);
    const summary = await runSource(a, { maxItems: args.maxItems, triggeredBy: "cli" });
    console.log(`[${a.slug}] ${summary.status} — found ${summary.itemsFound}, inserted ${summary.itemsInserted}, updated ${summary.itemsUpdated}, skipped ${summary.itemsSkipped} in ${summary.durationMs}ms`);
    results.push(summary);
  }

  const anyFailed = results.some((r) => r.status === "FAILED");
  await prisma.$disconnect();
  process.exit(anyFailed ? 1 : 0);
}

main().catch(async (err) => {
  console.error("[scrape] fatal:", err);
  await prisma.$disconnect();
  process.exit(1);
});
