import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, Bookmark, BookmarkCheck, Clock, Languages, MapPin, MessageSquare, Star, UserPlus, Video } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { canMessage } from "@/lib/messaging";
import { proTrainerUserIds } from "@/lib/billing";
import { learnerScore, recordProfileView } from "@/lib/stats";
import { loadPosts } from "@/lib/feed";
import { trainerBadges } from "@/lib/badges";
import { requestConnection, startConversation, toggleSaveTrainer } from "@/lib/actions/network";
import { inviteTrainer } from "@/lib/actions/requirements";
import { AvailabilityStrip } from "@/components/availability";
import { BadgeList, BadgeRow } from "@/components/badges";
import { PostCard } from "@/components/post-card";
import { FollowButton } from "@/components/post-actions";
import { RecommendationsSection } from "@/components/recommendations";
import { TrainerTeams } from "@/components/trainer-teams";
import { ReportButton } from "@/components/report-button";
import { TrainerCard } from "@/components/cards";
import { JsonLd } from "@/components/json-ld";
import { pageMeta, personLd } from "@/lib/seo";
import { Avatar, Badge, Button, Card, Chip, Select } from "@/components/ui";
import { certStatusLabel, cn, fmtDate, modeLabel, money, rateRange } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await db.trainerProfile.findUnique({ where: { slug }, select: { headline: true, cities: true, verifiedAt: true, yearsExperience: true, skills: { select: { name: true }, take: 6 }, user: { select: { name: true, avatarUrl: true, status: true } } } });
  if (!t) return { title: "Trainer", robots: { index: false } };
  const skills = t.skills.map((s) => s.name);
  return pageMeta({
    title: `${t.user.name} · ${t.headline}`,
    description: `${t.user.name} is a ${t.verifiedAt ? "verified " : ""}freelance corporate trainer${t.cities.length ? ` based in ${t.cities.slice(0, 2).join(" and ")}` : ""} with ${t.yearsExperience} years of experience${skills.length ? ` in ${skills.slice(0, 4).join(", ")}` : ""}. Book through CorpGurus with a signed work order.`,
    path: `/trainers/${slug}`, type: "profile", image: t.user.avatarUrl ?? undefined, noindex: t.user.status !== "ACTIVE",
    keywords: [`${t.user.name} corporate trainer`, ...skills.map((s) => `${s} trainer`), ...t.cities.map((c) => `corporate trainer ${c}`)],
  });
}

const TABS = ["overview", "courses", "recommendations", "feedback", "posts", "gallery"] as const;
type Tab = (typeof TABS)[number];

async function loadTrainer(slug: string) {
  return db.trainerProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, createdAt: true, status: true, ratingsReceived: { include: { fromUser: { select: { name: true, memberships: { select: { company: { select: { name: true } } } } } }, requirement: { select: { title: true } } }, orderBy: { createdAt: "desc" } } } },
      skills: { orderBy: { name: "asc" }, include: { category: { select: { name: true, slug: true } } } },
      certifications: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
      experiences: { orderBy: [{ current: "desc" }, { startDate: "desc" }] },
      applications: { where: { status: "AWARDED" }, include: { requirement: { include: { company: { select: { name: true, slug: true } } } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { courses: { where: { published: true } }, photos: true, recommendations: { where: { visible: true } } } },
    },
  });
}
type T = NonNullable<Awaited<ReturnType<typeof loadTrainer>>>;
type Viewer = Awaited<ReturnType<typeof getCurrentUser>>;

export default async function TrainerPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string; recommend?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? (sp.tab as Tab) : sp.recommend ? "recommendations" : "overview";
  const user = await getCurrentUser();
  const t = await loadTrainer(slug);
  if (!t || t.user.status !== "ACTIVE") notFound();

  const isSelf = user?.id === t.userId;
  const showRate = !!user && user.role !== "TRAINER";
  if (!isSelf) await recordProfileView(t.id);

  const [conn, messagable, saved, openReqs, follow, followerCount, pro, learners, blocks, badges, postCount] = await Promise.all([
    user && !isSelf ? db.connection.findFirst({ where: { OR: [{ requesterId: user.id, addresseeId: t.userId }, { requesterId: t.userId, addresseeId: user.id }] } }) : null,
    user && !isSelf ? canMessage(user.id, t.userId) : false,
    user?.membership ? db.savedTrainer.findUnique({ where: { companyId_trainerId: { companyId: user.membership.company.id, trainerId: t.id } } }) : null,
    user?.membership ? db.requirement.findMany({ where: { companyId: user.membership.company.id, status: { in: ["OPEN", "SHORTLISTING"] }, invitedTrainers: { none: { id: t.id } } }, select: { id: true, title: true } }) : [],
    user && !isSelf ? db.follow.findUnique({ where: { followerId_followingUserId: { followerId: user.id, followingUserId: t.userId } } }) : null,
    db.follow.count({ where: { followingUserId: t.userId } }),
    proTrainerUserIds(),
    learnerScore(t.id),
    db.availabilityBlock.findMany({ where: { trainerId: t.id, endDate: { gte: new Date() } }, select: { startDate: true, endDate: true, kind: true } }),
    trainerBadges(t.id),
    db.post.count({ where: { authorId: t.userId, deletedAt: null } }),
  ]);
  const ratings = t.user.ratingsReceived;
  const avg = ratings.length ? ratings.reduce((a, r) => a + r.score, 0) / ratings.length : null;
  const first = t.user.name.split(" ")[0];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" }, { key: "courses", label: "Courses", count: t._count.courses }, { key: "recommendations", label: "Recommendations", count: t._count.recommendations },
    { key: "feedback", label: "Feedback", count: ratings.length + learners.count }, { key: "posts", label: "Posts", count: postCount }, { key: "gallery", label: "Gallery", count: t._count.photos },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <JsonLd data={personLd({ name: t.user.name, slug, headline: t.headline, cities: t.cities, skills: t.skills.map((s) => s.name), avatarUrl: t.user.avatarUrl, verified: !!t.verifiedAt })} />
      <div className="min-w-0">
        <Card className="p-6" glow="cyan">
          <div className="flex flex-wrap items-start gap-5">
            <Avatar name={t.user.name} src={t.user.avatarUrl} size={96} />
            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold md:text-3xl">{t.user.name}{t.verifiedAt ? <BadgeCheck className="text-cyan" size={22} aria-label="Verified trainer" /> : null}{pro.has(t.userId) ? <Badge tone="cyan">Trainer Pro</Badge> : null}</h1>
              <p className="mt-1 text-lg text-muted">{t.headline}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
                <span className="flex items-center gap-1.5"><MapPin size={14} />{t.cities.join(", ") || "Location flexible"}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} />{t.yearsExperience} years</span>
                <span className="flex items-center gap-1.5"><Languages size={14} />{t.languages.join(", ") || "English"}</span>
                {avg ? <span className="flex items-center gap-1 text-amber"><Star size={14} className="fill-amber" />{avg.toFixed(1)} · {ratings.length} client rating{ratings.length > 1 ? "s" : ""}</span> : null}
                {learners.count ? <span className="text-lime" title="Anonymous participant feedback collected through CorpGurus">Learner score {learners.avg!.toFixed(1)} · {learners.recommendPct}% recommend</span> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{t.deliveryModes.map((m) => <Badge key={m} tone="cyan">{modeLabel[m]}</Badge>)}</div>
              <BadgeRow badges={badges} className="mt-3" />
            </div>
          </div>
        </Card>

        <nav className="sticky top-16 z-30 mt-4 border-b border-line bg-bg/95 backdrop-blur">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {tabs.map((x) => (
              <Link key={x.key} href={`/trainers/${slug}${x.key === "overview" ? "" : `?tab=${x.key}`}`} className={cn("whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition", tab === x.key ? "border-cyan text-cyan" : "border-transparent text-muted hover:text-ink")}>
                {x.label}{x.count ? <span className="ml-1.5 rounded-md bg-surface-2 px-1.5 text-xs text-muted">{x.count}</span> : null}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-6 space-y-8">
          {tab === "overview" ? <Overview t={t} badges={badges} first={first} /> : null}
          {tab === "courses" ? <CoursesTab trainerId={t.id} slug={slug} first={first} showRate={showRate} user={user} /> : null}
          {tab === "recommendations" ? <RecsTab t={t} user={user} isSelf={isSelf} conn={conn} openForm={sp.recommend === "1"} /> : null}
          {tab === "feedback" ? <FeedbackTab trainerId={t.id} ratings={ratings} avg={avg} learners={learners} /> : null}
          {tab === "posts" ? <PostsTab userId={t.userId} viewerId={user?.id} staff={isStaff(user)} /> : null}
          {tab === "gallery" ? <GalleryTab trainerId={t.id} isSelf={isSelf} /> : null}
        </div>

        <SimilarTrainers t={t} showRate={showRate} pro={pro} />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Day rate</p>
          <p className="mt-1 font-display text-xl font-bold text-cyan">{showRate ? rateRange(t.dayRateMin, t.dayRateMax, t.currency) : "Visible to companies"}</p>
          {!user ? <p className="mt-1 text-xs text-dim">Sign in with a company account to see rates and message trainers.</p> : null}
          {t.availabilityNote ? <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">{t.availabilityNote}</p> : null}
          {!isSelf && user ? (
            <div className="mt-4 space-y-2">
              <FollowButton userId={t.userId} following={!!follow} />
              {conn?.status === "ACCEPTED" ? <Badge tone="lime" className="w-full justify-center py-1.5">Connected</Badge>
                : conn?.status === "PENDING" ? <Badge tone="amber" className="w-full justify-center py-1.5">{conn.requesterId === user.id ? "Request sent" : "Wants to connect with you"}</Badge>
                : (<form action={requestConnection}><input type="hidden" name="userId" value={t.userId} /><Button className="w-full" variant="secondary"><UserPlus size={15} /> Connect</Button></form>)}
              {messagable ? (<form action={startConversation}><input type="hidden" name="userId" value={t.userId} /><Button className="w-full"><MessageSquare size={15} /> Message</Button></form>)
                : <p className="text-center text-xs text-dim">Messaging unlocks once connected, after an application at your company, or on a Growth plan.</p>}
              {user.membership ? (
                <form action={toggleSaveTrainer}><input type="hidden" name="trainerId" value={t.id} /><Button className="w-full" variant="ghost">{saved ? <><BookmarkCheck size={15} className="text-cyan" /> Saved to shortlist</> : <><Bookmark size={15} /> Save to shortlist</>}</Button></form>
              ) : null}
            </div>
          ) : null}
          <Link href={`/trainers/${slug}/cv`} className="mt-3 block text-center text-xs text-cyan hover:underline">View as one-page CV</Link>
          {isSelf ? <div className="mt-4 grid gap-1 text-sm"><Link href="/settings" className="text-cyan hover:underline">Edit profile</Link><Link href="/settings/availability" className="text-cyan hover:underline">Availability</Link><Link href="/settings/courses" className="text-cyan hover:underline">Courses</Link><Link href="/settings/gallery" className="text-cyan hover:underline">Gallery</Link></div> : null}
        </Card>
        <Card className="p-5">
          <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Availability · next 12 weeks</p>
          <div className="mt-2"><AvailabilityStrip blocks={blocks} /></div>
        </Card>
        {user?.membership && openReqs.length ? (
          <Card className="p-5">
            <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Invite to a requirement</p>
            <form action={inviteTrainer} className="mt-2 space-y-2">
              <input type="hidden" name="trainerId" value={t.id} />
              <Select name="requirementId">{openReqs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</Select>
              <Button variant="violet" className="w-full">Send invite</Button>
            </form>
          </Card>
        ) : null}
        <p className="mono px-1 text-[11px] uppercase tracking-wider text-dim">{followerCount} follower{followerCount === 1 ? "" : "s"} · member since {fmtDate(t.user.createdAt)}</p>
        {user && !isSelf ? <ReportButton targetType="USER" targetId={t.userId} /> : null}
      </aside>
    </div>
  );
}

function Overview({ t, badges, first }: { t: T; badges: Awaited<ReturnType<typeof trainerBadges>>; first: string }) {
  const byCat = new Map<string, { slug: string; skills: string[] }>();
  for (const s of t.skills) { const k = s.category?.name ?? "Other"; const e = byCat.get(k) ?? { slug: s.category?.slug ?? "", skills: [] }; e.skills.push(s.name); byCat.set(k, e); }
  return (
    <>
      {t.bio ? <section><h2 className="mb-2 text-lg font-bold">About</h2><p className="max-w-3xl whitespace-pre-line leading-relaxed text-ink/90">{t.bio}</p>{t.videoUrl ? <a href={t.videoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-cyan hover:underline"><Video size={15} /> Watch {first}&apos;s intro video</a> : null}</section> : null}
      <section><h2 className="mb-3 text-lg font-bold">Skills</h2>
        <div className="space-y-3">{[...byCat.entries()].map(([cat, e]) => <div key={cat}><p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{e.slug ? <Link href={`/categories/${e.slug}`} className="hover:text-ink">{cat}</Link> : cat}</p><div className="flex flex-wrap gap-2">{e.skills.map((s) => <Link key={s} href={`/trainers?q=${encodeURIComponent(s)}`}><Chip className="hover:border-cyan">{s}</Chip></Link>)}</div></div>)}</div>
      </section>
      {t.experiences.length ? (
        <section><h2 className="mb-3 text-lg font-bold">Work history</h2>
          <ol className="relative space-y-4 border-l border-line pl-5">{t.experiences.map((e) => (
            <li key={e.id} className="relative"><span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan" /><p className="font-semibold">{e.title} <span className="font-normal text-muted">· {e.organisation}</span></p><p className="text-xs text-muted">{e.startDate ? fmtDate(e.startDate) : "?"} → {e.current ? "present" : e.endDate ? fmtDate(e.endDate) : "?"}</p>{e.description ? <p className="mt-1 text-sm text-ink/90">{e.description}</p> : null}</li>
          ))}</ol>
        </section>
      ) : null}
      <TrainerTeams trainerId={t.id} />
      <section><h2 className="mb-3 text-lg font-bold">Certifications</h2>
        {t.certifications.length ? (
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">{t.certifications.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5"><div className="min-w-0 flex-1"><p className="font-medium">{c.name}</p><p className="text-sm text-muted">{c.issuer}{c.credentialId ? <span className="mono"> · {c.credentialId}</span> : null}{c.issuedOn ? ` · issued ${fmtDate(c.issuedOn)}` : ""}{c.expiresOn ? ` · expires ${fmtDate(c.expiresOn)}` : ""}</p></div><Badge tone={c.status === "VERIFIED" ? "lime" : c.status === "PENDING" ? "amber" : "rose"}>{c.status === "VERIFIED" ? <BadgeCheck size={12} /> : null}{certStatusLabel[c.status]}</Badge></div>
          ))}</div>
        ) : <p className="text-sm text-muted">No certifications listed yet.</p>}
      </section>
      <section><h2 className="mb-3 text-lg font-bold">Badges</h2><BadgeList badges={badges} /></section>
      <section><h2 className="mb-3 text-lg font-bold">Engagements on CorpGurus</h2>
        {t.applications.length ? <div className="space-y-2">{t.applications.map((a) => <Link key={a.id} href={`/requirements/${a.requirementId}`} className="block rounded-xl border border-line bg-white px-5 py-3 hover:border-violet"><p className="font-medium">{a.requirement.title}</p><p className="text-sm text-muted">{a.requirement.company.name} · {a.requirement.days} day{a.requirement.days > 1 ? "s" : ""} · {a.requirement.participants} participants · {fmtDate(a.requirement.startDate)}</p></Link>)}</div> : <p className="text-sm text-muted">No awarded engagements yet.</p>}
      </section>
    </>
  );
}

async function CoursesTab({ trainerId, slug, first, showRate, user }: { trainerId: string; slug: string; first: string; showRate: boolean; user: Viewer }) {
  const courses = await db.course.findMany({ where: { trainerId, published: true }, include: { skills: true, category: true }, orderBy: { createdAt: "desc" } });
  if (!courses.length) return <p className="text-sm text-muted">{first} has not listed courses yet.</p>;
  return (
    <section><h2 className="mb-3 text-lg font-bold">Courses {first} delivers</h2>
      <div className="grid gap-3 md:grid-cols-2">{courses.map((c) => (
        <div key={c.id} className="flex flex-col rounded-2xl border border-line bg-white p-4">
          <p className="font-display font-semibold">{c.title}</p>
          <p className="mt-0.5 text-xs text-muted">{c.durationDays} day{c.durationDays > 1 ? "s" : ""} · {c.level.toLowerCase()} · {c.modes.map((m) => modeLabel[m]).join(" · ") || "any mode"}{c.maxParticipants ? ` · up to ${c.maxParticipants}` : ""}{showRate && c.indicativeRate ? ` · ${money(c.indicativeRate, c.currency)} / day` : ""}</p>
          <p className="mt-2 text-sm text-ink/90">{c.summary}</p>
          {c.outline ? <details className="mt-2 text-sm"><summary className="cursor-pointer text-cyan hover:underline">Outline</summary><p className="mt-1 whitespace-pre-line text-muted">{c.outline}</p></details> : null}
          <div className="mt-2 flex flex-wrap gap-1">{c.skills.map((s) => <Chip key={s.id}>{s.name}</Chip>)}</div>
          <div className="mt-3 flex items-center gap-2">
            {c.outlineUrl ? <a href={c.outlineUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan hover:underline">Outline PDF</a> : null}
            {user?.membership ? <Link href={`/requirements/new?course=${c.id}`} className="ml-auto inline-flex h-8 items-center rounded-lg bg-violet px-3 text-xs font-semibold text-white hover:bg-[#3d3384]">Request this course</Link> : !user ? <Link href={`/login?next=/trainers/${slug}?tab=courses`} className="ml-auto text-xs text-muted hover:text-ink">Sign in as a company to request</Link> : null}
          </div>
        </div>
      ))}</div>
    </section>
  );
}

async function RecsTab({ t, user, isSelf, conn, openForm }: { t: T; user: Viewer; isSelf: boolean; conn: { status: string } | null; openForm: boolean }) {
  const recs = await db.recommendation.findMany({ where: { trainerId: t.id }, include: { author: { select: { id: true, name: true, avatarUrl: true, role: true, memberships: { select: { company: { select: { name: true, slug: true } } } } } } }, orderBy: { createdAt: "desc" } });
  const existing = user ? recs.find((r) => r.authorId === user.id) ?? null : null;
  let canWrite = false;
  let askable: { id: string; name: string; company: string | null }[] = [];
  if (user && !isSelf) {
    const hired = user.membership ? await db.application.findFirst({ where: { trainerId: t.id, status: "AWARDED", requirement: { companyId: user.membership.company.id } }, select: { id: true } }) : null;
    canWrite = !!hired || conn?.status === "ACCEPTED";
  }
  if (isSelf) {
    const [hirers, conns] = await Promise.all([
      db.companyMember.findMany({ where: { company: { requirements: { some: { applications: { some: { trainerId: t.id, status: "AWARDED" } } } } } }, include: { user: { select: { id: true, name: true } }, company: { select: { name: true } } } }),
      db.connection.findMany({ where: { status: "ACCEPTED", OR: [{ requesterId: t.userId }, { addresseeId: t.userId }] }, include: { requester: { select: { id: true, name: true, memberships: { select: { company: { select: { name: true } } } } } }, addressee: { select: { id: true, name: true, memberships: { select: { company: { select: { name: true } } } } } } } }),
    ]);
    const seen = new Set<string>();
    for (const m of hirers) if (!seen.has(m.user.id)) { seen.add(m.user.id); askable.push({ id: m.user.id, name: m.user.name, company: m.company.name }); }
    for (const c of conns) { const o = c.requesterId === t.userId ? c.addressee : c.requester; if (!seen.has(o.id)) { seen.add(o.id); askable.push({ id: o.id, name: o.name, company: o.memberships[0]?.company.name ?? null }); } }
    askable = askable.filter((a) => !recs.some((r) => r.authorId === a.id));
  }
  return <RecommendationsSection recs={recs} trainerId={t.id} trainerName={t.user.name} viewerId={user?.id} isSelf={isSelf} canWrite={canWrite} existing={existing} askable={askable} openForm={openForm} />;
}

async function FeedbackTab({ trainerId, ratings, avg, learners }: { trainerId: string; ratings: T["user"]["ratingsReceived"]; avg: number | null; learners: { avg: number | null; count: number; recommendPct: number } }) {
  const comments = await db.feedbackResponse.findMany({ where: { link: { trainerId }, comment: { not: null } }, select: { score: true, comment: true, createdAt: true, link: { select: { requirement: { select: { title: true } } } } }, orderBy: { createdAt: "desc" }, take: 20 });
  return (
    <>
      <section>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-5"><p className="mono text-[11px] uppercase tracking-wider text-muted">Client ratings</p><p className="mt-1 font-display text-3xl font-bold text-amber">{avg ? avg.toFixed(1) : "—"}</p><p className="text-xs text-muted">{ratings.length ? `${ratings.length} rating${ratings.length > 1 ? "s" : ""} from companies after completed engagements` : "No client ratings yet"}</p></Card>
          <Card className="p-5"><p className="mono text-[11px] uppercase tracking-wider text-muted">Learner score</p><p className="mt-1 font-display text-3xl font-bold text-lime">{learners.count ? learners.avg!.toFixed(1) : "—"}</p><p className="text-xs text-muted">{learners.count ? `${learners.count} anonymous participants · ${learners.recommendPct}% would recommend` : "Collected through feedback links after sessions"}</p></Card>
        </div>
      </section>
      {ratings.length ? <section><h2 className="mb-3 text-lg font-bold">What clients say</h2><div className="space-y-3">{ratings.map((r) => <div key={r.id} className="rounded-xl border border-line bg-white p-4"><p className="flex items-center gap-2 text-amber">{"★".repeat(r.score)}<span className="text-dim">{"★".repeat(5 - r.score)}</span><span className="ml-1 text-xs text-muted">{fmtDate(r.createdAt)}</span></p>{r.review ? <p className="mt-2 text-ink/90">“{r.review}”</p> : null}<p className="mt-2 text-sm text-muted">{r.fromUser.name}{r.fromUser.memberships[0] ? `, ${r.fromUser.memberships[0].company.name}` : ""} · {r.requirement.title}</p></div>)}</div></section> : null}
      {comments.length ? <section><h2 className="mb-3 text-lg font-bold">What participants say</h2><div className="space-y-3">{comments.map((c, i) => <div key={i} className="rounded-xl border border-line bg-white p-4"><p className="text-lime">{"★".repeat(c.score)}<span className="text-dim">{"★".repeat(5 - c.score)}</span></p><p className="mt-1 text-ink/90">“{c.comment}”</p><p className="mt-1 text-xs text-muted">Anonymous participant · {c.link.requirement.title} · {fmtDate(c.createdAt)}</p></div>)}</div></section> : null}
      {!ratings.length && !comments.length ? <p className="text-sm text-muted">No written feedback yet.</p> : null}
    </>
  );
}

async function PostsTab({ userId, viewerId, staff }: { userId: string; viewerId?: string; staff: boolean }) {
  const feed = await loadPosts({ authorId: userId }, 20, viewerId);
  if (!feed.posts.length) return <p className="text-sm text-muted">No posts yet.</p>;
  return <div className="space-y-3">{feed.posts.map((p) => <PostCard key={p.id} post={p} viewerId={viewerId} liked={feed.liked.has(p.repostOfId ?? p.id)} isStaff={staff} />)}</div>;
}

async function GalleryTab({ trainerId, isSelf }: { trainerId: string; isSelf: boolean }) {
  const photos = await db.galleryPhoto.findMany({ where: { trainerId }, include: { company: { select: { name: true, slug: true } } }, orderBy: [{ takenOn: "desc" }, { createdAt: "desc" }] });
  if (!photos.length) return <p className="text-sm text-muted">{isSelf ? <>No photos yet. <Link href="/settings/gallery" className="text-cyan hover:underline">Add photos from recent sessions.</Link></> : "No training photos yet."}</p>;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{photos.map((p) => (
      <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-line bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.url} alt={p.caption} className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]" />
        <span className="block p-3 text-xs"><span className="line-clamp-2 block">{p.caption || "Training session"}</span><span className="mt-1 block text-muted">{p.takenOn ? fmtDate(p.takenOn) : ""}{p.company ? ` · ${p.company.name}` : ""}</span></span>
      </a>
    ))}</div>
  );
}

async function SimilarTrainers({ t, showRate, pro }: { t: T; showRate: boolean; pro: Set<string> }) {
  const similar = await db.trainerProfile.findMany({ where: { id: { not: t.id }, user: { status: "ACTIVE" }, skills: { some: { id: { in: t.skills.map((s) => s.id) } } } }, include: { user: { select: { name: true, avatarUrl: true } }, skills: true }, take: 4 });
  if (!similar.length) return null;
  return (
    <section className="mt-12 border-t border-line pt-8"><h2 className="mb-3 text-lg font-bold">Similar trainers</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{similar.map((s) => <TrainerCard key={s.id} t={{ ...s, pro: pro.has(s.userId) }} showRate={showRate} />)}</div></section>
  );
}
