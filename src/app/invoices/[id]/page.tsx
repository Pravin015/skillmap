import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { memberCan } from "@/lib/permissions";
import { isStaff, requireUser } from "@/lib/auth";
import { loadInvoiceDoc, woNumber } from "@/lib/documents";
import { deliveryRecords } from "@/lib/delivery";
import { cancelInvoice, issueCreditNote, markInvoicePaid } from "@/lib/actions/invoices";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { DocumentView, DownloadPdf } from "@/components/document-view";
import { PrintButton } from "@/components/print-button";
import { Alert, Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Invoice" };
const tone = { DRAFT: "neutral", SENT: "amber", PAID: "lime", CANCELLED: "neutral" } as const;

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const { id } = await params;
  const { sent } = await searchParams;
  const user = await requireUser(`/invoices/${id}`);
  const doc = await loadInvoiceDoc(id);
  if (!doc) notFound();
  const { inv, model } = doc;
  const isTrainer = inv.trainer.user.id === user.id;
  const isMember = memberCan(inv.company.members, user.id, "view");
  const canPay = memberCan(inv.company.members, user.id, "pay_invoice");
  if (!isTrainer && !isMember && !isStaff(user)) notFound();
  const overdue = inv.status === "SENT" && inv.dueDate < new Date();
  const credits = inv.creditNotes.reduce((n, c) => n + c.total, 0);
  const creditable = inv.amount - inv.creditNotes.reduce((n, c) => n + c.amount, 0);
  const rec = await deliveryRecords(inv.workOrderId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Invoices</Link>
        <Link href={`/requirements/${inv.workOrder.requirementId}/work-order`} className="text-sm text-muted hover:text-ink">· {woNumber(inv.workOrder.number)} {inv.workOrder.title}</Link>
        {inv.purchaseOrder ? <Link href={`/purchase-orders/${inv.purchaseOrder.id}`} className="text-sm text-muted hover:text-ink">· PO {inv.purchaseOrder.poNumber}</Link> : null}
        <Badge tone={overdue ? "rose" : tone[inv.status]} className="ml-auto">{overdue ? "overdue" : inv.status.toLowerCase()}</Badge>
      </div>
      {sent ? <Alert tone="lime">Invoice {inv.invoiceNumber} sent to {inv.company.name} with the PDF attached. They have been notified.</Alert> : null}
      <DocumentView m={model} />

      {inv.status === "PAID" || inv.creditNotes.length ? (
        <Card className="p-5 print:hidden">
          <h2 className="font-display text-base font-semibold">Settlement</h2>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <Row l="Invoice total (incl. GST)" v={money(inv.total, inv.currency)} />
            {inv.creditNotes.length ? <Row l="Credit notes" v={`− ${money(credits, inv.currency)}`} /> : null}
            {inv.tdsAmount ? <Row l={`TDS withheld @ ${inv.tdsRate}% on taxable value`} v={`− ${money(inv.tdsAmount, inv.currency)}`} /> : null}
            {inv.status === "PAID" ? <Row l={`Paid ${inv.paidAt ? fmtDate(inv.paidAt) : ""}${inv.paidReference ? ` · ${inv.paidReference}` : ""}`} v={money(inv.amountReceived ?? inv.total - credits - inv.tdsAmount, inv.currency)} strong /> : <Row l="Net payable now" v={money(inv.total - credits, inv.currency)} strong />}
          </dl>
          {inv.creditNotes.length ? <ul className="mt-3 divide-y divide-line text-sm">{inv.creditNotes.map((c) => <li key={c.id} className="flex flex-wrap items-center gap-3 py-2"><Badge tone="violet">{c.creditNumber}</Badge><span className="min-w-0 flex-1 truncate text-muted">{c.reason} · {fmtDate(c.createdAt)}</span><span className="tabular-nums">{money(c.total, inv.currency)}</span></li>)}</ul> : null}
          {inv.tdsAmount ? <p className="mt-2 text-xs text-muted">The trainer claims the TDS against their income tax; the company issues Form 16A for it.</p> : null}
        </Card>
      ) : null}

      {rec && (rec.roster.length || rec.feedbackCount) ? (
        <Card className="p-5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-base font-semibold">Delivery records</h2><Link href={`/requirements/${inv.workOrder.requirementId}/work-order/attendance`} className="text-sm text-cyan hover:underline">Attendance register →</Link></div>
          <p className="mt-1 text-sm text-muted">{rec.roster.length} participants on the roster{rec.attendancePct != null ? ` · ${rec.attendancePct}% attendance across ${rec.dates.length} day${rec.dates.length === 1 ? "" : "s"}` : ""}{rec.feedbackCount ? ` · learner feedback ${rec.feedbackAvg} / 5 from ${rec.feedbackCount} responses, ${rec.recommendPct}% would recommend` : ""}.</p>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2 print:hidden">
        <DownloadPdf href={`/api/documents/invoice/${inv.id}`} />
        <PrintButton />
        {isTrainer && inv.status === "SENT" ? <form action={cancelInvoice}><input type="hidden" name="id" value={inv.id} /><Button variant="danger" size="sm">Cancel invoice</Button></form> : null}
      </div>

      {canPay && inv.status === "SENT" ? (
        <Card className="p-6 print:hidden" glow="violet">
          <h2 className="text-lg font-bold">Record payment</h2>
          <p className="mt-1 text-sm text-muted">Payment happens outside CorpGurus (bank transfer, UPI). Record it here with any TDS you withheld; the trainer sees the net amount{inv.purchaseOrder ? " and the purchase order closes automatically once fully paid" : ""}.</p>
          <ActionForm action={markInvoicePaid} className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
            <input type="hidden" name="id" value={inv.id} />
            <Field label="Payment reference"><Input name="reference" placeholder="UTR / transaction id (optional)" /></Field>
            <Field label="TDS withheld" hint="Section 194J, on the taxable value"><Select name="tdsRate" defaultValue="0"><option value="0">None</option><option value="1">1%</option><option value="2">2% (professional/technical)</option><option value="5">5%</option><option value="10">10%</option></Select></Field>
            <SubmitButton variant="violet" pendingText="Saving…">Mark as paid</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}

      {isTrainer && ["SENT", "PAID"].includes(inv.status) && creditable > 0 ? (
        <Card className="p-6 print:hidden">
          <h2 className="text-lg font-bold">Issue a credit note</h2>
          <p className="mt-1 text-sm text-muted">For a cancelled day, short delivery or an agreed discount. GST is credited at the invoice rate; up to {money(creditable, inv.currency)} of taxable value can still be credited.</p>
          <ActionForm action={issueCreditNote} className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end" resetOnSuccess>
            <input type="hidden" name="invoiceId" value={inv.id} />
            <Field label={`Taxable amount (${inv.currency})`}><Input name="amount" type="number" min={1} max={creditable} required /></Field>
            <Field label="Reason"><Input name="reason" required placeholder="Day 3 cancelled by the client" /></Field>
            <SubmitButton variant="secondary" pendingText="Issuing…">Issue credit note</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}

const Row = ({ l, v, strong }: { l: string; v: string; strong?: boolean }) => <div className="flex items-center justify-between"><dt className="text-muted">{l}</dt><dd className={`tabular-nums ${strong ? "font-display font-bold text-cyan" : ""}`}>{v}</dd></div>;
