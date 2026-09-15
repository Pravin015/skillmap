import { db } from "@/lib/db";
import { apiHandler, json, page, pagination } from "@/lib/api-auth";
import { purchaseOrderSelect, shapePurchaseOrder } from "@/lib/api-shapes";

const STATUSES = ["DRAFT", "ISSUED", "CHANGES_REQUESTED", "ACCEPTED", "CLOSED", "CANCELLED"];

/** GET /api/v1/purchase-orders?status=ACCEPTED&work_order_id=…&limit=50&cursor=… — the company's purchase orders with lines and invoices. */
export const GET = apiHandler(async (req, _ctx, auth) => {
  const { url, limit, cursor } = pagination(req);
  const status = url.searchParams.get("status")?.toUpperCase();
  const workOrderId = url.searchParams.get("work_order_id");
  const rows = await db.purchaseOrder.findMany({
    where: { companyId: auth.company.id, ...(status && STATUSES.includes(status) ? { status: status as "DRAFT" } : {}), ...(workOrderId ? { workOrderId } : {}) },
    select: purchaseOrderSelect, orderBy: { createdAt: "desc" }, take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const p = page(rows, limit);
  return json({ data: p.data.map(shapePurchaseOrder), next_cursor: p.next_cursor });
});
