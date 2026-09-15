import { db } from "@/lib/db";
import { apiHandler, ApiError, json } from "@/lib/api-auth";
import { purchaseOrderSelect, shapePurchaseOrder } from "@/lib/api-shapes";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/purchase-orders/:id */
export const GET = apiHandler<Ctx>(async (_req, ctx, auth) => {
  const { id } = await ctx.params;
  const po = await db.purchaseOrder.findFirst({ where: { id, companyId: auth.company.id }, select: purchaseOrderSelect });
  if (!po) throw new ApiError(404, "Purchase order not found.");
  return json({ data: shapePurchaseOrder(po) });
});
