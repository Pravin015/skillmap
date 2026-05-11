// Adapter for gamify (outerlayerx) — the lab platform.
//
// Auth model (per qna.md Q1/Q2 + outerlayerx codebase):
//   - `GET /api/v1/labs`            Bearer GAMIFY_STATUS_TOKEN
//   - `GET /launch?token=<jwt>`     student lands here; JWT signed HS256 with
//                                   GAMIFY_LAUNCH_SECRET, payload identifies
//                                   the student + lab. Gamify verifies, spins
//                                   up a container, iframes the lab.
//   - `GET /api/v1/launches/:jti/status`  Bearer GAMIFY_STATUS_TOKEN
//
// On lab completion gamify POSTs a signed webhook to
// /api/integrations/gamify-webhook (HMAC-SHA256 with GAMIFY_WEBHOOK_SECRET).
//
// Env vars (Railway):
//   GAMIFY_API_URL         = https://outerlayerx.com         (no trailing slash)
//   GAMIFY_CLIENT_ID       = cmp102qkb0000kwemmtuj93kg
//   GAMIFY_LAUNCH_SECRET   = <hex>  — used to mint JWTs
//   GAMIFY_WEBHOOK_SECRET  = <hex>  — used to verify webhooks (in webhook handler)
//   GAMIFY_STATUS_TOKEN    = st_…   — used to authenticate catalog + status reads
//
// If env vars aren't set, the adapter returns gamifyConfigured=false and
// the rest of the app stays functional (UI shows a "not configured" hint).

import crypto from "crypto";
import jwt from "jsonwebtoken";

const BASE = (process.env.GAMIFY_API_URL || "").replace(/\/$/, "");
const CLIENT_ID = process.env.GAMIFY_CLIENT_ID || "";
const LAUNCH_SECRET = process.env.GAMIFY_LAUNCH_SECRET || "";
const STATUS_TOKEN = process.env.GAMIFY_STATUS_TOKEN || "";

// We consider the integration "configured" when the three things we actually
// need at runtime are all present. WEBHOOK_SECRET is checked separately in
// the webhook handler — it's not needed for outbound calls.
const HAS_GAMIFY = Boolean(BASE && LAUNCH_SECRET && STATUS_TOKEN);

export interface GamifyLab {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;          // EASY | MEDIUM | HARD
  timeLimit: number;           // minutes
  xpReward: number;
  maxScore: number;
  tags: string[];
  taskCount: number;
  stats: {
    completions: number;
    avgScore: number;
  };
}

export interface LaunchStatus {
  jti: string;
  status: string;              // PENDING | RUNNING | FLAG_CAPTURED | COMPLETED | TIMED_OUT | ERRORED
  score?: number | null;
  maxScore?: number | null;
  passed?: boolean | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

class GamifyError extends Error {
  status: number;
  constructor(msg: string, status: number) { super(msg); this.status = status; }
}

/**
 * GET /api/v1/labs — catalog listing.
 *
 * Per qna.md Q2 Option A, gamify will accept the per-client `statusToken` as
 * an alternative to the legacy `apiKey` on this endpoint. Until they ship
 * that change, this call returns 401 and the UI shows the "platform connected
 * but no labs published yet" hint — which is the correct fallback.
 */
export async function listLabs(filters?: { category?: string; difficulty?: string }): Promise<GamifyLab[]> {
  if (!HAS_GAMIFY) throw new GamifyError("Gamify env vars not configured", 500);

  const qs = new URLSearchParams();
  if (filters?.category) qs.set("category", filters.category);
  if (filters?.difficulty) qs.set("difficulty", filters.difficulty);
  const query = qs.toString() ? `?${qs}` : "";

  const res = await fetch(`${BASE}/api/v1/labs${query}`, {
    headers: {
      Authorization: `Bearer ${STATUS_TOKEN}`,
      Accept: "application/json",
    },
    // Hard timeout — never hang Next's server-side render on a slow gamify.
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GamifyError(`Gamify /api/v1/labs ${res.status}: ${text.slice(0, 200)}`, res.status);
  }

  const data = (await res.json()) as { labs: GamifyLab[]; count?: number };
  return data.labs ?? [];
}

/**
 * Mint a launch URL the student opens to start a lab. Self-contained — no
 * HTTP call to gamify here; gamify verifies the JWT on its /launch endpoint.
 *
 * JWT payload (matches gamify's verifyLaunchToken expectations):
 *   { iss, sub: studentId, aud?, exp, iat, jti, lab: slug, email?, name?, lesson? }
 *
 * `jti` is the gamify-side session identifier — webhook deliveries reference
 * it so we can correlate the completion back to the right student + lab.
 */
export function mintLaunchUrl(params: {
  labSlug: string;
  studentId: string;              // AstraaHire User.id
  studentEmail?: string;
  studentName?: string;
  parentOrigin?: string;          // optional `aud` claim for CSP frame-ancestors
}): { url: string; jti: string } {
  if (!HAS_GAMIFY) throw new GamifyError("Gamify env vars not configured", 500);

  const jti = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const payload: Record<string, unknown> = {
    iss: "astraahire",
    sub: params.studentId,
    iat: now,
    exp: now + 15 * 60,            // 15-minute launch window
    jti,
    lab: params.labSlug,
  };
  if (params.studentEmail) payload.email = params.studentEmail;
  if (params.studentName) payload.name = params.studentName;
  if (params.parentOrigin) payload.aud = params.parentOrigin;

  // HS256 with the launchSecret. Gamify's verifyLaunchToken tries each
  // API_CLIENT's launchSecret until one verifies, so we don't need to set
  // `kid` — but it speeds up their lookup if we do, since they prefer
  // `kid = apiClient.id` when present.
  const signOpts: jwt.SignOptions = { algorithm: "HS256" };
  if (CLIENT_ID) {
    signOpts.header = { alg: "HS256", typ: "JWT", kid: CLIENT_ID } as jwt.JwtHeader;
  }

  const token = jwt.sign(payload, LAUNCH_SECRET, signOpts);

  return { url: `${BASE}/launch?token=${token}`, jti };
}

/**
 * GET /api/v1/launches/:jti/status — poll latest state if the webhook is
 * delayed or we want to sync before showing a result page.
 *
 * Same auth as listLabs() — Bearer statusToken. Returns the launch's current
 * state including (when completed) score + maxScore + passed.
 */
export async function getLaunchStatus(jti: string): Promise<LaunchStatus> {
  if (!HAS_GAMIFY) throw new GamifyError("Gamify env vars not configured", 500);

  const res = await fetch(`${BASE}/api/v1/launches/${encodeURIComponent(jti)}/status`, {
    headers: {
      Authorization: `Bearer ${STATUS_TOKEN}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GamifyError(`Gamify /launches/${jti}/status ${res.status}: ${text.slice(0, 200)}`, res.status);
  }

  return (await res.json()) as LaunchStatus;
}

export const gamifyConfigured = HAS_GAMIFY;
export const gamifyBaseUrl = BASE;
export { GamifyError };
