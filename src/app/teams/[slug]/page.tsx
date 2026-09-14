import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar, Badge, Card, Chip, PageHeader } from "@/components/ui";
import { rateRange } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await db.trainerTeam.findUnique({ where: { slug }, select: { name: true, tagline: true } });
  return t ? { title: `${t.name} · Trainer team`, description: t.tagline } : { title: "Team" };
}

/** Public team page: lead + accepted members, combined skills, joint engagements delivered. */
export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const team = await db.trainerTeam.findUnique({ where: { slug }, include: { lead: { include: { user: { select: { name: true, avatarUrl: true } }, skills: true } }, members: { where: { status: "ACCEPTED" }, include: { trainer: { include: { user: { select: { name: true, avatarUrl: true } }, skills: true } } } }, applications: { where: { status: "AWARDED" }, include: { requirement: { select: { id: true, title: true, status: true, company: { select: { name: true, slug: true } } } } }, orderBy: { createdAt: "desc" }, take: 10 } } });
  if (!team) notFound();
  const people = [{ ...team.lead, role: "Lead" }, ...team.members.map((m) => ({ ...m.trainer, role: m.role }))];
  const skills = [...new Map(people.flatMap((p) => p.skills).map((s) => [s.slug, s])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const showRate = !!user && (user.role !== "TRAINER");
  const rates = people.map((p) => p.dayRateMin).filter((n): n is number => !!n);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow={<span className="inline-flex items-center gap-1.5"><Users size={14} /> Trainer team</span>} title={team.name} body={team.tagline || undefined} />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {team.description ? <Card className="p-5"><p className="whitespace-pre-line text-[15px] leading-relaxed">{team.description}</p></Card> : null}
          <Card className="p-5">
            <h2 className="text-lg font-bold">Members</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">{people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <Avatar name={p.user.name} src={p.user.avatarUrl} size={44} />
                <div className="min-w-0">
                  <Link href={`/trainers/${p.slug}`} className="flex items-center gap-1 font-display font-semibold hover:text-cyan">{p.user.name}{p.verifiedAt ? <BadgeCheck size={14} className="text-cyan" /> : null}</Link>
                  <p className="truncate text-xs text-muted">{p.role} · {p.headline}</p>
                  {showRate ? <p className="mono text-xs text-cyan">{rateRange(p.dayRateMin, p.dayRateMax, p.currency)}</p> : null}
                </div>
              </li>
            ))}</ul>
          </Card>
          {team.applications.length ? (
            <Card className="p-5">
              <h2 className="text-lg font-bold">Delivered as a team</h2>
              <ul className="mt-3 space-y-2 text-sm">{team.applications.map((a) => <li key={a.id} className="flex flex-wrap items-center gap-2"><Link href={`/requirements/${a.requirement.id}`} className="font-medium hover:text-cyan">{a.requirement.title}</Link><span className="text-muted">for <Link href={`/companies/${a.requirement.company.slug}`} className="hover:text-cyan">{a.requirement.company.name}</Link></span><Badge tone={a.requirement.status === "COMPLETED" ? "lime" : "amber"}>{a.requirement.status.toLowerCase()}</Badge></li>)}</ul>
            </Card>
          ) : null}
        </div>
        <aside className="space-y-4">
          <Card className="p-5">
            <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Team at a glance</p>
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Trainers</dt><dd className="font-semibold">{people.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Combined skills</dt><dd className="font-semibold">{skills.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Team engagements</dt><dd className="font-semibold">{team.applications.length}</dd></div>
              {showRate && rates.length ? <div className="flex justify-between"><dt className="text-muted">Day rates from</dt><dd className="font-semibold">{rateRange(Math.min(...rates), null, team.lead.currency)}</dd></div> : null}
            </dl>
          </Card>
          <Card className="p-5">
            <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Skills covered</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{skills.map((s) => <Chip key={s.slug}>{s.name}</Chip>)}</div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
