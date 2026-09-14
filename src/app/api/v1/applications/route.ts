import { db } from "@/lib/db";
import { apiHandler, json, page, pagination } from "@/lib/api-auth";
import { applicationSelect, shapeApplication } from "@/lib/api-shapes";

/** GET /api/v1/applications?requirement_id=…&status=APPLIED&limit=50&cursor=… — applications across the company's requirements. */
export const GET = apiHandler(async (req, _ctx, auth) => {
  const { url, limit, cursor } = pagination(req);
  const requirementId = url.searchParams.get("requirement_id") || undefined;
  const status = url.searchParams.get("status")?.toUpperCase();
  const rows = await db.application.findMany({
    where: { requirement: { companyId: auth.company.id }, ...(requirementId ? { requirementId } : {}), ...(status && ["APPLIED", "SHORTLISTED", "AWARDED", "DECLINED", "WITHDRAWN"].includes(status) ? { status: status as "APPLIED" } : {}) },
    select: applicationSelect, orderBy: { createdAt: "desc" }, take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const p = page(rows, limit);
  return json({ data: p.data.map(shapeApplication), next_cursor: p.next_cursor });
});
