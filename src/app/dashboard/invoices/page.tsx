import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { raiseInvoice } from "@/lib/actions/invoices";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Badge, Card, Empty, Field, Input, PageHeader, Select, Stat, Textarea } from "@/components/ui";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Invoices" };
const tone = { DRAFT: "neutral", SENT: "amber", PAID: "lime", CANCELLED: "neutral" } as const;
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ raise?: string }> }) {
  const { raise } = await searchParams;
  const user = await requireUser("/dashboard/invoices");
  const isTrainer = !!user.trainerProfile;
  if (!isTrainer && !user.membership) redirect("/dashboard");
  const where = isTrainer ? { trainerId: user.trainerProfile!.id } : { companyId: user.membership!.company.id };
  const invoices = await db.invoice.findMany({ where, include: { trainer: { include: { user: { select: { name: true } } } }, company: { select: { name: true } }, workOrder: { select: { title: true } } }, orderBy: { issuedAt: "desc" } });
  const open = invoices.filter((i) => i.status === "SENT");
  const paid = invoices.filter((i) => i.status === "PAID");
  const sum = (xs: typeof invoices) => xs.reduce((n, i) => n + i.total, 0);
  const overdue = open.filter((i) => i.dueDate < new Date());

  // Trainer: accepted work orders without an invoice yet.
  const invoiceable = isTrainer ? await db.workOrder.findMany({ where: { trainerId: user.trainerProfile!.id, status: "ACCEPTED", invoices: { none: { status: { in: ["SENT", "PAID"] } } } }, include: { company: { select: { name: true, gstin: true } }, requirement: { select: { title: true } } }, orderBy: { acceptedAt: "desc" } }) : [];
  const profile = isTrainer ? await db.trainerProfile.findUnique({ where: { id: user.trainerProfile!.id }, select: { gstin: true, paymentDetails: true } }) : null;
  const raising = raise ? invoiceable.find((w) => w.id === raise) : null;
  const nextNumber = `CG-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, "0")}`;

  return (
    <div>
      <PageHeader eyebrow={isTrainer ? "Trainer" : user.membership!.company.name} title="Invoices" body={isTrainer ? "Raise invoices against accepted work orders and track payment." : "Invoices from trainers for accepted work orders. Record payments once made."} actions={<div className="flex flex-wrap gap-2"><Link href="/api/export/invoices/zoho" className="inline-flex h-8 items-center rounded-full border border-line-2 bg-white px-3.5 font-display text-[13px] font-semibold hover:bg-surface-2">Export for Zoho Books</Link><Link href="/api/export/invoices/tally" className="inline-flex h-8 items-center rounded-full border border-line-2 bg-white px-3.5 font-display text-[13px] font-semibold hover:bg-surface-2">Export for Tally</Link></div>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Outstanding" value={money(sum(open))} tone="amber" /><Stat label="Overdue" value={overdue.length} tone={overdue.length ? "amber" : "lime"} /><Stat label={isTrainer ? "Received" : "Paid"} value={money(sum(paid))} tone="lime" /><Stat label="Invoices" value={invoices.length} />
      </div>

      {isTrainer && invoiceable.length ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Ready to invoice</h2>
          <div className="space-y-2">{invoiceable.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
              <div className="min-w-0 flex-1"><p className="font-medium">{w.title}</p><p className="text-xs text-muted">{w.company.name} · accepted {w.acceptedAt ? fmtDate(w.acceptedAt) : ""} · {money(w.total, w.currency)}</p></div>
              <Link href={`/dashboard/invoices?raise=${w.id}`} className="inline-flex h-8 items-center rounded-lg bg-cyan px-3 font-display text-xs font-semibold text-white hover:bg-navy">Raise invoice</Link>
            </div>
          ))}</div>
        </section>
      ) : null}

      {raising ? (
        <Card className="mt-6 p-6" glow="cyan">
          <h2 className="text-lg font-bold">Invoice for {raising.title}</h2>
          <p className="text-sm text-muted">Bill to {raising.company.name}{raising.company.gstin ? ` · GSTIN ${raising.company.gstin}` : ""}. Work order total {money(raising.total, raising.currency)}.</p>
          <ActionForm action={raiseInvoice} className="mt-4 grid gap-4 md:grid-cols-3">
            <input type="hidden" name="workOrderId" value={raising.id} />
            <Field label="Invoice number"><Input name="invoiceNumber" required defaultValue={nextNumber} /></Field>
            <Field label={`Amount (${raising.currency}, ex. GST)`}><Input name="amount" type="number" min={1} required defaultValue={raising.total} /></Field>
            <Field label="GST rate"><Select name="gstRate" defaultValue={profile?.gstin ? "18" : "0"}><option value="0">0% · not registered / exempt</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option></Select></Field>
            <Field label="Your GSTIN"><Input name="trainerGstin" defaultValue={profile?.gstin ?? ""} placeholder="Optional" /></Field>
            <Field label="Due date"><Input name="dueDate" type="date" defaultValue={inDays(30)} /></Field>
            <Field label="Description"><Input name="description" defaultValue={`${raising.title} · ${raising.days} day${raising.days > 1 ? "s" : ""} × ${money(raising.dayRate, raising.currency)}`} /></Field>
            <Field label="Payment details" hint="Bank account or UPI. Saved for next time." className="md:col-span-3"><Textarea name="paymentDetails" required defaultValue={profile?.paymentDetails ?? ""} className="min-h-20" placeholder={"Account name · Bank · Account no · IFSC\nor UPI id"} /></Field>
            <Field label="Notes" className="md:col-span-3"><Input name="notes" placeholder="Optional" /></Field>
            <div className="md:col-span-3"><SubmitButton pendingText="Sending…">Send invoice</SubmitButton></div>
          </ActionForm>
        </Card>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">All invoices</h2>
        {invoices.length ? (
          <div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full text-sm">
            <thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted"><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">{isTrainer ? "Company" : "Trainer"}</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Due</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-line">{invoices.map((i) => { const od = i.status === "SENT" && i.dueDate < new Date(); return (
              <tr key={i.id} className="hover:bg-surface-2"><td className="px-4 py-3"><Link href={`/invoices/${i.id}`} className="font-medium hover:text-cyan">{i.invoiceNumber}</Link><p className="text-xs text-muted">{i.workOrder.title}</p></td><td className="px-4 py-3">{isTrainer ? i.company.name : i.trainer.user.name}</td><td className="px-4 py-3 text-muted">{fmtDate(i.issuedAt)}</td><td className={`px-4 py-3 ${od ? "text-rose" : "text-muted"}`}>{fmtDate(i.dueDate)}</td><td className="px-4 py-3 text-right tabular-nums">{money(i.total, i.currency)}</td><td className="px-4 py-3"><Badge tone={od ? "rose" : tone[i.status]}>{od ? "overdue" : i.status.toLowerCase()}</Badge></td></tr>
            ); })}</tbody>
          </table></div>
        ) : <Empty title="No invoices yet" body={isTrainer ? "Once a work order is accepted it appears above, ready to invoice." : "Trainers raise invoices here after you accept a work order."} />}
      </section>
    </div>
  );
}
