import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const cats = await db.category.findMany({ include: { skills: { select: { id: true, name: true, slug: true, _count: { select: { trainers: true } } } }, _count: { select: { requirements: { where: { status: { in: ["OPEN", "SHORTLISTING"] }, visibility: "PUBLIC" } }, courses: { where: { published: true } } } } }, orderBy: { name: "asc" } });
  const trainerCounts = await Promise.all(cats.map((c) => db.trainerProfile.count({ where: { user: { status: "ACTIVE" }, skills: { some: { categoryId: c.id } } } })));
  return (
    <div>
      <PageHeader eyebrow="Browse" title="Training categories" body="Every domain on CorpGurus with the trainers, courses and open requirements behind it." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c, i) => (
          <Link key={c.id} href={`/categories/${c.slug}`} className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan hover:shadow-md">
            <h2 className="font-display text-lg font-bold group-hover:text-cyan">{c.name}</h2>
            {c.description ? <p className="mt-1 text-sm text-muted">{c.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-1.5">{c.skills.slice(0, 5).map((s) => <span key={s.id} className="rounded-md border border-line-2 bg-surface-2 px-2 py-0.5 text-xs">{s.name}</span>)}{c.skills.length > 5 ? <span className="text-xs text-muted">+{c.skills.length - 5}</span> : null}</div>
            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
              <div><dd className="font-display text-xl font-bold text-cyan">{trainerCounts[i]}</dd><dt className="text-[11px] text-muted">trainers</dt></div>
              <div><dd className="font-display text-xl font-bold text-violet">{c._count.requirements}</dd><dt className="text-[11px] text-muted">open</dt></div>
              <div><dd className="font-display text-xl font-bold">{c._count.courses}</dd><dt className="text-[11px] text-muted">courses</dt></div>
            </dl>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-cyan">Explore <ArrowRight size={14} /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
