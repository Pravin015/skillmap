import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ledgerFor } from "@/lib/ledger";
import { Badge, Empty, PageHeader, Stat } from "@/components/ui";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Ledger" };
const runningBalance = <T extends { debit: number; credit: number }>(rows: T[]) => rows.reduce<(T & { balance: number })[]>((acc, e) => { const prev = acc.length ? acc[acc.length - 1].balance : 0; acc.push({ ...e, balance: prev + e.debit - e.credit }); return acc; }, []);

export default async function LedgerPage({ searchParams }: { searchParams: Promise<{ party?: string }> }) {
  const { party } = await searchParams;
  const user = await requireUser("/dashboard/ledger");
  const isTrainer = !!user.trainerProfile;
  if (!isTrainer && !user.membership) redirect("/dashboard");
  const ledger = await ledgerFor(isTrainer ? { trainerId: user.trainerProfile!.id } : { companyId: user.membership!.company.id });
  const parties = [...new Map(ledger.entries.map((e) => [e.partyId, e.party])).entries()];
  const rows = party ? ledger.entries.filter((e) => e.partyId === party) : ledger.entries;
  const withBalance = runningBalance(rows);
  const kindTone = { invoice: "amber", payment: "lime", credit_note: "violet", tds: "neutral" } as const;
  const kindLabel = { invoice: "Invoice", payment: "Payment", credit_note: "Credit note", tds: "TDS deducted" } as const;

  return (
    <div>
      <PageHeader eyebrow={isTrainer ? "Trainer" : user.membership!.company.name} title="Ledger" body={isTrainer ? "Every invoice, payment, credit note and TDS deduction, with the running balance each company owes you." : "What you owe each trainer: invoices received, payments recorded, credit notes and TDS withheld."} actions={<Link href={`/api/export/ledger${party ? `?party=${party}` : ""}`} prefetch={false} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-2 bg-white px-3.5 font-display text-[13px] font-semibold hover:bg-surface-2"><Download size={14} /> ledger.csv</Link>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Invoiced (incl. GST)" value={money(ledger.totals.invoiced)} /><Stat label={isTrainer ? "Received" : "Paid"} value={money(ledger.totals.paid)} tone="lime" /><Stat label="TDS withheld" value={money(ledger.totals.tds)} tone="violet" /><Stat label={isTrainer ? "Outstanding" : "Payable"} value={money(ledger.totals.outstanding)} tone={ledger.totals.outstanding > 0 ? "amber" : "lime"} />
      </div>
      {parties.length > 1 ? <div className="mt-5 flex flex-wrap gap-2 text-sm"><Link href="/dashboard/ledger" className={`rounded-full border px-3 py-1 ${!party ? "border-cyan bg-cyan text-white" : "border-line-2 bg-white hover:bg-surface-2"}`}>All</Link>{parties.map(([id, name]) => <Link key={id} href={`/dashboard/ledger?party=${id}`} className={`rounded-full border px-3 py-1 ${party === id ? "border-cyan bg-cyan text-white" : "border-line-2 bg-white hover:bg-surface-2"}`}>{name}</Link>)}</div> : null}
      <section className="mt-6">
        {withBalance.length ? (
          <div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full text-sm">
            <thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Entry</th><th className="px-4 py-3">{isTrainer ? "Company" : "Trainer"}</th><th className="px-4 py-3 text-right">Debit</th><th className="px-4 py-3 text-right">Credit</th><th className="px-4 py-3 text-right">Balance</th></tr></thead>
            <tbody className="divide-y divide-line">{withBalance.map((e) => (
              <tr key={e.id} className="hover:bg-surface-2"><td className="px-4 py-3 text-muted">{fmtDate(e.date)}</td><td className="px-4 py-3"><Badge tone={kindTone[e.kind]}>{kindLabel[e.kind]}</Badge> <Link href={e.href} className="ml-1 font-medium hover:text-cyan">{e.ref}</Link>{e.note ? <p className="text-xs text-muted">{e.note}</p> : null}</td><td className="px-4 py-3">{e.party}</td><td className="px-4 py-3 text-right tabular-nums">{e.debit ? money(e.debit) : ""}</td><td className="px-4 py-3 text-right tabular-nums">{e.credit ? money(e.credit) : ""}</td><td className={`px-4 py-3 text-right font-medium tabular-nums ${e.balance > 0 ? "text-amber" : ""}`}>{money(e.balance)}</td></tr>
            ))}</tbody>
          </table></div>
        ) : <Empty title="Nothing on the ledger yet" body={isTrainer ? "Invoices you raise, payments recorded against them, credit notes and TDS appear here." : "Invoices from trainers and the payments you record appear here."} />}
      </section>
      <p className="mt-3 text-xs text-muted">Debit = amount owed {isTrainer ? "to you" : "by you"} (invoice total incl. GST). Credit = payment received, TDS withheld or credit note issued. Balance is the running amount still due.</p>
    </div>
  );
}
