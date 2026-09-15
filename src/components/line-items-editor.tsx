"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, Input, Select } from "@/components/ui";
import { computeTax, stateName, TAX_LABEL, UNITS, type LineInput } from "@/lib/gst";
import { money } from "@/lib/utils";


/**
 * Line items with quantity, unit and rate, a GST rate select and a live tax preview.
 * Posts `lines` (JSON) and `gstRate`; the server recomputes everything and never trusts the preview.
 */
export function LineItemsEditor({ initial, currency, defaultGstRate, supplierState, buyerState, cap, capLabel }: { initial: LineInput[]; currency: string; defaultGstRate: number; supplierState?: string | null; buyerState?: string | null; cap?: number | null; capLabel?: string }) {
  const [lines, setLines] = useState<LineInput[]>(initial.length ? initial : [{ description: "", qty: "1", unit: "day", rate: "" }]);
  const [gstRate, setGstRate] = useState(String(defaultGstRate));
  const amounts = lines.map((l) => Math.round((Number(l.qty) || 0) * (Number(l.rate) || 0)));
  const subtotal = amounts.reduce((n, a) => n + a, 0);
  const tax = computeTax(subtotal, Number(gstRate) || 0, supplierState, buyerState);
  const update = (i: number, patch: Partial<LineInput>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const over = cap != null && subtotal > cap;
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-4">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="font-display text-sm font-semibold">Line items</p><p className="text-xs text-muted">Training days, lab access per participant, travel, courseware. Amount = quantity × rate, before GST.</p></div>
        <button type="button" onClick={() => setLines((ls) => [...ls, { description: "", qty: "1", unit: "pax", rate: "" }])} className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-2 bg-white px-3 text-xs font-semibold hover:bg-surface-2"><Plus size={13} /> Add line</button>
      </div>
      <div className="mt-3 space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid items-end gap-2 rounded-lg border border-line bg-white p-2 md:grid-cols-[auto_1fr_90px_120px_130px_110px_auto]">
            <p className="mono pb-2.5 text-xs text-muted">{i + 1}</p>
            <Field label="Description"><Input value={l.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Training delivery charges · Kubernetes bootcamp · 8–11 Sep 2026 · 25 participants" required /></Field>
            <Field label="Qty"><Input type="number" min={0} step="0.5" value={l.qty} onChange={(e) => update(i, { qty: e.target.value })} required /></Field>
            <Field label="Unit"><Select value={l.unit} onChange={(e) => update(i, { unit: e.target.value })}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</Select></Field>
            <Field label={`Rate (${currency})`}><Input type="number" min={0} step={100} value={l.rate} onChange={(e) => update(i, { rate: e.target.value })} required /></Field>
            <div className="pb-1 text-right"><p className="mono text-[10px] uppercase text-muted">Amount</p><p className="font-display font-bold tabular-nums">{amounts[i] ? money(amounts[i], currency) : "—"}</p></div>
            <button type="button" aria-label="Remove line" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="mb-1 rounded-lg p-2 text-muted hover:bg-rose/10 hover:text-rose disabled:opacity-30"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="GST rate" hint={tax.taxType === "NONE" ? "No GST line on the document" : `${TAX_LABEL[tax.taxType]}${supplierState && buyerState ? ` · ${stateName(supplierState)} → ${stateName(buyerState)}` : " · add both parties' states for a CGST/SGST split"}`}>
            <Select name="gstRate" value={gstRate} onChange={(e) => setGstRate(e.target.value)}><option value="0">0% · not registered / exempt</option><option value="5">5%</option><option value="12">12%</option><option value="18">18% · standard for training (SAC 9992)</option><option value="28">28%</option></Select>
          </Field>
          {cap != null ? <div className={`rounded-lg border px-4 py-2.5 ${over ? "border-rose/40 bg-rose/5" : "border-line bg-white"}`}><p className="mono text-[11px] uppercase tracking-wider text-muted">{capLabel ?? "Available under the PO"}</p><p className={`font-display text-lg font-bold tabular-nums ${over ? "text-rose" : ""}`}>{money(cap, currency)}</p>{over ? <p className="text-xs text-rose">Over the purchase order by {money(subtotal - cap, currency)}. Ask the company to revise it.</p> : null}</div> : null}
        </div>
        <dl className="min-w-64 space-y-1 rounded-lg border border-cyan/30 bg-cyan/5 px-4 py-3 text-sm">
          <Row l="Sub-total" v={money(subtotal, currency)} />
          {tax.taxType === "CGST_SGST" ? <><Row l={`CGST @ ${Number(gstRate) / 2}%`} v={money(tax.cgst, currency)} /><Row l={`SGST @ ${Number(gstRate) / 2}%`} v={money(tax.sgst, currency)} /></> : tax.taxType === "IGST" ? <Row l={`IGST @ ${gstRate}%`} v={money(tax.igst, currency)} /> : null}
          <div className="flex items-center justify-between border-t border-cyan/20 pt-1.5"><dt className="font-display font-semibold">Total</dt><dd className="font-display text-lg font-bold tabular-nums text-cyan">{money(tax.total, currency)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
const Row = ({ l, v }: { l: string; v: string }) => <div className="flex items-center justify-between"><dt className="text-muted">{l}</dt><dd className="tabular-nums">{v}</dd></div>;
