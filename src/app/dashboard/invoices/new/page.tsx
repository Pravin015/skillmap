import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { poNumberOf, woNumber } from "@/lib/documents";
import { docNumber, financialYear, stateCodeFromGstin, stateName, suggestPrefix, toLineInputs } from "@/lib/gst";
import { Alert, PageHeader } from "@/components/ui";
import { dateRange, modeLabel, money } from "@/lib/utils";
import { InvoiceForm } from "./invoice-form";

export const metadata = { title: "Raise invoice" };
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ workOrder?: string; po?: string }> }) {
  const { workOrder: workOrderId, po: poId } = await searchParams;
  const user = await requireUser("/dashboard/invoices/new");
  if (!user.trainerProfile) redirect("/dashboard/invoices");
  if (!workOrderId) redirect("/dashboard/invoices");
  const wo = await db.workOrder.findUnique({ where: { id: workOrderId }, include: { company: { select: { name: true, gstLegalName: true, gstin: true, stateCode: true, billingAddress: true } }, batches: { orderBy: { position: "asc" } }, purchaseOrders: { where: { status: { in: ["ACCEPTED", "ISSUED"] } }, include: { lines: { orderBy: { position: "asc" } }, invoices: { where: { status: { in: ["SENT", "PAID"] } }, select: { amount: true } } }, orderBy: { createdAt: "desc" } } } });
  if (!wo || wo.trainerId !== user.trainerProfile.id) notFound();
  if (wo.status !== "ACCEPTED") return <Alert tone="amber">The work order must be accepted before you invoice. <Link href={`/requirements/${wo.requirementId}/work-order`} className="underline">Open the work order</Link>.</Alert>;
  const po = poId ? wo.purchaseOrders.find((p) => p.id === poId) : wo.purchaseOrders.find((p) => p.status === "ACCEPTED");
  const pending = wo.purchaseOrders.find((p) => p.status === "ISSUED");
  const profile = await db.trainerProfile.findUniqueOrThrow({ where: { id: wo.trainerId }, include: { user: { select: { name: true } } } });
  const supplierState = profile.stateCode || stateCodeFromGstin(profile.gstin);
  const buyerState = po?.buyerStateCode ?? wo.company.stateCode ?? stateCodeFromGstin(wo.company.gstin);
  const fy = financialYear();
  const nextNumber = docNumber(profile.invoicePrefix || suggestPrefix(profile.legalName || profile.user.name, "initials"), fy, profile.invoiceSeqFy === fy ? profile.invoiceSeq + 1 : 1);
  const billedUnderPo = po ? po.invoices.reduce((n, i) => n + i.amount, 0) : 0;
  const cap = po ? Math.max(0, po.subtotal - billedUnderPo) : null;
  const lines = po ? po.lines : wo.batches.length
    ? wo.batches.map((b) => ({ description: `Training delivery · ${wo.title} · ${b.label} · ${dateRange(b.startDate, b.endDate)} · ${b.participants} participants`, qty: b.days, unit: "day", rate: wo.dayRate }))
    : [{ description: `Training delivery charges · ${wo.title} (${modeLabel[wo.mode]}) as per ${woNumber(wo.number)} · ${dateRange(wo.startDate, wo.endDate)} · ${wo.participants} participants`, qty: wo.days, unit: "day", rate: wo.dayRate }];
  const missing = [!profile.legalName && "legal / trade name", !profile.billingAddress && "address", !supplierState && "state", !profile.bankAccountEnc && "bank account"].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3"><Link href="/dashboard/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Invoices</Link></div>
      <PageHeader eyebrow="Tax invoice" title={po ? `Invoice against ${poNumberOf(po)}` : `Invoice for ${wo.title}`} body={`Bill to ${po?.buyerName ?? wo.company.gstLegalName ?? wo.company.name}${buyerState ? ` · ${stateName(buyerState)}` : ""}${po ? ` · PO value ${money(po.subtotal, po.currency)} before GST, ${money(cap ?? 0, po.currency)} remaining` : ` · work order total ${money(wo.total, wo.currency)} before GST`}.`} />
      {missing.length ? <Alert tone="amber">Your invoice is missing your {missing.join(", ")}. Add them under <Link href="/settings" className="underline">Settings → Invoicing details</Link> so the document is GST-complete. You can still send it now.</Alert> : null}
      {!po && pending ? <Alert tone="amber">{wo.company.name} issued <Link href={`/purchase-orders/${pending.id}`} className="underline">{poNumberOf(pending)}</Link> for this work order. Accept it first to invoice against it, or continue without a PO.</Alert> : null}
      {!po && !pending && !wo.purchaseOrders.length ? <p className="text-sm text-muted">No purchase order for this work order. The invoice references {woNumber(wo.number)} instead; you can add a client PO number if they sent one by email.</p> : null}
      <InvoiceForm cap={cap} supplierState={supplierState} buyerState={buyerState} lines={toLineInputs(lines)} d={{ workOrderId: wo.id, purchaseOrderId: po?.id ?? "", poNumber: po?.poNumber ?? "", nextNumber, currency: wo.currency, gstRate: profile.gstin ? (po?.gstRate ?? 18) : 0, gstin: profile.gstin ?? "", sacCode: po?.sacCode ?? "999293", placeOfSupply: po?.placeOfSupply ?? (wo.mode === "VIRTUAL" ? "Virtual instructor-led training (VILT)" : wo.venue.split("\n")[0] ?? ""), periodText: po?.periodText ?? dateRange(wo.startDate, wo.endDate), participants: String(po?.participants ?? wo.participants), endClientRef: po?.endClientRef ?? "", dueDate: inDays(30), signatoryName: profile.signatoryName ?? profile.user.name, hasBank: !!profile.bankAccountEnc, paymentDetails: profile.paymentDetails ?? "" }} />
    </div>
  );
}
