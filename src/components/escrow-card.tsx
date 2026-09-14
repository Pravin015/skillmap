import { Lock, ShieldCheck } from "lucide-react";
import type { EscrowDeposit } from "@prisma/client";
import { fundEscrow, refundEscrow, releaseEscrow, requestEscrowRelease } from "@/lib/actions/escrow";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import { fmtDate, money } from "@/lib/utils";

const tone = { PENDING: "amber", FUNDED: "cyan", RELEASED: "lime", PAID_OUT: "lime", REFUNDED: "neutral" } as const;
const label = { PENDING: "Awaiting payment", FUNDED: "Funded · held by CorpGurus", RELEASED: "Released · payout in progress", PAID_OUT: "Paid out", REFUNDED: "Refunded" } as const;

/** Managed-payment card on the work-order page. Company funds after acceptance, releases after delivery; CorpGurus pays the trainer out. */
export function EscrowCard({ escrow, workOrderId, workOrderStatus, total, currency, isMember, isTrainer, feePercent, live }: {
  escrow: EscrowDeposit | null; workOrderId: string; workOrderStatus: string; total: number; currency: string; isMember: boolean; isTrainer: boolean; feePercent: number; live: boolean;
}) {
  const active = escrow && escrow.status !== "REFUNDED" && escrow.status !== "PENDING" ? escrow : null;
  return (
    <Card className="p-5 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold"><Lock size={16} className="text-cyan" /> Managed payment (escrow)</h2>
        {escrow ? <Badge tone={tone[escrow.status]}>{label[escrow.status]}</Badge> : <Badge tone="neutral">Not funded</Badge>}
      </div>
      {active ? (
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div><dt className="mono text-[11px] uppercase tracking-wider text-muted">Deposit</dt><dd className="font-semibold tabular-nums">{money(active.amount, active.currency)}</dd></div>
          <div><dt className="mono text-[11px] uppercase tracking-wider text-muted">Platform fee ({active.feePercent}%)</dt><dd className="tabular-nums">{money(active.fee, active.currency)}</dd></div>
          <div><dt className="mono text-[11px] uppercase tracking-wider text-muted">Trainer receives</dt><dd className="font-semibold tabular-nums text-cyan">{money(active.amount - active.fee, active.currency)}</dd></div>
          <div><dt className="mono text-[11px] uppercase tracking-wider text-muted">Timeline</dt><dd className="text-xs text-muted">Funded {active.fundedAt ? fmtDate(active.fundedAt) : "—"}{active.releasedAt ? ` · released ${fmtDate(active.releasedAt)}` : ""}{active.paidOutAt ? ` · paid out ${fmtDate(active.paidOutAt)}${active.payoutRef ? ` (ref ${active.payoutRef})` : ""}` : ""}</dd></div>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted">{isMember ? `Secure ${money(total, currency)} with CorpGurus now and release it after delivery. A ${feePercent}% platform fee is deducted from the payout. Trainers prioritise funded engagements.` : "When the company funds the deposit, the amount is held by CorpGurus and released to you after delivery."}</p>
      )}

      {isMember && (!escrow || escrow.status === "PENDING" || escrow.status === "REFUNDED") && workOrderStatus === "ACCEPTED" ? (
        <ActionForm action={fundEscrow} className="mt-4">
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <SubmitButton pendingText="Preparing payment…"><ShieldCheck size={15} /> Fund {money(total, currency)}{live ? " via Razorpay" : " (simulated)"}</SubmitButton>
          {escrow?.status === "PENDING" ? <p className="mt-2 text-xs text-muted">A payment link was created but not paid yet. Funding again creates a fresh link.</p> : null}
        </ActionForm>
      ) : null}
      {isMember && escrow?.status === "FUNDED" ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ActionForm action={releaseEscrow} className="space-y-2">
            <input type="hidden" name="id" value={escrow.id} />
            <Field label="Release to trainer" hint="Do this once the training is delivered."><Input name="note" placeholder="Optional note, e.g. delivered on schedule" /></Field>
            <SubmitButton pendingText="Releasing…">Release {money(escrow.amount - escrow.fee, escrow.currency)}</SubmitButton>
          </ActionForm>
          {workOrderStatus === "CANCELLED" ? (
            <ActionForm action={refundEscrow} className="space-y-2">
              <input type="hidden" name="id" value={escrow.id} />
              <Field label="Refund (work order cancelled)"><Input name="note" placeholder="Reason" /></Field>
              <SubmitButton variant="danger" pendingText="Refunding…">Refund deposit</SubmitButton>
            </ActionForm>
          ) : null}
        </div>
      ) : null}
      {isTrainer && escrow?.status === "FUNDED" ? (
        <form action={requestEscrowRelease} className="mt-4"><input type="hidden" name="id" value={escrow.id} /><Button variant="secondary" size="sm">Training delivered · request release</Button></form>
      ) : null}
    </Card>
  );
}
