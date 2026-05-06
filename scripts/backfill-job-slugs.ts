// Backfill JobPosting.slug for existing rows that don't have one.
// Safe to re-run; only touches rows where slug IS NULL.
//
// Usage:
//   DATABASE_URL=... npx tsx scripts/backfill-job-slugs.ts
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { generateJobSlug } from "@/lib/slug";

async function main() {
  const jobs = await prisma.jobPosting.findMany({
    where: { slug: null },
    select: { id: true, title: true, company: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Backfilling slugs for ${jobs.length} jobs...`);

  let done = 0;
  for (const job of jobs) {
    const slug = await generateJobSlug(job.title, job.company);
    await prisma.jobPosting.update({
      where: { id: job.id },
      data: { slug },
    });
    done++;
    if (done % 10 === 0) console.log(`  ${done}/${jobs.length}`);
  }

  console.log(`✔ Backfilled ${done} slugs`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
