"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

/** Every member gets a stable code on first visit to the referrals page. */
export async function ensureReferralCode() {
  const user = await requireUser();
  const u = await db.user.findUnique({ where: { id: user.id }, select: { referralCode: true } });
  if (u?.referralCode) return u.referralCode;
  for (let i = 0; i < 5; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    try { await db.user.update({ where: { id: user.id }, data: { referralCode: code } }); return code; } catch { /* collision, retry */ }
  }
  throw new Error("Could not allocate a referral code.");
}

/**
 * Called when a referred member qualifies (trainer: first verified certificate; company: first requirement posted).
 * Reward: 30 days of Trainer Pro or Company Growth for the referrer, added to an active subscription or created as a free one.
 */
export async function qualifyReferral(referredUserId: string) {
  const referred = await db.user.findUnique({ where: { id: referredUserId }, include: { referredBy: { include: { membership: { select: { companyId: true } } } } } });
  if (!referred?.referredBy) return;
  if (await db.referralReward.findUnique({ where: { referredId: referredUserId } })) return;
  const referrer = referred.referredBy;
  const plan = referrer.role === "TRAINER" ? "TRAINER_PRO" : referrer.membership ? "COMPANY_GROWTH" : null;
  if (!plan) return;
  const where = referrer.membership ? { companyId: referrer.membership.companyId } : { userId: referrer.id };
  const active = await db.subscription.findFirst({ where: { ...where, status: { in: ["ACTIVE", "AUTHENTICATED", "PENDING"] } } });
  if (active) {
    await db.subscription.update({ where: { id: active.id }, data: { currentPeriodEnd: new Date((active.currentPeriodEnd ?? new Date()).getTime() + 30 * 86400000) } });
  } else {
    await db.subscription.create({ data: { ...where, plan, interval: "MONTHLY", status: "ACTIVE", amount: 0, simulated: true, razorpaySubscriptionId: `ref_${referredUserId}`, currentPeriodEnd: new Date(Date.now() + 30 * 86400000) } });
  }
  await db.referralReward.create({ data: { referrerId: referrer.id, referredId: referredUserId, reward: `30 days of ${plan === "TRAINER_PRO" ? "Trainer Pro" : "Company Growth"}` } });
  await notify(referrer.id, "billing", "Referral reward unlocked", `${referred.name} qualified. You got 30 days of ${plan === "TRAINER_PRO" ? "Trainer Pro" : "Company Growth"}.`, "/dashboard/referrals");
  revalidatePath("/dashboard/referrals");
}
