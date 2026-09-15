import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Empty, PageHeader, Stat } from "@/components/ui";
import { poNumberOf } from "@/lib/documents";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Invoices" };
const tone = { DRAFT: "neutral", SENT: "amber", PAID: "lime", CANCELLED: "neutral" } as const;

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ raise?: string }> }) {
  const { raise } = await searchParams;
  if (raise) redirect(`/dashboard/invoices/new?workOrder=${raise}`);
  const user = await requireUser("/dashboard/invoices");
  const isTrainer = !!user.trainerProfile;
  if (!isTrainer && !user.membership) redirect("/dashboard");
  const where = isTrainer ? { trainerId: user.trainerProfile!.id } : { companyId: user.membership!.company.id };
  const invoices = await db.invoice.findMany({ where, include: { trainer: { include: { user: { select: { name: true } } } }, company: { select: { name: true } }, workOrder: { select: { title: true } }, purchaseOrder: { select: { id: true, poNumber: true, number: true } } }, orderBy: { issuedAt: "desc" } });
  const open = invoices.filter((i) => i.status === "SENT");
  const paid = invoices.filter((i) => i.status === "PAID");
  const sum = (xs: typeof invoices) => xs.reduce((n, i) => n + i.total, 0);
  const overdue = open.filter((i) => i.dueDate < new Date());

  // Trainer: accepted work orders that still have something to bill (no invoice yet, or an accepted PO with value remaining).
  const accepted = isTrainer ? await db.workOrder.findMany({ where: { trainerId: user.trainerProfile!.id, status: "ACCEPTED" }, include: { company: { select: { name: true } }, invoices: { where: { status: { in: ["SENT", "PAID"] } }, select: { amount: true, purchaseOrderId: true } }, purchaseOrders: { where: { status: { in: ["ACCEPTED", "ISSUED"] } }, select: { id: true, poNumber: true, number: true, status: true, subtotal: true } } }, orderBy: { acceptedAt: "desc" } }) : [];
  const invoiceable = accepted.map((w) => { const po = w.purchaseOrders.find((p) => p.status === "ACCEPTED"); const pending = w.purchaseOrders.find((p) => p.status === "ISSUED"); const billed = po ? w.invoices.filter((i) => i.purchaseOrderId === po.id).reduce((n, i) => n + i.amount, 0) : 0; return { ...w, po, pending, remaining: po ? po.subtotal - billed : null }; }).filter((w) => (w.po ? w.remaining! > 0 : !w.invoices.length));

  return (
    <div>
      <PageHeader eyebrow={isTrainer ? "Trainer" : user.membership!.company.name} title="Invoices" body={isTrainer ? "Raise invoices against accepted work orders and track payment." : "Invoices from trainers for accepted work orders. Record payments once made."} actions={<div className="flex flex-wrap gap-2"><Link href="/dashboard/purchase-orders" className="inline-flex h-8 items-center rounded-full border border-line-2 bg-white px-3.5 font-display text-[13px] font-semibold hover:bg-surface-2">Purchase orders</Link><Link href="/api/export/invoices/zoho" className="inline-flex h-8 items-center rounded-full border border-line-2 bg-white px-3.5 font-display text-[13px] font-semibold hover:bg-surface-2">Export for Zoho Books</Link><Link href="/api/export/invoices/tally" className="inline-flex h-8 items-center rounded-full border border-line-2 bg-white px-3.5 font-display text-[13px] font-semibold hover:bg-surface-2">Export for Tally</Link></div>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Outstanding" value={money(sum(open))} tone="amber" /><Stat label="Overdue" value={overdue.length} tone={overdue.length ? "amber" : "lime"} /><Stat label={isTrainer ? "Received" : "Paid"} value={money(sum(paid))} tone="lime" /><Stat label="Invoices" value={invoices.length} />
      </div>

      {isTrainer && invoiceable.length ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Ready to invoice</h2>
          <div className="space-y-2">{invoiceable.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
              <div className="min-w-0 flex-1"><p className="font-medium">{w.title}</p><p className="text-xs text-muted">{w.company.name} · accepted {w.acceptedAt ? fmtDate(w.acceptedAt) : ""} · {w.po ? <>PO {w.po.poNumber} · {money(w.remaining!, w.currency)} remaining</> : w.pending ? <>PO {poNumberOf(w.pending)} awaiting your acceptance</> : money(w.total, w.currency)}</p></div>
              {w.pending && !w.po ? <Link href={`/purchase-orders/${w.pending.id}`} className="inline-flex h-8 items-center rounded-lg border border-line-2 bg-white px-3 font-display text-xs font-semibold hover:bg-surface-2">Review PO</Link> : null}
              <Link href={`/dashboard/invoices/new?workOrder=${w.id}${w.po ? `&po=${w.po.id}` : ""}`} className="inline-flex h-8 items-center rounded-lg bg-cyan px-3 font-display text-xs font-semibold text-white hover:bg-navy">{w.po ? "Invoice against PO" : "Raise invoice"}</Link>
            </div>
          ))}</div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">All invoices</h2>
        {invoices.length ? (
          <div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full text-sm">
            <thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted"><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">{isTrainer ? "Company" : "Trainer"}</th><th className="px-4 py-3">PO</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Due</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-line">{invoices.map((i) => { const od = i.status === "SENT" && i.dueDate < new Date(); return (
              <tr key={i.id} className="hover:bg-surface-2"><td className="px-4 py-3"><Link href={`/invoices/${i.id}`} className="font-medium hover:text-cyan">{i.invoiceNumber}</Link><p className="text-xs text-muted">{i.workOrder.title}</p></td><td className="px-4 py-3">{isTrainer ? i.company.name : i.trainer.user.name}</td><td className="px-4 py-3 text-muted">{i.purchaseOrder ? <Link href={`/purchase-orders/${i.purchaseOrder.id}`} className="hover:text-cyan">{i.purchaseOrder.poNumber}</Link> : i.poNumber ?? "—"}</td><td className="px-4 py-3 text-muted">{fmtDate(i.issuedAt)}</td><td className={`px-4 py-3 ${od ? "text-rose" : "text-muted"}`}>{fmtDate(i.dueDate)}</td><td className="px-4 py-3 text-right tabular-nums">{money(i.total, i.currency)}</td><td className="px-4 py-3"><Badge tone={od ? "rose" : tone[i.status]}>{od ? "overdue" : i.status.toLowerCase()}</Badge></td></tr>
            ); })}</tbody>
          </table></div>
        ) : <Empty title="No invoices yet" body={isTrainer ? "Once a work order is accepted it appears above, ready to invoice." : "Trainers raise invoices here after you accept a work order."} />}
      </section>
    </div>
  );
}
