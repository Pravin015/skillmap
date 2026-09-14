import "server-only";

/**
 * GSTIN and PAN verification. Provider: Sandbox (sandbox.co.in) when SANDBOX_API_KEY / SANDBOX_API_SECRET are set.
 * Without a provider we still validate the format and the GSTIN check digit, and say so in the result.
 */
export const kycConfigured = () => !!process.env.SANDBOX_API_KEY && !!process.env.SANDBOX_API_SECRET;

export type GstResult = { valid: boolean; provider: "sandbox" | "format"; legalName?: string | null; tradeName?: string | null; status?: string | null; state?: string | null; message?: string };
export type PanResult = { valid: boolean; provider: "sandbox" | "format"; nameMatch?: boolean | null; category?: string | null; message?: string };

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;

/** GSTIN check digit (mod-36, weights alternate 1 and 2 with digit-sum folding). */
export function gstinChecksumOk(g: string) {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = chars.indexOf(g[i]);
    const w = (i % 2 === 0 ? 1 : 2) * v;
    sum += Math.floor(w / 36) + (w % 36);
  }
  return chars[(36 - (sum % 36)) % 36] === g[14];
}

const STATES: Record<string, string> = { "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh" };

let sandboxToken: { token: string; exp: number } | null = null;
async function sandboxAuth() {
  if (sandboxToken && sandboxToken.exp > Date.now()) return sandboxToken.token;
  const res = await fetch("https://api.sandbox.co.in/authenticate", { method: "POST", headers: { "x-api-key": process.env.SANDBOX_API_KEY!, "x-api-secret": process.env.SANDBOX_API_SECRET!, "x-api-version": "1.0" } });
  const j = (await res.json()) as { access_token?: string; message?: string };
  if (!res.ok || !j.access_token) throw new Error(j.message || "KYC provider authentication failed");
  sandboxToken = { token: j.access_token, exp: Date.now() + 20 * 3600 * 1000 };
  return j.access_token;
}

export async function verifyGstin(input: string): Promise<GstResult> {
  const gstin = input.trim().toUpperCase();
  if (!GSTIN_RE.test(gstin)) return { valid: false, provider: "format", message: "Not a valid GSTIN format (15 characters, e.g. 29ABCDE1234F1Z5)." };
  if (!gstinChecksumOk(gstin)) return { valid: false, provider: "format", message: "GSTIN check digit does not match. Re-check the number." };
  const state = STATES[gstin.slice(0, 2)] ?? null;
  if (!kycConfigured()) return { valid: true, provider: "format", state, message: "Format and check digit are valid. Connect a KYC provider (Sandbox) to confirm the registered business name." };
  try {
    const token = await sandboxAuth();
    const res = await fetch("https://api.sandbox.co.in/gst/compliance/public/gstin/search", { method: "POST", headers: { Authorization: token, "x-api-key": process.env.SANDBOX_API_KEY!, "x-api-version": "1.0", "Content-Type": "application/json" }, body: JSON.stringify({ gstin }) });
    const j = (await res.json()) as { data?: { data?: { lgnm?: string; tradeNam?: string; sts?: string } }; message?: string };
    const d = j.data?.data;
    if (!res.ok || !d) return { valid: false, provider: "sandbox", state, message: j.message || "GSTIN not found on the GST network." };
    return { valid: (d.sts ?? "").toLowerCase() === "active", provider: "sandbox", legalName: d.lgnm ?? null, tradeName: d.tradeNam ?? null, status: d.sts ?? null, state, message: (d.sts ?? "").toLowerCase() === "active" ? undefined : `GSTIN status is ${d.sts}.` };
  } catch (e) {
    return { valid: true, provider: "format", state, message: `Format valid; provider check failed (${(e as Error).message}).` };
  }
}

export async function verifyPan(input: string, name?: string): Promise<PanResult> {
  const pan = input.trim().toUpperCase();
  if (!PAN_RE.test(pan)) return { valid: false, provider: "format", message: "Not a valid PAN format (e.g. ABCDE1234F)." };
  const category = { P: "Individual", C: "Company", H: "HUF", F: "Firm", A: "AOP", T: "Trust", B: "BOI", L: "Local authority", J: "Artificial juridical person", G: "Government" }[pan[3]] ?? null;
  if (!kycConfigured()) return { valid: true, provider: "format", category, message: "Format is valid. Connect a KYC provider to confirm the name against the Income Tax database." };
  try {
    const token = await sandboxAuth();
    const res = await fetch("https://api.sandbox.co.in/kyc/pan/verify", { method: "POST", headers: { Authorization: token, "x-api-key": process.env.SANDBOX_API_KEY!, "x-api-version": "1.0", "Content-Type": "application/json" }, body: JSON.stringify({ "@entity": "in.co.sandbox.kyc.pan_verification.request", pan, name_as_per_pan: name, consent: "Y", reason: "Trainer identity verification on CorpGurus" }) });
    const j = (await res.json()) as { data?: { status?: string; name_as_per_pan_match?: boolean; category?: string }; message?: string };
    if (!res.ok || !j.data) return { valid: false, provider: "sandbox", category, message: j.message || "PAN could not be verified." };
    const ok = (j.data.status ?? "").toLowerCase() === "valid";
    return { valid: ok, provider: "sandbox", nameMatch: j.data.name_as_per_pan_match ?? null, category: j.data.category ?? category, message: ok ? undefined : `PAN status: ${j.data.status}` };
  } catch (e) {
    return { valid: true, provider: "format", category, message: `Format valid; provider check failed (${(e as Error).message}).` };
  }
}
