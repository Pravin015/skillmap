import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { proTrainerUserIds } from "@/lib/billing";
import { RequirementCard, TrainerCard } from "@/components/cards";
import { ButtonLink, Chip, Empty, PageHeader } from "@/components/ui";
import { modeLabel, money } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await db.category.findUnique({ where: { slug }, select: { name: true } });
  return { title: c ? `${c.name} trainers` : "Category", description: c ? `Freelance corporate trainers, courses and open requirements in ${c.name} on CorpGurus.` : undefined };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const c = await db.category.findUnique({ where: { slug }, include: { skills: { include: { _count: { select: { trainers: true, requirements: true } } }, orderBy: { name: "asc" } } } });
  if (!c) notFound();
  const showRate = !!user && user.role !== "TRAINER";
  const [trainers, requirements, courses, pro] = await Promise.all([
    db.trainerProfile.findMany({ where: { user: { status: "ACTIVE" }, skills: { some: { categoryId: c.id } } }, include: { user: { select: { name: true, avatarUrl: true } }, skills: true }, orderBy: [{ verifiedAt: { sort: "desc", nulls: "last" } }, { yearsExperience: "desc" }], take: 24 }),
    db.requirement.findMany({ where: { categoryId: c.id, visibility: "PUBLIC", status: { in: ["OPEN", "SHORTLISTING"] } }, include: { company: { select: { name: true, slug: true, type: true, logoUrl: true, domainVerifiedAt: true } }, skills: true, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.course.findMany({ where: { published: true, OR: [{ categoryId: c.id }, { skills: { some: { categoryId: c.id } } }] }, include: { trainer: { include: { user: { select: { name: true } } } }, skills: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    proTrainerUserIds(),
  ]);
  const sorted = [...trainers].sort((a, b) => Number(pro.has(b.userId)) - Number(pro.has(a.userId)));
  const vendors = Array.from(new Set(c.skills.map((s) => s.vendor).filter(Boolean))) as string[];

  return (
    <div className="space-y-10">
      <PageHeader eyebrow={<Link href="/categories" className="hover:underline">Categories</Link>} title={c.name} body={c.description || `Trainers, courses and open requirements in ${c.name}.`}
        actions={<><ButtonLink href={`/requirements?category=${c.slug}`} variant="secondary">All requirements</ButtonLink>{user?.membership ? <ButtonLink href="/requirements/new" variant="violet">Post a requirement</ButtonLink> : null}</>} />
      <section>
        <h2 className="mb-3 text-lg font-bold">Skills in this category</h2>
        <div className="flex flex-wrap gap-2">{c.skills.map((s) => <Link key={s.id} href={`/trainers?skill=${s.slug}`}><Chip className="hover:border-cyan">{s.name}{s.vendor ? <span className="ml-1 text-muted">· {s.vendor}</span> : null}<span className="ml-1.5 text-muted">{s._count.trainers}</span></Chip></Link>)}</div>
        {vendors.length ? <p className="mt-3 text-sm text-muted">Vendors: {vendors.join(", ")}</p> : null}
      </section>
      <section>
        <div className="mb-3 flex items-end justify-between"><h2 className="text-lg font-bold">Trainers <span className="text-sm font-normal text-muted">{trainers.length}</span></h2></div>
        {sorted.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{sorted.map((t) => <TrainerCard key={t.id} t={{ ...t, pro: pro.has(t.userId) }} showRate={showRate} />)}</div> : <Empty title="No trainers yet" body="Trainers appear here once they list a skill from this category." />}
      </section>
      {courses.length ? (
        <section>
          <h2 className="mb-3 text-lg font-bold">Courses</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{courses.map((k) => (
            <Link key={k.id} href={`/trainers/${k.trainer.slug}?tab=courses`} className="block rounded-2xl border border-line bg-white p-4 hover:border-cyan">
              <p className="font-display font-semibold">{k.title}</p>
              <p className="text-xs text-muted">{k.trainer.user.name} · {k.durationDays} day{k.durationDays > 1 ? "s" : ""} · {k.level.toLowerCase()} · {k.modes.map((m) => modeLabel[m]).join(" · ")}{showRate && k.indicativeRate ? ` · ${money(k.indicativeRate, k.currency)} / day` : ""}</p>
              <p className="mt-1 line-clamp-2 text-sm">{k.summary}</p>
            </Link>
          ))}</div>
        </section>
      ) : null}
      <section>
        <div className="mb-3 flex items-end justify-between"><h2 className="text-lg font-bold">Open requirements</h2><Link href={`/requirements?category=${c.slug}`} className="text-sm text-cyan hover:underline">All →</Link></div>
        {requirements.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{requirements.map((r) => <RequirementCard key={r.id} r={r} />)}</div> : <Empty title="Nothing open right now" />}
      </section>
    </div>
  );
}
