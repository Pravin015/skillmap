import "server-only";
import { headers } from "next/headers";

/** Fixed-window in-memory limiter. Per process; for multi-instance deployments swap the Map for Redis with the same interface. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

/** Returns true when the caller is within `limit` hits per `windowMs` for this key. */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const ip = await clientIp();
  const k = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(k);
  if (!b || b.resetAt < now) { buckets.set(k, { count: 1, resetAt: now + windowMs }); return true; }
  b.count++;
  if (buckets.size > 10000) for (const [kk, v] of buckets) if (v.resetAt < now) buckets.delete(kk);
  return b.count <= limit;
}
