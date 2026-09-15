import "server-only";
import React from "react";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { amountInWords, fmtQty, moneyPlain, type TaxType } from "@/lib/gst";

/**
 * One PDF layout shared by tax invoices and purchase orders (A4, Helvetica, purple accent).
 * Callers build a DocModel from the database row; nothing here touches Prisma.
 */

Font.registerHyphenationCallback((w) => [w]);

export type PartyBlock = { name: string; address?: string | null; gstin?: string | null; pan?: string | null; state?: string | null; contact?: string | null };
export type DocLine = { description: string; qty: number; unit: string; rate: number; amount: number };
export type Signatory = { label: string; name?: string | null; caption?: string | null };
export type DocModel = {
  kind: "INVOICE" | "PURCHASE_ORDER";
  title: string;
  subtitle?: string;
  number: string;
  date: Date;
  status?: string;
  from: PartyBlock; fromLabel: string;
  to: PartyBlock; toLabel: string;
  meta: [string, string][];
  supply?: string[];
  lines: DocLine[];
  currency: string;
  subtotal: number;
  gstRate: number;
  taxType: TaxType;
  cgst: number; sgst: number; igst: number; gstAmount: number;
  total: number;
  bank?: [string, string][];
  sections?: { title: string; lines: string[] }[];
  declaration?: string;
  signatories: Signatory[];
  footer: string;
  watermark?: string;
};

const P = "#6d28d9", INK = "#16121f", MUTED = "#6b6580", LINE = "#e6e2f2", SOFT = "#f6f3fc";
const s = StyleSheet.create({
  page: { padding: 34, paddingBottom: 48, fontFamily: "Helvetica", fontSize: 9, color: INK, lineHeight: 1.35 },
  bar: { height: 5, backgroundColor: P, marginHorizontal: -34, marginTop: -34, marginBottom: 16 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandMark: { width: 18, height: 18, borderRadius: 4, backgroundColor: P, color: "#fff", fontSize: 7, fontFamily: "Helvetica-Bold", textAlign: "center", paddingTop: 5 },
  brandText: { fontFamily: "Helvetica-Bold", fontSize: 11, color: INK },
  title: { fontFamily: "Helvetica-Bold", fontSize: 16, color: P, textAlign: "right", letterSpacing: 0.5 },
  subtitle: { fontSize: 8, color: MUTED, textAlign: "right", marginTop: 3 },
  status: { fontSize: 7, color: "#fff", backgroundColor: INK, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, alignSelf: "flex-end", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  eyebrow: { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  parties: { flexDirection: "row", gap: 14, marginTop: 14 },
  party: { flex: 1, padding: 9, backgroundColor: SOFT, borderRadius: 4 },
  partyName: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 1 },
  mono: { fontSize: 8, color: MUTED },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, borderWidth: 1, borderColor: LINE, borderRadius: 4 },
  metaCell: { width: "33.33%", padding: 6, borderRightWidth: 1, borderBottomWidth: 1, borderColor: LINE },
  metaLabel: { fontSize: 6.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6 },
  metaValue: { fontFamily: "Helvetica-Bold", fontSize: 8.5, marginTop: 1 },
  supply: { marginTop: 8, padding: 7, borderWidth: 1, borderColor: LINE, borderRadius: 4 },
  table: { marginTop: 12 },
  th: { flexDirection: "row", backgroundColor: INK, color: "#fff", paddingVertical: 5, paddingHorizontal: 6, fontSize: 7, textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: LINE },
  cSl: { width: 22 }, cDesc: { flex: 1, paddingRight: 8 }, cQty: { width: 60, textAlign: "right" }, cRate: { width: 80, textAlign: "right" }, cAmt: { width: 90, textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 260, marginTop: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 6 },
  grand: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 6, backgroundColor: SOFT, borderRadius: 4, marginTop: 3 },
  grandText: { fontFamily: "Helvetica-Bold", fontSize: 11, color: P },
  words: { marginTop: 8, fontSize: 8.5 },
  section: { marginTop: 10 },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: P, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: LINE, borderRadius: 4 },
  bankCell: { width: "50%", flexDirection: "row", padding: 5, borderBottomWidth: 1, borderColor: LINE },
  bankLabel: { width: 95, color: MUTED },
  sig: { flexDirection: "row", justifyContent: "space-between", marginTop: 22, gap: 20 },
  sigBox: { flex: 1, borderTopWidth: 1, borderColor: LINE, paddingTop: 6 },
  sigName: { fontFamily: "Helvetica-Oblique", fontSize: 12, marginTop: 8 },
  footer: { position: "absolute", left: 34, right: 34, bottom: 20, fontSize: 7, color: MUTED, textAlign: "center", borderTopWidth: 1, borderColor: LINE, paddingTop: 6 },
  watermark: { position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontSize: 72, color: "#efeaf9", fontFamily: "Helvetica-Bold", transform: "rotate(-25deg)" },
});

const fmtDate = (d: Date) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
const Party = ({ label, p }: { label: string; p: PartyBlock }) => (
  <View style={s.party}>
    <Text style={s.eyebrow}>{label}</Text>
    <Text style={s.partyName}>{p.name}</Text>
    {p.address ? <Text>{p.address}</Text> : null}
    {p.contact ? <Text style={s.mono}>{p.contact}</Text> : null}
    {p.gstin || p.pan ? <Text style={s.mono}>{[p.gstin ? `GSTIN: ${p.gstin}` : null, p.pan ? `PAN: ${p.pan}` : null].filter(Boolean).join("    ")}</Text> : null}
    {p.state ? <Text style={s.mono}>State: {p.state}</Text> : null}
  </View>
);

export function DocumentPdf({ m }: { m: DocModel }) {
  const money = (n: number) => moneyPlain(n, m.currency);
  return (
    <Document title={`${m.title} ${m.number}`} author="CorpGurus" creator="CorpGurus" producer="CorpGurus">
      <Page size="A4" style={s.page}>
        <View style={s.bar} fixed />
        {m.watermark ? <Text style={s.watermark} fixed>{m.watermark}</Text> : null}
        <View style={s.head}>
          <View>
            <View style={s.brand}><Text style={s.brandMark}>CG</Text><Text style={s.brandText}>CorpGurus</Text></View>
            <Text style={{ ...s.mono, marginTop: 3 }}>Generated on CorpGurus · corpgurus.com</Text>
          </View>
          <View>
            <Text style={s.title}>{m.title}</Text>
            {m.subtitle ? <Text style={s.subtitle}>{m.subtitle}</Text> : null}
            {m.status ? <Text style={s.status}>{m.status}</Text> : null}
          </View>
        </View>

        <View style={s.parties}>
          <Party label={m.fromLabel} p={m.from} />
          <Party label={m.toLabel} p={m.to} />
        </View>

        <View style={s.metaGrid}>
          {[[m.kind === "INVOICE" ? "Invoice no." : "PO number", m.number], [m.kind === "INVOICE" ? "Invoice date" : "PO date", fmtDate(m.date)], ...m.meta].map(([k, v], i) => (
            <View key={i} style={s.metaCell}><Text style={s.metaLabel}>{k}</Text><Text style={s.metaValue}>{v || "—"}</Text></View>
          ))}
        </View>
        {m.supply?.length ? <View style={s.supply}><Text style={s.eyebrow}>Place of supply / delivery</Text>{m.supply.map((l, i) => <Text key={i}>{l}</Text>)}</View> : null}

        <View style={s.table}>
          <View style={s.th}><Text style={s.cSl}>SL</Text><Text style={s.cDesc}>Description of service</Text><Text style={s.cQty}>Qty</Text><Text style={s.cRate}>Rate ({m.currency})</Text><Text style={s.cAmt}>Amount ({m.currency})</Text></View>
          {m.lines.map((l, i) => (
            <View key={i} style={s.tr} wrap={false}><Text style={s.cSl}>{i + 1}</Text><Text style={s.cDesc}>{l.description}</Text><Text style={s.cQty}>{fmtQty(l.qty)} {l.unit}</Text><Text style={s.cRate}>{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(l.rate)}</Text><Text style={s.cAmt}>{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(l.amount)}</Text></View>
          ))}
        </View>
        <View style={s.totals}>
          <View style={s.totalRow}><Text>Sub-total (taxable value)</Text><Text>{money(m.subtotal)}</Text></View>
          {m.taxType === "CGST_SGST" ? (<>
            <View style={s.totalRow}><Text>CGST @ {m.gstRate / 2}%</Text><Text>{money(m.cgst)}</Text></View>
            <View style={s.totalRow}><Text>SGST @ {m.gstRate / 2}%</Text><Text>{money(m.sgst)}</Text></View>
          </>) : m.taxType === "IGST" ? <View style={s.totalRow}><Text>IGST @ {m.gstRate}%</Text><Text>{money(m.igst)}</Text></View> : <View style={s.totalRow}><Text>GST</Text><Text>Not applicable</Text></View>}
          <View style={s.grand}><Text style={s.grandText}>{m.kind === "INVOICE" ? "Total payable" : "PO value (incl. GST)"}</Text><Text style={s.grandText}>{money(m.total)}</Text></View>
        </View>
        <Text style={s.words}><Text style={{ fontFamily: "Helvetica-Bold" }}>Amount in words: </Text>{amountInWords(m.total, m.currency)}</Text>

        {m.bank?.length ? (
          <View style={s.section} wrap={false}>
            <Text style={s.sectionTitle}>Bank details for payment</Text>
            <View style={s.bankGrid}>{m.bank.map(([k, v], i) => <View key={i} style={s.bankCell}><Text style={s.bankLabel}>{k}</Text><Text style={{ fontFamily: "Helvetica-Bold" }}>{v}</Text></View>)}</View>
          </View>
        ) : null}
        {m.sections?.filter((x) => x.lines.length).map((x, i) => (
          <View key={i} style={s.section}>
            <Text style={s.sectionTitle}>{x.title}</Text>
            {x.lines.map((l, j) => <Text key={j} style={{ marginBottom: 1.5 }}>{x.lines.length > 1 ? `${j + 1}. ` : ""}{l}</Text>)}
          </View>
        ))}
        {m.declaration ? <Text style={{ marginTop: 10, fontSize: 8, color: MUTED }}><Text style={{ fontFamily: "Helvetica-Bold", color: INK }}>Declaration: </Text>{m.declaration}</Text> : null}

        <View style={s.sig} wrap={false}>
          {m.signatories.map((g, i) => (
            <View key={i} style={s.sigBox}>
              <Text style={s.eyebrow}>{g.label}</Text>
              <Text style={s.sigName}>{g.name || " "}</Text>
              <Text style={s.mono}>{g.caption ?? (g.name ? "Authorised signatory" : "Not yet signed")}</Text>
            </View>
          ))}
        </View>

        <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => `${m.footer}   ·   Page ${pageNumber} of ${totalPages}`} />
      </Page>
    </Document>
  );
}

export async function renderDocumentPdf(m: DocModel): Promise<Buffer> {
  return renderToBuffer(<DocumentPdf m={m} />);
}
