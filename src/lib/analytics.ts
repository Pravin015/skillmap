import "server-only";
import { createHash } from "node:crypto";

/**
 * Product analytics (PostHog) and error reporting (Sentry) without SDK weight: plain HTTP calls, no-ops when unset.
 * Distinct ids are hashed user ids so raw ids never leave the platform.
 */
export const posthogConfigured = () => !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = () => (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
export const distinctId = (userId: string) => createHash("sha256").update(`cg:${userId}`).digest("hex").slice(0, 32);

/** Server-side event. Never throws, never awaited by callers that care about latency. */
export async function track(event: string, userId: string | null, properties: Record<string, unknown> = {}) {
  if (!posthogConfigured()) return;
  try {
    await fetch(`${host()}/capture/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY, event, distinct_id: userId ? distinctId(userId) : "anonymous", properties: { ...properties, $lib: "corpgurus-server" }, timestamp: new Date().toISOString() }), cache: "no-store" });
  } catch (e) { console.error("[analytics]", (e as Error).message); }
}

/* ---------- Sentry (store API, no SDK) ---------- */

export const sentryConfigured = () => !!process.env.SENTRY_DSN;

function parseDsn(dsn: string) {
  const u = new URL(dsn);
  return { key: u.username, host: u.host, projectId: u.pathname.replace(/^\//, ""), protocol: u.protocol };
}

/** Report an error to Sentry via the envelope endpoint. */
export async function reportError(err: unknown, context: Record<string, unknown> = {}) {
  if (!sentryConfigured()) return;
  try {
    const { key, host: h, projectId, protocol } = parseDsn(process.env.SENTRY_DSN!);
    const e = err instanceof Error ? err : new Error(String(err));
    const eventId = createHash("md5").update(`${Date.now()}${Math.random()}`).digest("hex");
    const event = { event_id: eventId, timestamp: new Date().toISOString(), platform: "node", level: "error", environment: process.env.NODE_ENV, release: process.env.APP_VERSION, exception: { values: [{ type: e.name, value: e.message, stacktrace: { frames: (e.stack ?? "").split("\n").slice(1, 20).reverse().map((l) => ({ function: l.trim() })) } }] }, extra: context, tags: { app: "corpgurus" } };
    const envelope = `${JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: process.env.SENTRY_DSN })}\n${JSON.stringify({ type: "event" })}\n${JSON.stringify(event)}\n`;
    await fetch(`${protocol}//${h}/api/${projectId}/envelope/`, { method: "POST", headers: { "Content-Type": "application/x-sentry-envelope", "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${key}, sentry_client=corpgurus/1.0` }, body: envelope, cache: "no-store" });
  } catch (e2) { console.error("[sentry]", (e2 as Error).message); }
}
