import { describe, expect, it } from "vitest";
import { amountInWords, computeTax, docNumber, financialYear, numberToWords, parseLines, stateCodeFromGstin, suggestPrefix, sumLines } from "./gst";

describe("computeTax", () => {
  it("splits CGST and SGST for an intra-state supply", () => {
    const t = computeTax(268000, 18, "27", "27");
    expect(t.taxType).toBe("CGST_SGST");
    expect(t.cgst + t.sgst).toBe(t.gstAmount);
    expect(t.gstAmount).toBe(48240);
    expect(t.total).toBe(316240);
  });
  it("charges IGST across states, matching the Techademy sample", () => {
    const t = computeTax(268000, 18, "27", "29");
    expect(t).toMatchObject({ taxType: "IGST", igst: 48240, cgst: 0, sgst: 0, total: 316240 });
  });
  it("falls back to IGST when a state is unknown", () => {
    expect(computeTax(1000, 18, null, "29").taxType).toBe("IGST");
  });
  it("returns NONE at 0%", () => {
    expect(computeTax(1000, 0, "27", "27")).toMatchObject({ taxType: "NONE", gstAmount: 0, total: 1000 });
  });
  it("gives the rounding remainder to SGST so the halves add up", () => {
    const t = computeTax(1001, 5, "36", "36"); // 50.05 → 50
    expect(t.gstAmount).toBe(50);
    expect(t.cgst + t.sgst).toBe(50);
  });
});

describe("amount in words", () => {
  it("uses lakh and crore for INR", () => {
    expect(numberToWords(316240)).toBe("Three Lakh Sixteen Thousand Two Hundred Forty");
    expect(amountInWords(316240)).toBe("Rupees Three Lakh Sixteen Thousand Two Hundred Forty Only");
    expect(numberToWords(12345678)).toBe("One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight");
  });
  it("uses the short scale for USD", () => {
    expect(amountInWords(1250000, "USD")).toBe("US Dollars One Million Two Hundred Fifty Thousand Only");
  });
  it("handles teens and zero", () => {
    expect(numberToWords(0)).toBe("Zero");
    expect(numberToWords(115)).toBe("One Hundred Fifteen");
  });
});

describe("numbering", () => {
  it("computes the Indian financial year", () => {
    expect(financialYear(new Date("2026-09-15"))).toBe("26-27");
    expect(financialYear(new Date("2027-03-31"))).toBe("26-27");
    expect(financialYear(new Date("2027-04-01"))).toBe("27-28");
  });
  it("formats document numbers", () => {
    expect(docNumber("TECHSPHERE", "26-27", 1, 4)).toBe("TECHSPHERE/26-27/0001");
    expect(docNumber("AI/", "26-27", 12)).toBe("AI/26-27/012");
  });
  it("suggests prefixes", () => {
    expect(suggestPrefix("Techademy Learning Solutions", "word")).toBe("TECHADEMY");
    expect(suggestPrefix("Pravin Nagare", "initials")).toBe("PN");
    expect(suggestPrefix("", "word")).toBe("DOC");
  });
});

describe("GSTIN", () => {
  it("extracts the state code from a valid GSTIN", () => {
    expect(stateCodeFromGstin("27ABDCA5448D1ZT")).toBe("27");
    expect(stateCodeFromGstin(" 29aaict1669b1z8 ")).toBe("29");
  });
  it("rejects malformed numbers", () => {
    expect(stateCodeFromGstin("27ABC")).toBeNull();
    expect(stateCodeFromGstin(null)).toBeNull();
  });
});

describe("parseLines", () => {
  it("totals quantity times rate", () => {
    const lines = parseLines(JSON.stringify([{ description: "Training", qty: "8", unit: "half day", rate: "21000" }, { description: "Lab", qty: 25, unit: "pax", rate: 4000 }]));
    expect(typeof lines).not.toBe("string");
    if (typeof lines === "string") return;
    expect(lines.map((l) => l.amount)).toEqual([168000, 100000]);
    expect(sumLines(lines)).toBe(268000);
  });
  it("explains what is wrong", () => {
    expect(parseLines("[]")).toBe("Add at least one line item.");
    expect(parseLines(JSON.stringify([{ description: "", qty: 1, rate: 1 }]))).toMatch(/Line 1: add a description/);
    expect(parseLines(JSON.stringify([{ description: "x", qty: 0, rate: 1 }]))).toMatch(/quantity/);
    expect(parseLines("{bad")).toBe("Line items are malformed.");
  });
});
