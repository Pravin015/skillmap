import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { apiHandler, ApiError, json } from "@/lib/api-auth";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";

/** REST-hook style subscriptions for Zapier, Make and similar: list and create webhook endpoints with the API key. */
export const GET = apiHandler(async (_req, _ctx, auth) => {
  const rows = await db.webhookEndpoint.findMany({ where: { companyId: auth.company.id }, select: { id: true, url: true, events: true, active: true, createdAt: true }, orderBy: { createdAt: "asc" } });
  return json({ data: rows });
});

export const POST = apiHandler(async (req, _ctx, auth) => {
  let body: { url?: string; events?: string[] | string };
  try { body = await req.json(); } catch { throw new ApiError(400, "Body must be JSON: { url, events[] }"); }
  const url = String(body.url ?? "").trim();
  if (!/^https:\/\/[^\s]+$/i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(url)) throw new ApiError(422, "url must be an https URL");
  const events = (Array.isArray(body.events) ? body.events : String(body.events ?? "*").split(",")).map((e) => e.trim()).filter((e) => e === "*" || (WEBHOOK_EVENTS as readonly string[]).includes(e));
  if (!events.length) throw new ApiError(422, `events must include "*" or one of: ${WEBHOOK_EVENTS.join(", ")}`);
  const count = await db.webhookEndpoint.count({ where: { companyId: auth.company.id } });
  if (count >= 10) throw new ApiError(409, "Up to 10 endpoints per company.");
  const secret = `whsec_${randomBytes(24).toString("base64url")}`;
  const ep = await db.webhookEndpoint.create({ data: { companyId: auth.company.id, url, secret, events: events.includes("*") ? ["*"] : events } });
  // The signing secret is returned once, on creation.
  return json({ data: { id: ep.id, url: ep.url, events: ep.events, active: ep.active, secret, created_at: ep.createdAt } }, 201);
});
