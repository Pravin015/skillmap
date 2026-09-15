import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { memberCan } from "@/lib/permissions";
import { isStaff, requireUser } from "@/lib/auth";
import { loadInvoiceDoc } from "@/lib/documents";
import { cancelInvoice, markInvoicePaid } from "@/lib/actions/invoices";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { DocumentView, DownloadPdf } from "@/components/document-view";
import { PrintButton } from "@/components/print-button";
import { Alert, Badge, Button, Card, Field, Input } from "@/components/ui";
import { woNumber } from "@/lib/documents";

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
      <div className="flex flex-wrap gap-2 print:hidden">
        <DownloadPdf href={`/api/documents/invoice/${inv.id}`} />
        <PrintButton />
        {isTrainer && inv.status === "SENT" ? <form action={cancelInvoice}><input type="hidden" name="id" value={inv.id} /><Button variant="danger" size="sm">Cancel invoice</Button></form> : null}
      </div>
      {canPay && inv.status === "SENT" ? (
        <Card className="p-6 print:hidden" glow="violet">
          <h2 className="text-lg font-bold">Record payment</h2>
          <p className="mt-1 text-sm text-muted">Payment happens outside CorpGurus (bank transfer, UPI). Record it here so both sides see the status{inv.purchaseOrder ? "; the purchase order closes automatically once fully paid" : ""}.</p>
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
