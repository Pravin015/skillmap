"use client";

import { savePurchaseOrder } from "@/lib/actions/purchase-orders";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { LineItemsEditor } from "@/components/line-items-editor";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { SAC_CODES, type LineInput } from "@/lib/gst";

export type PoDefaults = { id: string; title: string; poDate: string; validUntil: string; gstRate: number; sacCode: string; currency: string; placeOfSupply: string; supplyMode: string; periodText: string; participants: string; endClientRef: string; paymentTerms: string; deliverables: string; terms: string; notes: string };

export function PoForm({ d, lines, supplierState, buyerState, reissuing }: { d: PoDefaults; lines: LineInput[]; supplierState?: string | null; buyerState?: string | null; reissuing: boolean }) {
  return (
    <ActionForm action={savePurchaseOrder}>
      <Card className="space-y-5 p-6">
        <input type="hidden" name="id" value={d.id} />
        <Field label="Title" hint="Printed as the training name"><Input name="title" required defaultValue={d.title} /></Field>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="PO date"><Input name="poDate" type="date" required defaultValue={d.poDate} /></Field>
          <Field label="Valid until"><Input name="validUntil" type="date" defaultValue={d.validUntil} /></Field>
          <Field label="SAC code"><Select name="sacCode" defaultValue={d.sacCode}>{SAC_CODES.map((s) => <option key={s.code} value={s.code}>{s.code} · {s.label}</option>)}</Select></Field>
          <Field label="Participants"><Input name="participants" type="number" min={1} defaultValue={d.participants} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Delivery mode"><Input name="supplyMode" defaultValue={d.supplyMode} placeholder="Virtual instructor-led (VILT)" /></Field>
          <Field label="Training period" hint="As it should read on the PO"><Input name="periodText" defaultValue={d.periodText} placeholder="1, 2, 3, 4, 8, 9, 10 & 11 September 2026 (8 half days)" /></Field>
          <Field label="End client / project reference" hint="For training partners billing a client"><Input name="endClientRef" defaultValue={d.endClientRef} placeholder="Optional" /></Field>
        </div>
        <Field label="Place of supply / delivery"><Input name="placeOfSupply" defaultValue={d.placeOfSupply} placeholder="Virtual instructor-led training (VILT) · or the venue city" /></Field>
        <LineItemsEditor initial={lines} currency={d.currency} defaultGstRate={d.gstRate} supplierState={supplierState} buyerState={buyerState} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Scope and deliverables" hint="One per line"><Textarea name="deliverables" defaultValue={d.deliverables} className="min-h-28" placeholder={"8 half-day live sessions covering the agreed syllabus\nLab environment access for 25 participants\nAttendance, feedback and pre/post assessment records"} /></Field>
          <Field label="Payment terms" hint="One per line; the first line is shown in the summary"><Textarea name="paymentTerms" defaultValue={d.paymentTerms} className="min-h-28" /></Field>
        </div>
        <Field label="Terms and conditions" hint="One per line. Set a default under Settings → Purchase orders."><Textarea name="terms" defaultValue={d.terms} className="min-h-32" /></Field>
        <Field label="Notes"><Textarea name="notes" defaultValue={d.notes} className="min-h-16" /></Field>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
          <p className="mr-auto text-xs text-muted">Issuing numbers the PO, emails the PDF to the trainer and asks them to accept it.</p>
          <SubmitButton variant="secondary" pendingText="Saving…">Save draft</SubmitButton>
          <button type="submit" name="issue" value="1" className="inline-flex h-10 items-center rounded-lg bg-violet px-4 font-display text-sm font-semibold text-white hover:bg-[#3d3384]">{reissuing ? "Issue revised version" : "Issue purchase order"}</button>
        </div>
      </Card>
    </ActionForm>
  );
}
