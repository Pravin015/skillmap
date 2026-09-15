import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import { isStaff, requireUser } from "@/lib/auth";
import { memberCan } from "@/lib/permissions";
import { loadPoDoc, poNumberOf, woNumber } from "@/lib/documents";
import { cancelPurchaseOrder, closePurchaseOrder, respondPurchaseOrder } from "@/lib/actions/purchase-orders";
import { ActionForm } from "@/components/form-bits";
import { DocumentView, DownloadPdf } from "@/components/document-view";
import { PrintButton } from "@/components/print-button";
import { Alert, Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";
import { fmtDate, money } from "@/lib/utils";
import { stateCodeFromGstin, toLineInputs } from "@/lib/gst";
import { PoForm } from "./po-form";

export const metadata = { title: "Purchase order" };
const tone = { DRAFT: "neutral", ISSUED: "amber", CHANGES_REQUESTED: "rose", ACCEPTED: "lime", CLOSED: "neutral", CANCELLED: "neutral" } as const;
const label = { DRAFT: "Draft", ISSUED: "Awaiting trainer", CHANGES_REQUESTED: "Changes requested", ACCEPTED: "Accepted", CLOSED: "Closed", CANCELLED: "Cancelled" } as const;
const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function PurchaseOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string; sent?: string; err?: string }> }) {
  const { id } = await params;
  const { edit, sent, err } = await searchParams;
  const user = await requireUser(`/purchase-orders/${id}`);
  const doc = await loadPoDoc(id);
  if (!doc) notFound();
  const { po, model } = doc;
  const isTrainer = po.trainer.user.id === user.id;
  const isMember = memberCan(po.company.members, user.id, "view");
  const canSign = memberCan(po.company.members, user.id, "sign_work_order");
  if (!isTrainer && !isMember && !isStaff(user)) notFound();
  const editable = !["ACCEPTED", "CLOSED", "CANCELLED"].includes(po.status);
  const editing = canSign && editable && (po.status === "DRAFT" || po.status === "CHANGES_REQUESTED" || edit === "1");
  const billed = po.invoices.reduce((n, i) => n + i.amount, 0);
  const paid = po.invoices.filter((i) => i.status === "PAID").reduce((n, i) => n + i.amount, 0);
  const remaining = Math.max(0, po.subtotal - billed);
  const vendorState = stateCodeFromGstin(po.vendorGstin);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/dashboard/purchase-orders" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Purchase orders</Link>
        <Link href={`/requirements/${po.workOrder.requirementId}/work-order`} className="text-sm text-muted hover:text-ink">· {woNumber(po.workOrder.number)} {po.workOrder.title}</Link>
        <Badge tone={tone[po.status]} className="ml-auto">{label[po.status]} · v{po.version}</Badge>
      </div>
      {sent ? <Alert tone="lime">Purchase order {po.poNumber} issued to {po.trainer.user.name}. They have the PDF by email and can accept it here.</Alert> : null}
      {err === "has-invoices" ? <Alert tone="rose">This purchase order has invoices against it and cannot be cancelled. Cancel the invoices first.</Alert> : null}
      {po.status === "CHANGES_REQUESTED" && po.changeNote ? <Alert tone="rose">{po.trainer.user.name} asked for changes: &ldquo;{po.changeNote}&rdquo;</Alert> : null}

      {editing ? (
        <>
          <div><p className="mono text-[12px] uppercase tracking-[0.08em] text-violet">{po.issuedAt ? "Revise purchase order" : "New purchase order"}</p><h1 className="text-2xl font-bold">{po.poNumber || `Draft against ${woNumber(po.workOrder.number)}`}</h1><p className="mt-1 text-sm text-muted">Vendor: {po.vendorName} · Buyer: {po.buyerName}. Party details come from Settings; the number is assigned when you issue.</p></div>
          {!po.buyerGstin || !po.buyerAddress ? <Alert tone="amber">Add your company&apos;s GSTIN and billing address under <Link href="/settings" className="underline">Settings</Link> so they print on the PO.</Alert> : null}
          <PoForm reissuing={!!po.issuedAt} supplierState={vendorState} buyerState={po.buyerStateCode} lines={toLineInputs(po.lines)} d={{ id: po.id, title: po.title, poDate: iso(po.poDate), validUntil: iso(po.validUntil), gstRate: po.gstRate, sacCode: po.sacCode, currency: po.currency, placeOfSupply: po.placeOfSupply, supplyMode: po.supplyMode, periodText: po.periodText, participants: po.participants ? String(po.participants) : "", endClientRef: po.endClientRef ?? "", paymentTerms: po.paymentTerms, deliverables: po.deliverables, terms: po.terms, notes: po.notes }} />
        </>
      ) : (
        <>
          <DocumentView m={model} />
          <div className="flex flex-wrap gap-2 print:hidden">
            {po.status !== "DRAFT" ? <DownloadPdf href={`/api/documents/po/${po.id}`} /> : null}
            <PrintButton />
            {isTrainer && po.status === "ACCEPTED" && remaining > 0 ? <Link href={`/dashboard/invoices/new?workOrder=${po.workOrderId}&po=${po.id}`} className="inline-flex h-9 items-center rounded-lg bg-violet px-3 font-display text-sm font-semibold text-white hover:bg-navy">Raise invoice against this PO</Link> : null}
            {canSign && editable ? <Link href={`/purchase-orders/${po.id}?edit=1`} className="inline-flex h-9 items-center rounded-lg border border-line-2 bg-white px-3 font-display text-sm font-semibold hover:bg-surface-2">Edit and reissue</Link> : null}
            {canSign && po.status === "ACCEPTED" ? <form action={closePurchaseOrder}><input type="hidden" name="id" value={po.id} /><Button variant="secondary" size="sm">Close purchase order</Button></form> : null}
            {canSign && editable ? <form action={cancelPurchaseOrder}><input type="hidden" name="id" value={po.id} /><Button variant="danger" size="sm">Cancel purchase order</Button></form> : null}
          </div>

          {isTrainer && po.status === "ISSUED" ? (
            <Card className="p-6 print:hidden" glow="cyan">
              <h2 className="flex items-center gap-2 text-lg font-bold"><FileCheck2 size={18} className="text-cyan" /> Your response</h2>
              <p className="mt-1 text-sm text-muted">Accepting confirms the scope, rates and terms above. You then raise invoices against {poNumberOf(po)} up to {money(po.subtotal, po.currency)} before GST.</p>
              <ActionForm action={respondPurchaseOrder} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={po.id} />
                <Field label="Notes (required when requesting changes)"><Textarea name="note" className="min-h-20" placeholder="e.g. Lab access should be billed at ₹4,000 per participant as agreed; please add it as a line." /></Field>
                <Field label="Accept as (type your full name)" hint="Your typed name and the time are recorded on the document."><Input name="signedName" placeholder={po.trainer.user.name} /></Field>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" name="decision" value="ACCEPT" className="inline-flex h-10 items-center rounded-lg bg-cyan px-4 font-display text-sm font-semibold text-white hover:bg-navy">Accept purchase order</button>
                  <button type="submit" name="decision" value="CHANGES" className="inline-flex h-10 items-center rounded-lg border border-line-2 bg-white px-4 font-display text-sm font-semibold hover:bg-surface-2">Request changes</button>
                </div>
              </ActionForm>
            </Card>
          ) : null}

          {po.status !== "DRAFT" ? (
            <Card className="p-5 print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-base font-semibold">Invoices against this PO</h2><p className="text-sm text-muted">Billed {money(billed, po.currency)} · paid {money(paid, po.currency)} · remaining {money(remaining, po.currency)} (before GST)</p></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-cyan" style={{ width: `${Math.min(100, po.subtotal ? (billed / po.subtotal) * 100 : 0)}%` }} /></div>
              {po.invoices.length ? <ul className="mt-3 divide-y divide-line text-sm">{po.invoices.map((i) => <li key={i.id} className="flex flex-wrap items-center gap-3 py-2"><Link href={`/invoices/${i.id}`} className="font-medium hover:text-cyan">{i.invoiceNumber}</Link><span className="text-muted">issued {fmtDate(i.issuedAt)} · due {fmtDate(i.dueDate)}</span><span className="ml-auto tabular-nums">{money(i.total, i.currency)}</span><Badge tone={i.status === "PAID" ? "lime" : "amber"}>{i.status.toLowerCase()}</Badge></li>)}</ul> : <p className="mt-2 text-sm text-muted">{po.status === "ACCEPTED" ? "No invoices yet." : "Invoices can be raised once the trainer accepts."}</p>}
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
