import "server-only";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/oauth";
import { dateRange, fmtDate } from "@/lib/utils";
import { sacLabel, stateName, type TaxType } from "@/lib/gst";
import { renderDocumentPdf, type DocModel } from "@/lib/pdf/documents";

/** Loads an invoice or purchase order and shapes it for the shared PDF layout. Access checks stay with the caller. */

export const poNumberOf = (po: { poNumber: string; number: number }) => po.poNumber || `PO-${String(po.number).padStart(4, "0")} (draft)`;
export const woNumber = (n: number) => `WO-${String(n).padStart(4, "0")}`;
const lines = (s: string | null | undefined) => (s ?? "").split("\n").map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean);
const bankRows = (s: string) => lines(s).map((l) => { const i = l.indexOf(":"); return (i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ["", l]) as [string, string]; });

export const invoiceInclude = {
  trainer: { include: { user: { select: { id: true, name: true, email: true } } } },
  company: { include: { members: { select: { userId: true, role: true } } } },
  workOrder: { include: { requirement: { select: { id: true, title: true } } } },
  purchaseOrder: { select: { id: true, poNumber: true, number: true, status: true, subtotal: true, total: true } },
  lines: { orderBy: { position: "asc" as const } },
  creditNotes: { orderBy: { createdAt: "asc" as const } },
};

export async function loadInvoiceDoc(id: string) {
  const inv = await db.invoice.findUnique({ where: { id }, include: invoiceInclude });
  if (!inv) return null;
  const supplier = inv.supplierName ?? inv.trainer.user.name;
  const model: DocModel = {
    kind: "INVOICE",
    title: inv.gstAmount ? "TAX INVOICE" : "INVOICE",
    subtitle: "(Original for Recipient)",
    number: inv.invoiceNumber,
    date: inv.issuedAt,
    status: inv.status === "PAID" ? `Paid ${fmtDate(inv.paidAt ?? inv.issuedAt)}` : inv.status === "CANCELLED" ? "Cancelled" : inv.dueDate < new Date() ? "Overdue" : undefined,
    from: { name: supplier, address: inv.supplierAddress, gstin: inv.trainerGstin, pan: inv.supplierPan, state: stateName(inv.supplierStateCode), contact: inv.supplierContact },
    fromLabel: "Supplier",
    to: { name: inv.customerName ?? inv.company.name, address: inv.customerAddress ?? inv.company.billingAddress, gstin: inv.companyGstin, state: stateName(inv.customerStateCode) },
    toLabel: "Bill to",
    meta: [
      ["Training", inv.workOrder.title],
      ["Training period", inv.periodText || dateRange(inv.workOrder.startDate, inv.workOrder.endDate)],
      ["SAC code", `${inv.sacCode} · ${sacLabel(inv.sacCode)}`],
      ["P.O. number", inv.poNumber ?? "—"],
      ["P.O. date", inv.poDate ? fmtDate(inv.poDate) : "—"],
      ["Payment due", fmtDate(inv.dueDate)],
      ["Trainer", inv.trainerName ?? inv.trainer.user.name],
      ["Work order", `${woNumber(inv.workOrder.number)} v${inv.workOrder.version}`],
      ["Participants", inv.participants ? String(inv.participants) : "—"],
    ],
    supply: [inv.placeOfSupply || (inv.customerStateCode ? stateName(inv.customerStateCode) : ""), inv.endClientRef ? `End client / project reference: ${inv.endClientRef}` : ""].filter(Boolean),
    lines: inv.lines.length ? inv.lines : [{ description: inv.description, qty: 1, unit: "lump sum", rate: inv.amount, amount: inv.amount }],
    currency: inv.currency,
    subtotal: inv.amount, gstRate: inv.gstRate, taxType: inv.taxType as TaxType, cgst: inv.cgstAmount, sgst: inv.sgstAmount, igst: inv.igstAmount, gstAmount: inv.gstAmount, total: inv.total,
    bank: inv.paymentDetails ? bankRows(inv.paymentDetails) : undefined,
    sections: [{ title: "Notes", lines: lines(inv.notes) }],
    declaration: "We declare that this invoice shows the actual price of the services described and that all particulars are true and correct. TDS, if any, to be deducted as per the Income Tax Act, 1961 and the certificate issued to the supplier.",
    signatories: [{ label: `For ${supplier}`, name: inv.signatoryName ?? inv.trainer.user.name, caption: `Authorised signatory · issued ${fmtDate(inv.issuedAt)} · digitally generated, no physical signature required` }],
    footer: `${inv.invoiceNumber} · E. & O.E. · Verify at ${appUrl().replace(/^https?:\/\//, "")}/invoices/${inv.id}`,
    watermark: inv.status === "PAID" ? "PAID" : inv.status === "CANCELLED" ? "CANCELLED" : undefined,
  };
  return { inv, model, filename: `${inv.invoiceNumber.replace(/[^A-Za-z0-9-]+/g, "_")}.pdf` };
}

export const poInclude = {
  trainer: { include: { user: { select: { id: true, name: true, email: true } } } },
  company: { include: { members: { select: { userId: true, role: true } } } },
  workOrder: { select: { id: true, number: true, version: true, title: true, requirementId: true, startDate: true, endDate: true, days: true, participants: true, status: true } },
  issuedBy: { select: { name: true, email: true } },
  lines: { orderBy: { position: "asc" as const } },
  invoices: { where: { status: { in: ["SENT", "PAID"] as ("SENT" | "PAID")[] } }, select: { id: true, invoiceNumber: true, status: true, amount: true, total: true, currency: true, dueDate: true, issuedAt: true }, orderBy: { issuedAt: "asc" as const } },
};

export async function loadPoDoc(id: string) {
  const po = await db.purchaseOrder.findUnique({ where: { id }, include: poInclude });
  if (!po) return null;
  const buyer = po.buyerName ?? po.company.name;
  const vendor = po.vendorName ?? po.trainer.user.name;
  const statusText: Record<string, string | undefined> = { DRAFT: "Draft", ISSUED: "Issued · awaiting acceptance", CHANGES_REQUESTED: "Changes requested", ACCEPTED: `Accepted ${po.acceptedAt ? fmtDate(po.acceptedAt) : ""}`, CLOSED: "Closed", CANCELLED: "Cancelled" };
  const model: DocModel = {
    kind: "PURCHASE_ORDER",
    title: "PURCHASE ORDER",
    subtitle: `Version ${po.version} · against ${woNumber(po.workOrder.number)}`,
    number: poNumberOf(po),
    date: po.poDate,
    status: statusText[po.status],
    from: { name: buyer, address: po.buyerAddress, gstin: po.buyerGstin, state: stateName(po.buyerStateCode), contact: po.buyerContact },
    fromLabel: "Buyer",
    to: { name: vendor, address: po.vendorAddress, gstin: po.vendorGstin, pan: po.vendorPan, contact: po.trainer.user.email },
    toLabel: "Vendor · trainer",
    meta: [
      ["Training", po.title],
      ["Training period", po.periodText || dateRange(po.workOrder.startDate, po.workOrder.endDate)],
      ["Delivery mode", po.supplyMode || "—"],
      ["SAC code", `${po.sacCode} · ${sacLabel(po.sacCode)}`],
      ["Participants", po.participants ? String(po.participants) : "—"],
      ["Valid until", po.validUntil ? fmtDate(po.validUntil) : "—"],
      ["Payment terms", lines(po.paymentTerms)[0] ?? "—"],
    ],
    supply: [po.placeOfSupply, po.endClientRef ? `End client / project reference: ${po.endClientRef}` : ""].filter(Boolean),
    lines: po.lines,
    currency: po.currency,
    subtotal: po.subtotal, gstRate: po.gstRate, taxType: po.taxType as TaxType, cgst: po.taxType === "CGST_SGST" ? Math.round(po.gstAmount / 2) : 0, sgst: po.taxType === "CGST_SGST" ? po.gstAmount - Math.round(po.gstAmount / 2) : 0, igst: po.taxType === "IGST" ? po.gstAmount : 0, gstAmount: po.gstAmount, total: po.total,
    sections: [
      { title: "Scope and deliverables", lines: lines(po.deliverables) },
      { title: "Payment terms", lines: lines(po.paymentTerms) },
      { title: "Terms and conditions", lines: lines(po.terms) },
      { title: "Notes", lines: lines(po.notes) },
    ],
    signatories: [
      { label: `For ${buyer}`, name: po.issuedBy.name, caption: po.issuedAt ? `Issued ${fmtDate(po.issuedAt)} · v${po.version}` : "Draft · not yet issued" },
      { label: "Accepted by the vendor", name: po.acceptedByName, caption: po.acceptedAt ? `${po.trainer.user.name} · ${fmtDate(po.acceptedAt)}` : "Not yet accepted" },
    ],
    footer: `${poNumberOf(po)} · Verify at ${appUrl().replace(/^https?:\/\//, "")}/purchase-orders/${po.id}`,
    watermark: po.status === "DRAFT" ? "DRAFT" : po.status === "CANCELLED" ? "CANCELLED" : undefined,
  };
  return { po, model, filename: `${poNumberOf(po).replace(/[^A-Za-z0-9-]+/g, "_")}.pdf` };
}

export const invoicePdf = async (id: string) => { const d = await loadInvoiceDoc(id); return d ? { buffer: await renderDocumentPdf(d.model), filename: d.filename } : null; };
export const purchaseOrderPdf = async (id: string) => { const d = await loadPoDoc(id); return d ? { buffer: await renderDocumentPdf(d.model), filename: d.filename } : null; };
