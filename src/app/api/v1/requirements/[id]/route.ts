import { db } from "@/lib/db";
import { apiHandler, ApiError, json } from "@/lib/api-auth";
import { applicationSelect, requirementSelect, shapeApplication, shapeRequirement, shapeWorkOrder, workOrderSelect } from "@/lib/api-shapes";
import { dispatchWebhook } from "@/lib/webhooks";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/requirements/:id — one requirement with its applications and work order. */
export const GET = apiHandler<Ctx>(async (_req, ctx, auth) => {
  const { id } = await ctx.params;
  const r = await db.requirement.findFirst({ where: { id, companyId: auth.company.id }, select: { ...requirementSelect, applications: { select: applicationSelect, orderBy: { createdAt: "desc" } }, workOrder: { select: workOrderSelect } } });
  if (!r) throw new ApiError(404, "Requirement not found.");
  return json({ data: { ...shapeRequirement(r), applications: r.applications.map(shapeApplication), work_order: r.workOrder ? shapeWorkOrder(r.workOrder) : null } });
});

/** PATCH /api/v1/requirements/:id — { "status": "CANCELLED" | "COMPLETED" | "OPEN" } */
export const PATCH = apiHandler<Ctx>(async (req, ctx, auth) => {
  const { id } = await ctx.params;
  let body: { status?: string };
  try { body = await req.json(); } catch { throw new ApiError(400, "Body must be JSON."); }
  const status = String(body.status ?? "").toUpperCase();
  if (!["OPEN", "CANCELLED", "COMPLETED"].includes(status)) throw new ApiError(422, "status must be OPEN, CANCELLED or COMPLETED");
  const r = await db.requirement.findFirst({ where: { id, companyId: auth.company.id }, select: { id: true, status: true } });
  if (!r) throw new ApiError(404, "Requirement not found.");
  if (status === "COMPLETED" && r.status !== "AWARDED") throw new ApiError(409, "Only awarded requirements can be completed.");
  if (status === "OPEN" && !["CANCELLED", "SHORTLISTING"].includes(r.status)) throw new ApiError(409, "Only cancelled or shortlisting requirements can be reopened.");
  const updated = await db.requirement.update({ where: { id }, data: { status: status as "OPEN" }, select: requirementSelect });
  if (status === "CANCELLED") await db.availabilityBlock.deleteMany({ where: { requirementId: id } });
  await dispatchWebhook(auth.company.id, "requirement.status_changed", { requirement: shapeRequirement(updated) });
  return json({ data: shapeRequirement(updated) });
});
