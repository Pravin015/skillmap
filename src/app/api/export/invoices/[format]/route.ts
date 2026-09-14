import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { companyCan } from "@/lib/permissions";
import { tallyXml, zohoBooksCsv, type InvoiceRow } from "@/lib/exports/invoices";
import { audit } from "@/lib/notify";

/** Accounting export of the signed-in trainer's or company's invoices: ?format=zoho (CSV) or tally (XML). */
export async function GET(req: Request, { params }: { params: Promise<{ format: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const { format } = await params;
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const asCompany = !!user.membership && companyCan(user.membership.role, "view");
  const where = user.trainerProfile ? { trainerId: user.trainerProfile.id } : asCompany ? { companyId: user.membership!.company.id } : null;
  if (!where) return NextResponse.json({ error: "no invoices for this account" }, { status: 403 });
  const invoices = await db.invoice.findMany({ where: { ...where, ...(status ? { status: status as "SENT" } : {}) }, include: { company: { select: { name: true, gstin: true, billingAddress: true } }, trainer: { select: { gstin: true, user: { select: { name: true } } } } }, orderBy: { createdAt: "asc" } });
  const rows: InvoiceRow[] = invoices.map((i) => ({ invoiceNumber: i.invoiceNumber, createdAt: i.createdAt, dueDate: i.dueDate, status: i.status, description: i.description, amount: i.amount, gstRate: i.gstRate, gstAmount: i.gstAmount, total: i.total, currency: i.currency, customerName: i.company.name, customerGstin: i.companyGstin ?? i.company.gstin, customerAddress: i.company.billingAddress, supplierName: i.trainer.user.name, supplierGstin: i.trainerGstin ?? i.trainer.gstin }));
  await audit(user.id, "export.invoices", format, { rows: rows.length });
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "zoho") return new NextResponse(zohoBooksCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="corpgurus-invoices-zoho-${stamp}.csv"` } });
  if (format === "tally") return new NextResponse(tallyXml(rows, user.membership?.company.name ?? user.name), { headers: { "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": `attachment; filename="corpgurus-invoices-tally-${stamp}.xml"` } });
  return NextResponse.json({ error: "format must be zoho or tally" }, { status: 400 });
}
