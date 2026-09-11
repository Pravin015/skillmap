"use server";

import { revalidatePath } from "next/cache";
import type { ReportTarget } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth";
import { audit, notify } from "@/lib/notify";
import type { ActionState } from "@/lib/types";

const TARGETS: ReportTarget[] = ["POST", "POST_COMMENT", "REQUIREMENT", "COMMENT", "USER"];

export async function createReport(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const targetType = String(fd.get("targetType")) as ReportTarget;
  const targetId = String(fd.get("targetId") ?? "");
  const reason = String(fd.get("reason") ?? "").trim();
  const detail = String(fd.get("detail") ?? "").trim().slice(0, 1000) || null;
  if (!TARGETS.includes(targetType) || !targetId || !reason) return { error: "Choose a reason." };
  const dup = await db.report.findFirst({ where: { reporterId: user.id, targetType, targetId, status: "OPEN" } });
  if (dup) return { ok: "You already reported this. Our team will review it." };
  await db.report.create({ data: { reporterId: user.id, targetType, targetId, reason, detail } });
  const staff = await db.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" }, select: { id: true } });
  await notify(staff.map((s) => s.id), "report", `New report: ${reason}`, `${user.name} reported a ${targetType.toLowerCase().replace("_", " ")}.`, "/admin/reports");
  revalidatePath("/admin/reports");
  return { ok: "Reported. A CorpGurus administrator will review it." };
}

export async function resolveReport(fd: FormData) {
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const id = String(fd.get("id"));
  const outcome = String(fd.get("outcome")) === "DISMISSED" ? "DISMISSED" : "RESOLVED";
  const resolution = String(fd.get("resolution") ?? "").trim() || null;
  const r = await db.report.findUnique({ where: { id } });
  if (!r || r.status !== "OPEN") return;
  await db.report.update({ where: { id }, data: { status: outcome, resolvedById: admin.id, resolvedAt: new Date(), resolution } });
  await audit(admin.id, `report.${outcome.toLowerCase()}`, id, { targetType: r.targetType, targetId: r.targetId, resolution });
  await notify(r.reporterId, "report", outcome === "RESOLVED" ? "Thanks, your report was actioned" : "Your report was reviewed", resolution ?? (outcome === "RESOLVED" ? "We took action on the content you reported." : "We reviewed it and did not find a violation."), undefined);
  revalidatePath("/admin/reports");
}
