// Hybrid rate limiter:
//   - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set,
//     uses Upstash Redis (durable across deploys + multi-instance).
//   - Otherwise falls back to an in-process Map (good enough for
//     single-instance dev + early prod with one Railway replica).
//
// Why both: in-memory was the original implementation. It works,
// but every Railway redeploy wipes the limiter and it doesn't share
// state across replicas. Upstash gives us a free 10K-request/day
// tier — plenty for OTP flows, offer-verify, abuse reports, etc.
//
// Setup (optional):
//   1. https://console.upstash.com/redis → create db (any region)
//   2. Copy REST URL + REST Token from the UI
//   3. Add to Railway env:
//        UPSTASH_REDIS_REST_URL=https://...upstash.io
//        UPSTASH_REDIS_REST_TOKEN=...
//   4. Redeploy. Limiter auto-detects and switches.

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const HAS_UPSTASH = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

// ─── In-memory fallback (per-instance) ───────────────────────────
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function rateLimitMemory(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

// Cleanup every 5 min so the memory map doesn't grow forever.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memoryStore) if (now > v.resetAt) memoryStore.delete(k);
  }, 5 * 60 * 1000);
}

// ─── Upstash REST API (durable + cross-instance) ─────────────────
//
// Uses INCR + EXPIRE NX pattern — atomic increment, set TTL only
// on the first hit. One pipelined round-trip per request.
async function rateLimitUpstash(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  const ttlSec = Math.ceil(windowMs / 1000);
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(ttlSec), "NX"],
      ]),
      // Hard timeout — never hang the request because the limiter is slow.
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) {
      // Upstash unavailable → in-memory fallback so we don't accidentally
      // block all traffic when our limiter has a bad day.
      console.warn("[rate-limit] Upstash returned", res.status, "— falling back to memory");
      return rateLimitMemory(key, limit, windowMs);
    }

    const result = (await res.json()) as Array<{ result: number | string }>;
    const count = Number(result[0]?.result ?? 0);
    if (count > limit) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: Math.max(0, limit - count) };
  } catch (err) {
    console.warn("[rate-limit] Upstash error:", (err as Error).message);
    return rateLimitMemory(key, limit, windowMs);
  }
}

/**
 * Synchronous rate limit — uses in-memory store only.
 * Backwards-compatible signature for existing call sites that
 * don't await. New code that needs distributed limiting should
 * use rateLimitAsync.
 */
export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  return rateLimitMemory(key, limit, windowMs);
}

/**
 * Async rate limit — uses Upstash if configured, falls back to
 * in-memory if not (or on Upstash error). Recommended for any
 * critical surface (auth, payments, AI calls).
 */
export async function rateLimitAsync(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  if (HAS_UPSTASH) return rateLimitUpstash(key, limit, windowMs);
  return rateLimitMemory(key, limit, windowMs);
}

// Helper to get client IP from request
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
