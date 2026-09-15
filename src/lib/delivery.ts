import "server-only";
import { db } from "@/lib/db";

/** Attendance and learner-feedback figures for a work order, used on the attendance page, the invoice page and exports. */
export async function deliveryRecords(workOrderId: string) {
  const wo = await db.workOrder.findUnique({ where: { id: workOrderId }, select: { id: true, requirementId: true, trainerId: true, startDate: true, endDate: true, batches: { select: { id: true, label: true, startDate: true, endDate: true }, orderBy: { position: "asc" } }, roster: { include: { attendance: true, batch: { select: { label: true } } }, orderBy: [{ batchId: "asc" }, { name: "asc" }] } } });
  if (!wo) return null;
  const dates = trainingDates(wo);
  const cells = wo.roster.length * dates.length;
  const present = wo.roster.reduce((n, p) => n + p.attendance.filter((x) => x.present).length, 0);
  const marked = wo.roster.reduce((n, p) => n + p.attendance.length, 0);
  const feedback = await db.feedbackLink.findFirst({ where: { requirementId: wo.requirementId, trainerId: wo.trainerId }, select: { responses: { select: { score: true, wouldRecommend: true } } } });
  const responses = feedback?.responses ?? [];
  return {
    wo, dates, roster: wo.roster,
    attendancePct: cells ? Math.round((present / cells) * 100) : null, present, marked, cells,
    feedbackAvg: responses.length ? Math.round((responses.reduce((n, r) => n + r.score, 0) / responses.length) * 10) / 10 : null,
    feedbackCount: responses.length, recommendPct: responses.length ? Math.round((responses.filter((r) => r.wouldRecommend).length / responses.length) * 100) : null,
  };
}

/** Every calendar day covered by the batches (or the whole engagement when there are none). */
export function trainingDates(wo: { startDate: Date; endDate: Date; batches: { startDate: Date; endDate: Date }[] }) {
  const ranges = wo.batches.length ? wo.batches : [wo];
  const out = new Set<string>();
  for (const r of ranges) {
    for (let d = new Date(r.startDate); d <= r.endDate && out.size < 60; d.setDate(d.getDate() + 1)) out.add(d.toISOString().slice(0, 10));
  }
  return [...out].sort();
}

export const attendanceCsv = (rec: NonNullable<Awaited<ReturnType<typeof deliveryRecords>>>) => {
  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = ["Name", "Email", "Employee ID", "Batch", ...rec.dates, "Days present", "Attendance %"];
  const rows = rec.roster.map((p) => {
    const byDate = new Map(p.attendance.map((a) => [a.date.toISOString().slice(0, 10), a.present]));
    const days = rec.dates.map((d) => (byDate.has(d) ? (byDate.get(d) ? "P" : "A") : ""));
    const present = days.filter((x) => x === "P").length;
    return [p.name, p.email ?? "", p.employeeId ?? "", p.batch?.label ?? "", ...days, present, rec.dates.length ? Math.round((present / rec.dates.length) * 100) : ""];
  });
  return [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
};
