import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { loadPosts } from "@/lib/feed";
import { TrainerCard, RequirementCard } from "@/components/cards";
import { PostCard } from "@/components/post-card";
import { Avatar, Badge, Empty, Input, Button, Chip } from "@/components/ui";
import { modeLabel, money } from "@/lib/utils";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const user = await getCurrentUser();
  const term = q.trim();
  const showRate = !!user && user.role !== "TRAINER";
  const ci = { contains: term, mode: "insensitive" as const };

  const [trainers, requirements, companies, courses, feed] = term
    ? await Promise.all([
        db.trainerProfile.findMany({ where: { user: { status: "ACTIVE" }, OR: [{ headline: ci }, { bio: ci }, { user: { name: ci } }, { skills: { some: { name: ci } } }, { cities: { has: term } }] }, include: { user: { select: { name: true, avatarUrl: true } }, skills: true }, take: 8 }),
        db.requirement.findMany({ where: { visibility: "PUBLIC", status: { in: ["OPEN", "SHORTLISTING"] }, OR: [{ title: ci }, { description: ci }, { skills: { some: { name: ci } } }, { company: { name: ci } }] }, include: { company: { select: { name: true, slug: true, type: true, logoUrl: true, domainVerifiedAt: true } }, skills: true, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
        db.company.findMany({ where: { OR: [{ name: ci }, { industry: ci }, { description: ci }] }, take: 6 }),
        db.course.findMany({ where: { published: true, OR: [{ title: ci }, { summary: ci }, { skills: { some: { name: ci } } }] }, include: { trainer: { include: { user: { select: { name: true } } } }, skills: true }, take: 6 }),
        loadPosts({ body: ci }, 5, user?.id),
      ])
    : [[], [], [], [], { posts: [], liked: new Set<string>() }];
  const total = trainers.length + requirements.length + companies.length + courses.length + feed.posts.length;

  return (
    <div className="mx-auto max-w-5xl">
      <form className="mb-8 flex gap-2">
        <div className="relative flex-1"><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" /><Input name="q" defaultValue={q} placeholder="Search trainers, requirements, companies, courses and posts" className="h-12 pl-11 text-base" autoFocus /></div>
        <Button size="lg">Search</Button>
      </form>
      {!term ? <Empty title="Search everything on CorpGurus" body="Try a skill like “PAN-OS”, a city, a company, or a course name." /> : !total ? <Empty title={`Nothing found for “${term}”`} body="Try a shorter or broader term." /> : (
        <div className="space-y-10">
          <p className="mono text-[11px] uppercase tracking-wider text-dim">{total} result{total === 1 ? "" : "s"} for “{term}”</p>
          {trainers.length ? <section><h2 className="mb-3 text-lg font-bold">Trainers</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{trainers.map((t) => <TrainerCard key={t.id} t={t} showRate={showRate} />)}</div></section> : null}
          {courses.length ? (
            <section><h2 className="mb-3 text-lg font-bold">Courses</h2>
              <div className="grid gap-3 md:grid-cols-2">{courses.map((c) => (
                <Link key={c.id} href={`/trainers/${c.trainer.slug}#courses`} className="block rounded-2xl border border-line bg-white p-4 hover:border-cyan">
                  <p className="font-display font-semibold">{c.title}</p>
                  <p className="text-xs text-muted">{c.trainer.user.name} · {c.durationDays} day{c.durationDays > 1 ? "s" : ""} · {c.level.toLowerCase()} · {c.modes.map((m) => modeLabel[m]).join(" · ")}{showRate && c.indicativeRate ? ` · ${money(c.indicativeRate, c.currency)} / day` : ""}</p>
                  <p className="mt-1 line-clamp-2 text-sm">{c.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{c.skills.slice(0, 4).map((s) => <Chip key={s.id}>{s.name}</Chip>)}</div>
                </Link>
              ))}</div>
            </section>
          ) : null}
          {requirements.length ? <section><h2 className="mb-3 text-lg font-bold">Requirements</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{requirements.map((r) => <RequirementCard key={r.id} r={r} />)}</div></section> : null}
          {companies.length ? (
            <section><h2 className="mb-3 text-lg font-bold">Companies</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{companies.map((c) => (
                <Link key={c.id} href={`/companies/${c.slug}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 hover:border-violet"><Avatar name={c.name} src={c.logoUrl} size={40} tone="violet" className="rounded-lg" /><div className="min-w-0"><p className="truncate font-semibold">{c.name}</p><p className="truncate text-xs text-muted">{c.industry}</p></div>{c.type === "TRAINING_PARTNER" ? <Badge tone="violet" className="ml-auto">partner</Badge> : null}</Link>
              ))}</div>
            </section>
          ) : null}
          {feed.posts.length ? <section><h2 className="mb-3 text-lg font-bold">Posts</h2><div className="space-y-3">{feed.posts.map((p) => <PostCard key={p.id} post={p} viewerId={user?.id} liked={feed.liked.has(p.repostOfId ?? p.id)} isStaff={isStaff(user)} compact />)}</div></section> : null}
        </div>
      )}
    </div>
  );
}
