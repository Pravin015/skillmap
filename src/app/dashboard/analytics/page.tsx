import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { learnerScore, trainerStats } from "@/lib/stats";
import { Card, PageHeader, Stat } from "@/components/ui";
import { cn, fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Analytics" };

const RANGES = { "30": 30, "90": 90, "365": 365 } as const;
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (k: string) => new Date(`${k}-01`).toLocaleString("en-IN", { month: "short", year: "2-digit" });
function lastMonths(n: number) { const out: string[] = []; const d = new Date(); d.setDate(1); for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(monthKey(x)); } return out; }
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range = "90" } = await searchParams;
  const days = RANGES[range as keyof typeof RANGES] ?? 90;
  const since = daysAgo(days);
  const user = await requireUser("/dashboard/analytics");
  const tabs = (
    <div className="flex rounded-lg border border-line bg-white p-0.5 text-sm">{Object.keys(RANGES).map((r) => <Link key={r} href={`/dashboard/analytics?range=${r}`} className={cn("rounded-md px-3 py-1.5 font-medium", range === r ? "bg-navy text-white" : "text-muted hover:text-ink")}>{r} days</Link>)}</div>
  );

  if (user.trainerProfile) {
    const tid = user.trainerProfile.id;
    const [stats, learners, apps, wos, ratings] = await Promise.all([
      trainerStats(tid, days),
      learnerScore(tid),
      db.application.findMany({ where: { trainerId: tid, createdAt: { gte: since } }, select: { status: true, createdAt: true, requirement: { select: { title: true, company: { select: { name: true } } } } } }),
      db.workOrder.findMany({ where: { trainerId: tid, status: "ACCEPTED" }, select: { total: true, currency: true, acceptedAt: true, startDate: true, title: true, invoices: { select: { status: true, total: true } } } }),
      db.rating.findMany({ where: { toUserId: user.id }, select: { score: true, createdAt: true, fromUser: { select: { name: true, memberships: { select: { company: { select: { name: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);
    const shortlisted = apps.filter((a) => ["SHORTLISTED", "AWARDED"].includes(a.status)).length;
    const awarded = apps.filter((a) => a.status === "AWARDED").length;
    const months = lastMonths(6);
    const earnings = months.map((m) => wos.filter((w) => monthKey(w.startDate) === m).reduce((n, w) => n + w.total, 0));
    const maxE = Math.max(1, ...earnings);
    const invoiced = wos.flatMap((w) => w.invoices).filter((i) => i.status === "PAID").reduce((n, i) => n + i.total, 0);
    const maxBar = Math.max(1, ...stats.series.map((d) => d.views + d.searches));
    return (
      <div>
        <PageHeader eyebrow="Trainer" title="Analytics" body="How companies find you, how your applications convert, and what you have earned through CorpGurus." actions={tabs} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <Stat label="Profile views" value={stats.views} /><Stat label="Search appearances" value={stats.searches} />
          <Stat label="Applications" value={apps.length} tone="violet" /><Stat label="Shortlist rate" value={pct(shortlisted, apps.length)} tone="amber" /><Stat label="Award rate" value={pct(awarded, apps.length)} tone="lime" />
          <Stat label="Learner score" value={learners.count ? learners.avg!.toFixed(1) : "—"} tone="lime" />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-5"><p className="font-semibold">Views and search appearances</p><p className="text-xs text-muted">Daily, last {days} days. Dark = profile views, light = appeared in search results.</p>
            <div className="mt-4 flex h-28 items-end gap-px">{stats.series.map((d) => <span key={d.date} title={`${d.date}: ${d.views} views, ${d.searches} in search`} className="flex flex-1 flex-col justify-end gap-px"><span className="bg-cyan" style={{ height: `${(d.views / maxBar) * 100}%` }} /><span className="bg-cyan/30" style={{ height: `${(d.searches / maxBar) * 100}%` }} /></span>)}</div>
            <p className="mt-1 flex justify-between text-[10px] text-dim"><span>{fmtDate(stats.series[0].date)}</span><span>today</span></p></Card>
          <Card className="p-5"><p className="font-semibold">Earnings from accepted work orders</p><p className="text-xs text-muted">By engagement start month, last 6 months · {money(invoiced)} confirmed paid on invoices.</p>
            <div className="mt-4 flex h-28 items-end gap-2">{months.map((m, i) => <div key={m} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] tabular-nums text-muted">{earnings[i] ? money(earnings[i]).replace("₹", "₹") : ""}</span><span className="w-full rounded-t bg-lime" style={{ height: `${(earnings[i] / maxE) * 80}%`, minHeight: earnings[i] ? 4 : 1 }} /><span className="text-[10px] text-dim">{monthLabel(m)}</span></div>)}</div></Card>
          <Card className="p-5"><p className="font-semibold">Application funnel</p>
            <ul className="mt-3 space-y-2 text-sm">{[["Applied", apps.length], ["Shortlisted", shortlisted], ["Awarded", awarded]].map(([l, v]) => <li key={String(l)} className="flex items-center gap-3"><span className="w-24 text-muted">{l}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"><span className="block h-full bg-violet" style={{ width: pct(Number(v), apps.length) === "—" ? 0 : pct(Number(v), apps.length) }} /></span><span className="w-8 text-right font-semibold tabular-nums">{v}</span></li>)}</ul>
            {apps.length ? <ul className="mt-4 divide-y divide-line text-xs text-muted">{apps.slice(0, 6).map((a, i) => <li key={i} className="flex justify-between py-1.5"><span className="truncate pr-2">{a.requirement.title}</span><span className="shrink-0">{a.status.toLowerCase()}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted">No applications in this range.</p>}</Card>
          <Card className="p-5"><p className="font-semibold">Client ratings</p>
            {ratings.length ? <ul className="mt-3 space-y-2 text-sm">{ratings.map((r, i) => <li key={i} className="flex items-center gap-3"><span className="text-amber">{"★".repeat(r.score)}<span className="text-dim">{"★".repeat(5 - r.score)}</span></span><span className="truncate text-muted">{r.fromUser.memberships[0]?.company.name ?? r.fromUser.name}</span><span className="ml-auto text-xs text-dim">{fmtDate(r.createdAt)}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted">No client ratings yet. Ratings open when a company marks an engagement completed.</p>}
            {learners.count ? <p className="mt-4 border-t border-line pt-3 text-sm text-muted">Learner score <span className="font-semibold text-lime">{learners.avg!.toFixed(1)}</span> from {learners.count} participants · {learners.recommendPct}% recommend</p> : null}</Card>
        </div>
      </div>
    );
  }

  if (user.membership) {
    const cid = user.membership.company.id;
    const [reqs, wos, ratingsGiven] = await Promise.all([
      db.requirement.findMany({ where: { companyId: cid, createdAt: { gte: since } }, include: { applications: { select: { status: true, createdAt: true, statusChangedAt: true, trainer: { include: { user: { select: { name: true } } } } } }, skills: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
      db.workOrder.findMany({ where: { companyId: cid, status: "ACCEPTED" }, select: { total: true, startDate: true, invoices: { select: { status: true, total: true } } } }),
      db.rating.count({ where: { fromUser: { memberships: { some: { companyId: cid } } } } }),
    ]);
    const apps = reqs.flatMap((r) => r.applications);
    const awardedReqs = reqs.filter((r) => r.applications.some((a) => a.status === "AWARDED"));
    const avgDays = (pick: (r: (typeof reqs)[number]) => Date | null) => { const xs = reqs.map((r) => { const d = pick(r); return d ? (d.getTime() - r.createdAt.getTime()) / 86400000 : null; }).filter((x): x is number => x !== null); return xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "—"; };
    const firstShortlist = avgDays((r) => { const s = r.applications.filter((a) => ["SHORTLISTED", "AWARDED"].includes(a.status)).map((a) => a.statusChangedAt).sort((a, b) => a.getTime() - b.getTime()); return s[0] ?? null; });
    const awardDays = avgDays((r) => r.applications.find((a) => a.status === "AWARDED")?.statusChangedAt ?? null);
    const months = lastMonths(6);
    const spend = months.map((m) => wos.filter((w) => monthKey(w.startDate) === m).reduce((n, w) => n + w.total, 0));
    const posted = months.map((m) => reqs.filter((r) => monthKey(r.createdAt) === m).length);
    const maxS = Math.max(1, ...spend), maxP = Math.max(1, ...posted);
    const topTrainers = Object.entries(apps.filter((a) => a.status === "AWARDED").reduce<Record<string, number>>((acc, a) => { acc[a.trainer.user.name] = (acc[a.trainer.user.name] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topSkills = Object.entries(reqs.flatMap((r) => r.skills.map((s) => s.name)).reduce<Record<string, number>>((acc, s) => { acc[s] = (acc[s] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const paid = wos.flatMap((w) => w.invoices).filter((i) => i.status === "PAID").reduce((n, i) => n + i.total, 0);
    return (
      <div>
        <PageHeader eyebrow={user.membership.company.name} title="Analytics" body="How fast you hire, what it costs, and who you keep coming back to." actions={tabs} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="Requirements posted" value={reqs.length} tone="violet" /><Stat label="Applications" value={apps.length} /><Stat label="Apps per requirement" value={reqs.length ? (apps.length / reqs.length).toFixed(1) : "—"} />
          <Stat label="Days to shortlist" value={firstShortlist} tone="amber" /><Stat label="Days to award" value={awardDays} tone="lime" /><Stat label="Award rate" value={pct(awardedReqs.length, reqs.length)} tone="lime" />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-5"><p className="font-semibold">Spend on accepted work orders</p><p className="text-xs text-muted">By engagement month, last 6 months · {money(paid)} paid on invoices.</p>
            <div className="mt-4 flex h-28 items-end gap-2">{months.map((m, i) => <div key={m} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] tabular-nums text-muted">{spend[i] ? money(spend[i]) : ""}</span><span className="w-full rounded-t bg-violet" style={{ height: `${(spend[i] / maxS) * 80}%`, minHeight: spend[i] ? 4 : 1 }} /><span className="text-[10px] text-dim">{monthLabel(m)}</span></div>)}</div></Card>
          <Card className="p-5"><p className="font-semibold">Requirements posted</p><p className="text-xs text-muted">Per month, last 6 months.</p>
            <div className="mt-4 flex h-28 items-end gap-2">{months.map((m, i) => <div key={m} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] tabular-nums text-muted">{posted[i] || ""}</span><span className="w-full rounded-t bg-cyan" style={{ height: `${(posted[i] / maxP) * 80}%`, minHeight: posted[i] ? 4 : 1 }} /><span className="text-[10px] text-dim">{monthLabel(m)}</span></div>)}</div></Card>
          <Card className="p-5"><p className="font-semibold">Trainers you award most</p>{topTrainers.length ? <ul className="mt-3 space-y-1.5 text-sm">{topTrainers.map(([n, c]) => <li key={n} className="flex justify-between"><span>{n}</span><span className="font-semibold tabular-nums">{c}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted">No awards in this range.</p>}<p className="mt-3 text-xs text-muted">{ratingsGiven} ratings given by your team.</p></Card>
          <Card className="p-5"><p className="font-semibold">Skills you hire for</p>{topSkills.length ? <ul className="mt-3 space-y-1.5 text-sm">{topSkills.map(([n, c]) => <li key={n} className="flex items-center gap-3"><span className="w-40 truncate">{n}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"><span className="block h-full bg-cyan" style={{ width: `${(c / topSkills[0][1]) * 100}%` }} /></span><span className="w-6 text-right tabular-nums">{c}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted">Post a requirement to see skills here.</p>}</Card>
        </div>
      </div>
    );
  }
  redirect("/dashboard");
}
