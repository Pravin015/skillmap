// Slug helpers shared by job-posting create + backfill.
import { prisma } from "./prisma";

/** Lower-case, hyphen-separated, ASCII-only. Strips punctuation, spaces, etc. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Generate a unique job slug like "social-media-manager-edunueron-001".
 * If `<title>-<company>` already exists, append -002, -003, etc.
 * Capped at 999 attempts (extremely unlikely; would mean 999 dupes).
 */
export async function generateJobSlug(title: string, company: string): Promise<string> {
  const base = `${slugify(title)}-${slugify(company)}`.slice(0, 80) || "job";

  // First try the bare slug (no counter) — better-looking URL.
  const bareTaken = await prisma.jobPosting.findUnique({ where: { slug: base }, select: { id: true } });
  if (!bareTaken) return base;

  // Otherwise increment until we find a free one.
  for (let i = 1; i <= 999; i++) {
    const candidate = `${base}-${String(i).padStart(3, "0")}`;
    const taken = await prisma.jobPosting.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  // Fallback — should never happen.
  return `${base}-${Date.now().toString(36)}`;
}
