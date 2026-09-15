import Link from "next/link";
import { Download } from "lucide-react";
import { Logo } from "@/components/shell";
import { Card } from "@/components/ui";
import { amountInWords, fmtQty } from "@/lib/gst";
import type { DocModel, PartyBlock } from "@/lib/pdf/documents";
import { fmtDate, money } from "@/lib/utils";

/** On-screen rendering of an invoice or purchase order, mirroring the PDF layout. */
export function DocumentView({ m }: { m: DocModel }) {
  const fmt = (n: number) => money(n, m.currency);
  return (
    <Card className="relative overflow-hidden p-8 print:border-0 print:shadow-none">
      {m.watermark ? <p className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -rotate-[25deg] select-none font-display text-8xl font-black text-lilac/40">{m.watermark}</p> : null}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div><Logo /><p className="mono mt-3 text-[11px] uppercase tracking-[0.08em] text-muted">Generated on CorpGurus</p></div>
        <div className="text-right"><p className="font-display text-2xl font-bold tracking-wide text-cyan">{m.title}</p>{m.subtitle ? <p className="text-xs text-muted">{m.subtitle}</p> : null}{m.status ? <p className="mono mt-1 inline-block rounded bg-navy px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">{m.status}</p> : null}</div>
      </div>
      <div className="grid gap-4 py-5 md:grid-cols-2">
        <Party label={m.fromLabel} p={m.from} />
        <Party label={m.toLabel} p={m.to} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-line bg-surface-2 p-4 md:grid-cols-3">
        <Meta l={m.kind === "INVOICE" ? "Invoice no." : "PO number"} v={m.number} accent />
        <Meta l={m.kind === "INVOICE" ? "Invoice date" : "PO date"} v={fmtDate(m.date)} />
        {m.meta.map(([l, v]) => <Meta key={l} l={l} v={v || "—"} />)}
      </dl>
      {m.supply?.length ? <div className="mt-4 rounded-xl border border-line p-4"><p className="mono text-[11px] uppercase tracking-wider text-muted">Place of supply / delivery</p>{m.supply.map((l, i) => <p key={i} className="text-sm">{l}</p>)}</div> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="mono bg-navy text-left text-[11px] uppercase tracking-wider text-white"><th className="rounded-l-lg px-3 py-2">SL</th><th className="px-3 py-2">Description of service</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Rate</th><th className="rounded-r-lg px-3 py-2 text-right">Amount</th></tr></thead>
          <tbody className="divide-y divide-line">{m.lines.map((l, i) => <tr key={i}><td className="mono px-3 py-2.5 text-xs text-muted">{i + 1}</td><td className="px-3 py-2.5">{l.description}</td><td className="px-3 py-2.5 text-right tabular-nums">{fmtQty(l.qty)} {l.unit}</td><td className="px-3 py-2.5 text-right tabular-nums">{fmt(l.rate)}</td><td className="px-3 py-2.5 text-right font-medium tabular-nums">{fmt(l.amount)}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <dl className="w-full max-w-sm space-y-1 text-sm">
          <Row l="Sub-total (taxable value)" v={fmt(m.subtotal)} />
          {m.taxType === "CGST_SGST" ? <><Row l={`CGST @ ${m.gstRate / 2}%`} v={fmt(m.cgst)} /><Row l={`SGST @ ${m.gstRate / 2}%`} v={fmt(m.sgst)} /></> : m.taxType === "IGST" ? <Row l={`IGST @ ${m.gstRate}%`} v={fmt(m.igst)} /> : <Row l="GST" v="Not applicable" />}
          <div className="flex items-center justify-between rounded-lg bg-cyan/5 px-3 py-2"><dt className="font-display font-bold">{m.kind === "INVOICE" ? "Total payable" : "PO value (incl. GST)"}</dt><dd className="font-display text-lg font-bold tabular-nums text-cyan">{fmt(m.total)}</dd></div>
        </dl>
      </div>
      <p className="mt-3 text-sm"><span className="font-semibold">Amount in words:</span> {amountInWords(m.total, m.currency)}</p>
      {m.bank?.length ? (
        <div className="mt-6"><h3 className="mono text-[11px] uppercase tracking-wider text-cyan">Bank details for payment</h3>
          <dl className="mt-2 grid gap-x-6 gap-y-1 rounded-xl border border-line p-4 text-sm sm:grid-cols-2">{m.bank.map(([k, v], i) => <div key={i} className="flex gap-3"><dt className="w-32 shrink-0 text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl></div>
      ) : null}
      {m.sections?.filter((x) => x.lines.length).map((x) => (
        <div key={x.title} className="mt-5"><h3 className="mono text-[11px] uppercase tracking-wider text-cyan">{x.title}</h3><ol className={`mt-1.5 space-y-1 text-sm text-ink/90 ${x.lines.length > 1 ? "list-decimal pl-5" : ""}`}>{x.lines.map((l, i) => <li key={i}>{l}</li>)}</ol></div>
      ))}
      {m.declaration ? <p className="mt-5 text-xs text-muted"><span className="font-semibold text-ink">Declaration:</span> {m.declaration}</p> : null}
      <div className="mt-8 grid gap-6 border-t border-line pt-5 text-sm md:grid-cols-2">
        {m.signatories.map((g) => <div key={g.label}><p className="mono text-[11px] uppercase tracking-wider text-muted">{g.label}</p><p className="mt-1 font-display text-xl italic">{g.name || <span className="text-muted">—</span>}</p><p className="text-xs text-muted">{g.caption ?? (g.name ? "Authorised signatory" : "Not yet signed")}</p></div>)}
      </div>
      <p className="mono mt-6 border-t border-line pt-3 text-center text-[10px] text-dim">{m.footer}</p>
    </Card>
  );
}

function Party({ label, p }: { label: string; p: PartyBlock }) {
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <p className="mono text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-semibold">{p.name}</p>
      {p.address ? <p className="whitespace-pre-line text-sm text-muted">{p.address}</p> : null}
      {p.contact ? <p className="text-xs text-muted">{p.contact}</p> : null}
      {p.gstin || p.pan ? <p className="mono mt-1 text-xs text-muted">{[p.gstin ? `GSTIN ${p.gstin}` : null, p.pan ? `PAN ${p.pan}` : null].filter(Boolean).join(" · ")}</p> : null}
      {p.state ? <p className="mono text-xs text-muted">State: {p.state}</p> : null}
    </div>
  );
}
const Meta = ({ l, v, accent }: { l: string; v: string; accent?: boolean }) => <div><dt className="mono text-[10px] uppercase tracking-wider text-muted">{l}</dt><dd className={`mt-0.5 text-sm font-semibold ${accent ? "text-cyan" : ""}`}>{v}</dd></div>;
const Row = ({ l, v }: { l: string; v: string }) => <div className="flex items-center justify-between px-3"><dt className="text-muted">{l}</dt><dd className="tabular-nums">{v}</dd></div>;

export function DownloadPdf({ href, label = "Download PDF" }: { href: string; label?: string }) {
  return <Link href={href} prefetch={false} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan px-3 font-display text-sm font-semibold text-white hover:bg-navy"><Download size={15} /> {label}</Link>;
}
