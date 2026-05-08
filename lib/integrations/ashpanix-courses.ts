// Adapter for ashpanix-institute — the courses LMS.
// Their /api/courses endpoint is public (no auth) but tenant-scoped via
// request headers. We sync their catalog into our local Course model
// periodically (Option B from the audit discussion). Students enroll
// inside AstraaHire so we own the enrollment + certificate lifecycle.
//
// Setup:
//   ASHPANIX_API_URL=https://ashpanix-edu.example.com  (no trailing slash)
//   ASHPANIX_TENANT_SLUG=astraahire                     (our tenant on their side)
//   ASHPANIX_API_KEY=<optional-if-they-add-auth-later>
//
// If ASHPANIX_API_URL isn't set, syncCourses() is a no-op (returns 0).

import { prisma } from "../prisma";

const BASE = (process.env.ASHPANIX_API_URL || "").replace(/\/$/, "");
const TENANT = process.env.ASHPANIX_TENANT_SLUG || "";
const KEY = process.env.ASHPANIX_API_KEY || "";
const HAS_ASHPANIX = Boolean(BASE);

interface AshpanixCourse {
  id: string;
  title: string;
  slug: string;
  shortDesc?: string | null;
  description?: string | null;
  category?: string | null;
  image?: string | null;
  heroImage?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  duration?: string | null;
  curriculum?: unknown; // JSON — array of modules typically
  features?: unknown;
  tools?: unknown;
  outcomes?: unknown;
  hiringCompanies?: unknown;
  introVideoUrl?: string | null;
  requirements?: unknown;
  status?: string;
  settingsJson?: unknown;
}

export interface SyncResult {
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessage?: string;
}

function asArrayOfStrings(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === "string");
  }
  if (typeof v === "string" && v.trim()) {
    // Their bulk import sometimes stores semicolon-separated strings.
    return v.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Fetch ashpanix-institute's public courses catalog and upsert into
 * our local Course model. Idempotent — safe to call repeatedly.
 *
 * Strategy: their `slug` is unique → we use a synthetic slug
 * `ashpanix:<their-slug>` to avoid collisions with locally-created
 * AstraaHire courses. Local courses (without that prefix) are never
 * touched by sync.
 */
export async function syncCourses(): Promise<SyncResult> {
  const result: SyncResult = { fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };

  if (!HAS_ASHPANIX) {
    result.errorMessage = "ASHPANIX_API_URL not configured — sync is a no-op";
    return result;
  }

  let courses: AshpanixCourse[] = [];
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (TENANT) headers["x-tenant-slug"] = TENANT;
    if (KEY) headers["Authorization"] = `Bearer ${KEY}`;

    const res = await fetch(`${BASE}/api/courses`, {
      headers,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });

    if (!res.ok) {
      result.errors++;
      result.errorMessage = `ashpanix returned ${res.status}: ${(await res.text()).slice(0, 200)}`;
      return result;
    }

    const data = (await res.json()) as { courses?: AshpanixCourse[] };
    courses = data.courses ?? [];
    result.fetched = courses.length;
  } catch (err) {
    result.errors++;
    result.errorMessage = err instanceof Error ? err.message : "Unknown fetch error";
    return result;
  }

  // Find an admin user to attribute synced courses to. Required because
  // our Course model has createdById NOT NULL.
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) {
    result.errorMessage = "No ADMIN user found — create one before syncing courses";
    return result;
  }

  for (const c of courses) {
    if (c.status && c.status !== "PUBLISHED" && c.status !== "ACTIVE") {
      result.skipped++;
      continue;
    }
    if (!c.title || !c.slug) {
      result.skipped++;
      continue;
    }

    const localSlug = `ashpanix-${c.slug}`;
    const description = c.description || c.shortDesc || `${c.title} — imported from Ashpanix`;
    const skills = [
      ...asArrayOfStrings(c.tools),
      ...asArrayOfStrings(c.features),
    ].slice(0, 12);
    const tags = asArrayOfStrings(c.outcomes).slice(0, 8);

    try {
      const existing = await prisma.course.findUnique({ where: { slug: localSlug } });

      if (existing) {
        await prisma.course.update({
          where: { id: existing.id },
          data: {
            title: c.title,
            description,
            coverImageUrl: c.heroImage || c.image || c.thumbnail || existing.coverImageUrl,
            duration: c.duration || existing.duration,
            category: c.category || existing.category,
            tags,
            skills,
            videoUrl: c.introVideoUrl || existing.videoUrl,
            // Pricing — ashpanix.price is in INR (rupees); our schema expects paise.
            pricing: c.price && c.price > 0 ? "PAID" : "FREE",
            price: c.price && c.price > 0 ? Math.round(c.price * 100) : null,
          },
        });
        result.updated++;
      } else {
        await prisma.course.create({
          data: {
            slug: localSlug,
            title: c.title,
            description,
            coverImageUrl: c.heroImage || c.image || c.thumbnail || null,
            duration: c.duration || null,
            difficulty: "Beginner", // ashpanix doesn't expose difficulty — sane default
            skills,
            category: c.category || null,
            tags,
            videoUrl: c.introVideoUrl || null,
            pricing: c.price && c.price > 0 ? "PAID" : "FREE",
            price: c.price && c.price > 0 ? Math.round(c.price * 100) : null,
            createdById: admin.id,
            creatorRole: "ADMIN",
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        });
        result.inserted++;
      }
    } catch (err) {
      console.error(`[ashpanix-sync] row '${c.slug}' failed:`, err);
      result.errors++;
    }
  }

  return result;
}

export const ashpanixConfigured = HAS_ASHPANIX;
