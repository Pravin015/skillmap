import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Public API v1 authentication: `Authorization: Bearer cg_live_…`. Keys are stored hashed; the plaintext is shown once at creation. */

export const API_KEY_PREFIX = "cg_live_";

export function generateApiKey() {
  const secret = randomBytes(24).toString("base64url");
  const key = `${API_KEY_PREFIX}${secret}`;
  return { key, prefix: key.slice(0, API_KEY_PREFIX.length + 6), keyHash: hashApiKey(key) };
}

export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** In-memory per-key limiter: 600 requests per minute. Swap for Redis alongside `ratelimit.ts` for multi-instance deployments. */
const buckets = new Map<string, { count: number; resetAt: number }>();
function limited(keyId: string) {
  const now = Date.now();
  const b = buckets.get(keyId);
  if (!b || b.resetAt < now) { buckets.set(keyId, { count: 1, resetAt: now + 60_000 }); return false; }
  b.count++;
  return b.count > 600;
}

export async function authenticateApi(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(\S+)$/i);
  if (!m) throw new ApiError(401, "Missing bearer token. Send `Authorization: Bearer cg_live_…`.");
  if (!m[1].startsWith(API_KEY_PREFIX)) throw new ApiError(401, "Malformed API key.");
  const key = await db.apiKey.findUnique({ where: { keyHash: hashApiKey(m[1]) }, include: { company: { select: { id: true, name: true, slug: true } } } });
  if (!key || key.revokedAt) throw new ApiError(401, "Invalid or revoked API key.");
  if (limited(key.id)) throw new ApiError(429, "Rate limit exceeded (600 requests per minute).");
  // Touch lastUsedAt at most once a minute to keep writes cheap.
  if (!key.lastUsedAt || Date.now() - key.lastUsedAt.getTime() > 60_000) await db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { keyId: key.id, company: key.company };
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

/** Wrap a route handler so ApiError and unexpected errors become clean JSON responses. */
export function apiHandler<Ctx>(fn: (req: Request, ctx: Ctx, auth: Awaited<ReturnType<typeof authenticateApi>>) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      const auth = await authenticateApi(req);
      return await fn(req, ctx, auth);
    } catch (e) {
      if (e instanceof ApiError) return json({ error: { status: e.status, message: e.message } }, e.status);
      console.error("[api/v1]", e);
      return json({ error: { status: 500, message: "Internal error" } }, 500);
    }
  };
}

/** Parse pagination from the query string: `?limit=50&cursor=<id>`. */
export function pagination(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
  const cursor = url.searchParams.get("cursor") || undefined;
  return { url, limit, cursor };
}

/** Shape a list response with a `next_cursor` for the caller. */
export function page<T extends { id: string }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  return { data, next_cursor: hasMore ? data[data.length - 1].id : null };
}
