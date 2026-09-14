import Link from "next/link";
import { AlertTriangle, Download } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaffAny } from "@/lib/auth";
import { Avatar, Badge, Card, PageHeader, Stat } from "@/components/ui";
import { staffCan } from "@/lib/permissions";
import { featureMap, FEATURES } from "@/lib/features";
import { fmtDate, money, timeAgo } from "@/lib/utils";

export const metadata = { title: "Overview · Admin" };
const DAY = 86400000;

/** Staff landing page: growth, marketplace health, revenue, verification SLA, quality flags, feature flags and staff activity. */
export default async function AdminOverview() {
  const user = await requireStaffAny(["verify", "moderate", "users", "finance", "support", "platform"], "/admin/overview");
  const now = new Date(), d7 = new Date(now.getTime() - 7 * DAY), d30 = new Date(now.getTime() - 30 * DAY);
  const [trainers7, trainers30, companies7, companies30, trainersAll, companiesAll, openReqs, apps30, awarded30, closed30, cancelled30, wo30, subs, escrowFees, pendingCerts, oldestCert, pendingDomains, pendingIds, lowRated, overdueInv, staleChanges, openReports, audit, flags] = await Promise.all([
    db.trainerProfile.count({ where: { createdAt: { gte: d7 } } }), db.trainerProfile.count({ where: { createdAt: { gte: d30 } } }),
    db.company.count({ where: { createdAt: { gte: d7 } } }), db.company.count({ where: { createdAt: { gte: d30 } } }),
    db.trainerProfile.count(), db.company.count(),
    db.requirement.count({ where: { status: { in: ["OPEN", "SHORTLISTING"] } } }),
    db.application.count({ where: { createdAt: { gte: d30 } } }),
    db.application.count({ where: { status: "AWARDED", statusChangedAt: { gte: d30 } } }),
    db.requirement.count({ where: { status: { in: ["AWARDED", "COMPLETED", "CANCELLED"] }, updatedAt: { gte: d30 } } }),
    db.requirement.count({ where: { status: "CANCELLED", updatedAt: { gte: d30 } } }),
    db.workOrder.findMany({ where: { status: "ACCEPTED", acceptedAt: { gte: d30 } }, select: { total: true, currency: true } }),
    db.subscription.findMany({ where: { status: { in: ["ACTIVE", "AUTHENTICATED", "PENDING"] } }, select: { amount: true, interval: true, currency: true, plan: true } }),
    db.escrowDeposit.findMany({ where: { status: { in: ["RELEASED", "PAID_OUT"] } }, select: { fee: true, currency: true, releasedAt: true } }),
    db.certification.count({ where: { status: "PENDING" } }),
    db.certification.findFirst({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    db.company.count({ where: { domain: { not: null }, domainVerifiedAt: null } }),
    db.user.count({ where: { identityDocUrl: { not: null }, identityVerifiedAt: null } }),
    db.rating.groupBy({ by: ["toUserId"], _avg: { score: true }, _count: { _all: true }, having: { score: { _avg: { lt: 3 } } } }),
    db.invoice.count({ where: { status: "SENT", dueDate: { lt: now } } }),
    db.workOrder.count({ where: { status: "CHANGES_REQUESTED", updatedAt: { lt: new Date(now.getTime() - 7 * DAY) } } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.auditLog.findMany({ where: { actor: { role: { in: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "FINANCE", "SUPPORT"] } } }, include: { actor: { select: { name: true, avatarUrl: true, role: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
    featureMap(),
  ]);
  const gmv = wo30.filter((w) => w.currency === "INR").reduce((n, w) => n + w.total, 0);
  const mrr = subs.filter((s) => s.currency === "INR").reduce((n, s) => n + (s.interval === "YEARLY" ? Math.round(s.amount / 12) : s.amount), 0) / 100;
  const fees30 = escrowFees.filter((e) => e.currency === "INR" && e.releasedAt && e.releasedAt >= d30).reduce((n, e) => n + e.fee, 0);
  const fillRate = closed30 ? Math.round(((closed30 - cancelled30) / closed30) * 100) : null;
  const oldestAge = oldestCert ? Math.round((now.getTime() - oldestCert.createdAt.getTime()) / DAY) : 0;
  const flagsList: { t: string; n: number; href: string; tone: "rose" | "amber" }[] = [
    { t: "Overdue invoices", n: overdueInv, href: "/admin/escrow", tone: "rose" as const },
    { t: "Work orders stuck in changes for 7+ days", n: staleChanges, href: "/admin/requirements", tone: "amber" as const },
    { t: "Trainers rated under 3.0", n: lowRated.length, href: "/admin/users?role=TRAINER", tone: "amber" as const },
    { t: "Open content reports", n: openReports, href: "/admin/reports", tone: "rose" as const },
    { t: "Requirements cancelled in 30 days", n: cancelled30, href: "/admin/requirements", tone: "amber" as const },
  ].filter((f) => f.n > 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Platform overview" body="How the marketplace is doing this week, what needs attention, and what is switched on." actions={staffCan(user.role, "platform") ? <div className="flex flex-wrap gap-2">{["users", "companies", "requirements", "invoices", "subscriptions"].map((k) => <Link key={k} href={`/api/admin/export/${k}`} className="inline-flex h-8 items-center gap-1 rounded-full border border-line-2 bg-white px-3 text-xs font-semibold hover:bg-surface-2"><Download size={12} /> {k}.csv</Link>)}</div> : null} />

      <section>
        <h2 className="mb-3 text-lg font-bold">Growth</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Trainer sign-ups · 7d / 30d" value={`${trainers7} / ${trainers30}`} />
          <Stat label="Company sign-ups · 7d / 30d" value={`${companies7} / ${companies30}`} tone="violet" />
          <Stat label="Trainers total" value={trainersAll} />
          <Stat label="Companies total" value={companiesAll} tone="violet" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Marketplace · last 30 days</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Open requirements now" value={openReqs} tone="violet" />
          <Stat label="Applications" value={apps30} />
          <Stat label="Awards" value={awarded30} tone="lime" />
          <Stat label="Fill rate (closed)" value={fillRate === null ? "—" : `${fillRate}%`} tone="lime" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Revenue</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="GMV · accepted work orders 30d" value={money(gmv)} tone="violet" />
          <Stat label="Subscription MRR" value={money(Math.round(mrr))} tone="lime" />
          <Stat label="Active subscriptions" value={subs.length} />
          <Stat label="Escrow fees · 30d" value={money(fees30)} tone="amber" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold">Verification SLA</h2>
          <p className="text-sm text-muted">Target: every item reviewed within 2 working days.</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between"><Link href="/admin" className="hover:text-cyan">Certifications pending</Link><span className="flex items-center gap-2 tabular-nums">{pendingCerts}{oldestAge > 2 ? <Badge tone="rose">oldest {oldestAge}d</Badge> : pendingCerts ? <Badge tone="lime">oldest {oldestAge}d</Badge> : null}</span></li>
            <li className="flex items-center justify-between"><Link href="/admin" className="hover:text-cyan">Company domains pending</Link><span className="tabular-nums">{pendingDomains}</span></li>
            <li className="flex items-center justify-between"><Link href="/admin" className="hover:text-cyan">Identity documents pending</Link><span className="tabular-nums">{pendingIds}</span></li>
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><AlertTriangle size={17} className="text-amber" /> Quality flags</h2>
          {flagsList.length ? <ul className="mt-3 space-y-2 text-sm">{flagsList.map((f) => <li key={f.t} className="flex items-center justify-between"><Link href={f.href} className="hover:text-cyan">{f.t}</Link><Badge tone={f.tone}>{f.n}</Badge></li>)}</ul> : <p className="mt-2 text-sm text-muted">No flags. Overdue invoices, stuck work orders, low ratings, open reports and cancellations show here.</p>}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold">Feature flags</h2>
          <p className="text-sm text-muted">{staffCan(user.role, "platform") ? "Toggle on the Platform page." : "Read-only for your role."}</p>
          <ul className="mt-3 space-y-1.5 text-sm">{FEATURES.map((f) => <li key={f.key} className="flex items-center justify-between"><span>{f.label}</span>{flags[f.key] ? <Badge tone="lime">on</Badge> : <Badge tone="neutral">off</Badge>}</li>)}</ul>
          {staffCan(user.role, "platform") ? <Link href="/admin/platform#features" className="mt-3 inline-block text-sm font-semibold text-amber hover:underline">Manage on Platform →</Link> : null}
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold">Staff activity</h2>
          {audit.length ? <ul className="mt-3 space-y-2 text-sm">{audit.map((a) => <li key={a.id} className="flex items-center gap-2"><Avatar name={a.actor.name} src={a.actor.avatarUrl} size={24} tone="amber" /><span className="min-w-0 flex-1 truncate"><span className="font-medium">{a.actor.name}</span> <span className="text-muted">{a.action.replace(/[._]/g, " ")}</span> <span className="mono text-xs text-dim">{a.target.slice(0, 10)}</span></span><span className="text-xs text-dim" title={fmtDate(a.createdAt)}>{timeAgo(a.createdAt)}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted">No staff actions yet.</p>}
        </Card>
      </div>
    </div>
  );
}
