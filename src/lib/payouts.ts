import "server-only";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

/**
 * RazorpayX payouts: escrow releases are paid to the trainer's bank account automatically.
 * Needs RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (with RazorpayX enabled on the account) and RAZORPAYX_ACCOUNT_NUMBER.
 * Without them, staff record payouts manually on /admin/escrow as before.
 */
export const payoutsConfigured = () => !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET && !!process.env.RAZORPAYX_ACCOUNT_NUMBER;

async function rzpx<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, { method, headers: { Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) throw new Error(json.error?.description || `RazorpayX ${path} failed (${res.status})`);
  return json;
}

export const validIfsc = (s: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(s);

/** Create (once) the RazorpayX contact and fund account for a trainer from their saved bank details. Returns the fund account id. */
export async function ensureFundAccount(trainerId: string) {
  const t = await db.trainerProfile.findUnique({ where: { id: trainerId }, include: { user: { select: { name: true, email: true, phone: true } } } });
  if (!t) throw new Error("Trainer not found");
  if (t.rzpFundAccountId) return t.rzpFundAccountId;
  const account = decrypt(t.bankAccountEnc);
  if (!t.bankHolder || !account || !t.bankIfsc) throw new Error("Trainer has not added bank details for payouts.");
  let contactId = t.rzpContactId;
  if (!contactId) {
    const c = await rzpx<{ id: string }>("/contacts", { name: t.bankHolder, email: t.user.email, contact: t.user.phone ?? undefined, type: "vendor", reference_id: t.id, notes: { corpgurus_trainer: t.id } });
    contactId = c.id;
    await db.trainerProfile.update({ where: { id: t.id }, data: { rzpContactId: contactId } });
  }
  const fa = await rzpx<{ id: string }>("/fund_accounts", { contact_id: contactId, account_type: "bank_account", bank_account: { name: t.bankHolder, ifsc: t.bankIfsc, account_number: account } });
  await db.trainerProfile.update({ where: { id: t.id }, data: { rzpFundAccountId: fa.id } });
  return fa.id;
}

/** Queue a payout (amount in INR rupees). Returns the payout id and status; the webhook finalises it. */
export async function createPayout(opts: { fundAccountId: string; amountInr: number; referenceId: string; narration: string }) {
  const p = await rzpx<{ id: string; status: string; utr?: string | null }>("/payouts", {
    account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER, fund_account_id: opts.fundAccountId, amount: Math.round(opts.amountInr * 100), currency: "INR", mode: opts.amountInr >= 200000 ? "NEFT" : "IMPS", purpose: "vendor bill",
    queue_if_low_balance: true, reference_id: opts.referenceId.slice(0, 40), narration: opts.narration.slice(0, 30), notes: { escrow: opts.referenceId },
  });
  return p;
}
