import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { inviteTrainer } from "@/lib/actions/requirements";
import { startConversation } from "@/lib/actions/network";
import { AvailabilityStrip } from "@/components/availability";
import { Avatar, Badge, Button, ButtonLink, Card, Chip, Empty, PageHeader, Select } from "@/components/ui";
import { fmtDate, rateRange } from "@/lib/utils";

export const metadata = { title: "Bench" };

export default async function BenchPage() {
  const user = await requireUser("/dashboard/bench");
  if (!user.membership) redirect("/dashboard");
  const companyId = user.membership.company.id;
  const [awarded, saved, openReqs, ratings] = await Promise.all([
    db.application.findMany({ where: { status: "AWARDED", requirement: { companyId } }, include: { requirement: { select: { id: true, title: true, startDate: true, status: true } }, trainer: { include: { user: { select: { id: true, name: true, avatarUrl: true } }, skills: true, availability: { where: { endDate: { gte: new Date() } } } } } }, orderBy: { createdAt: "desc" } }),
    db.savedTrainer.findMany({ where: { companyId }, include: { trainer: { include: { user: { select: { id: true, name: true, avatarUrl: true } }, skills: true, availability: { where: { endDate: { gte: new Date() } } } } } } }),
    db.requirement.findMany({ where: { companyId, status: { in: ["OPEN", "SHORTLISTING"] } }, select: { id: true, title: true } }),
    db.rating.findMany({ where: { fromUser: { memberships: { some: { companyId } } } }, select: { toUserId: true, score: true } }),
  ]);
  type T = (typeof awarded)[number]["trainer"];
  const bench = new Map<string, { t: T; engagements: { id: string; title: string; startDate: Date; status: string }[]; saved: boolean }>();
  for (const a of awarded) {
    const e = bench.get(a.trainer.id) ?? { t: a.trainer, engagements: [], saved: false };
    e.engagements.push(a.requirement); bench.set(a.trainer.id, e);
  }
  for (const s of saved) {
    const e = bench.get(s.trainer.id) ?? { t: s.trainer, engagements: [], saved: true };
    e.saved = true; bench.set(s.trainer.id, e);
  }
  const ratingFor = (userId: string) => { const r = ratings.filter((x) => x.toUserId === userId); return r.length ? (r.reduce((n, x) => n + x.score, 0) / r.length).toFixed(1) : null; };
  const rows = [...bench.values()].sort((a, b) => b.engagements.length - a.engagements.length);

  return (
    <div>
      <PageHeader eyebrow={user.membership.company.name} title="Your bench" body="Every trainer you have awarded or saved, with their live availability. Invite them straight into an open requirement." actions={<ButtonLink href="/trainers" variant="secondary">Find more trainers</ButtonLink>} />
      {rows.length ? (
        <div className="space-y-4">{rows.map(({ t, engagements, saved: isSaved }) => (
          <Card key={t.id} className="p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="flex items-start gap-4">
                <Avatar name={t.user.name} src={t.user.avatarUrl} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2"><Link href={`/trainers/${t.slug}`} className="font-display text-lg font-semibold hover:text-cyan">{t.user.name}</Link>{t.verifiedAt ? <BadgeCheck size={16} className="text-cyan" /> : null}{ratingFor(t.user.id) ? <Badge tone="amber">★ {ratingFor(t.user.id)} by you</Badge> : null}{isSaved && !engagements.length ? <Badge>saved</Badge> : null}</p>
                  <p className="text-sm text-muted">{t.headline}</p>
                  <p className="mono mt-1 text-xs text-cyan">{rateRange(t.dayRateMin, t.dayRateMax, t.currency)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{t.skills.slice(0, 6).map((s) => <Chip key={s.id}>{s.name}</Chip>)}</div>
                  {engagements.length ? <ul className="mt-3 space-y-1 text-sm text-muted">{engagements.slice(0, 3).map((e) => <li key={e.id}><Link href={`/requirements/${e.id}`} className="hover:text-ink">{e.title}</Link> · {fmtDate(e.startDate)} · {e.status.toLowerCase()}</li>)}{engagements.length > 3 ? <li>+{engagements.length - 3} more</li> : null}</ul> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={startConversation}><input type="hidden" name="userId" value={t.user.id} /><Button size="sm" variant="secondary">Message</Button></form>
                    {openReqs.length ? <form action={inviteTrainer} className="flex gap-2"><input type="hidden" name="trainerId" value={t.id} /><Select name="requirementId" className="h-8 w-64 py-1 text-xs">{openReqs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</Select><Button size="sm" variant="violet">Invite</Button></form> : <ButtonLink href="/requirements/new" size="sm" variant="violet">Post a requirement to invite</ButtonLink>}
                  </div>
                </div>
              </div>
              <div><p className="mono mb-1 text-[11px] uppercase tracking-wider text-muted">Availability · next 12 weeks</p><AvailabilityStrip blocks={t.availability} /></div>
            </div>
          </Card>
        ))}</div>
      ) : <Empty title="Your bench is empty" body="Trainers you award or save appear here with their availability." action={<ButtonLink href="/trainers" size="sm">Browse trainers</ButtonLink>} />}
    </div>
  );
}
