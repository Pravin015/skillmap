import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { memberCan } from "@/lib/permissions";
import { isStaff, requireUser } from "@/lib/auth";
import { cancelInvoice, markInvoicePaid } from "@/lib/actions/invoices";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Logo } from "@/components/shell";
import { PrintButton } from "@/components/print-button";
import { Alert, Badge, Button, Card, Field, Input } from "@/components/ui";
import { dateRange, fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Invoice" };
const tone = { DRAFT: "neutral", SENT: "amber", PAID: "lime", CANCELLED: "neutral" } as const;

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const { id } = await params;
  const { sent } = await searchParams;
  const user = await requireUser(`/invoices/${id}`);
  const inv = await db.invoice.findUnique({ where: { id }, include: { trainer: { include: { user: { select: { id: true, name: true, email: true } } } }, company: { include: { members: { select: { userId: true, role: true } } } }, workOrder: { include: { requirement: { select: { id: true, title: true } } } } } });
  if (!inv) notFound();
  const isTrainer = inv.trainer.user.id === user.id;
  const isMember = memberCan(inv.company.members, user.id, "view");
  if (!isTrainer && !isMember && !isStaff(user)) notFound();
  const overdue = inv.status === "SENT" && inv.dueDate < new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Invoices</Link>
        <Badge tone={overdue ? "rose" : tone[inv.status]} className="ml-auto">{overdue ? "overdue" : inv.status.toLowerCase()}</Badge>
      </div>
      {sent ? <Alert tone="lime">Invoice sent to {inv.company.name}. They have been notified.</Alert> : null}
      <Card className="p-8 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div><Logo /><p className="mono mt-3 text-[12px] uppercase tracking-[0.08em] text-muted">Tax invoice</p><h1 className="mt-1 text-2xl font-bold">{inv.invoiceNumber}</h1></div>
          <div className="text-right text-sm text-muted"><p>Issued {fmtDate(inv.issuedAt)}</p><p>Due {fmtDate(inv.dueDate)}</p>{inv.paidAt ? <p className="text-lime">Paid {fmtDate(inv.paidAt)}{inv.paidReference ? ` · ${inv.paidReference}` : ""}</p> : null}</div>
        </div>
        <div className="grid gap-6 py-5 md:grid-cols-2">
          <div><p className="mono text-[11px] uppercase tracking-wider text-muted">From</p><p className="mt-1 font-semibold">{inv.trainer.user.name}</p><p className="text-sm text-muted">{inv.trainer.headline}</p><p className="text-sm text-muted">{inv.trainer.user.email}</p>{inv.trainerGstin ? <p className="mono text-xs text-muted">GSTIN {inv.trainerGstin}</p> : null}</div>
          <div><p className="mono text-[11px] uppercase tracking-wider text-muted">Bill to</p><p className="mt-1 font-semibold">{inv.company.name}</p>{inv.company.billingAddress ? <p className="whitespace-pre-line text-sm text-muted">{inv.company.billingAddress}</p> : null}{inv.companyGstin ? <p className="mono text-xs text-muted">GSTIN {inv.companyGstin}</p> : null}</div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="mono border-y border-line text-left text-[11px] uppercase tracking-wider text-muted"><th className="py-2">Description</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody>
            <tr><td className="py-3"><p className="font-medium">{inv.description}</p><p className="text-xs text-muted">Work order WO-{String(inv.workOrder.number).padStart(4, "0")} · {dateRange(inv.workOrder.startDate, inv.workOrder.endDate)} · <Link href={`/requirements/${inv.workOrder.requirementId}`} className="hover:text-ink">{inv.workOrder.requirement.title}</Link></p></td><td className="py-3 text-right tabular-nums">{money(inv.amount, inv.currency)}</td></tr>
            <tr className="border-t border-line"><td className="py-2 text-muted">GST @ {inv.gstRate}%</td><td className="py-2 text-right tabular-nums">{money(inv.gstAmount, inv.currency)}</td></tr>
            <tr className="border-t-2 border-line"><td className="py-3 font-display text-base font-bold">Total payable</td><td className="py-3 text-right font-display text-lg font-bold tabular-nums text-cyan">{money(inv.total, inv.currency)}</td></tr>
          </tbody>
        </table>
        {inv.paymentDetails ? <div className="mt-6"><h3 className="font-display font-semibold">Payment details</h3><p className="mt-1 whitespace-pre-line text-sm">{inv.paymentDetails}</p></div> : null}
        {inv.notes ? <div className="mt-4"><h3 className="font-display font-semibold">Notes</h3><p className="mt-1 whitespace-pre-line text-sm text-muted">{inv.notes}</p></div> : null}
      </Card>

      <div className="flex flex-wrap gap-2 print:hidden">
        <PrintButton />
        {isTrainer && inv.status === "SENT" ? <form action={cancelInvoice}><input type="hidden" name="id" value={inv.id} /><Button variant="danger" size="sm">Cancel invoice</Button></form> : null}
      </div>
      {isMember && inv.status === "SENT" ? (
        <Card className="p-6 print:hidden" glow="violet">
          <h2 className="text-lg font-bold">Record payment</h2>
          <p className="mt-1 text-sm text-muted">Payment happens outside CorpGurus (bank transfer, UPI). Record it here so both sides see the status.</p>
          <ActionForm action={markInvoicePaid} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={inv.id} />
            <Field label="Payment reference" className="flex-1"><Input name="reference" placeholder="UTR / transaction id (optional)" /></Field>
            <SubmitButton variant="violet" pendingText="Saving…">Mark as paid</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}
