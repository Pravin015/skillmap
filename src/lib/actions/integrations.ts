"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit, notify } from "@/lib/notify";
import { syncTrainerBusy } from "@/lib/calendar";
import { encrypt } from "@/lib/crypto";
import { ensureFundAccount, payoutsConfigured, validIfsc } from "@/lib/payouts";
import { verifyGstin, verifyPan } from "@/lib/kyc";
import { companyCan } from "@/lib/permissions";
import type { ActionState } from "@/lib/types";

/* ---------- Calendars ---------- */

export async function disconnectCalendar(fd: FormData) {
  const user = await requireUser();
  const provider = String(fd.get("provider")) === "MICROSOFT" ? "MICROSOFT" : "GOOGLE";
  await db.calendarConnection.deleteMany({ where: { userId: user.id, provider } });
  if (user.trainerProfile) await db.availabilityBlock.deleteMany({ where: { trainerId: user.trainerProfile.id, source: provider.toLowerCase() } });
  await audit(user.id, "calendar.disconnect", provider);
  revalidatePath("/settings/availability"); revalidatePath("/settings");
}

export async function updateCalendarPrefs(fd: FormData) {
  const user = await requireUser();
  const provider = String(fd.get("provider")) === "MICROSOFT" ? "MICROSOFT" : "GOOGLE";
  await db.calendarConnection.updateMany({ where: { userId: user.id, provider }, data: { pushEvents: String(fd.get("pushEvents")) === "1", pullBusy: String(fd.get("pullBusy")) === "1" } });
  revalidatePath("/settings/availability");
}

export async function syncCalendarNow(): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Only trainers sync availability." };
  try {
    const r = await syncTrainerBusy(user.id, user.trainerProfile.id);
    revalidatePath("/settings/availability");
    return { ok: r.providers ? `Synced ${r.providers} calendar${r.providers === 1 ? "" : "s"}: ${r.blocks} busy day${r.blocks === 1 ? "" : "s"} marked unavailable for the next 90 days.` : "No calendar connected." };
  } catch (e) { return { error: (e as Error).message }; }
}

/* ---------- Meetings ---------- */

export async function setMeetingProvider(fd: FormData) {
  const user = await requireUser();
  if (!user.membership || !companyCan(user.membership.role, "company_settings")) return;
  const p = String(fd.get("meetingProvider"));
  if (!["AUTO", "ZOOM", "MEET", "TEAMS", "NONE"].includes(p)) return;
  await db.company.update({ where: { id: user.membership.company.id }, data: { meetingProvider: p } });
  revalidatePath("/settings");
}

/* ---------- Payouts: trainer bank details ---------- */

export async function saveBankDetails(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Trainer accounts only." };
  const holder = String(fd.get("bankHolder") ?? "").trim();
  const account = String(fd.get("bankAccount") ?? "").replace(/\s+/g, "");
  const ifsc = String(fd.get("bankIfsc") ?? "").trim().toUpperCase();
  if (holder.length < 3) return { error: "Enter the account holder name exactly as on the bank account." };
  if (!/^\d{9,18}$/.test(account)) return { error: "Account number should be 9 to 18 digits." };
  if (!validIfsc(ifsc)) return { error: "IFSC looks wrong (e.g. HDFC0001234)." };
  await db.trainerProfile.update({ where: { id: user.trainerProfile.id }, data: { bankHolder: holder, bankAccountEnc: encrypt(account), bankIfsc: ifsc, rzpFundAccountId: null, paymentDetails: `${holder} · A/c ${"•".repeat(Math.max(0, account.length - 4))}${account.slice(-4)} · IFSC ${ifsc}` } });
  await audit(user.id, "bank.update", user.trainerProfile.id);
  let note = "";
  if (payoutsConfigured()) {
    try { await ensureFundAccount(user.trainerProfile.id); note = " Registered with RazorpayX for automatic payouts."; } catch (e) { note = ` Saved, but payout registration failed: ${(e as Error).message}`; }
  }
  revalidatePath("/settings");
  return { ok: `Bank details saved (account number encrypted at rest).${note}` };
}

/* ---------- KYC ---------- */

export async function verifyCompanyGst(): Promise<ActionState> {
  const user = await requireUser();
  if (!user.membership || !companyCan(user.membership.role, "company_settings")) return { error: "Only owners and admins verify the GSTIN." };
  const c = await db.company.findUnique({ where: { id: user.membership.company.id }, include: { members: { select: { userId: true } } } });
  if (!c?.gstin) return { error: "Add the GSTIN first and save." };
  const r = await verifyGstin(c.gstin);
  if (!r.valid) return { error: r.message ?? "GSTIN could not be verified." };
  const via = r.provider === "sandbox" ? "api" : "format";
  await db.company.update({ where: { id: c.id }, data: { gstin: c.gstin.toUpperCase(), gstLegalName: r.legalName ?? c.gstLegalName, gstVerifiedVia: via, ...(r.provider === "sandbox" ? { gstVerifiedAt: new Date() } : {}) } });
  await audit(user.id, "company.gst.selfverify", c.id, { provider: r.provider, legalName: r.legalName });
  if (r.provider === "sandbox") await notify(c.members.map((m) => m.userId), "verification", "GST verified", `${c.name} (${r.legalName ?? c.gstin}) now carries the GST verified badge.`, `/companies/${c.slug}`);
  revalidatePath("/settings"); revalidatePath(`/companies/${c.slug}`);
  return { ok: r.provider === "sandbox" ? `Verified: ${r.legalName ?? c.gstin}${r.tradeName ? ` (${r.tradeName})` : ""}, ${r.state ?? "India"}. Badge granted.` : `${r.message} Staff will confirm the badge from the verification queue.` };
}

export async function verifyTrainerPan(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Trainer accounts only." };
  const pan = String(fd.get("pan") ?? "").trim().toUpperCase();
  const r = await verifyPan(pan, user.name);
  if (!r.valid) return { error: r.message ?? "PAN could not be verified." };
  await db.trainerProfile.update({ where: { id: user.trainerProfile.id }, data: { pan, ...(r.provider === "sandbox" && r.nameMatch !== false ? { panVerifiedAt: new Date() } : {}) } });
  await audit(user.id, "pan.verify", user.trainerProfile.id, { provider: r.provider, nameMatch: r.nameMatch });
  revalidatePath("/settings");
  if (r.provider === "sandbox" && r.nameMatch === false) return { error: "PAN is valid but the name does not match your account name. Update your name in Settings to match your PAN and try again." };
  return { ok: r.provider === "sandbox" ? `PAN verified (${r.category ?? "Individual"}). Identity badge granted.` : `PAN saved. ${r.message}` };
}
