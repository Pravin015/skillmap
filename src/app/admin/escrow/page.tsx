import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { markEscrowPaidOut, refundEscrow } from "@/lib/actions/escrow";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Badge, Card, Empty, Input, PageHeader, Stat } from "@/components/ui";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Escrow · Admin" };

const tone = { PENDING: "amber", FUNDED: "cyan", RELEASED: "lime", PAID_OUT: "lime", REFUNDED: "neutral" } as const;

/** Staff view of managed payments: what is held, what is due for payout, and the fee earned. */
export default async function AdminEscrowPage() {
  await requireStaff("finance", "/admin/escrow");
  const rows = await db.escrowDeposit.findMany({ include: { company: { select: { name: true, slug: true } }, trainer: { select: { slug: true, paymentDetails: true, user: { select: { name: true } } } }, workOrder: { select: { number: true, title: true, requirementId: true } } }, orderBy: { updatedAt: "desc" }, take: 200 });
  const held = rows.filter((r) => r.status === "FUNDED").reduce((n, r) => n + (r.currency === "INR" ? r.amount : 0), 0);
  const due = rows.filter((r) => r.status === "RELEASED");
  const fees = rows.filter((r) => ["RELEASED", "PAID_OUT"].includes(r.status)).reduce((n, r) => n + (r.currency === "INR" ? r.fee : 0), 0);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Escrow and payouts" body="Deposits companies fund against accepted work orders. Release is the company's call; payouts are recorded here with the bank reference." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Held (INR)" value={money(held, "INR")} tone="cyan" /><Stat label="Payouts due" value={due.length} tone="amber" /><Stat label="Fees earned (INR)" value={money(fees, "INR")} tone="lime" /><Stat label="Deposits" value={rows.length} tone="violet" />
      </div>
      {due.length ? (
        <Card className="p-5">
          <h2 className="text-lg font-bold">Payouts due</h2>
          <ul className="mt-3 divide-y divide-line">{due.map((r) => (
            <li key={r.id} className="grid gap-3 py-3 md:grid-cols-[1fr_auto]">
              <div>
                <p className="font-semibold"><Link href={`/requirements/${r.workOrder.requirementId}/work-order`} className="hover:text-cyan">WO-{String(r.workOrder.number).padStart(4, "0")} · {r.workOrder.title}</Link></p>
                <p className="text-sm text-muted">{r.company.name} → <Link href={`/trainers/${r.trainer.slug}`} className="hover:text-cyan">{r.trainer.user.name}</Link> · pay <span className="font-semibold text-ink">{money(r.amount - r.fee, r.currency)}</span> (deposit {money(r.amount, r.currency)}, fee {money(r.fee, r.currency)}) · released {fmtDate(r.releasedAt!)}</p>
                <p className="mt-1 whitespace-pre-line rounded-md bg-surface-2 px-3 py-2 text-xs text-muted">{r.trainer.paymentDetails || "Trainer has not added bank details yet (Settings → invoices)."}</p>
              </div>
              <ActionForm action={markEscrowPaidOut} className="flex items-end gap-2">
                <input type="hidden" name="id" value={r.id} />
                <Input name="payoutRef" placeholder="UTR / transfer ref" required className="w-44" />
                <SubmitButton size="sm" pendingText="Saving…">Mark paid out</SubmitButton>
              </ActionForm>
            </li>
          ))}</ul>
        </Card>
      ) : null}
      <Card className="p-5">
        <h2 className="text-lg font-bold">All deposits</h2>
        {rows.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted"><th className="py-2 pr-3">Work order</th><th className="py-2 pr-3">Company</th><th className="py-2 pr-3">Trainer</th><th className="py-2 pr-3 text-right">Amount</th><th className="py-2 pr-3 text-right">Fee</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Provider</th><th className="py-2">Updated</th><th className="py-2" /></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id} className="border-b border-line/60">
                  <td className="py-2 pr-3"><Link href={`/requirements/${r.workOrder.requirementId}/work-order`} className="hover:text-cyan">WO-{String(r.workOrder.number).padStart(4, "0")}</Link></td>
                  <td className="py-2 pr-3">{r.company.name}</td><td className="py-2 pr-3">{r.trainer.user.name}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{money(r.amount, r.currency)}</td><td className="py-2 pr-3 text-right tabular-nums">{money(r.fee, r.currency)}</td>
                  <td className="py-2 pr-3"><Badge tone={tone[r.status]}>{r.status.toLowerCase().replace("_", " ")}</Badge></td>
                  <td className="mono py-2 pr-3 text-xs">{r.provider}{r.providerRef ? ` · ${r.providerRef.slice(0, 14)}` : ""}</td>
                  <td className="py-2 text-xs text-muted">{fmtDate(r.updatedAt)}</td>
                  <td className="py-2 text-right">{r.status === "FUNDED" ? <ActionForm action={refundEscrow} className="inline-flex items-center gap-1"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="note" value="Refunded by CorpGurus support" /><SubmitButton variant="danger" size="sm">Refund</SubmitButton></ActionForm> : null}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="mt-3"><Empty title="No deposits yet" body="Deposits appear once a company funds an accepted work order." /></div>}
      </Card>
    </div>
  );
}
