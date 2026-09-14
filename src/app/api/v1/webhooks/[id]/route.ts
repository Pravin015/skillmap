import { db } from "@/lib/db";
import { apiHandler, ApiError, json } from "@/lib/api-auth";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/v1/webhooks/:id — unsubscribe (Zapier calls this when a Zap is turned off). */
export const DELETE = apiHandler<Ctx>(async (_req, ctx, auth) => {
  const { id } = await ctx.params;
  const r = await db.webhookEndpoint.deleteMany({ where: { id, companyId: auth.company.id } });
  if (!r.count) throw new ApiError(404, "Webhook not found.");
  return json({ ok: true });
});

/** GET /api/v1/webhooks/:id — endpoint with its last 20 deliveries, for debugging integrations. */
export const GET = apiHandler<Ctx>(async (_req, ctx, auth) => {
  const { id } = await ctx.params;
  const ep = await db.webhookEndpoint.findFirst({ where: { id, companyId: auth.company.id }, select: { id: true, url: true, events: true, active: true, createdAt: true, deliveries: { select: { event: true, status: true, responseCode: true, error: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 } } });
  if (!ep) throw new ApiError(404, "Webhook not found.");
  return json({ data: ep });
});
