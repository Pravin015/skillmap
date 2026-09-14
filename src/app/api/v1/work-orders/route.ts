import { db } from "@/lib/db";
import { apiHandler, json, page, pagination } from "@/lib/api-auth";
import { shapeWorkOrder, workOrderSelect } from "@/lib/api-shapes";

/** GET /api/v1/work-orders?status=ACCEPTED&limit=50&cursor=… — the company's work orders with batches and invoices. */
export const GET = apiHandler(async (req, _ctx, auth) => {
  const { url, limit, cursor } = pagination(req);
  const status = url.searchParams.get("status")?.toUpperCase();
  const rows = await db.workOrder.findMany({
    where: { companyId: auth.company.id, ...(status && ["DRAFT", "SENT", "CHANGES_REQUESTED", "ACCEPTED", "CANCELLED"].includes(status) ? { status: status as "DRAFT" } : {}) },
    select: workOrderSelect, orderBy: { createdAt: "desc" }, take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const p = page(rows, limit);
  return json({ data: p.data.map(shapeWorkOrder), next_cursor: p.next_cursor });
});
