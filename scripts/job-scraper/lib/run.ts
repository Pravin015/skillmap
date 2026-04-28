import { prisma } from "@/lib/prisma";
import type { RawJob, RunSummary, SourceAdapter } from "./types";
import { cleanText, makeDedupeHash, normalizeWorkMode, parseSalary, validateRaw } from "./normalize";

const DEFAULT_MAX_ITEMS = 60;

// Runs a single source adapter end-to-end:
// 1. records a ScrapeRun row in RUNNING state
// 2. streams items from adapter, upserts each
// 3. finalizes ScrapeRun with counts + status
export async function runSource(
  adapter: SourceAdapter,
  opts: { triggeredBy?: string; maxItems?: number; query?: Record<string, unknown> } = {}
): Promise<RunSummary> {
  const { triggeredBy = "cli", maxItems = DEFAULT_MAX_ITEMS, query } = opts;
  const startedAt = new Date();

  // Ensure source row exists.
  const source = await prisma.jobSource.upsert({
    where: { slug: adapter.slug },
    update: { displayName: adapter.displayName, baseUrl: adapter.baseUrl, vertical: adapter.vertical },
    create: {
      slug: adapter.slug,
      displayName: adapter.displayName,
      baseUrl: adapter.baseUrl,
      vertical: adapter.vertical,
      defaultQuery: (adapter.defaultQuery ?? {}) as object,
    },
  });

  const run = await prisma.scrapeRun.create({
    data: { sourceId: source.id, status: "RUNNING", triggeredBy, query: (query ?? adapter.defaultQuery ?? {}) as object },
  });

  let found = 0, inserted = 0, updated = 0, skipped = 0;
  let errorMessage: string | undefined;
  let status: RunSummary["status"] = "SUCCESS";

  try {
    const gen = adapter.scrape({ query: query ?? adapter.defaultQuery, maxItems });
    for await (const raw of gen) {
      found++;
      const reason = validateRaw(raw);
      if (reason) { skipped++; continue; }
      try {
        const result = await upsertExternalJob(source.id, adapter.slug, raw);
        if (result === "inserted") inserted++;
        else if (result === "updated") updated++;
        else skipped++;
      } catch (err) {
        skipped++;
        // Continue on per-item failures — don't fail the whole run.
        console.error(`[${adapter.slug}] upsert failed:`, (err as Error).message);
      }
      if (found >= maxItems) break;
    }
  } catch (err) {
    status = inserted > 0 ? "PARTIAL" : "FAILED";
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[${adapter.slug}] scrape failed:`, errorMessage);
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  await prisma.scrapeRun.update({
    where: { id: run.id },
    data: { status, finishedAt, durationMs, itemsFound: found, itemsInserted: inserted, itemsUpdated: updated, itemsSkipped: skipped, errorMessage },
  });

  await prisma.jobSource.update({
    where: { id: source.id },
    data: { lastRunAt: finishedAt, lastStatus: status },
  });

  return { sourceSlug: adapter.slug, status, itemsFound: found, itemsInserted: inserted, itemsUpdated: updated, itemsSkipped: skipped, durationMs, error: errorMessage };
}

async function upsertExternalJob(sourceId: string, sourceSlug: string, raw: RawJob): Promise<"inserted" | "updated" | "skipped"> {
  const dedupeHash = makeDedupeHash(sourceSlug, raw.title, raw.company, raw.location);
  const { min, max } = parseSalary(raw.salaryText);
  const data = {
    sourceId,
    sourceJobId: raw.sourceJobId,
    dedupeHash,
    title: raw.title.trim(),
    company: raw.company.trim(),
    companyLogoUrl: raw.companyLogoUrl ?? null,
    location: raw.location.trim(),
    workMode: normalizeWorkMode(raw.workMode),
    salaryText: raw.salaryText ?? null,
    salaryMin: min,
    salaryMax: max,
    experienceLevel: raw.experienceLevel ?? null,
    jobType: raw.jobType ?? null,
    domain: raw.domain ?? null,
    description: cleanText(raw.description, 800),
    skills: raw.skills ?? [],
    vertical: raw.vertical,
    externalUrl: raw.externalUrl,
    postedAt: raw.postedAt ?? null,
    expiresAt: raw.expiresAt ?? null,
    lastSeenAt: new Date(),
    isActive: true,
  };

  // Two unique keys: (sourceId, sourceJobId) for same-source reposts, dedupeHash for cross-post detection.
  // Prefer sourceJobId match; if that misses but hash matches, update the existing row.
  const existing = await prisma.externalJob.findFirst({
    where: { OR: [{ sourceId, sourceJobId: raw.sourceJobId }, { dedupeHash }] },
    select: { id: true },
  });

  if (existing) {
    await prisma.externalJob.update({ where: { id: existing.id }, data });
    return "updated";
  }
  await prisma.externalJob.create({ data: { ...data, firstSeenAt: new Date() } });
  return "inserted";
}
