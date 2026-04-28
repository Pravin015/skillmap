// Seeds JobSource rows so the admin panel has something to show before the first scrape.
// Safe to run multiple times (uses upsert).

import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { internshala } from "./sources/internshala";
import { indeedRss } from "./sources/indeed-rss";
import { remotive } from "./sources/remotive";
import { linkedinGuest } from "./sources/linkedin-guest";
import { adzuna } from "./sources/adzuna";
import { arbeitnow } from "./sources/arbeitnow";

const adapters = [internshala, indeedRss, remotive, linkedinGuest, adzuna, arbeitnow];

async function main() {
  for (const a of adapters) {
    await prisma.jobSource.upsert({
      where: { slug: a.slug },
      update: { displayName: a.displayName, baseUrl: a.baseUrl, vertical: a.vertical },
      create: {
        slug: a.slug,
        displayName: a.displayName,
        baseUrl: a.baseUrl,
        vertical: a.vertical,
        defaultQuery: (a.defaultQuery ?? {}) as object,
      },
    });
    console.log(`seeded source: ${a.slug}`);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("seed failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
