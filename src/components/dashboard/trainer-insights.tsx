import Link from "next/link";
import { ArrowRight, Sparkles, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { money } from "@/lib/utils";

const DAY = 86400000;

/**
 * Trainer dashboard extras: engagement pipeline, earnings, a rate benchmark and one "next best action".
 * Server component; all queries are scoped to the trainer.
 */
export async function TrainerInsights({ trainerId, onboardingDone }: { trainerId: string; onboardingDone: boolean }) {
  const now = new Date();
  const [apps, interviews, workOrders, invoices, escrows, profile, invited, expiring] = await Promise.all([
    db.application.groupBy({ by: ["status"], where: { trainerId }, _count: { _all: true } }),
    db.interview.count({ where: { status: { in: ["PROPOSED", "CONFIRMED"] }, application: { trainerId } } }),
    db.workOrder.findMany({ where: { trainerId }, select: { id: true, status: true, startDate: true, endDate: true, total: true, currency: true, requirementId: true, title: true, invoices: { select: { status: true } } } }),
    db.invoice.findMany({ where: { trainerId }, select: { status: true, total: true, currency: true, dueDate: true } }),
    db.escrowDeposit.findMany({ where: { trainerId, status: { in: ["FUNDED", "RELEASED"] } }, select: { amount: true, fee: true, currency: true, status: true } }),
    db.trainerProfile.findUnique({ where: { id: trainerId }, select: { dayRateMin: true, dayRateMax: true, currency: true, skills: { select: { slug: true } } } }),
    db.requirement.count({ where: { status: { in: ["OPEN", "SHORTLISTING"] }, invitedTrainers: { some: { id: trainerId } }, applications: { none: { trainerId } } } }),
    db.certification.count({ where: { trainerId, status: "VERIFIED", expiresOn: { gte: now, lte: new Date(now.getTime() + 60 * DAY) } } }),
  ]);
  const count = (s: string) => apps.find((a) => a.status === s)?._count._all ?? 0;
  const accepted = workOrders.filter((w) => w.status === "ACCEPTED");
  const delivering = accepted.filter((w) => w.startDate <= now && w.endDate >= new Date(now.getTime() - 3 * DAY) && !w.invoices.some((i) => i.status !== "CANCELLED"));
  const toInvoice = accepted.filter((w) => w.endDate < now && !w.invoices.some((i) => i.status === "SENT" || i.status === "PAID"));
  const sentWO = workOrders.filter((w) => w.status === "SENT");
  const inr = (rows: { total: number; currency: string }[]) => rows.filter((r) => r.currency === "INR").reduce((n, r) => n + r.total, 0);
  const paid = inr(invoices.filter((i) => i.status === "PAID"));
  const outstanding = inr(invoices.filter((i) => i.status === "SENT"));
  const overdue = invoices.filter((i) => i.status === "SENT" && i.dueDate < now).length;
  const inEscrow = escrows.filter((e) => e.status === "FUNDED" && e.currency === "INR").reduce((n, e) => n + e.amount - e.fee, 0);
  const pipeline: { label: string; n: number; href: string; tone: string }[] = [
    { label: "Applied", n: count("APPLIED"), href: "/dashboard/applications", tone: "bg-cyan/10 text-cyan" },
    { label: "Shortlisted", n: count("SHORTLISTED"), href: "/dashboard/applications", tone: "bg-amber/10 text-amber" },
    { label: "Interviews", n: interviews, href: "/dashboard/applications", tone: "bg-violet/10 text-violet" },
    { label: "Awarded", n: count("AWARDED"), href: "/dashboard/applications", tone: "bg-lime/10 text-lime" },
    { label: "Delivering", n: delivering.length, href: "/dashboard/invoices", tone: "bg-navy/10 text-navy" },
    { label: "To invoice", n: toInvoice.length, href: "/dashboard/invoices", tone: "bg-rose/10 text-rose" },
    { label: "Paid", n: invoices.filter((i) => i.status === "PAID").length, href: "/dashboard/invoices", tone: "bg-surface-2 text-muted" },
  ];

  // Rate benchmark against trainers sharing at least one skill.
  const peers = profile?.skills.length ? await db.trainerProfile.findMany({ where: { id: { not: trainerId }, skills: { some: { slug: { in: profile.skills.map((s) => s.slug) } } }, dayRateMin: { not: null } }, select: { dayRateMin: true, dayRateMax: true } }) : [];
  const mins = peers.map((p) => p.dayRateMin!).sort((a, b) => a - b), maxs = peers.map((p) => p.dayRateMax ?? p.dayRateMin!).sort((a, b) => a - b);
  const med = (a: number[]) => (a.length ? a[Math.floor(a.length / 2)] : null);
  const bench = mins.length ? { n: mins.length, lo: med(mins)!, hi: med(maxs)! } : null;
  const position = bench && profile?.dayRateMin ? (profile.dayRateMin < bench.lo * 0.85 ? "below" : profile.dayRateMin > bench.hi * 1.15 ? "above" : "within") : null;

  // Next best action, in priority order.
  const next = !onboardingDone ? { t: "Finish setting up your profile", b: "Complete profiles get shortlisted more often.", href: "/onboarding/trainer", cta: "Resume setup" }
    : sentWO.length ? { t: `Review ${sentWO.length === 1 ? "a work order" : `${sentWO.length} work orders`} waiting for you`, b: `${sentWO[0].title} is ready to accept or send back with changes.`, href: `/requirements/${sentWO[0].requirementId}/work-order`, cta: "Open work order" }
    : toInvoice.length ? { t: "Raise an invoice for a finished batch", b: `${toInvoice[0].title} ended ${Math.round((now.getTime() - toInvoice[0].endDate.getTime()) / DAY)} day(s) ago and has no invoice yet.`, href: `/dashboard/invoices?raise=${toInvoice[0].id}`, cta: "Raise invoice" }
    : invited ? { t: `You were invited to ${invited === 1 ? "a requirement" : `${invited} requirements`}`, b: "Companies invited you directly. Reply before the slot fills.", href: "/requirements?invited=1", cta: "See invitations" }
    : overdue ? { t: `${overdue} invoice${overdue === 1 ? " is" : "s are"} overdue`, b: "Nudge the company from the invoice page or message them.", href: "/dashboard/invoices", cta: "Open invoices" }
    : expiring ? { t: `${expiring} certification${expiring === 1 ? "" : "s"} expire within 60 days`, b: "Renew and upload the new certificate to keep the verified badge.", href: "/settings", cta: "Update certifications" }
    : position === "below" ? { t: "Your day rate is below peers", b: `Trainers with your skills list ${money(bench!.lo)} to ${money(bench!.hi)} per day.`, href: "/settings", cta: "Review rate" }
    : { t: "Browse requirements that match your skills", b: "New requirements are posted every day. Apply early to be shortlisted first.", href: "/requirements", cta: "Browse requirements" };

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
      <Card className="p-5">
        <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Your pipeline</p>
        <div className="mt-3 flex flex-wrap gap-2">{pipeline.map((p) => <Link key={p.label} href={p.href} className={`flex min-w-[88px] flex-1 flex-col rounded-xl px-3 py-2 ${p.tone} transition hover:opacity-80`}><span className="font-display text-2xl font-bold tabular-nums">{p.n}</span><span className="text-[11px] font-medium opacity-80">{p.label}</span></Link>)}</div>
      </Card>
      <Card className="p-5">
        <p className="mono flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted"><Wallet size={12} /> Earnings (INR)</p>
        <p className="mt-2 font-display text-2xl font-bold tabular-nums text-lime">{money(paid)}</p>
        <p className="text-xs text-muted">paid to date</p>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Outstanding</dt><dd className={`tabular-nums ${overdue ? "text-rose" : ""}`}>{money(outstanding)}{overdue ? ` · ${overdue} overdue` : ""}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Held in escrow for you</dt><dd className="tabular-nums">{money(inEscrow)}</dd></div>
          {bench ? <div className="flex justify-between"><dt className="text-muted">Peer day rate</dt><dd className="tabular-nums">{money(bench.lo)}–{money(bench.hi)}{position ? <span className={`ml-1 text-xs ${position === "within" ? "text-lime" : "text-amber"}`}>({position})</span> : null}</dd></div> : null}
        </dl>
      </Card>
      <Card className="p-5" glow="cyan">
        <p className="mono flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-cyan"><Sparkles size={12} /> Next best action</p>
        <p className="mt-2 font-display font-semibold leading-snug">{next.t}</p>
        <p className="mt-1 text-sm text-muted">{next.b}</p>
        <Link href={next.href} className="mt-3 inline-flex items-center gap-1 font-display text-sm font-semibold text-cyan hover:underline">{next.cta} <ArrowRight size={14} /></Link>
      </Card>
    </div>
  );
}
