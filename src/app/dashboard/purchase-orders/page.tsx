import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { companyCan } from "@/lib/permissions";
import { createPurchaseOrder } from "@/lib/actions/purchase-orders";
import { poNumberOf, woNumber } from "@/lib/documents";
import { Alert, Badge, Button, Empty, PageHeader, Stat } from "@/components/ui";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Purchase orders" };
const tone = { DRAFT: "neutral", ISSUED: "amber", CHANGES_REQUESTED: "rose", ACCEPTED: "lime", CLOSED: "neutral", CANCELLED: "neutral" } as const;
const label = { DRAFT: "Draft", ISSUED: "Awaiting trainer", CHANGES_REQUESTED: "Changes requested", ACCEPTED: "Accepted", CLOSED: "Closed", CANCELLED: "Cancelled" } as const;

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const user = await requireUser("/dashboard/purchase-orders");
  const isTrainer = !!user.trainerProfile;
  if (!isTrainer && !user.membership) redirect("/dashboard");
  const where = isTrainer ? { trainerId: user.trainerProfile!.id } : { companyId: user.membership!.company.id };
  const pos = await db.purchaseOrder.findMany({ where, include: { trainer: { select: { user: { select: { name: true } } } }, company: { select: { name: true } }, workOrder: { select: { number: true, requirementId: true } }, invoices: { where: { status: { in: ["SENT", "PAID"] } }, select: { amount: true, status: true } } }, orderBy: { createdAt: "desc" } });
  const open = pos.filter((p) => p.status === "ACCEPTED");
  const awaiting = pos.filter((p) => p.status === "ISSUED");
  const openValue = open.reduce((n, p) => n + p.subtotal, 0);
  const billed = open.reduce((n, p) => n + p.invoices.reduce((m, i) => m + i.amount, 0), 0);
  const canSign = !isTrainer && companyCan(user.membership!.role, "sign_work_order");
  const withoutPo = canSign ? await db.workOrder.findMany({ where: { companyId: user.membership!.company.id, status: "ACCEPTED", purchaseOrders: { none: { status: { not: "CANCELLED" } } } }, select: { id: true, number: true, title: true, total: true, currency: true, acceptedAt: true, trainer: { select: { user: { select: { name: true } } } } }, orderBy: { acceptedAt: "desc" } }) : [];

  return (
    <div>
      <PageHeader eyebrow={isTrainer ? "Trainer" : user.membership!.company.name} title="Purchase orders" body={isTrainer ? "Purchase orders companies issue to you against accepted work orders. Accept them, then invoice against them." : "Formal POs for your trainers: numbered, GST-aware, sent as PDF, with invoices tracked against each one."} />
      {err === "perm" ? <Alert tone="rose">You do not have permission to issue purchase orders for this company.</Alert> : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Awaiting acceptance" value={awaiting.length} tone={awaiting.length ? "amber" : "lime"} /><Stat label="Open PO value" value={money(openValue)} /><Stat label="Invoiced against open POs" value={money(billed)} tone="violet" /><Stat label="All purchase orders" value={pos.length} />
      </div>

      {withoutPo.length ? (
        <section className="mt-8">
          <h2 className="mb-1 text-lg font-bold">Accepted work orders without a purchase order</h2>
          <p className="mb-3 text-sm text-muted">A PO is optional, but it gives the trainer a formal document to invoice against and keeps billing within the approved value.</p>
          <div className="space-y-2">{withoutPo.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
              <div className="min-w-0 flex-1"><p className="font-medium">{w.title}</p><p className="text-xs text-muted">{woNumber(w.number)} · {w.trainer.user.name} · accepted {w.acceptedAt ? fmtDate(w.acceptedAt) : ""} · {money(w.total, w.currency)} before GST</p></div>
              <form action={createPurchaseOrder}><input type="hidden" name="workOrderId" value={w.id} /><Button size="sm" variant="violet">Issue purchase order</Button></form>
            </div>
          ))}</div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">All purchase orders</h2>
        {pos.length ? (
          <div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full text-sm">
            <thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted"><th className="px-4 py-3">PO</th><th className="px-4 py-3">{isTrainer ? "Company" : "Trainer"}</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Value (ex. GST)</th><th className="px-4 py-3 text-right">Invoiced</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-line">{pos.map((p) => { const b = p.invoices.reduce((n, i) => n + i.amount, 0); return (
              <tr key={p.id} className="hover:bg-surface-2"><td className="px-4 py-3"><Link href={`/purchase-orders/${p.id}`} className="font-medium hover:text-cyan">{poNumberOf(p)}</Link><p className="text-xs text-muted">{p.title} · {woNumber(p.workOrder.number)}</p></td><td className="px-4 py-3">{isTrainer ? p.company.name : p.trainer.user.name}</td><td className="px-4 py-3 text-muted">{fmtDate(p.poDate)}</td><td className="px-4 py-3 text-right tabular-nums">{money(p.subtotal, p.currency)}</td><td className="px-4 py-3 text-right tabular-nums text-muted">{b ? `${money(b, p.currency)} · ${Math.round((b / Math.max(1, p.subtotal)) * 100)}%` : "—"}</td><td className="px-4 py-3"><Badge tone={tone[p.status]}>{label[p.status]}</Badge></td></tr>
            ); })}</tbody>
          </table></div>
        ) : <Empty title="No purchase orders yet" body={isTrainer ? "When a company issues a PO against one of your accepted work orders it appears here." : "Accept a work order with a trainer, then issue a purchase order from it above or from the work order page."} />}
      </section>
    </div>
  );
}
