import "server-only";
import { db } from "./db";
import { notify } from "./notify";

const day = (n: number) => new Date(Date.now() + n * 86400000);

/** Idempotent daily maintenance. Safe to run more than once a day. */
export async function runDailyJobs() {
  const out: string[] = [];

  // 1. Certifications expiring within 30 days: remind once.
  const expiring = await db.certification.findMany({ where: { status: "VERIFIED", expiresOn: { gte: new Date(), lte: day(30) }, expiryRemindedAt: null }, include: { trainer: { select: { userId: true } } } });
  for (const c of expiring) {
    await notify(c.trainer.userId, "verification", `${c.name} expires on ${c.expiresOn!.toDateString()}`, "Renew it and upload the new certificate to keep your verified badge.", "/settings");
    await db.certification.update({ where: { id: c.id }, data: { expiryRemindedAt: new Date() } });
  }
  out.push(`${expiring.length} expiry reminder${expiring.length === 1 ? "" : "s"}`);

  // 2. Certifications past their expiry: mark expired, drop the trainer badge if nothing verified remains.
  const expired = await db.certification.findMany({ where: { status: "VERIFIED", expiresOn: { lt: new Date() } }, include: { trainer: { select: { id: true, userId: true } } } });
  for (const c of expired) {
    await db.certification.update({ where: { id: c.id }, data: { status: "EXPIRED" } });
    const remaining = await db.certification.count({ where: { trainerId: c.trainer.id, status: "VERIFIED" } });
    if (!remaining) await db.trainerProfile.update({ where: { id: c.trainer.id }, data: { verifiedAt: null } });
    await notify(c.trainer.userId, "verification", `${c.name} has expired`, remaining ? "It no longer counts toward your verified badge." : "Your verified badge is paused until you upload a current certificate.", "/settings");
  }
  out.push(`${expired.length} expired`);

  // 3. Overdue invoices: nudge the company once a week.
  const overdue = await db.invoice.findMany({ where: { status: "SENT", dueDate: { lt: new Date() } }, include: { company: { include: { members: { select: { userId: true } } } }, trainer: { select: { userId: true } } } });
  let nudged = 0;
  for (const i of overdue) {
    const daysLate = Math.floor((Date.now() - i.dueDate.getTime()) / 86400000);
    if (daysLate % 7 !== 0) continue;
    await notify(i.company.members.map((m) => m.userId), "invoice", `Invoice ${i.invoiceNumber} is ${daysLate} day${daysLate === 1 ? "" : "s"} overdue`, "Record the payment once made so the trainer sees it.", `/invoices/${i.id}`);
    nudged++;
  }
  out.push(`${nudged} overdue nudge${nudged === 1 ? "" : "s"}`);

  // 4. Interview reminders 24 hours ahead.
  const soon = await db.interview.findMany({ where: { status: "CONFIRMED", slots: { some: { startsAt: { gte: day(1), lt: day(2) } } } }, include: { slots: true, proposedBy: { select: { id: true } }, application: { include: { trainer: { select: { userId: true } }, requirement: { select: { id: true, title: true } } } } } });
  let reminded = 0;
  for (const iv of soon) {
    const slot = iv.slots.find((s) => s.id === iv.confirmedSlotId);
    if (!slot || slot.startsAt < day(1) || slot.startsAt >= day(2)) continue;
    const when = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(slot.startsAt) + " IST";
    await notify([iv.application.trainer.userId, iv.proposedBy.id], "application", "Interview tomorrow", `${iv.application.requirement.title} · ${when}${iv.location ? ` · ${iv.location}` : ""}`, `/requirements/${iv.application.requirement.id}`);
    reminded++;
  }
  out.push(`${reminded} interview reminder${reminded === 1 ? "" : "s"}`);

  // 5. Engagements whose end date passed 7+ days ago and are still AWARDED: nudge company to mark completed (enables ratings and feedback).
  const stale = await db.requirement.findMany({ where: { status: "AWARDED", endDate: { lt: day(-7) } }, include: { company: { include: { members: { select: { userId: true } } } } } });
  for (const r of stale) {
    const daysAgo = Math.floor((Date.now() - r.endDate.getTime()) / 86400000);
    if (daysAgo % 7 !== 0) continue;
    await notify(r.company.members.map((m) => m.userId), "requirement", `Mark “${r.title}” completed?`, "Completing it unlocks ratings, participant feedback and the trainer's invoice.", `/requirements/${r.id}`);
  }
  out.push(`${stale.length} completion nudge candidate${stale.length === 1 ? "" : "s"}`);

  const summary = out.join(" · ");
  await db.jobRun.create({ data: { name: "daily", summary } });
  return summary;
}
