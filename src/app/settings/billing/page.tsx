import Link from "next/link";
import { CreditCard } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ACTIVE_STATUSES, entitlementsFor, inr, planByCode, simulatorEnabled, subscriptionWhere } from "@/lib/billing";
import { cancelSubscription, simulateExpire } from "@/lib/actions/billing";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Alert, Badge, Button, ButtonLink, Card, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Billing" };

const statusTone = { ACTIVE: "lime", AUTHENTICATED: "lime", PENDING: "amber", HALTED: "rose", CANCELLED: "neutral", COMPLETED: "neutral", EXPIRED: "neutral", CREATED: "amber" } as const;

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string; simulated?: string }> }) {
  const { success, error, simulated } = await searchParams;
  const user = await requireUser("/settings/billing");
  const where = subscriptionWhere(user);
  const [subs, ent] = await Promise.all([
    db.subscription.findMany({ where, include: { payments: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } }),
    entitlementsFor(user),
  ]);
  const active = subs.find((s) => ACTIVE_STATUSES!.includes(s.status));
  const payments = subs.flatMap((s) => s.payments.map((p) => ({ ...p, plan: s.plan }))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const isCompany = !!user.membership;
  const canManage = !isCompany || user.membership?.role === "OWNER";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow={isCompany ? user.membership!.company.name : "Your account"} title="Plan & billing" body={canManage ? undefined : "Only the company owner can change the plan."} actions={<ButtonLink href="/settings" variant="ghost" size="sm">← Settings</ButtonLink>} />
      {success ? <Alert tone="lime">{simulated ? "Simulated subscription activated. No money moved." : "Payment confirmed. Your plan activates as soon as Razorpay confirms it, usually within a minute."}</Alert> : null}
      {error === "signature" ? <Alert tone="rose">The payment could not be verified. If you were charged, contact support@corpgurus.com with the payment reference.</Alert> : null}
      {error === "owner" ? <Alert tone="rose">That subscription belongs to a different account.</Alert> : null}

      <Card className="p-6" glow={isCompany ? "violet" : "cyan"}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mono text-[12px] uppercase tracking-[0.08em] text-muted">Current plan</p>
            <p className="mt-1 font-display text-2xl font-bold">{ent.planName}</p>
            {active ? (
              <p className="mt-1 text-sm text-muted">
                {inr(active.amount)} / {active.interval === "YEARLY" ? "year" : "month"}
                {active.currentPeriodEnd ? ` · ${active.cancelAtPeriodEnd ? "ends" : "renews"} ${fmtDate(active.currentPeriodEnd)}` : ""}
                {active.simulated ? " · simulated" : ""}
              </p>
            ) : <p className="mt-1 text-sm text-muted">{isCompany ? "2 open requirements, 2 team members." : "5 applications a month."}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {active ? <Badge tone={statusTone[active.status]}>{active.cancelAtPeriodEnd ? "cancelling" : active.status.toLowerCase()}</Badge> : null}
            {!active ? <ButtonLink href="/pricing" variant={isCompany ? "violet" : "primary"}><CreditCard size={15} /> See plans</ButtonLink> : null}
          </div>
        </div>
        <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
          <Benefit on={ent.unlimitedApplications || isCompany} label={isCompany ? "Applications from trainers" : "Unlimited applications"} always={isCompany} />
          {isCompany ? <Benefit on={ent.unlimitedRequirements} label="Unlimited open requirements" /> : <Benefit on={ent.featured} label="Featured in trainer search" />}
          {isCompany ? <Benefit on={ent.messageAnyTrainer} label="Message any trainer directly" /> : <Benefit on={ent.featured} label="Pro badge on profile" />}
          {isCompany ? <Benefit on={ent.memberLimit > 2} label={`Team members: ${ent.memberLimit === Infinity ? "unlimited" : ent.memberLimit}`} /> : <Benefit on={ent.plan === "TRAINER_PRO"} label="Priority certificate verification" />}
        </ul>
        {active && canManage && !active.cancelAtPeriodEnd ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <ActionForm action={cancelSubscription}><input type="hidden" name="id" value={active.id} /><SubmitButton variant="danger" size="sm" pendingText="Cancelling…">Cancel plan</SubmitButton></ActionForm>
            <p className="text-xs text-muted">Benefits continue until the end of the paid period.</p>
            {active.simulated && simulatorEnabled() ? <form action={simulateExpire} className="ml-auto"><input type="hidden" name="id" value={active.id} /><Button variant="ghost" size="sm">Simulate expiry</Button></form> : null}
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold">Billing history</h2>
        {payments.length ? (
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted"><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Plan</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Status</th><th className="py-2">Reference</th></tr></thead>
            <tbody className="divide-y divide-line">{payments.map((p) => (
              <tr key={p.id}><td className="py-2 pr-4">{fmtDate(p.createdAt)}</td><td className="py-2 pr-4">{planByCode(p.plan).name}</td><td className="py-2 pr-4 tabular-nums">{inr(p.amount)}</td><td className="py-2 pr-4"><Badge tone={p.status === "captured" ? "lime" : p.status === "failed" ? "rose" : "amber"}>{p.status}</Badge></td><td className="mono py-2 text-xs text-muted">{p.razorpayPaymentId ?? "—"}{p.method ? ` · ${p.method}` : ""}</td></tr>
            ))}</tbody>
          </table></div>
        ) : <p className="mt-2 text-sm text-muted">No charges yet.</p>}
      </Card>

      {subs.filter((s) => s.id !== active?.id).length ? (
        <Card className="p-6">
          <h2 className="text-lg font-bold">Past subscriptions</h2>
          <ul className="mt-3 divide-y divide-line text-sm">{subs.filter((s) => s.id !== active?.id).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-2"><span className="font-medium">{planByCode(s.plan).name}</span><span className="text-muted">{s.interval.toLowerCase()} · started {fmtDate(s.createdAt)}</span><Badge tone={statusTone[s.status]} className="ml-auto">{s.status.toLowerCase()}</Badge></li>
          ))}</ul>
        </Card>
      ) : null}
      <p className="text-xs text-dim">Questions about a charge? Email <Link href="mailto:support@corpgurus.com" className="text-cyan hover:underline">support@corpgurus.com</Link> with the payment reference.</p>
    </div>
  );
}

function Benefit({ on, label, always }: { on: boolean; label: string; always?: boolean }) {
  return <li className={on || always ? "text-ink" : "text-dim"}><span className={`mr-2 ${on || always ? "text-lime" : "text-dim"}`}>{on || always ? "✓" : "○"}</span>{label}</li>;
}
