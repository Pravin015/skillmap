"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { WorkOrder } from "@prisma/client";
import { saveWorkOrder } from "@/lib/actions/work-orders";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { CURRENCIES, DELIVERY_MODES, modeLabel, money } from "@/lib/utils";

type Defaults = Pick<WorkOrder, "title" | "startDate" | "endDate" | "dayRate" | "currency" | "participants" | "mode" | "venue" | "deliverables" | "provided" | "paymentTerms" | "cancellationTerms" | "notes">;
export type BatchInput = { label: string; startDate: string; endDate: string; participants: string; city: string };
const iso = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => { const s = new Date(a), e = new Date(b); if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0; return Math.round((e.getTime() - s.getTime()) / 86400000) + 1; };

export function WorkOrderForm({ requirementId, defaults, revising, initialBatches }: { requirementId: string; defaults: Defaults; revising: boolean; initialBatches: BatchInput[] }) {
  const [start, setStart] = useState(iso(defaults.startDate));
  const [end, setEnd] = useState(iso(defaults.endDate));
  const [rate, setRate] = useState(String(defaults.dayRate || ""));
  const [currency, setCurrency] = useState(defaults.currency);
  const [batches, setBatches] = useState<BatchInput[]>(initialBatches);
  const multi = batches.length > 0;
  const batchDays = batches.map((b) => daysBetween(b.startDate, b.endDate));
  const days = multi ? batchDays.reduce((n, d) => n + d, 0) : daysBetween(start, end);
  const total = days * (Number(rate) || 0);
  const participants = multi ? batches.reduce((n, b) => n + (Number(b.participants) || 0), 0) : null;
  const update = (i: number, patch: Partial<BatchInput>) => setBatches((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const addBatch = () => setBatches((bs) => [...bs, { label: `Batch ${bs.length + 1}`, startDate: bs.length ? bs[bs.length - 1].endDate : start, endDate: bs.length ? bs[bs.length - 1].endDate : end, participants: "", city: "" }]);
  return (
    <ActionForm action={saveWorkOrder}>
      <Card className="space-y-5 p-6">
        <input type="hidden" name="requirementId" value={requirementId} />
        <input type="hidden" name="batches" value={JSON.stringify(batches)} />
        <Field label="Title"><Input name="title" required defaultValue={defaults.title} /></Field>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label={multi ? "Start (from batches)" : "Start"}><Input name="startDate" type="date" required value={multi ? batches.map((b) => b.startDate).filter(Boolean).sort()[0] ?? start : start} onChange={(e) => setStart(e.target.value)} readOnly={multi} /></Field>
          <Field label={multi ? "End (from batches)" : "End"}><Input name="endDate" type="date" required value={multi ? batches.map((b) => b.endDate).filter(Boolean).sort().at(-1) ?? end : end} onChange={(e) => setEnd(e.target.value)} readOnly={multi} /></Field>
          <Field label={multi ? "Participants (total)" : "Participants"}>{multi ? <Input name="participants" type="number" value={participants ?? 0} readOnly /> : <Input name="participants" type="number" min={1} required defaultValue={defaults.participants} />}</Field>
          <Field label="Delivery"><Select name="mode" defaultValue={defaults.mode}>{DELIVERY_MODES.map((m) => <option key={m} value={m}>{modeLabel[m]}</option>)}</Select></Field>
        </div>

        <div className="rounded-xl border border-line bg-surface-2/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-display text-sm font-semibold">Batches</p><p className="text-xs text-muted">Optional. Split the engagement into multiple batches or cities; days and participants add up automatically.</p></div>
            <button type="button" onClick={addBatch} className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-2 bg-white px-3 text-xs font-semibold hover:bg-surface-2"><Plus size={13} /> Add batch</button>
          </div>
          {multi ? (
            <div className="mt-3 space-y-2">
              {batches.map((b, i) => (
                <div key={i} className="grid items-end gap-2 rounded-lg border border-line bg-white p-2 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_1fr_auto_auto]">
                  <Field label="Label"><Input value={b.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Batch 1 · Bengaluru" /></Field>
                  <Field label="Start"><Input type="date" value={b.startDate} onChange={(e) => update(i, { startDate: e.target.value })} /></Field>
                  <Field label="End"><Input type="date" value={b.endDate} onChange={(e) => update(i, { endDate: e.target.value })} /></Field>
                  <Field label="People"><Input type="number" min={1} value={b.participants} onChange={(e) => update(i, { participants: e.target.value })} /></Field>
                  <Field label="City / platform"><Input value={b.city} onChange={(e) => update(i, { city: e.target.value })} placeholder="Optional" /></Field>
                  <div className="pb-1 text-center"><p className="mono text-[10px] uppercase text-muted">Days</p><p className="font-display font-bold tabular-nums">{batchDays[i] || "—"}</p></div>
                  <button type="button" aria-label="Remove batch" onClick={() => setBatches((bs) => bs.filter((_, j) => j !== i))} className="mb-1 rounded-lg p-2 text-muted hover:bg-rose/10 hover:text-rose"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-[120px_1fr_1fr_1fr]">
          <Field label="Currency"><Select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Day rate"><Input name="dayRate" type="number" min={0} step={500} required value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
          <div className="rounded-lg border border-line bg-surface-2 px-4 py-2.5"><p className="mono text-[11px] uppercase tracking-wider text-muted">Days{multi ? ` · ${batches.length} batches` : ""}</p><p className="font-display text-xl font-bold tabular-nums">{days || "—"}</p></div>
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
        <div className="flex flex-wrap items-end justify-end gap-3 border-t border-line pt-4">
          <Field label="Sign as (type your full name to send)" className="min-w-64 flex-1"><Input name="signedName" placeholder="Your full name" /></Field>
          <SubmitButton variant="secondary" pendingText="Saving…">Save draft</SubmitButton>
          <button type="submit" name="send" value="1" className="inline-flex h-10 items-center rounded-lg bg-violet px-4 font-display text-sm font-semibold text-white hover:bg-[#3d3384]">{revising ? "Send revised version" : "Send to trainer"}</button>
        </div>
      </Card>
    </ActionForm>
  );
}
