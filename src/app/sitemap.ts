import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absolute, slugifyCity } from "@/lib/seo";

/** Public, indexable URLs only. Regenerated on each request (dynamic route). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trainers, companies, requirements, categories, skills, teams] = await Promise.all([
    db.trainerProfile.findMany({ where: { user: { status: "ACTIVE" } }, select: { slug: true, createdAt: true, cities: true, skills: { select: { slug: true } } } }),
    db.company.findMany({ select: { slug: true, createdAt: true } }),
    db.requirement.findMany({ where: { visibility: "PUBLIC", status: { in: ["OPEN", "SHORTLISTING"] } }, select: { id: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
    db.skill.findMany({ select: { slug: true } }),
    db.trainerTeam.findMany({ select: { slug: true, createdAt: true } }),
  ]);
  const now = new Date();
  const statics: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absolute("/trainers"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absolute("/requirements"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: absolute("/companies"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: absolute("/categories"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absolute("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absolute("/feed"), lastModified: now, changeFrequency: "daily", priority: 0.4 },
    { url: absolute("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absolute("/legal/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absolute("/legal/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absolute("/legal/refunds"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
  // Skill landing pages, plus skill × city pages where at least one trainer exists.
  const pairs = new Set<string>();
  for (const t of trainers) for (const s of t.skills) for (const c of t.cities) pairs.add(`${s.slug}/${slugifyCity(c)}`);
  return [
    ...statics,
    ...categories.map((c) => ({ url: absolute(`/categories/${c.slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...skills.map((s) => ({ url: absolute(`/hire/${s.slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...[...pairs].map((p) => ({ url: absolute(`/hire/${p}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...trainers.map((t) => ({ url: absolute(`/trainers/${t.slug}`), lastModified: t.createdAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...companies.map((c) => ({ url: absolute(`/companies/${c.slug}`), lastModified: c.createdAt, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...requirements.map((r) => ({ url: absolute(`/requirements/${r.id}`), lastModified: r.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
    ...teams.map((t) => ({ url: absolute(`/teams/${t.slug}`), lastModified: t.createdAt, changeFrequency: "monthly" as const, priority: 0.4 })),
  ];
}
