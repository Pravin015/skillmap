// B2B partner authentication for /api/v1/partner/**.
//
// Contract:
//   - Authorization: Bearer ah_(live|test)_<random>
//   - Optional Origin header — if present and not in partner.allowedOrigins, reject.
//   - Per-partner rate limit (sliding window via Upstash if configured, else
//     in-memory; key = `b2b:<partnerId>`).
//   - Scope check (today every route uses "jobs:read").
//   - Every call logged to B2BApiCallLog (async, never blocks the response).
//   - Standard error envelope: { error: { code, message, retryAfter? } }.
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimitAsync, getClientIP } from "@/lib/rate-limit";

const KEY_PREFIX_LEN = 16; // "ah_live_" + 8 random chars — cheap index lookup
export const KEY_LIVE_PREFIX = "ah_live_";
export const KEY_TEST_PREFIX = "ah_test_";

export type B2BErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "INTERNAL";

export function b2bError(
  code: B2BErrorCode,
  message: string,
  status: number,
  extra?: { retryAfter?: number; headers?: Record<string, string> }
) {
  const body: { error: { code: B2BErrorCode; message: string; retryAfter?: number } } = {
    error: { code, message },
  };
  if (extra?.retryAfter) body.error.retryAfter = extra.retryAfter;
  const res = NextResponse.json(body, { status });
  if (extra?.retryAfter) res.headers.set("Retry-After", String(extra.retryAfter));
  if (extra?.headers) {
    for (const [k, v] of Object.entries(extra.headers)) res.headers.set(k, v);
  }
  return res;
}

export interface AuthedPartner {
  id: string;
  name: string;
  scope: string[];
  rateLimit: number;
  allowedOrigins: string[];
  isActive: boolean;
  webhookUrl: string | null;
  webhookSecret: string | null;
  webhookEvents: string[];
}

interface AuthOk {
  ok: true;
  partner: AuthedPartner;
  rateHeaders: Record<string, string>;
}
interface AuthFail {
  ok: false;
  response: NextResponse;
}

export type AuthResult = AuthOk | AuthFail;

/**
 * Resolve + verify the bearer token. Returns either the authed partner
 * or a ready-to-send NextResponse with the proper error envelope.
 *
 * Call sites should:
 *   const auth = await authenticatePartner(req, "jobs:read");
 *   if (!auth.ok) return auth.response;
 *   // ... handler logic using auth.partner ...
 *   return withCorsAndRate(req, auth, response);
 */
export async function authenticatePartner(
  req: NextRequest,
  requiredScope: string
): Promise<AuthResult> {
  const started = Date.now();
  const endpoint = new URL(req.url).pathname;
  const ip = getClientIP(req);
  const userAgent = req.headers.get("user-agent");
  const origin = req.headers.get("origin");

  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(\S+)$/i);
  if (!m) {
    return {
      ok: false,
      response: b2bError("UNAUTHORIZED", "Missing or malformed Authorization header. Expected: Bearer ah_live_…", 401),
    };
  }
  const plaintext = m[1];

  // Reject obviously-wrong format early so we don't waste a bcrypt round.
  if (!plaintext.startsWith(KEY_LIVE_PREFIX) && !plaintext.startsWith(KEY_TEST_PREFIX)) {
    return {
      ok: false,
      response: b2bError("UNAUTHORIZED", "Invalid key format", 401),
    };
  }
  if (plaintext.length < KEY_PREFIX_LEN + 16) {
    return { ok: false, response: b2bError("UNAUTHORIZED", "Invalid key", 401) };
  }

  const prefix = plaintext.slice(0, KEY_PREFIX_LEN);
  const candidates = await prisma.b2BPartner.findMany({
    where: { apiKeyPrefix: prefix },
  });

  let matched: typeof candidates[number] | null = null;
  for (const c of candidates) {
    try {
      if (await bcrypt.compare(plaintext, c.apiKeyHash)) { matched = c; break; }
    } catch { /* skip malformed hash */ }
  }

  if (!matched) {
    // Log a 401 against no partner — use ip + userAgent only. (Cannot
    // attribute to a partner if the key doesn't match anyone.)
    return { ok: false, response: b2bError("UNAUTHORIZED", "Invalid or unknown API key", 401) };
  }

  const partner = matched;

  if (!partner.isActive) {
    await logCall({ partnerId: partner.id, endpoint, method: req.method, status: 403, latencyMs: Date.now() - started, ip, userAgent, errorDetail: "API key revoked" });
    return { ok: false, response: b2bError("FORBIDDEN", "API key has been revoked", 403) };
  }

  // CORS / Origin check. Server-to-server (no Origin header) is allowed.
  if (origin && partner.allowedOrigins.length > 0 && !partner.allowedOrigins.includes(origin)) {
    await logCall({ partnerId: partner.id, endpoint, method: req.method, status: 403, latencyMs: Date.now() - started, ip, userAgent, errorDetail: `Origin ${origin} not allowed` });
    return { ok: false, response: b2bError("FORBIDDEN", `Origin '${origin}' is not in the allowed list for this partner`, 403) };
  }

  // Scope check.
  if (!partner.scope.includes(requiredScope)) {
    await logCall({ partnerId: partner.id, endpoint, method: req.method, status: 403, latencyMs: Date.now() - started, ip, userAgent, errorDetail: `Missing scope ${requiredScope}` });
    return { ok: false, response: b2bError("FORBIDDEN", `Partner key missing required scope: ${requiredScope}`, 403) };
  }

  // Rate limit (sliding 60s window).
  const { allowed, remaining } = await rateLimitAsync(`b2b:${partner.id}`, partner.rateLimit, 60 * 1000);
  const resetEpoch = Math.floor(Date.now() / 1000) + 60;
  const rateHeaders = {
    "X-RateLimit-Limit": String(partner.rateLimit),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": String(resetEpoch),
  };
  if (!allowed) {
    await logCall({ partnerId: partner.id, endpoint, method: req.method, status: 429, latencyMs: Date.now() - started, ip, userAgent, errorDetail: "Rate limited" });
    return {
      ok: false,
      response: b2bError("RATE_LIMITED", `Rate limit ${partner.rateLimit}/min exceeded`, 429, {
        retryAfter: 60,
        headers: rateHeaders,
      }),
    };
  }

  // Bump lastUsedAt — fire-and-forget.
  prisma.b2BPartner.update({
    where: { id: partner.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return {
    ok: true,
    partner: {
      id: partner.id,
      name: partner.name,
      scope: partner.scope,
      rateLimit: partner.rateLimit,
      allowedOrigins: partner.allowedOrigins,
      isActive: partner.isActive,
      webhookUrl: partner.webhookUrl,
      webhookSecret: partner.webhookSecret,
      webhookEvents: partner.webhookEvents,
    },
    rateHeaders,
  };
}

/**
 * Wrap a successful response: copy rate-limit headers + CORS headers.
 * Also writes the audit log entry asynchronously.
 */
export function finalisePartnerResponse(
  req: NextRequest,
  auth: AuthOk,
  res: NextResponse,
  startedAt: number
): NextResponse {
  for (const [k, v] of Object.entries(auth.rateHeaders)) res.headers.set(k, v);

  const origin = req.headers.get("origin");
  if (origin && auth.partner.allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Async audit log.
  const endpoint = new URL(req.url).pathname;
  logCall({
    partnerId: auth.partner.id,
    endpoint,
    method: req.method,
    status: res.status,
    latencyMs: Date.now() - startedAt,
    ip: getClientIP(req),
    userAgent: req.headers.get("user-agent"),
    errorDetail: res.status >= 400 ? `HTTP ${res.status}` : null,
  });

  return res;
}

interface LogArgs {
  partnerId: string;
  endpoint: string;
  method: string;
  status: number;
  latencyMs: number;
  ip: string;
  userAgent: string | null;
  errorDetail: string | null;
}
function logCall(a: LogArgs) {
  prisma.b2BApiCallLog
    .create({
      data: {
        partnerId: a.partnerId,
        endpoint: a.endpoint,
        method: a.method,
        status: a.status,
        latencyMs: a.latencyMs,
        ip: a.ip,
        userAgent: a.userAgent?.slice(0, 200) || null,
        errorDetail: a.errorDetail?.slice(0, 200) || null,
      },
    })
    .catch((e) => console.error("[b2b-log]", e));
}

/**
 * CORS preflight responder. Returns null if not a preflight, else a
 * fully-formed OPTIONS response. Doesn't authenticate — preflight runs
 * without credentials by design.
 */
export function handlePreflight(req: NextRequest): NextResponse | null {
  if (req.method !== "OPTIONS") return null;
  const origin = req.headers.get("origin") || "";
  const reqMethod = req.headers.get("access-control-request-method") || "GET";
  const reqHeaders = req.headers.get("access-control-request-headers") || "authorization,content-type";

  // We can't check the partner allowlist without the API key (which isn't
  // sent on preflight), so echo Origin back. The actual call later will
  // enforce the allowlist before doing anything sensitive.
  const res = new NextResponse(null, { status: 204 });
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
  }
  res.headers.set("Access-Control-Allow-Methods", reqMethod);
  res.headers.set("Access-Control-Allow-Headers", reqHeaders);
  res.headers.set("Access-Control-Max-Age", "600");
  return res;
}

// ─── Key generation helpers ────────────────────────────────────
// Used by /api/admin/b2b-partners on create + rotate.

export function generateApiKey(env: "live" | "test" = "live"): {
  plaintext: string;
  prefix: string;
  last4: string;
} {
  const random = crypto.randomBytes(36).toString("base64url"); // 48 chars
  const prefix = env === "live" ? KEY_LIVE_PREFIX : KEY_TEST_PREFIX;
  const plaintext = `${prefix}${random}`;
  return {
    plaintext,
    prefix: plaintext.slice(0, KEY_PREFIX_LEN),
    last4: plaintext.slice(-4),
  };
}

export async function hashApiKey(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, 10);
}
