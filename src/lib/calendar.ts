import "server-only";
import type { CalendarProvider } from "@prisma/client";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/oauth";
import { decrypt, encrypt } from "@/lib/crypto";

/**
 * Google Calendar and Outlook (Microsoft Graph) connections for trainers and company users.
 * Push: interviews and accepted work orders become events. Pull: busy time becomes UNAVAILABLE blocks.
 * Both providers are optional; without keys the settings page explains what to configure.
 */

const CFG = {
  GOOGLE: {
    name: "Google Calendar",
    id: () => process.env.GOOGLE_CLIENT_ID ?? "", secret: () => process.env.GOOGLE_CLIENT_SECRET ?? "",
    auth: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly openid email",
  },
  MICROSOFT: {
    name: "Outlook / Microsoft 365",
    id: () => process.env.MS_CLIENT_ID ?? "", secret: () => process.env.MS_CLIENT_SECRET ?? "",
    auth: () => `https://login.microsoftonline.com/${process.env.MS_TENANT || "common"}/oauth2/v2.0/authorize`, token: () => `https://login.microsoftonline.com/${process.env.MS_TENANT || "common"}/oauth2/v2.0/token`,
    scope: "offline_access User.Read Calendars.ReadWrite",
  },
} as const;

export const calendarProviderName = (p: CalendarProvider) => CFG[p].name;
export const calendarConfigured = (p: CalendarProvider) => !!CFG[p].id() && !!CFG[p].secret();
export const calendarRedirect = (p: CalendarProvider) => `${appUrl()}/api/calendar/${p.toLowerCase()}/callback`;

export function calendarAuthUrl(p: CalendarProvider, state: string) {
  const c = CFG[p];
  const base = typeof c.auth === "function" ? c.auth() : c.auth;
  const q = new URLSearchParams({ client_id: c.id(), redirect_uri: calendarRedirect(p), response_type: "code", scope: c.scope, state });
  if (p === "GOOGLE") { q.set("access_type", "offline"); q.set("prompt", "consent"); }
  return `${base}?${q}`;
}

type Tokens = { access_token: string; refresh_token?: string; expires_in?: number; id_token?: string };

async function tokenRequest(p: CalendarProvider, body: Record<string, string>): Promise<Tokens> {
  const c = CFG[p];
  const url = typeof c.token === "function" ? c.token() : c.token;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: c.id(), client_secret: c.secret(), ...body }) });
  const json = (await res.json().catch(() => ({}))) as Tokens & { error?: string; error_description?: string };
  if (!res.ok) throw new Error(json.error_description || json.error || `${c.name} token request failed (${res.status})`);
  return json;
}

/** Exchange the OAuth code and store the connection (tokens encrypted). */
export async function connectCalendar(userId: string, p: CalendarProvider, code: string) {
  const t = await tokenRequest(p, { grant_type: "authorization_code", code, redirect_uri: calendarRedirect(p) });
  let email: string | null = null;
  try {
    if (p === "GOOGLE") { const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${t.access_token}` } }); email = ((await r.json()) as { email?: string }).email ?? null; }
    else { const r = await fetch("https://graph.microsoft.com/v1.0/me", { headers: { Authorization: `Bearer ${t.access_token}` } }); const j = (await r.json()) as { mail?: string; userPrincipalName?: string }; email = j.mail ?? j.userPrincipalName ?? null; }
  } catch { /* email is cosmetic */ }
  const data = { accessToken: encrypt(t.access_token), refreshToken: t.refresh_token ? encrypt(t.refresh_token) : undefined, expiresAt: t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null, email };
  return db.calendarConnection.upsert({ where: { userId_provider: { userId, provider: p } }, create: { userId, provider: p, ...data, refreshToken: data.refreshToken ?? null }, update: data });
}

/** Returns a valid access token, refreshing when it is within a minute of expiry. */
async function accessToken(conn: { id: string; provider: CalendarProvider; accessToken: string; refreshToken: string | null; expiresAt: Date | null }) {
  if (!conn.expiresAt || conn.expiresAt.getTime() - Date.now() > 60_000) return decrypt(conn.accessToken)!;
  const refresh = decrypt(conn.refreshToken);
  if (!refresh) throw new Error("Calendar connection expired. Reconnect it in Settings → Availability.");
  const t = await tokenRequest(conn.provider, { grant_type: "refresh_token", refresh_token: refresh, ...(conn.provider === "MICROSOFT" ? { scope: CFG.MICROSOFT.scope } : {}) });
  await db.calendarConnection.update({ where: { id: conn.id }, data: { accessToken: encrypt(t.access_token), expiresAt: t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null, ...(t.refresh_token ? { refreshToken: encrypt(t.refresh_token) } : {}) } });
  return t.access_token;
}

export type EventInput = { title: string; description?: string; start: Date; end: Date; attendees?: string[]; location?: string; withMeet?: boolean };
export type EventResult = { id: string; link: string | null; meetUrl: string | null };

async function api(conn: Parameters<typeof accessToken>[0], url: string, init?: RequestInit) {
  const token = await accessToken(conn);
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message || `Calendar API error ${res.status}`);
  return json;
}

export async function createCalendarEvent(conn: Parameters<typeof accessToken>[0] & { calendarId: string }, ev: EventInput): Promise<EventResult> {
  if (conn.provider === "GOOGLE") {
    const body = { summary: ev.title, description: ev.description, location: ev.location, start: { dateTime: ev.start.toISOString() }, end: { dateTime: ev.end.toISOString() }, attendees: ev.attendees?.map((email) => ({ email })), ...(ev.withMeet ? { conferenceData: { createRequest: { requestId: `cg-${Date.now()}`, conferenceSolutionKey: { type: "hangoutsMeet" } } } } : {}) };
    const j = (await api(conn, `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`, { method: "POST", body: JSON.stringify(body) })) as { id: string; htmlLink?: string; hangoutLink?: string };
    return { id: j.id, link: j.htmlLink ?? null, meetUrl: j.hangoutLink ?? null };
  }
  const body = { subject: ev.title, body: { contentType: "Text", content: ev.description ?? "" }, start: { dateTime: ev.start.toISOString(), timeZone: "UTC" }, end: { dateTime: ev.end.toISOString(), timeZone: "UTC" }, location: ev.location ? { displayName: ev.location } : undefined, attendees: ev.attendees?.map((email) => ({ emailAddress: { address: email }, type: "required" })), ...(ev.withMeet ? { isOnlineMeeting: true, onlineMeetingProvider: "teamsForBusiness" } : {}) };
  const j = (await api(conn, "https://graph.microsoft.com/v1.0/me/events", { method: "POST", body: JSON.stringify(body) })) as { id: string; webLink?: string; onlineMeeting?: { joinUrl?: string } };
  return { id: j.id, link: j.webLink ?? null, meetUrl: j.onlineMeeting?.joinUrl ?? null };
}

export async function deleteCalendarEvent(conn: Parameters<typeof accessToken>[0] & { calendarId: string }, eventId: string) {
  try {
    if (conn.provider === "GOOGLE") await api(conn, `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.calendarId)}/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
    else await api(conn, `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
  } catch (e) { console.error("[calendar] delete", (e as Error).message); }
}

/** Busy intervals between two instants. */
export async function fetchBusy(conn: Parameters<typeof accessToken>[0] & { calendarId: string }, from: Date, to: Date): Promise<{ start: Date; end: Date }[]> {
  if (conn.provider === "GOOGLE") {
    const j = (await api(conn, "https://www.googleapis.com/calendar/v3/freeBusy", { method: "POST", body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: conn.calendarId }] }) })) as { calendars?: Record<string, { busy?: { start: string; end: string }[] }> };
    return (j.calendars?.[conn.calendarId]?.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
  }
  const j = (await api(conn, `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${from.toISOString()}&endDateTime=${to.toISOString()}&$select=start,end,showAs&$top=500`)) as { value?: { start: { dateTime: string }; end: { dateTime: string }; showAs?: string }[] };
  return (j.value ?? []).filter((e) => e.showAs !== "free").map((e) => ({ start: new Date(`${e.start.dateTime}Z`), end: new Date(`${e.end.dateTime}Z`) }));
}

/**
 * Pull busy days from every connected calendar of a trainer into UNAVAILABLE blocks (source = provider).
 * Previously pulled blocks are replaced, so cancelled meetings free the days again.
 */
export async function syncTrainerBusy(userId: string, trainerId: string, days = 90) {
  const conns = await db.calendarConnection.findMany({ where: { userId, pullBusy: true } });
  if (!conns.length) return { blocks: 0, providers: 0 };
  const from = new Date(); from.setHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + days * 86400000);
  const dayKeys = new Map<string, { start: Date; end: Date; source: string }>();
  for (const conn of conns) {
    const busy = await fetchBusy(conn, from, to);
    for (const b of busy) {
      // Only whole-day or long (4h+) blocks count as unavailable days; short meetings do not block a training day.
      if (b.end.getTime() - b.start.getTime() < 4 * 3600000) continue;
      for (let d = new Date(b.start); d < b.end; d = new Date(d.getTime() + 86400000)) {
        const day = new Date(d); day.setHours(0, 0, 0, 0);
        dayKeys.set(`${day.toISOString().slice(0, 10)}`, { start: day, end: day, source: conn.provider.toLowerCase() });
      }
    }
    await db.calendarConnection.update({ where: { id: conn.id }, data: { lastSyncAt: new Date() } });
  }
  await db.availabilityBlock.deleteMany({ where: { trainerId, source: { in: ["google", "microsoft"] } } });
  if (dayKeys.size) await db.availabilityBlock.createMany({ data: [...dayKeys.entries()].map(([k, v]) => ({ trainerId, startDate: v.start, endDate: v.end, kind: "UNAVAILABLE", note: `Busy in ${v.source === "google" ? "Google Calendar" : "Outlook"}`, source: v.source, externalId: k })) });
  return { blocks: dayKeys.size, providers: conns.length };
}

/** Create the same event on every connected calendar of a user that has push enabled. Returns {provider: eventId}. Never throws. */
export async function pushEventToUser(userId: string, ev: EventInput): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const conns = await db.calendarConnection.findMany({ where: { userId, pushEvents: true } });
  for (const conn of conns) {
    try { const r = await createCalendarEvent(conn, ev); out[conn.provider] = r.id; if (r.meetUrl) out[`${conn.provider}_meet`] = r.meetUrl; }
    catch (e) { console.error("[calendar] push", conn.provider, (e as Error).message); }
  }
  return out;
}

export async function removeEventsForUser(userId: string, ids: Record<string, string> | null | undefined) {
  if (!ids) return;
  const conns = await db.calendarConnection.findMany({ where: { userId } });
  for (const conn of conns) if (ids[conn.provider]) await deleteCalendarEvent(conn, ids[conn.provider]);
}
