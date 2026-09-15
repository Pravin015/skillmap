import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardCheck, Users } from "lucide-react";
import type { MemberRole } from "@prisma/client";
import { db } from "@/lib/db";
import { Avatar, Badge, Card } from "@/components/ui";
import { TrainerCard, reqTone } from "@/components/cards";
import { companyCan } from "@/lib/permissions";
import { dateRange, fmtDate, money, timeAgo } from "@/lib/utils";

const DAY = 86400000;

/**
 * Company dashboard extras: approvals queue, hiring board, spend and speed metrics, upcoming batches, bench health,
 * team activity and suggested trainers from the hiring profile.
 */
export async function CompanyInsights({ companyId, role }: { companyId: string; role: MemberRole }) {
  const now = new Date();
  const [reqs, changes, poChanges, invoicesDue, escrowRelease, interviewsWaiting, newApps, accepted, saved, members, audit, company] = await Promise.all([
    db.requirement.findMany({ where: { companyId }, select: { id: true, title: true, status: true, createdAt: true, startDate: true, budgetMax: true, _count: { select: { applications: { where: { status: { in: ["APPLIED", "SHORTLISTED", "AWARDED"] } } } } }, applications: { where: { status: "AWARDED" }, select: { statusChangedAt: true } } }, orderBy: { createdAt: "desc" } }),
    db.workOrder.findMany({ where: { companyId, status: "CHANGES_REQUESTED" }, select: { id: true, title: true, requirementId: true, updatedAt: true }, take: 5 }),
    db.purchaseOrder.findMany({ where: { companyId, status: "CHANGES_REQUESTED" }, select: { id: true, title: true, poNumber: true, updatedAt: true }, take: 5 }),
    db.invoice.findMany({ where: { companyId, status: "SENT" }, select: { id: true, invoiceNumber: true, total: true, currency: true, dueDate: true, trainer: { select: { user: { select: { name: true } } } } }, orderBy: { dueDate: "asc" }, take: 5 }),
    db.escrowDeposit.findMany({ where: { companyId, status: "FUNDED", workOrder: { endDate: { lt: now } } }, select: { id: true, amount: true, currency: true, workOrder: { select: { title: true, requirementId: true } } }, take: 5 }),
    db.interview.findMany({ where: { status: "PROPOSED", application: { requirement: { companyId } } }, select: { id: true, application: { select: { requirementId: true, requirement: { select: { title: true } }, trainer: { select: { user: { select: { name: true } } } } } } }, take: 5 }),
    db.application.findMany({ where: { status: "APPLIED", requirement: { companyId }, createdAt: { gte: new Date(now.getTime() - 7 * DAY) } }, select: { id: true, requirementId: true, requirement: { select: { title: true } }, trainer: { select: { user: { select: { name: true } } } }, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.workOrder.findMany({ where: { companyId, status: "ACCEPTED" }, select: { id: true, title: true, requirementId: true, startDate: true, endDate: true, total: true, currency: true, acceptedAt: true, trainer: { select: { slug: true, user: { select: { name: true, avatarUrl: true } } } } }, orderBy: { startDate: "asc" } }),
    db.savedTrainer.findMany({ where: { companyId }, select: { trainer: { select: { id: true, verifiedAt: true, availability: { where: { endDate: { gte: now }, startDate: { lte: new Date(now.getTime() + 30 * DAY) } }, select: { id: true } } } } } }),
    db.companyMember.findMany({ where: { companyId }, select: { userId: true } }),
    db.auditLog.findMany({ where: { actorId: { in: (await db.companyMember.findMany({ where: { companyId }, select: { userId: true } })).map((m) => m.userId) } }, include: { actor: { select: { name: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.company.findUnique({ where: { id: companyId }, select: { hiringCategories: true, hiringCities: true, budgetBand: true } }),
  ]);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const spendQuarter = accepted.filter((w) => w.currency === "INR" && (w.acceptedAt ?? w.startDate) >= quarterStart).reduce((n, w) => n + w.total, 0);
  const awardedReqs = reqs.filter((r) => r.applications[0]);
  const ttf = awardedReqs.length ? Math.round(awardedReqs.reduce((n, r) => n + (r.applications[0].statusChangedAt.getTime() - r.createdAt.getTime()) / DAY, 0) / awardedReqs.length) : null;
  const closed = reqs.filter((r) => ["AWARDED", "COMPLETED", "CANCELLED"].includes(r.status));
  const fillRate = closed.length ? Math.round((closed.filter((r) => r.status !== "CANCELLED").length / closed.length) * 100) : null;
  const upcoming = accepted.filter((w) => w.endDate >= now).slice(0, 4);
  const benchVerified = saved.filter((s) => s.trainer.verifiedAt).length;
  const benchFree = saved.filter((s) => !s.trainer.availability.length).length;
  const canHire = companyCan(role, "hire"), canPay = companyCan(role, "pay_invoice") || companyCan(role, "fund_escrow");
  const approvals = [
    ...(canHire ? newApps.map((a) => ({ key: a.id, t: `${a.trainer.user.name} applied`, b: a.requirement.title, href: `/dashboard/requirements/${a.requirementId}/applicants`, when: a.createdAt, tone: "cyan" as const })) : []),
    ...(canHire ? interviewsWaiting.map((i) => ({ key: i.id, t: `Interview slots proposed`, b: `${i.application.trainer.user.name} · ${i.application.requirement.title}`, href: `/dashboard/requirements/${i.application.requirementId}/applicants`, when: null, tone: "violet" as const })) : []),
    ...(companyCan(role, "sign_work_order") ? changes.map((w) => ({ key: w.id, t: "Work order needs changes", b: w.title, href: `/requirements/${w.requirementId}/work-order`, when: w.updatedAt, tone: "amber" as const })) : []),
    ...(companyCan(role, "sign_work_order") ? poChanges.map((p) => ({ key: p.id, t: `Purchase order ${p.poNumber} needs changes`, b: p.title, href: `/purchase-orders/${p.id}`, when: p.updatedAt, tone: "amber" as const })) : []),
    ...(canPay ? invoicesDue.map((i) => ({ key: i.id, t: `Invoice ${i.invoiceNumber} · ${money(i.total, i.currency)}`, b: `${i.trainer.user.name} · due ${fmtDate(i.dueDate)}${i.dueDate < now ? " · overdue" : ""}`, href: `/invoices/${i.id}`, when: null, tone: i.dueDate < now ? "rose" as const : "neutral" as const })) : []),
    ...(canPay ? escrowRelease.map((e) => ({ key: e.id, t: `Release escrow · ${money(e.amount, e.currency)}`, b: `${e.workOrder.title} finished`, href: `/requirements/${e.workOrder.requirementId}/work-order`, when: null, tone: "lime" as const })) : []),
  ];
  const board: { status: "OPEN" | "SHORTLISTING" | "AWARDED" | "COMPLETED"; label: string }[] = [{ status: "OPEN", label: "Open" }, { status: "SHORTLISTING", label: "Shortlisting" }, { status: "AWARDED", label: "Awarded" }, { status: "COMPLETED", label: "Completed" }];
  const suggested = company?.hiringCategories.length ? await db.trainerProfile.findMany({ where: { user: { status: "ACTIVE" }, skills: { some: { category: { slug: { in: company.hiringCategories } } } }, savedBy: { none: { companyId } }, ...(company.hiringCities.length ? { OR: [{ cities: { hasSome: company.hiringCities } }, { deliveryModes: { has: "VIRTUAL" } }] } : {}) }, include: { user: { select: { name: true, avatarUrl: true } }, skills: true }, orderBy: [{ verifiedAt: { sort: "desc", nulls: "last" } }, { yearsExperience: "desc" }], take: 4 }) : [];

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-5" glow="violet">
          <p className="mono flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-violet"><ClipboardCheck size={12} /> Waiting on you</p>
          {approvals.length ? <ul className="mt-3 divide-y divide-line/70">{approvals.slice(0, 7).map((a) => <li key={a.key}><Link href={a.href} className="flex items-center gap-3 py-2 hover:text-violet"><Badge tone={a.tone}>{a.tone === "rose" ? "overdue" : "action"}</Badge><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{a.t}</span><span className="block truncate text-xs text-muted">{a.b}</span></span>{a.when ? <span className="text-xs text-dim">{timeAgo(a.when)}</span> : null}<ArrowRight size={14} className="text-dim" /></Link></li>)}</ul> : <p className="mt-2 text-sm text-muted">Nothing waiting. New applications, interview proposals, change requests, invoices and escrow releases show up here.</p>}
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4"><p className="mono text-[11px] uppercase tracking-wider text-muted">Spend this quarter</p><p className="mt-1 font-display text-2xl font-bold tabular-nums text-violet">{money(spendQuarter)}</p><p className="text-xs text-muted">accepted work orders{company?.budgetBand ? ` · budget band ${company.budgetBand}/day` : ""}</p></Card>
          <Card className="p-4"><p className="mono text-[11px] uppercase tracking-wider text-muted">Time to fill</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{ttf === null ? "—" : `${ttf}d`}</p><p className="text-xs text-muted">post → award, average</p></Card>
          <Card className="p-4"><p className="mono text-[11px] uppercase tracking-wider text-muted">Fill rate</p><p className="mt-1 font-display text-2xl font-bold tabular-nums text-lime">{fillRate === null ? "—" : `${fillRate}%`}</p><p className="text-xs text-muted">of closed requirements awarded</p></Card>
          <Card className="p-4"><p className="mono flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted"><Users size={11} /> Bench health</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{saved.length}</p><p className="text-xs text-muted">{benchVerified} verified · {benchFree} free next 30 days</p></Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between"><p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Hiring board</p><Link href="/requirements/new" className="text-xs font-semibold text-violet hover:underline">Post a requirement</Link></div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">{board.map((col) => {
          const rows = reqs.filter((r) => r.status === col.status);
          return (
            <div key={col.status} className="rounded-xl bg-surface-2/70 p-2">
              <p className="flex items-center justify-between px-1 pb-1 text-xs font-semibold"><span>{col.label}</span><span className="text-muted">{rows.length}</span></p>
              <div className="space-y-2">{rows.slice(0, 4).map((r) => <Link key={r.id} href={col.status === "OPEN" || col.status === "SHORTLISTING" ? `/dashboard/requirements/${r.id}/applicants` : `/requirements/${r.id}`} className="block rounded-lg border border-line bg-white p-2.5 text-xs transition hover:border-violet"><span className="line-clamp-2 font-medium">{r.title}</span><span className="mt-1 flex items-center justify-between text-muted"><span>{fmtDate(r.startDate)}</span><Badge tone={reqTone[r.status]}>{r._count.applications} app{r._count.applications === 1 ? "" : "s"}</Badge></span></Link>)}{rows.length > 4 ? <p className="px-1 text-[11px] text-muted">+{rows.length - 4} more</p> : null}{!rows.length ? <p className="px-1 py-3 text-center text-[11px] text-dim">—</p> : null}</div>
            </div>
          );
        })}</div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="mono flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted"><CalendarDays size={12} /> Upcoming batches</p>
          {upcoming.length ? <ul className="mt-3 space-y-2">{upcoming.map((w) => <li key={w.id} className="flex items-center gap-3 text-sm"><Avatar name={w.trainer.user.name} src={w.trainer.user.avatarUrl} size={30} /><span className="min-w-0 flex-1"><Link href={`/requirements/${w.requirementId}/work-order`} className="block truncate font-medium hover:text-violet">{w.title}</Link><span className="block text-xs text-muted">{dateRange(w.startDate, w.endDate)} · {w.trainer.user.name} · {money(w.total, w.currency)}</span></span>{w.startDate <= now ? <Badge tone="lime">in progress</Badge> : <Badge tone="neutral">{Math.ceil((w.startDate.getTime() - now.getTime()) / DAY)}d</Badge>}</li>)}</ul> : <p className="mt-2 text-sm text-muted">No accepted work orders with future dates.</p>}
        </Card>
        <Card className="p-5">
          <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Team activity</p>
          {audit.length ? <ul className="mt-3 space-y-2">{audit.map((a) => <li key={a.id} className="flex items-center gap-2 text-sm"><Avatar name={a.actor.name} src={a.actor.avatarUrl} size={24} tone="violet" /><span className="min-w-0 flex-1 truncate"><span className="font-medium">{a.actor.name}</span> <span className="text-muted">{a.action.replace(/[._]/g, " ")}</span></span><span className="text-xs text-dim">{timeAgo(a.createdAt)}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted">Team actions (awards, work orders, escrow, invoices, API keys) appear here.</p>}
          <p className="mt-3 text-xs text-muted">{members.length} member{members.length === 1 ? "" : "s"} · <Link href="/settings" className="text-violet hover:underline">manage team</Link></p>
        </Card>
      </div>

      {suggested.length ? (
        <section>
          <div className="flex items-end justify-between"><h2 className="text-lg font-bold">Trainers that fit your hiring profile</h2><Link href="/trainers" className="text-sm text-muted hover:text-ink">Directory →</Link></div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{suggested.map((t) => <TrainerCard key={t.id} t={t} showRate />)}</div>
        </section>
      ) : null}
    </div>
  );
}
