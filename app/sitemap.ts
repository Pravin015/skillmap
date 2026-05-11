// Dynamic sitemap — replaces the legacy public/sitemap.xml.
// Crawls active jobs, blog posts, courses, competitions, mentor profiles
// so Google indexes everything we publish.
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = "https://astraahire.com";

// Static / marketing pages — high priority, change rarely
const STATIC: MetadataRoute.Sitemap = [
  { url: BASE, changeFrequency: "weekly", priority: 1.0 },
  { url: `${BASE}/jobs`, changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE}/jobs/external`, changeFrequency: "daily", priority: 0.85 },
  { url: `${BASE}/courses`, changeFrequency: "weekly", priority: 0.85 },
  { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE}/events`, changeFrequency: "daily", priority: 0.8 },
  { url: `${BASE}/competitions`, changeFrequency: "daily", priority: 0.8 },
  { url: `${BASE}/companies`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${BASE}/mentors`, changeFrequency: "weekly", priority: 0.85 },
  { url: `${BASE}/mock-interview`, changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/offer-verify`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/labs`, changeFrequency: "weekly", priority: 0.6 },
  { url: `${BASE}/pricing`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE}/for-companies`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/for-mentors`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/for-institutions`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE}/refund-policy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE}/shipping-policy`, changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pull dynamic content. Failures shouldn't break the whole sitemap, so
  // each query is wrapped in a catch that returns an empty array.
  const [jobs, blogs, courses, competitions, mentors] = await Promise.all([
    prisma.jobPosting
      .findMany({ where: { status: "ACTIVE" }, select: { id: true, slug: true, updatedAt: true }, take: 5000 })
      .catch(() => []),
    prisma.blogPost
      .findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true }, take: 1000 })
      .catch(() => []),
    prisma.course
      .findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true }, take: 1000 })
      .catch(() => []),
    prisma.competition
      .findMany({ where: { status: { in: ["OPEN", "LIVE"] } }, select: { slug: true, updatedAt: true }, take: 500 })
      .catch(() => []),
    prisma.mentorProfile
      .findMany({ where: { status: "VERIFIED" }, select: { mentorNumber: true, updatedAt: true }, take: 2000 })
      .catch(() => []),
  ]);

  const dynamic: MetadataRoute.Sitemap = [
    ...jobs.map((j) => ({
      url: `${BASE}/jobs/${j.slug || j.id}`,
      lastModified: j.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...blogs.map((b) => ({
      url: `${BASE}/blog/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...courses.map((c) => ({
      url: `${BASE}/courses/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...competitions.map((c) => ({
      url: `${BASE}/competitions/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...mentors.map((m) => ({
      url: `${BASE}/mentor/${m.mentorNumber}`,
      lastModified: m.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...STATIC, ...dynamic];
}
