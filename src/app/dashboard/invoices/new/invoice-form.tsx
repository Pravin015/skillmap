"use client";

import { raiseInvoice } from "@/lib/actions/invoices";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { LineItemsEditor } from "@/components/line-items-editor";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { SAC_CODES, type LineInput } from "@/lib/gst";

export type InvoiceDefaults = { workOrderId: string; purchaseOrderId: string; poNumber: string; nextNumber: string; currency: string; gstRate: number; gstin: string; sacCode: string; placeOfSupply: string; periodText: string; participants: string; endClientRef: string; dueDate: string; signatoryName: string; hasBank: boolean; paymentDetails: string };

export function InvoiceForm({ d, lines, supplierState, buyerState, cap }: { d: InvoiceDefaults; lines: LineInput[]; supplierState?: string | null; buyerState?: string | null; cap: number | null }) {
  return (
    <ActionForm action={raiseInvoice}>
      <Card className="space-y-5 p-6" glow="cyan">
        <input type="hidden" name="workOrderId" value={d.workOrderId} />
        <input type="hidden" name="purchaseOrderId" value={d.purchaseOrderId} />
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Invoice number" hint="Leave blank to use your series"><Input name="invoiceNumber" placeholder={d.nextNumber} /></Field>
          <Field label="Invoice due"><Input name="dueDate" type="date" required defaultValue={d.dueDate} /></Field>
          <Field label="SAC code"><Select name="sacCode" defaultValue={d.sacCode}>{SAC_CODES.map((s) => <option key={s.code} value={s.code}>{s.code} · {s.label}</option>)}</Select></Field>
          {d.purchaseOrderId ? <Field label="P.O. number"><Input value={d.poNumber} readOnly /></Field> : <Field label="Client P.O. number" hint="If they sent one outside CorpGurus"><Input name="poNumber" placeholder="Optional" /></Field>}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Training period" hint="Actual delivered dates"><Input name="periodText" defaultValue={d.periodText} placeholder="1, 2, 3, 4, 8, 9, 10 & 11 September 2026 (8 half days)" /></Field>
          <Field label="Participants"><Input name="participants" type="number" min={1} defaultValue={d.participants} /></Field>
          <Field label="End client / project reference"><Input name="endClientRef" defaultValue={d.endClientRef} placeholder="Optional" /></Field>
        </div>
        <Field label="Place of supply"><Input name="placeOfSupply" defaultValue={d.placeOfSupply} placeholder="Virtual instructor-led training (VILT) · or the venue city" /></Field>
        <LineItemsEditor initial={lines} currency={d.currency} defaultGstRate={d.gstRate} supplierState={supplierState} buyerState={buyerState} cap={cap} capLabel="Remaining under the PO (ex. GST)" />
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Your GSTIN" hint="Required to charge GST"><Input name="trainerGstin" defaultValue={d.gstin} placeholder="27ABCDE1234F1Z5" className="uppercase" /></Field>
          <Field label="Signatory name" hint="Printed under “Authorised signatory”"><Input name="signatoryName" defaultValue={d.signatoryName} /></Field>
          <Field label="Bank details on the invoice">
            {d.hasBank ? <label className="flex h-10 items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-sm"><input type="checkbox" name="includeBank" value="1" defaultChecked className="accent-cyan" /> Print the account on file</label> : <Textarea name="paymentDetails" defaultValue={d.paymentDetails} className="min-h-10" placeholder={"Account name: …\nAccount number: …\nIFSC code: …"} />}
          </Field>
        </div>
        <Field label="Notes" hint="One per line. Delivery confirmation, TDS, records submitted."><Textarea name="notes" className="min-h-24" defaultValue={"Invoice raised for the days actually delivered as per the work order.\nAttendance records, feedback forms and assessment results have been submitted."} /></Field>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
          <p className="mr-auto text-xs text-muted">Sending emails the PDF to the company&apos;s finance and hiring contacts and notifies them in CorpGurus.</p>
          <SubmitButton pendingText="Sending…">Send invoice</SubmitButton>
        </div>
      </Card>
    </ActionForm>
  );
}
