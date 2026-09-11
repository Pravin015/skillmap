import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Globe, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar, Badge, Card, Empty } from "@/components/ui";
import { RequirementCard } from "@/components/cards";
import { fmtDate } from "@/lib/utils";
import { loadPosts } from "@/lib/feed";
import { PostCard } from "@/components/post-card";
import { FollowButton } from "@/components/post-actions";
import { isStaff } from "@/lib/auth";
import { companyBadges } from "@/lib/badges";
import { BadgeRow } from "@/components/badges";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await db.company.findUnique({ where: { slug }, select: { name: true, industry: true } });
  return c ? { title: c.name, description: `${c.name}${c.industry ? ` · ${c.industry}` : ""} hires freelance corporate trainers on CorpGurus.` } : { title: "Company" };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const c = await db.company.findUnique({
    where: { slug },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { role: "asc" } },
      requirements: { where: { visibility: "PUBLIC" }, include: { company: { select: { name: true, slug: true, type: true, logoUrl: true, domainVerifiedAt: true } }, skills: true, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) notFound();
  const isMember = !!user?.membership && user.membership.company.id === c.id;
  const [follow, followerCount, feed, badges] = await Promise.all([
    user && !isMember ? db.follow.findUnique({ where: { followerId_companyId: { followerId: user.id, companyId: c.id } } }) : null,
    db.follow.count({ where: { companyId: c.id } }),
    loadPosts({ companyId: c.id }, 5, user?.id),
    companyBadges(c.id),
  ]);
  const ratings = await db.rating.findMany({ where: { toUserId: { in: c.members.map((m) => m.userId) } }, include: { fromUser: { select: { name: true } }, requirement: { select: { title: true } } }, orderBy: { createdAt: "desc" } });
  const avg = ratings.length ? ratings.reduce((a, r) => a + r.score, 0) / ratings.length : null;
  const open = c.requirements.filter((r) => ["OPEN", "SHORTLISTING"].includes(r.status));
  const past = c.requirements.filter((r) => !["OPEN", "SHORTLISTING"].includes(r.status));

  return (
    <div className="space-y-8">
      <Card className="p-6" glow="violet">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={c.name} src={c.logoUrl} size={80} tone="violet" className="rounded-2xl" />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">{c.name}{c.domainVerifiedAt ? <BadgeCheck className="text-violet" size={22} aria-label="Verified company" /> : null}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={c.type === "TRAINING_PARTNER" ? "violet" : "neutral"}>{c.type === "TRAINING_PARTNER" ? "Training partner" : "Direct employer"}</Badge>
              {c.industry ? <Badge>{c.industry}</Badge> : null}{c.size ? <Badge>{c.size} people</Badge> : null}
              {c.domainVerifiedAt ? <Badge tone="lime">domain verified</Badge> : null}
              {avg ? <Badge tone="amber">★ {avg.toFixed(1)} from trainers</Badge> : null}
            </div>
            <BadgeRow badges={badges} className="mt-2" />
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1.5"><MapPin size={14} />{c.cities.join(", ") || "—"}</span>
              {c.website ? <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-ink"><Globe size={14} />{c.website.replace(/^https?:\/\//, "")}</a> : null}
              <span className="flex items-center gap-1.5"><Users size={14} />{c.members.length} member{c.members.length > 1 ? "s" : ""}</span>
              <span>{followerCount} follower{followerCount === 1 ? "" : "s"}</span>
              <span>Since {fmtDate(c.createdAt)}</span>
            </div>
            {c.description ? <p className="mt-4 max-w-3xl leading-relaxed text-ink/90">{c.description}</p> : null}
            {isMember ? <Link href="/settings" className="mt-3 inline-block text-sm text-violet hover:underline">Edit company page</Link> : null}
            {user && !isMember ? <FollowButton companyId={c.id} following={!!follow} className="mt-4 inline-block w-44" /> : null}
          </div>
        </div>
      </Card>

      {feed.posts.length ? (
        <section>
          <h2 className="mb-3 text-lg font-bold">Recent posts</h2>
          <div className="grid gap-3 lg:grid-cols-2">{feed.posts.map((p) => <PostCard key={p.id} post={p} viewerId={user?.id} liked={feed.liked.has(p.repostOfId ?? p.id)} isStaff={isStaff(user)} compact />)}</div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-bold">Open requirements</h2>
        {open.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{open.map((r) => <RequirementCard key={r.id} r={r} />)}</div> : <Empty title="Nothing open right now" body="Follow this page to hear about the next requirement." />}
      </section>

      {past.length ? (
        <section>
          <h2 className="mb-3 text-lg font-bold">Past requirements</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{past.map((r) => <RequirementCard key={r.id} r={r} />)}</div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-bold">Team</h2>
        <div className="flex flex-wrap gap-3">
          {c.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5">
              <Avatar name={m.user.name} src={m.user.avatarUrl} size={36} tone="violet" />
              <div><p className="text-sm font-medium">{m.user.name}</p><p className="mono text-[11px] uppercase tracking-wider text-muted">{m.role}</p></div>
            </div>
          ))}
        </div>
      </section>

      {ratings.length ? (
        <section>
          <h2 className="mb-3 text-lg font-bold">What trainers say</h2>
          <div className="space-y-3">{ratings.map((r) => (
            <div key={r.id} className="rounded-xl border border-line bg-white p-4">
              <p className="text-amber">{"★".repeat(r.score)}<span className="text-dim">{"★".repeat(5 - r.score)}</span></p>
              {r.review ? <p className="mt-1 text-ink/90">“{r.review}”</p> : null}
              <p className="mt-1 text-sm text-muted">{r.fromUser.name} · {r.requirement.title}</p>
            </div>
          ))}</div>
        </section>
      ) : null}
    </div>
  );
}
