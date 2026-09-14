import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { db } from "@/lib/db";
import { memberCan } from "@/lib/permissions";
import { isStaff, requireUser } from "@/lib/auth";
import { cancelWorkOrder, reopenWorkOrder, respondWorkOrder } from "@/lib/actions/work-orders";
import { ActionForm } from "@/components/form-bits";
import { Logo } from "@/components/shell";
import { Alert, Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";
import { dateRange, fmtDate, modeLabel, money, timeAgo } from "@/lib/utils";
import { WorkOrderForm } from "./form";
import { EscrowCard } from "@/components/escrow-card";
import { razorpayConfigured } from "@/lib/billing";
import { featureEnabled } from "@/lib/features";

export const metadata = { title: "Work order" };

const tone = { DRAFT: "neutral", SENT: "amber", CHANGES_REQUESTED: "rose", ACCEPTED: "lime", CANCELLED: "neutral" } as const;
const label = { DRAFT: "Draft", SENT: "Awaiting trainer", CHANGES_REQUESTED: "Changes requested", ACCEPTED: "Accepted", CANCELLED: "Cancelled" } as const;

export default async function WorkOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; edit?: string }> }) {
  const { id } = await params;
  const { sent, edit } = await searchParams;
  const user = await requireUser(`/requirements/${id}/work-order`);
  const req = await db.requirement.findUnique({
    where: { id },
    include: {
      company: { include: { members: { select: { userId: true, role: true } } } },
      applications: { where: { status: "AWARDED" }, include: { team: { include: { members: { where: { status: "ACCEPTED" }, include: { trainer: { select: { slug: true, user: { select: { name: true } } } } } } } }, trainer: { include: { user: { select: { id: true, name: true, email: true } } } } } },
      workOrder: { include: { events: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: "asc" } }, createdBy: { select: { name: true } }, batches: { orderBy: { position: "asc" } }, escrow: true } },
    },
  });
  if (!req) notFound();
  const awarded = req.applications[0];
  const isMember = memberCan(req.company.members, user.id, "view");
  const isTrainer = awarded?.trainer.user.id === user.id;
  if (!isMember && !isTrainer && !isStaff(user)) notFound();
  if (!awarded) return <Alert tone="amber">Award the requirement to a trainer before issuing a work order. <Link href={`/dashboard/requirements/${id}/applicants`} className="underline">Review applicants</Link>.</Alert>;

  const wo = req.workOrder;
  const feePercent = Number((await db.setting.findUnique({ where: { key: "escrow_fee_percent" } }))?.value ?? 5);
  const escrowOn = await featureEnabled("escrow");
  const editing = isMember && (!wo || edit === "1" || wo.status === "DRAFT" || wo.status === "CHANGES_REQUESTED") && wo?.status !== "ACCEPTED" && wo?.status !== "CANCELLED";
  const defaults = wo ?? { title: `${req.title}`, startDate: req.startDate, endDate: req.endDate, dayRate: awarded.proposedRate ?? req.budgetMax ?? 0, currency: req.currency, participants: req.participants, mode: req.mode, venue: req.city ? `${req.city}` : "", deliverables: "", provided: "", paymentTerms: "Invoice on completion, payable within 30 days by bank transfer. GST extra.", cancellationTerms: "Free reschedule up to 7 days before the start date. 50% of the total payable if cancelled within 7 days.", notes: "" };
  const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
  const isoDay = (d: Date) => d.toISOString().slice(0, 10);
  const initialBatches = (wo?.batches ?? []).map((b) => ({ label: b.label, startDate: isoDay(b.startDate), endDate: isoDay(b.endDate), participants: String(b.participants), city: b.city ?? "" }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href={`/requirements/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> {req.title}</Link>
        {wo ? <Badge tone={tone[wo.status]} className="ml-auto">{label[wo.status]} · v{wo.version}</Badge> : null}
      </div>
      {sent ? <Alert tone="lime">Sent to {awarded.trainer.user.name}. They have been notified and can accept or request changes.</Alert> : null}

      {editing ? (
        <>
          <div><p className="mono text-[12px] uppercase tracking-[0.08em] text-violet">{wo ? (wo.status === "CHANGES_REQUESTED" ? "Revise work order" : "Edit work order") : "New work order"}</p><h1 className="text-2xl font-bold">{req.title}</h1><p className="mt-1 text-sm text-muted">Trainer: {awarded.trainer.user.name} · Prefilled from the requirement and the accepted application.</p></div>
          {wo?.status === "CHANGES_REQUESTED" ? <Alert tone="rose">{awarded.trainer.user.name} asked for changes: “{[...wo.events].reverse().find((e) => e.type === "changes_requested")?.note}”</Alert> : null}
          <WorkOrderForm requirementId={id} defaults={defaults} revising={!!wo && wo.status !== "DRAFT"} initialBatches={initialBatches} />
        </>
      ) : wo ? (
        <>
          <Card className="p-8 print:border-0 print:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
              <div><Logo /><p className="mono mt-3 text-[12px] uppercase tracking-[0.08em] text-muted">Work order · WO-{String(wo.number).padStart(4, "0")} · v{wo.version}</p><h1 className="mt-1 text-2xl font-bold">{wo.title}</h1></div>
              <div className="text-right text-sm"><Badge tone={tone[wo.status]}>{label[wo.status]}</Badge><p className="mt-2 text-muted">Issued {fmtDate(wo.sentAt ?? wo.createdAt)}{wo.acceptedAt ? ` · Accepted ${fmtDate(wo.acceptedAt)}` : ""}</p></div>
            </div>
            <div className="grid gap-6 py-5 md:grid-cols-2">
              <div><p className="mono text-[11px] uppercase tracking-wider text-muted">Client</p><p className="mt-1 font-semibold">{req.company.name}</p><p className="text-sm text-muted">Issued by {wo.createdBy.name}</p></div>
              <div><p className="mono text-[11px] uppercase tracking-wider text-muted">Trainer</p><p className="mt-1 font-semibold">{awarded.trainer.user.name}</p><p className="text-sm text-muted">{awarded.trainer.headline}</p>{awarded.team ? <p className="mt-1 text-sm text-muted">Team <span className="font-medium text-ink">{awarded.team.name}</span>{awarded.team.members.length ? ` · with ${awarded.team.members.map((m) => m.trainer.user.name).join(", ")}` : ""}</p> : null}</div>
            </div>
            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-surface-2 p-4 md:grid-cols-4">
              <Item l="Dates" v={dateRange(wo.startDate, wo.endDate)} /><Item l="Days" v={String(wo.days)} /><Item l="Participants" v={String(wo.participants)} /><Item l="Delivery" v={modeLabel[wo.mode]} />
              <Item l="Day rate" v={money(wo.dayRate, wo.currency)} /><Item l="Total (ex. GST)" v={money(wo.total, wo.currency)} accent /><Item l="Requirement" v={req.title} span />
            </dl>
            {wo.batches.length ? (
              <div className="mt-6">
                <h3 className="font-display font-semibold">Batches</h3>
                <table className="mt-2 w-full text-sm">
                  <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted"><th className="py-1.5 pr-3">#</th><th className="py-1.5 pr-3">Batch</th><th className="py-1.5 pr-3">Dates</th><th className="py-1.5 pr-3 text-right">Days</th><th className="py-1.5 pr-3 text-right">Participants</th><th className="py-1.5">City / platform</th></tr></thead>
                  <tbody>{wo.batches.map((b, i) => <tr key={b.id} className="border-b border-line/60"><td className="mono py-1.5 pr-3 text-xs text-muted">{i + 1}</td><td className="py-1.5 pr-3 font-medium">{b.label}</td><td className="py-1.5 pr-3">{dateRange(b.startDate, b.endDate)}</td><td className="py-1.5 pr-3 text-right tabular-nums">{b.days}</td><td className="py-1.5 pr-3 text-right tabular-nums">{b.participants}</td><td className="py-1.5 text-muted">{b.city ?? "—"}</td></tr>)}</tbody>
                  <tfoot><tr className="font-semibold"><td /><td className="py-1.5 pr-3">Total</td><td /><td className="py-1.5 pr-3 text-right tabular-nums">{wo.days}</td><td className="py-1.5 pr-3 text-right tabular-nums">{wo.participants}</td><td /></tr></tfoot>
                </table>
              </div>
            ) : null}
            {wo.venue ? <Block title="Venue and logistics" text={wo.venue} /> : null}
            <div className="grid gap-6 md:grid-cols-2">
              {wo.deliverables ? <div className="mt-6"><h3 className="font-display font-semibold">Trainer delivers</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{lines(wo.deliverables).map((l, i) => <li key={i}>{l}</li>)}</ul></div> : null}
              {wo.provided ? <div className="mt-6"><h3 className="font-display font-semibold">Company provides</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{lines(wo.provided).map((l, i) => <li key={i}>{l}</li>)}</ul></div> : null}
            </div>
            {wo.paymentTerms ? <Block title="Payment terms" text={wo.paymentTerms} /> : null}
            {wo.cancellationTerms ? <Block title="Cancellation terms" text={wo.cancellationTerms} /> : null}
            {wo.notes ? <Block title="Notes" text={wo.notes} /> : null}
            <div className="mt-8 grid gap-6 border-t border-line pt-5 text-sm md:grid-cols-2">
              <div><p className="mono text-[11px] uppercase tracking-wider text-muted">Signed for {req.company.name}</p>{wo.companySignedName ? <><p className="mt-1 font-display text-xl italic">{wo.companySignedName}</p><p className="text-xs text-muted">{wo.createdBy.name} · {fmtDate(wo.companySignedAt ?? wo.sentAt ?? wo.createdAt)} · v{wo.version}</p></> : <p className="mt-1 text-muted">Not signed</p>}</div>
              <div><p className="mono text-[11px] uppercase tracking-wider text-muted">Signed by the trainer</p>{wo.trainerSignedName ? <><p className="mt-1 font-display text-xl italic">{wo.trainerSignedName}</p><p className="text-xs text-muted">{awarded.trainer.user.name} · {fmtDate(wo.trainerSignedAt!)}{wo.signatureHash ? <span className="mono"> · ref {wo.signatureHash.slice(0, 12)}</span> : null}</p></> : <p className="mt-1 text-muted">Not yet accepted</p>}</div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2 print:hidden">
            <PrintButton />
            {wo.status === "ACCEPTED" && isTrainer ? <Link href={`/dashboard/invoices?raise=${wo.id}`} className="inline-flex h-9 items-center rounded-lg bg-cyan px-3 font-display text-sm font-semibold text-white hover:bg-navy">Raise invoice</Link> : null}
            {wo.status === "ACCEPTED" ? <Link href="/dashboard/invoices" className="inline-flex h-9 items-center rounded-lg border border-line-2 bg-white px-3 font-display text-sm font-semibold hover:bg-surface-2">Invoices</Link> : null}
            {isMember && wo.status !== "CANCELLED" && wo.status !== "ACCEPTED" ? <Link href={`/requirements/${id}/work-order?edit=1`} className="inline-flex h-9 items-center rounded-lg border border-line-2 bg-white px-3 font-display text-sm font-semibold hover:bg-surface-2">Edit and resend</Link> : null}
            {isMember && wo.status !== "CANCELLED" ? <form action={cancelWorkOrder}><input type="hidden" name="id" value={wo.id} /><Button variant="danger" size="sm">Cancel work order</Button></form> : null}
            {isMember && wo.status === "CANCELLED" ? <form action={reopenWorkOrder}><input type="hidden" name="id" value={wo.id} /><Button variant="secondary" size="sm">Reopen as draft</Button></form> : null}
          </div>

          {escrowOn && (wo.status === "ACCEPTED" || wo.escrow) ? <EscrowCard escrow={wo.escrow} workOrderId={wo.id} workOrderStatus={wo.status} total={wo.total} currency={wo.currency} isMember={isMember} isTrainer={isTrainer} feePercent={feePercent} live={razorpayConfigured() && wo.currency === "INR"} /> : null}

          {isTrainer && wo.status === "SENT" ? (
            <Card className="p-6 print:hidden" glow="cyan">
              <h2 className="flex items-center gap-2 text-lg font-bold"><FileCheck2 size={18} className="text-cyan" /> Your response</h2>
              <p className="mt-1 text-sm text-muted">Accepting confirms the dates, rate and terms above. Requesting changes sends your notes back to {req.company.name}.</p>
              <ActionForm action={respondWorkOrder} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={wo.id} />
                <Field label="Notes (required when requesting changes)"><Textarea name="note" className="min-h-20" placeholder="e.g. Day rate should be ₹38,000 as agreed in messages; please add travel reimbursement." /></Field>
                <Field label="Sign as (type your full name to accept)" hint="Your typed name, the time and a reference hash are recorded on the document."><Input name="signedName" placeholder={awarded.trainer.user.name} /></Field>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" name="decision" value="ACCEPT" className="inline-flex h-10 items-center rounded-lg bg-cyan px-4 font-display text-sm font-semibold text-white hover:bg-navy">Accept work order</button>
                  <button type="submit" name="decision" value="CHANGES" className="inline-flex h-10 items-center rounded-lg border border-line-2 bg-white px-4 font-display text-sm font-semibold hover:bg-surface-2">Request changes</button>
                </div>
              </ActionForm>
            </Card>
          ) : null}
          {isTrainer && wo.status === "CHANGES_REQUESTED" ? <Alert tone="amber">Your change request was sent. {req.company.name} will revise and resend.</Alert> : null}

          <Card className="p-5 print:hidden">
            <h2 className="font-display text-base font-semibold">History</h2>
            <ul className="mt-3 space-y-2 text-sm">{wo.events.map((e) => <li key={e.id} className="flex flex-wrap gap-2"><span className="mono text-xs text-muted">v{e.version}</span><span className="font-medium">{e.actor.name}</span><span className="text-muted">{e.type.replace("_", " ")}{e.note ? `: “${e.note}”` : ""}</span><span className="ml-auto text-xs text-dim">{timeAgo(e.createdAt)}</span></li>)}</ul>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center"><h1 className="text-xl font-bold">No work order yet</h1><p className="mt-2 text-sm text-muted">{req.company.name} has not issued one for this engagement. You will be notified when they do.</p></Card>
      )}
    </div>
  );
}

function Item({ l, v, accent, span }: { l: string; v: string; accent?: boolean; span?: boolean }) {
  return <div className={span ? "col-span-2" : ""}><dt className="mono text-[11px] uppercase tracking-wider text-muted">{l}</dt><dd className={`mt-0.5 text-sm font-semibold ${accent ? "text-cyan" : ""}`}>{v}</dd></div>;
}
function Block({ title, text }: { title: string; text: string }) {
  return <div className="mt-6"><h3 className="font-display font-semibold">{title}</h3><p className="mt-1 whitespace-pre-line text-sm text-ink/90">{text}</p></div>;
}
