import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { memberCan } from "@/lib/permissions";
import { attendanceCsv, deliveryRecords } from "@/lib/delivery";

/** Attendance register as CSV (one row per participant, one column per training day). */
export async function GET(_req: Request, { params }: { params: Promise<{ workOrderId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const { workOrderId } = await params;
  const wo = await db.workOrder.findUnique({ where: { id: workOrderId }, select: { number: true, company: { select: { members: { select: { userId: true, role: true } } } }, trainer: { select: { userId: true } } } });
  if (!wo) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (wo.trainer.userId !== user.id && !memberCan(wo.company.members, user.id, "view") && !isStaff(user)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const rec = await deliveryRecords(workOrderId);
  if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(attendanceCsv(rec), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="attendance-WO-${String(wo.number).padStart(4, "0")}.csv"` } });
}
