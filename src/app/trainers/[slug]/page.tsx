import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Bookmark, BookmarkCheck, Clock, Languages, MapPin, MessageSquare, Star, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canMessage } from "@/lib/messaging";
import { requestConnection, startConversation, toggleSaveTrainer } from "@/lib/actions/network";
import { inviteTrainer } from "@/lib/actions/requirements";
import { Avatar, Badge, Button, Card, Chip, Select } from "@/components/ui";
import { certStatusLabel, fmtDate, modeLabel, money, rateRange } from "@/lib/utils";
import { loadPosts } from "@/lib/feed";
import { PostCard } from "@/components/post-card";
import { FollowButton } from "@/components/post-actions";
import { isStaff } from "@/lib/auth";
import { proTrainerUserIds } from "@/lib/billing";
import { learnerScore, recordProfileView } from "@/lib/stats";
import { AvailabilityStrip } from "@/components/availability";
import { ReportButton } from "@/components/report-button";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await db.trainerProfile.findUnique({ where: { slug }, select: { headline: true, user: { select: { name: true } } } });
  return t ? { title: `${t.user.name} · ${t.headline}`, description: `${t.user.name}, freelance corporate trainer on CorpGurus. ${t.headline}` } : { title: "Trainer" };
}

export default async function TrainerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const t = await db.trainerProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, createdAt: true, status: true, ratingsReceived: { include: { fromUser: { select: { name: true, membership: { select: { company: { select: { name: true } } } } } }, requirement: { select: { title: true } } }, orderBy: { createdAt: "desc" } } } },
      skills: { orderBy: { name: "asc" } },
      certifications: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
      applications: { where: { status: "AWARDED" }, include: { requirement: { include: { company: { select: { name: true, slug: true } } } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!t || t.user.status !== "ACTIVE") notFound();

  const isSelf = user?.id === t.userId;
  const showRate = !!user && user.role !== "TRAINER";
  const [conn, messagable, saved, openReqs] = await Promise.all([
    user && !isSelf ? db.connection.findFirst({ where: { OR: [{ requesterId: user.id, addresseeId: t.userId }, { requesterId: t.userId, addresseeId: user.id }] } }) : null,
    user && !isSelf ? canMessage(user.id, t.userId) : false,
    user?.membership ? db.savedTrainer.findUnique({ where: { companyId_trainerId: { companyId: user.membership.company.id, trainerId: t.id } } }) : null,
    user?.membership ? db.requirement.findMany({ where: { companyId: user.membership.company.id, status: { in: ["OPEN", "SHORTLISTING"] }, invitedTrainers: { none: { id: t.id } } }, select: { id: true, title: true } }) : [],
  ]);
  if (!isSelf) await recordProfileView(t.id);
  const [follow, followerCount, feed, pro, learners, blocks, courses] = await Promise.all([
    user && !isSelf ? db.follow.findUnique({ where: { followerId_followingUserId: { followerId: user.id, followingUserId: t.userId } } }) : null,
    db.follow.count({ where: { followingUserId: t.userId } }),
    loadPosts({ authorId: t.userId }, 5, user?.id),
    proTrainerUserIds(),
    learnerScore(t.id),
    db.availabilityBlock.findMany({ where: { trainerId: t.id, endDate: { gte: new Date() } }, select: { startDate: true, endDate: true, kind: true } }),
    db.course.findMany({ where: { trainerId: t.id, published: true }, include: { skills: true, category: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const ratings = t.user.ratingsReceived;
  const avg = ratings.length ? ratings.reduce((a, r) => a + r.score, 0) / ratings.length : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card className="p-6" glow="cyan">
          <div className="flex flex-wrap items-start gap-5">
            <Avatar name={t.user.name} src={t.user.avatarUrl} size={88} />
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">{t.user.name}{t.verifiedAt ? <BadgeCheck className="text-cyan" size={22} aria-label="Verified trainer" /> : null}</h1>
              <p className="mt-1 text-lg text-muted">{t.headline}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
                <span className="flex items-center gap-1.5"><MapPin size={14} />{t.cities.join(", ") || "Location flexible"}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} />{t.yearsExperience} years</span>
                <span className="flex items-center gap-1.5"><Languages size={14} />{t.languages.join(", ") || "English"}</span>
                {avg ? <span className="flex items-center gap-1 text-amber"><Star size={14} className="fill-amber" />{avg.toFixed(1)} · {ratings.length} client rating{ratings.length > 1 ? "s" : ""}</span> : null}
                {learners.count ? <span className="flex items-center gap-1 text-lime" title="Anonymous participant feedback collected through CorpGurus">Learner score {learners.avg!.toFixed(1)} · {learners.count} participant{learners.count > 1 ? "s" : ""} · {learners.recommendPct}% recommend</span> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{t.deliveryModes.map((m) => <Badge key={m} tone="cyan">{modeLabel[m]}</Badge>)}{t.verifiedAt ? <Badge tone="lime">verified {fmtDate(t.verifiedAt)}</Badge> : null}{pro.has(t.userId) ? <Badge tone="cyan">Trainer Pro</Badge> : null}</div>
            </div>
          </div>
          {t.bio ? <p className="mt-5 max-w-3xl whitespace-pre-line leading-relaxed text-ink/90">{t.bio}</p> : null}
        </Card>

        {courses.length ? (
          <section id="courses">
            <h2 className="mb-3 text-lg font-bold">Courses {t.user.name.split(" ")[0]} delivers</h2>
            <div className="grid gap-3 md:grid-cols-2">{courses.map((c) => (
              <div key={c.id} className="flex flex-col rounded-2xl border border-line bg-white p-4">
                <p className="font-display font-semibold">{c.title}</p>
                <p className="mt-0.5 text-xs text-muted">{c.durationDays} day{c.durationDays > 1 ? "s" : ""} · {c.level.toLowerCase()} · {c.modes.map((m) => modeLabel[m]).join(" · ") || "any mode"}{c.maxParticipants ? ` · up to ${c.maxParticipants}` : ""}{showRate && c.indicativeRate ? ` · ${money(c.indicativeRate, c.currency)} / day` : ""}</p>
                <p className="mt-2 text-sm text-ink/90">{c.summary}</p>
                {c.outline ? <details className="mt-2 text-sm"><summary className="cursor-pointer text-cyan hover:underline">Outline</summary><p className="mt-1 whitespace-pre-line text-muted">{c.outline}</p></details> : null}
                <div className="mt-2 flex flex-wrap gap-1">{c.skills.map((s) => <Chip key={s.id}>{s.name}</Chip>)}</div>
                <div className="mt-3 flex items-center gap-2">
                  {c.outlineUrl ? <a href={c.outlineUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan hover:underline">Outline PDF</a> : null}
                  {user?.membership ? <Link href={`/requirements/new?course=${c.id}`} className="ml-auto inline-flex h-8 items-center rounded-lg bg-violet px-3 text-xs font-semibold text-white hover:bg-[#3d3384]">Request this course</Link> : !user ? <Link href={`/login?next=/trainers/${t.slug}`} className="ml-auto text-xs text-muted hover:text-ink">Sign in as a company to request</Link> : null}
                </div>
              </div>
            ))}</div>
          </section>
        ) : null}

        {feed.posts.length ? (
          <section>
            <h2 className="mb-3 text-lg font-bold">Recent posts</h2>
            <div className="space-y-3">{feed.posts.map((p) => <PostCard key={p.id} post={p} viewerId={user?.id} liked={feed.liked.has(p.repostOfId ?? p.id)} isStaff={isStaff(user)} compact />)}</div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-3 text-lg font-bold">Skills</h2>
          <div className="flex flex-wrap gap-2">{t.skills.map((s) => <Link key={s.id} href={`/trainers?skill=${s.slug}`}><Chip className="hover:border-cyan/50">{s.name}</Chip></Link>)}</div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Certifications</h2>
          {t.certifications.length ? (
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {t.certifications.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted">{c.issuer}{c.credentialId ? <span className="mono"> · {c.credentialId}</span> : null}{c.issuedOn ? ` · issued ${fmtDate(c.issuedOn)}` : ""}</p>
                  </div>
                  <Badge tone={c.status === "VERIFIED" ? "lime" : c.status === "PENDING" ? "amber" : "rose"}>{c.status === "VERIFIED" ? <BadgeCheck size={12} /> : null}{certStatusLabel[c.status]}</Badge>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted">No certifications listed yet.</p>}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Engagements on CorpGurus</h2>
          {t.applications.length ? (
            <div className="space-y-2">
              {t.applications.map((a) => (
                <Link key={a.id} href={`/requirements/${a.requirementId}`} className="block rounded-xl border border-line bg-white px-5 py-3 hover:border-violet/50">
                  <p className="font-medium">{a.requirement.title}</p>
                  <p className="text-sm text-muted">{a.requirement.company.name} · {a.requirement.days} day{a.requirement.days > 1 ? "s" : ""} · {a.requirement.participants} participants · {fmtDate(a.requirement.startDate)}</p>
                </Link>
              ))}
            </div>
          ) : <p className="text-sm text-muted">No awarded engagements yet.</p>}
        </section>

        {ratings.length ? (
          <section>
            <h2 className="mb-3 text-lg font-bold">What clients say</h2>
            <div className="space-y-3">
              {ratings.map((r) => (
                <div key={r.id} className="rounded-xl border border-line bg-white p-4">
                  <p className="flex items-center gap-2 text-amber">{"★".repeat(r.score)}<span className="text-dim">{"★".repeat(5 - r.score)}</span><span className="ml-1 text-xs text-muted">{fmtDate(r.createdAt)}</span></p>
                  {r.review ? <p className="mt-2 text-ink/90">“{r.review}”</p> : null}
                  <p className="mt-2 text-sm text-muted">{r.fromUser.name}{r.fromUser.membership ? `, ${r.fromUser.membership.company.name}` : ""} · {r.requirement.title}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Availability · next 12 weeks</p>
          <div className="mt-2"><AvailabilityStrip blocks={blocks} /></div>
          {isSelf ? <Link href="/settings/availability" className="mt-2 block text-xs text-cyan hover:underline">Edit availability</Link> : null}
        </Card>
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
                : <p className="text-center text-xs text-dim">Messaging unlocks once connected, or after an application at your company.</p>}
              {user.membership ? (
                <form action={toggleSaveTrainer}><input type="hidden" name="trainerId" value={t.id} /><Button className="w-full" variant="ghost">{saved ? <><BookmarkCheck size={15} className="text-cyan" /> Saved to shortlist</> : <><Bookmark size={15} /> Save to shortlist</>}</Button></form>
              ) : null}
            </div>
          ) : null}
          {isSelf ? <Link href="/settings" className="mt-4 block text-center text-sm text-cyan hover:underline">Edit your profile</Link> : null}
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
