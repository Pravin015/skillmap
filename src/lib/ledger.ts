import "server-only";
import { db } from "@/lib/db";

export type LedgerEntry = { id: string; date: Date; kind: "invoice" | "payment" | "credit_note" | "tds"; ref: string; href: string; note?: string; partyId: string; party: string; debit: number; credit: number };

/** Receivables ledger for a trainer or payables ledger for a company, built from invoices, payments, TDS and credit notes. */
export async function ledgerFor(scope: { trainerId: string } | { companyId: string }) {
  const trainerSide = "trainerId" in scope;
  const invoices = await db.invoice.findMany({ where: { ...scope, status: { in: ["SENT", "PAID"] } }, include: { company: { select: { id: true, name: true } }, trainer: { select: { id: true, user: { select: { name: true } } } }, creditNotes: { orderBy: { createdAt: "asc" } } }, orderBy: { issuedAt: "asc" } });
  const entries: LedgerEntry[] = [];
  for (const i of invoices) {
    const partyId = trainerSide ? i.company.id : i.trainer.id;
    const party = trainerSide ? i.company.name : i.trainer.user.name;
    entries.push({ id: `inv-${i.id}`, date: i.issuedAt, kind: "invoice", ref: i.invoiceNumber, href: `/invoices/${i.id}`, note: i.description, partyId, party, debit: i.total, credit: 0 });
    for (const c of i.creditNotes) entries.push({ id: `cn-${c.id}`, date: c.createdAt, kind: "credit_note", ref: c.creditNumber, href: `/invoices/${i.id}`, note: c.reason, partyId, party, debit: 0, credit: c.total });
    if (i.status === "PAID" && i.paidAt) {
      if (i.tdsAmount) entries.push({ id: `tds-${i.id}`, date: i.paidAt, kind: "tds", ref: `${i.invoiceNumber} · TDS ${i.tdsRate}%`, href: `/invoices/${i.id}`, partyId, party, debit: 0, credit: i.tdsAmount });
      const credits = i.creditNotes.reduce((n, c) => n + c.total, 0);
      const received = i.amountReceived ?? Math.max(0, i.total - i.tdsAmount - credits);
      entries.push({ id: `pay-${i.id}`, date: i.paidAt, kind: "payment", ref: i.paidReference ? `${i.invoiceNumber} · ${i.paidReference}` : i.invoiceNumber, href: `/invoices/${i.id}`, partyId, party, debit: 0, credit: received });
    }
  }
  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  const totals = {
    invoiced: entries.filter((e) => e.kind === "invoice").reduce((n, e) => n + e.debit, 0),
    paid: entries.filter((e) => e.kind === "payment").reduce((n, e) => n + e.credit, 0),
    tds: entries.filter((e) => e.kind === "tds").reduce((n, e) => n + e.credit, 0),
    credits: entries.filter((e) => e.kind === "credit_note").reduce((n, e) => n + e.credit, 0),
    outstanding: 0,
  };
  totals.outstanding = totals.invoiced - totals.paid - totals.tds - totals.credits;
  return { entries, totals };
}

export function ledgerCsv(entries: LedgerEntry[]) {
  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  let bal = 0;
  const rows = entries.map((e) => { bal += e.debit - e.credit; return [e.date.toISOString().slice(0, 10), e.kind, e.ref, e.party, e.note ?? "", e.debit || "", e.credit || "", bal]; });
  return [["Date", "Type", "Reference", "Party", "Note", "Debit", "Credit", "Balance"], ...rows].map((r) => r.map(esc).join(",")).join("\n");
}
