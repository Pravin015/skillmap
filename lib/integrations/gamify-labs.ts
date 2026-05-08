// Adapter for gamify (outerlayerx) — the lab platform.
// Their API is purpose-built for LMS integration:
//   - GET  /api/v1/labs                   list published labs
//   - POST /api/v1/sessions               start a session for our user (returns embedUrl)
//   - GET  /api/v1/sessions/:id           current session state
//   - POST /api/v1/sessions/:id/end       force-end a session
//
// Auth: Authorization: Bearer <api_key>. Provisioned in their admin
// panel (admin/api-clients) — one key per LMS.
//
// Setup:
//   GAMIFY_API_URL=https://gamify.example.com   (no trailing slash)
//   GAMIFY_API_KEY=<bearer-token>
//
// If env vars aren't set, the adapter returns a stub error so the
// rest of the app stays functional.

const BASE = (process.env.GAMIFY_API_URL || "").replace(/\/$/, "");
const KEY = process.env.GAMIFY_API_KEY || "";
const HAS_GAMIFY = Boolean(BASE && KEY);

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

export interface GamifySession {
  sessionId: string;
  status: string;              // queued | running | completed | failed | timeout
  labUrl?: string;             // direct lab URL (full-page redirect)
  embedUrl?: string;           // iframe-friendly URL
  expiresAt?: string;
}

class GamifyError extends Error {
  status: number;
  constructor(msg: string, status: number) { super(msg); this.status = status; }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!HAS_GAMIFY) {
    throw new GamifyError("GAMIFY_API_URL / GAMIFY_API_KEY not configured", 500);
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
    // Hard timeout — never hang Next.js server-side render on a slow gamify.
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GamifyError(`Gamify ${res.status}: ${text.slice(0, 200)}`, res.status);
  }
  return (await res.json()) as T;
}

/** GET /api/v1/labs — paginated list of published labs. */
export async function listLabs(filters?: { category?: string; difficulty?: string }): Promise<GamifyLab[]> {
  const qs = new URLSearchParams();
  if (filters?.category) qs.set("category", filters.category);
  if (filters?.difficulty) qs.set("difficulty", filters.difficulty);
  const query = qs.toString() ? `?${qs}` : "";
  const data = await call<{ labs: GamifyLab[]; count: number }>(`/api/v1/labs${query}`);
  return data.labs;
}

/**
 * POST /api/v1/sessions — start a lab for our student.
 * The student's AstraaHire userId is passed as `externalUserId` so
 * gamify scopes their gamify-side state per AstraaHire identity.
 */
export async function startLabSession(params: {
  labSlug: string;
  externalUserId: string;        // AstraaHire User.id
  externalUserEmail?: string;
  externalUserName?: string;
  callbackUrl?: string;          // override webhook
  metadata?: Record<string, unknown>;
}): Promise<GamifySession> {
  return call<GamifySession>("/api/v1/sessions", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** GET /api/v1/sessions/:id — poll session state if webhook hasn't fired. */
export async function getSessionStatus(sessionId: string): Promise<GamifySession> {
  return call<GamifySession>(`/api/v1/sessions/${sessionId}`);
}

/** POST /api/v1/sessions/:id/end — force-end (used when student cancels). */
export async function endLabSession(sessionId: string): Promise<{ ok: boolean }> {
  return call<{ ok: boolean }>(`/api/v1/sessions/${sessionId}/end`, { method: "POST" });
}

export const gamifyConfigured = HAS_GAMIFY;
export { GamifyError };
