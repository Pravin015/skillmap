/**
 * Indian GST helpers shared by purchase orders and tax invoices.
 * Pure functions (no server-only import) so the invoice editor can preview tax in the browser.
 */

/** GST state codes (first two digits of a GSTIN). */
export const STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar",
  "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
  "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh", "97": "Other Territory",
};
export const STATE_OPTIONS = Object.entries(STATE_CODES).map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
export const stateName = (code: string | null | undefined) => (code && STATE_CODES[code] ? `${STATE_CODES[code]} (Code ${code})` : "");

/** SAC codes that cover corporate training. 999293 is the one on most training invoices. */
export const SAC_CODES = [
  { code: "999293", label: "Commercial training and coaching services" },
  { code: "999294", label: "Other education and training services" },
  { code: "999299", label: "Other educational support services" },
  { code: "998311", label: "Management consulting and advisory services" },
];
export const sacLabel = (code: string) => SAC_CODES.find((s) => s.code === code)?.label ?? "";

export const stateCodeFromGstin = (gstin: string | null | undefined) => {
  const m = String(gstin ?? "").trim().toUpperCase().match(/^(\d{2})[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/);
  return m ? m[1] : null;
};

export const UNITS = ["day", "half day", "hour", "pax", "batch", "session", "lump sum"];

/** Indian financial year label for a date: 1 Apr 2026 – 31 Mar 2027 → "26-27". */
export function financialYear(d = new Date()) {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${String(y).slice(-2)}-${String(y + 1).slice(-2)}`;
}

export const docNumber = (prefix: string, fy: string, seq: number, width = 3) => `${prefix.replace(/\/+$/, "")}/${fy}/${String(seq).padStart(width, "0")}`;

export type TaxType = "IGST" | "CGST_SGST" | "NONE";
export type TaxBreakup = { taxType: TaxType; gstAmount: number; cgst: number; sgst: number; igst: number; total: number };

/**
 * Split GST between CGST+SGST (same state) and IGST (different state / unknown).
 * Amounts are whole currency units, rounded the way most Indian invoices are.
 */
export function computeTax(subtotal: number, gstRate: number, supplierState?: string | null, buyerState?: string | null): TaxBreakup {
  const gstAmount = Math.round((subtotal * gstRate) / 100);
  if (!gstRate || !gstAmount) return { taxType: "NONE", gstAmount: 0, cgst: 0, sgst: 0, igst: 0, total: subtotal };
  if (supplierState && buyerState && supplierState === buyerState) {
    const cgst = Math.round(gstAmount / 2);
    return { taxType: "CGST_SGST", gstAmount, cgst, sgst: gstAmount - cgst, igst: 0, total: subtotal + gstAmount };
  }
  return { taxType: "IGST", gstAmount, cgst: 0, sgst: 0, igst: gstAmount, total: subtotal + gstAmount };
}

export type LineIn = { description: string; qty: number | string; unit?: string; rate: number | string };
export type LineOut = { description: string; qty: number; unit: string; rate: number; amount: number; position: number };

/** Validate and total line items from the editor. Returns an error string when something is off. */
export function parseLines(raw: string | LineIn[] | undefined | null): LineOut[] | string {
  let list: LineIn[];
  if (typeof raw === "string") { try { list = JSON.parse(raw || "[]"); } catch { return "Line items are malformed."; } } else list = raw ?? [];
  if (!Array.isArray(list) || !list.length) return "Add at least one line item.";
  if (list.length > 25) return "Up to 25 line items.";
  const out: LineOut[] = [];
  for (const [i, l] of list.entries()) {
    const description = String(l.description ?? "").trim().slice(0, 400);
    const qty = Number(l.qty), rate = Math.round(Number(l.rate));
    if (!description) return `Line ${i + 1}: add a description.`;
    if (!(qty > 0) || qty > 100000) return `Line ${i + 1}: quantity must be more than 0.`;
    if (!(rate >= 0) || rate > 1e9) return `Line ${i + 1}: rate must be 0 or more.`;
    out.push({ description, qty: Math.round(qty * 100) / 100, unit: String(l.unit ?? "day").trim().slice(0, 20) || "day", rate, amount: Math.round(qty * rate), position: i });
  }
  return out;
}
export const sumLines = (lines: { amount: number }[]) => lines.reduce((n, l) => n + l.amount, 0);
export const fmtQty = (q: number) => (Number.isInteger(q) ? String(q) : q.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""));

/** Editor state for a line (strings, since they come from inputs). */
export type LineInput = { description: string; qty: string; unit: string; rate: string };
export const toLineInputs = (lines: { description: string; qty: number; unit: string; rate: number }[]): LineInput[] => lines.map((l) => ({ description: l.description, qty: fmtQty(l.qty), unit: l.unit, rate: String(l.rate) }));

/* ---------- amount in words ---------- */

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) { parts.push(`${ONES[Math.floor(n / 100)]} Hundred`); n %= 100; }
  if (n >= 20) { parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "")); } else if (n > 0) parts.push(ONES[n]);
  return parts.join(" ");
}
/** Indian numbering (lakh, crore) for INR; short scale for other currencies. Whole units only. */
export function numberToWords(n: number, indian = true): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const parts: string[] = [];
  if (indian) {
    const units: [number, string][] = [[1e7, "Crore"], [1e5, "Lakh"], [1e3, "Thousand"]];
    for (const [v, label] of units) { if (n >= v) { parts.push(`${numberToWords(Math.floor(n / v), true)} ${label}`); n %= v; } }
  } else {
    const units: [number, string][] = [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"]];
    for (const [v, label] of units) { if (n >= v) { parts.push(`${below1000(Math.floor(n / v))} ${label}`); n %= v; } }
  }
  if (n > 0) parts.push(below1000(n));
  return parts.join(" ");
}
export function amountInWords(amount: number, currency = "INR") {
  const name = currency === "INR" ? "Rupees" : currency === "USD" ? "US Dollars" : currency;
  return `${name} ${numberToWords(amount, currency === "INR")} Only`;
}

/** Plain-text amount for PDFs (Helvetica has no rupee glyph). */
export function moneyPlain(amount: number, currency = "INR") {
  const s = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(amount);
  return currency === "INR" ? `Rs. ${s}` : `${currency} ${s}`;
}

export const TAX_LABEL: Record<TaxType, string> = { IGST: "IGST (inter-state supply)", CGST_SGST: "CGST + SGST (intra-state supply)", NONE: "No GST" };

/** Suggested document prefix from a name: "Techademy Learning Solutions" → "TECHADEMY", "Pravin Nagare" → "PN". */
export function suggestPrefix(name: string, style: "word" | "initials") {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "DOC";
  if (style === "initials") return words.slice(0, 3).map((w) => w[0].toUpperCase()).join("");
  return words[0].toUpperCase().slice(0, 12);
}
