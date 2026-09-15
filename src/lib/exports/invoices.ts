/**
 * Accounting exports for invoices.
 *  - Zoho Books: CSV in the column layout of Zoho's "Import Invoices" (one line item per row).
 *  - Tally: XML sales vouchers for Tally Prime's Import Data (Gateway of Tally → Import → Vouchers).
 * Both are plain-text builders; the route decides which invoices to include.
 */

export type InvoiceRow = {
  invoiceNumber: string; createdAt: Date; dueDate: Date; status: string; description: string; amount: number; gstRate: number; gstAmount: number; total: number; currency: string;
  customerName: string; customerGstin: string | null; customerAddress: string | null; supplierName: string; supplierGstin: string | null; poNumber?: string | null; taxType?: string; placeOfSupply?: string;
};

const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const d = (x: Date) => x.toISOString().slice(0, 10);
const tallyDate = (x: Date) => x.toISOString().slice(0, 10).replace(/-/g, "");
const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function zohoBooksCsv(rows: InvoiceRow[]) {
  const cols = ["Invoice Number", "Invoice Date", "Due Date", "Customer Name", "GST Treatment", "GST Identification Number (GSTIN)", "Place of Supply", "Invoice Status", "Currency Code", "Item Name", "Item Desc", "Quantity", "Item Price", "Item Tax %", "Item Tax Amount", "Item Total", "SubTotal", "Total", "Purchase Order", "Notes"];
  const lines = rows.map((r) => [
    r.invoiceNumber, d(r.createdAt), d(r.dueDate), r.customerName, r.customerGstin ? "business_gst" : "business_none", r.customerGstin ?? "", r.customerGstin ? r.customerGstin.slice(0, 2) : "", r.status === "PAID" ? "paid" : r.status === "CANCELLED" ? "void" : "sent", r.currency,
    "Corporate training", r.description, 1, r.amount, r.gstRate, r.gstAmount, r.total, r.amount, r.total, r.poNumber ?? "", `Imported from CorpGurus · supplier ${r.supplierName}${r.supplierGstin ? ` (${r.supplierGstin})` : ""}`,
  ].map(esc).join(","));
  return [cols.join(","), ...lines].join("\n");
}

export function tallyXml(rows: InvoiceRow[], companyName: string) {
  const vouchers = rows.map((r) => {
    const cgst = r.gstAmount / 2;
    const interstate = r.taxType ? r.taxType === "IGST" : r.customerGstin && r.supplierGstin && r.customerGstin.slice(0, 2) !== r.supplierGstin.slice(0, 2);
    const taxLedgers = interstate
      ? `<ALLLEDGERENTRIES.LIST><LEDGERNAME>Output IGST</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${r.gstAmount.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST>`
      : `<ALLLEDGERENTRIES.LIST><LEDGERNAME>Output CGST</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${cgst.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST><ALLLEDGERENTRIES.LIST><LEDGERNAME>Output SGST</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${cgst.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST>`;
    return `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
<DATE>${tallyDate(r.createdAt)}</DATE><VOUCHERTYPENAME>Sales</VOUCHERTYPENAME><VOUCHERNUMBER>${xml(r.invoiceNumber)}</VOUCHERNUMBER><REFERENCE>${xml(r.invoiceNumber)}</REFERENCE>
<PARTYLEDGERNAME>${xml(r.customerName)}</PARTYLEDGERNAME><PARTYGSTIN>${xml(r.customerGstin ?? "")}</PARTYGSTIN><NARRATION>${xml(r.description)}${r.poNumber ? ` against PO ${xml(r.poNumber)}` : ""} (CorpGurus)</NARRATION><ISINVOICE>Yes</ISINVOICE>
<LEDGERENTRIES.LIST><LEDGERNAME>${xml(r.customerName)}</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${r.total.toFixed(2)}</AMOUNT></LEDGERENTRIES.LIST>
<ALLLEDGERENTRIES.LIST><LEDGERNAME>Training Services</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${r.amount.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST>
${r.gstAmount ? taxLedgers : ""}
</VOUCHER></TALLYMESSAGE>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${xml(companyName)}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA>
${vouchers}
</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
}
