import { db } from "@/lib/db";
import { apiHandler, json, page, pagination } from "@/lib/api-auth";
import { invoiceSelect, shapeInvoice } from "@/lib/api-shapes";

/** GET /api/v1/invoices?status=SENT&purchase_order_id=…&limit=50&cursor=… — invoices trainers have raised to the company, with GST breakup and lines. */
export const GET = apiHandler(async (req, _ctx, auth) => {
  const { url, limit, cursor } = pagination(req);
  const status = url.searchParams.get("status")?.toUpperCase();
  const poId = url.searchParams.get("purchase_order_id");
  const rows = await db.invoice.findMany({
    where: { companyId: auth.company.id, ...(status && ["SENT", "PAID", "CANCELLED"].includes(status) ? { status: status as "SENT" } : {}), ...(poId ? { purchaseOrderId: poId } : {}) },
    select: invoiceSelect, orderBy: { issuedAt: "desc" }, take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const p = page(rows, limit);
  return json({ data: p.data.map(shapeInvoice), next_cursor: p.next_cursor });
});
