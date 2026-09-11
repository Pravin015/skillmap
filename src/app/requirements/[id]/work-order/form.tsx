"use client";

import { useState } from "react";
import type { WorkOrder } from "@prisma/client";
import { saveWorkOrder } from "@/lib/actions/work-orders";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { CURRENCIES, DELIVERY_MODES, modeLabel, money } from "@/lib/utils";

type Defaults = Pick<WorkOrder, "title" | "startDate" | "endDate" | "dayRate" | "currency" | "participants" | "mode" | "venue" | "deliverables" | "provided" | "paymentTerms" | "cancellationTerms" | "notes">;
const iso = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => { const s = new Date(a), e = new Date(b); if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0; return Math.round((e.getTime() - s.getTime()) / 86400000) + 1; };

export function WorkOrderForm({ requirementId, defaults, revising }: { requirementId: string; defaults: Defaults; revising: boolean }) {
  const [start, setStart] = useState(iso(defaults.startDate));
  const [end, setEnd] = useState(iso(defaults.endDate));
  const [rate, setRate] = useState(String(defaults.dayRate || ""));
  const [currency, setCurrency] = useState(defaults.currency);
  const days = daysBetween(start, end);
  const total = days * (Number(rate) || 0);
  return (
    <ActionForm action={saveWorkOrder}>
      <Card className="space-y-5 p-6">
        <input type="hidden" name="requirementId" value={requirementId} />
        <Field label="Title"><Input name="title" required defaultValue={defaults.title} /></Field>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Start"><Input name="startDate" type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="End"><Input name="endDate" type="date" required value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          <Field label="Participants"><Input name="participants" type="number" min={1} required defaultValue={defaults.participants} /></Field>
          <Field label="Delivery"><Select name="mode" defaultValue={defaults.mode}>{DELIVERY_MODES.map((m) => <option key={m} value={m}>{modeLabel[m]}</option>)}</Select></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-[120px_1fr_1fr_1fr]">
          <Field label="Currency"><Select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Day rate"><Input name="dayRate" type="number" min={0} step={500} required value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
          <div className="rounded-lg border border-line bg-surface-2 px-4 py-2.5"><p className="mono text-[11px] uppercase tracking-wider text-muted">Days</p><p className="font-display text-xl font-bold tabular-nums">{days || "—"}</p></div>
          <div className="rounded-lg border border-cyan/30 bg-cyan/5 px-4 py-2.5"><p className="mono text-[11px] uppercase tracking-wider text-muted">Total (ex. GST)</p><p className="font-display text-xl font-bold tabular-nums text-cyan">{total ? money(total, currency) : "—"}</p></div>
        </div>
        <Field label="Venue / logistics" hint="Address or platform, timings, travel and stay arrangements."><Textarea name="venue" defaultValue={defaults.venue} className="min-h-20" /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Trainer delivers" hint="One per line"><Textarea name="deliverables" defaultValue={defaults.deliverables} className="min-h-28" placeholder={"3-day instructor-led delivery\nLab guide and day-2 checklist for participants\nPost-course Q&A call within 2 weeks"} /></Field>
          <Field label="Company provides" hint="One per line"><Textarea name="provided" defaultValue={defaults.provided} className="min-h-28" placeholder={"Official courseware and lab access\nProjector, whiteboard, participant laptops\nAttendance sheet and feedback link"} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Payment terms"><Textarea name="paymentTerms" defaultValue={defaults.paymentTerms} className="min-h-20" placeholder="Invoice on completion, payable within 30 days by bank transfer. GST extra." /></Field>
          <Field label="Cancellation terms"><Textarea name="cancellationTerms" defaultValue={defaults.cancellationTerms} className="min-h-20" placeholder="Free reschedule up to 7 days before start. 50% payable if cancelled within 7 days." /></Field>
        </div>
        <Field label="Notes"><Textarea name="notes" defaultValue={defaults.notes} className="min-h-16" /></Field>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <SubmitButton variant="secondary" pendingText="Saving…">Save draft</SubmitButton>
          <button type="submit" name="send" value="1" className="inline-flex h-10 items-center rounded-lg bg-violet px-4 font-display text-sm font-semibold text-white hover:bg-[#3d3384]">{revising ? "Send revised version" : "Send to trainer"}</button>
        </div>
      </Card>
    </ActionForm>
  );
}
