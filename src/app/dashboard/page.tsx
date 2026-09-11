import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Avatar, Badge, ButtonLink, Card, Empty, PageHeader, Stat } from "@/components/ui";
import { RequirementCard, reqTone } from "@/components/cards";
import { appStatusLabel, fmtDate, reqStatusLabel, timeAgo } from "@/lib/utils";
import { entitlementsFor } from "@/lib/billing";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const user = await requireUser("/dashboard");
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") redirect("/admin");
  const notifications = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 });
  const pendingConns = await db.connection.count({ where: { addresseeId: user.id, status: "PENDING" } });
  const ent = await entitlementsFor(user);
  const planCard = (
    <Card className="p-5">
      <div className="flex items-center justify-between"><p className="font-semibold">Plan</p><Badge tone={ent.plan ? "lime" : "neutral"}>{ent.planName}</Badge></div>
      <p className="mt-2 text-sm text-muted">{ent.plan ? "Thank you for subscribing. Manage billing in Settings." : user.role === "TRAINER" ? "Free plan: 5 applications a month. Trainer Pro removes the limit and features you in search." : "Free plan: 2 open requirements. Growth removes the limit and lets you message any trainer."}</p>
      <ButtonLink href={ent.plan ? "/settings/billing" : "/pricing"} variant={ent.plan ? "secondary" : user.role === "COMPANY" ? "violet" : "primary"} size="sm" className="mt-3 w-full">{ent.plan ? "Manage plan" : "See plans"}</ButtonLink>
    </Card>
  );

  if (user.trainerProfile) {
    const profile = await db.trainerProfile.findUnique({ where: { id: user.trainerProfile.id }, include: { skills: true, certifications: true, applications: { include: { requirement: { include: { company: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } } } });
    const p = profile!;
    const matches = await db.requirement.findMany({
      where: { status: { in: ["OPEN", "SHORTLISTING"] }, OR: [{ visibility: "PUBLIC", skills: { some: { id: { in: p.skills.map((s) => s.id) } } } }, { invitedTrainers: { some: { id: p.id } } }], applications: { none: { trainerId: p.id } } },
      include: { company: { select: { name: true, slug: true, type: true, logoUrl: true, domainVerifiedAt: true } }, skills: true, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 3,
    });
    const active = p.applications.filter((a) => ["APPLIED", "SHORTLISTED"].includes(a.status));
    const checklist = [
      ["Headline and bio", !!p.bio], ["At least 3 skills", p.skills.length >= 3], ["Day rate", !!p.dayRateMin || !!p.dayRateMax], ["Delivery modes and cities", p.deliveryModes.length > 0 && p.cities.length > 0],
      ["A certification submitted", p.certifications.length > 0], ["Verified badge", !!p.verifiedAt],
    ] as const;
    const done = checklist.filter(([, ok]) => ok).length;

    return (
      <div>
        <PageHeader eyebrow="Trainer dashboard" title={`Hello, ${user.name.split(" ")[0]}`} body={p.verifiedAt ? "Your profile is verified. Companies see you first in search." : "Get verified to appear first in search results."} actions={<ButtonLink href="/requirements" variant="secondary">Browse requirements <ArrowRight size={15} /></ButtonLink>} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Active applications" value={active.length} />
          <Stat label="Shortlisted" value={p.applications.filter((a) => a.status === "SHORTLISTED").length} tone="amber" />
          <Stat label="Awarded" value={p.applications.filter((a) => a.status === "AWARDED").length} tone="lime" />
          <Stat label="Connection requests" value={pendingConns} tone="violet" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Matches your skills</h2><Link href="/requirements" className="text-sm text-muted hover:text-ink">All →</Link></div>
              {matches.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{matches.map((r) => <RequirementCard key={r.id} r={r} />)}</div> : <Empty title="No new matches" body="Add more skills to your profile to widen the net." action={<ButtonLink href="/settings" variant="secondary" size="sm">Edit skills</ButtonLink>} />}
            </section>
            <section>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Recent applications</h2><Link href="/dashboard/applications" className="text-sm text-muted hover:text-ink">All →</Link></div>
              {p.applications.length ? (
                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                  {p.applications.slice(0, 5).map((a) => (
                    <Link key={a.id} href={`/requirements/${a.requirementId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2">
                      <div className="min-w-0 flex-1"><p className="truncate font-medium">{a.requirement.title}</p><p className="text-xs text-muted">{a.requirement.company.name} · applied {timeAgo(a.createdAt)}</p></div>
                      <Badge tone={a.status === "AWARDED" ? "lime" : a.status === "SHORTLISTED" ? "amber" : a.status === "DECLINED" ? "rose" : a.status === "WITHDRAWN" ? "neutral" : "cyan"}>{appStatusLabel[a.status]}</Badge>
                    </Link>
                  ))}
                </div>
              ) : <Empty title="No applications yet" body="Find a requirement that matches and apply with your rate." />}
            </section>
          </div>
          <aside className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between"><p className="font-semibold">Profile strength</p><span className="mono text-xs text-cyan">{done}/{checklist.length}</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-cyan" style={{ width: `${(done / checklist.length) * 100}%` }} /></div>
              <ul className="mt-3 space-y-1.5 text-sm">{checklist.map(([l, ok]) => <li key={l} className={ok ? "text-muted line-through" : "text-ink"}><span className={`mr-2 ${ok ? "text-lime" : "text-dim"}`}>{ok ? "✓" : "○"}</span>{l}</li>)}</ul>
              <ButtonLink href="/settings" variant="secondary" size="sm" className="mt-3 w-full">Edit profile</ButtonLink>
            </Card>
            {planCard}
            <NotifCard notifications={notifications} />
          </aside>
        </div>
      </div>
    );
  }

  if (user.membership) {
    const company = await db.company.findUnique({
      where: { id: user.membership.company.id },
      include: {
        requirements: { include: { _count: { select: { applications: { where: { status: { in: ["APPLIED", "SHORTLISTED", "AWARDED"] } } }, comments: true } } }, orderBy: { createdAt: "desc" } },
        saved: { include: { trainer: { include: { user: { select: { name: true, avatarUrl: true } } } } }, orderBy: { createdAt: "desc" }, take: 6 },
      },
    });
    const c = company!;
    const open = c.requirements.filter((r) => ["OPEN", "SHORTLISTING"].includes(r.status));
    const totalApps = c.requirements.reduce((n, r) => n + r._count.applications, 0);
    return (
      <div>
        <PageHeader eyebrow={`${c.name} · ${user.membership.role.toLowerCase()}`} title={`Hello, ${user.name.split(" ")[0]}`} body={c.domainVerifiedAt ? "Your company is verified." : "Ask an administrator to verify your email domain to earn the verified badge."} actions={<ButtonLink href="/requirements/new" variant="violet"><Plus size={15} /> Post a requirement</ButtonLink>} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Open requirements" value={open.length} tone="violet" />
          <Stat label="Applications" value={totalApps} />
          <Stat label="Awarded" value={c.requirements.filter((r) => r.status === "AWARDED" || r.status === "COMPLETED").length} tone="lime" />
          <Stat label="Saved trainers" value={c.saved.length} tone="amber" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section>
            <h2 className="mb-3 text-lg font-bold">Your requirements</h2>
            {c.requirements.length ? (
              <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                {c.requirements.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <Link href={`/requirements/${r.id}`} className="block truncate font-medium hover:text-violet">{r.title}</Link>
                      <p className="text-xs text-muted">{fmtDate(r.startDate)} · {r.days}d · {r.participants} pax · {r._count.comments} comments</p>
                    </div>
                    <Badge tone={reqTone[r.status]}>{reqStatusLabel[r.status]}</Badge>
                    <ButtonLink href={`/dashboard/requirements/${r.id}/applicants`} variant="secondary" size="sm">{r._count.applications} applicant{r._count.applications === 1 ? "" : "s"}</ButtonLink>
                  </div>
                ))}
              </div>
            ) : <Empty title="No requirements yet" body="Post your first one. Matching trainers are notified instantly." action={<ButtonLink href="/requirements/new" variant="violet" size="sm">Post a requirement</ButtonLink>} />}
          </section>
          <aside className="space-y-4">
            <Card className="p-5">
              <p className="font-semibold">Saved trainers</p>
              {c.saved.length ? <ul className="mt-3 space-y-2">{c.saved.map((s) => <li key={s.trainerId}><Link href={`/trainers/${s.trainer.slug}`} className="flex items-center gap-2 text-sm hover:text-cyan"><Avatar name={s.trainer.user.name} src={s.trainer.user.avatarUrl} size={28} /><span className="truncate">{s.trainer.user.name}</span></Link></li>)}</ul> : <p className="mt-1 text-sm text-muted">Save trainers from their profile to build a bench.</p>}
              <ButtonLink href="/trainers" variant="secondary" size="sm" className="mt-3 w-full">Find trainers</ButtonLink>
            </Card>
            {planCard}
            <NotifCard notifications={notifications} />
          </aside>
        </div>
      </div>
    );
  }
  redirect("/settings");
}

function NotifCard({ notifications }: { notifications: { id: string; title: string; body: string; href: string | null; readAt: Date | null; createdAt: Date }[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between"><p className="flex items-center gap-1.5 font-semibold"><Bell size={15} className="text-cyan" /> Activity</p><Link href="/dashboard/notifications" className="text-xs text-muted hover:text-ink">All</Link></div>
      <ul className="mt-3 space-y-3">
        {notifications.map((n) => (
          <li key={n.id} className="text-sm">
            <Link href={n.href ?? "/dashboard"} className="block hover:text-cyan"><span className={`font-medium ${n.readAt ? "text-muted" : ""}`}>{n.readAt ? "" : <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cyan align-middle" />}{n.title}</span><span className="block text-xs text-dim">{n.body} · {timeAgo(n.createdAt)}</span></Link>
          </li>
        ))}
        {!notifications.length ? <li className="text-sm text-muted">Nothing yet.</li> : null}
      </ul>
    </Card>
  );
}
