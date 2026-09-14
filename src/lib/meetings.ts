import "server-only";
import { db } from "@/lib/db";
import { createCalendarEvent } from "@/lib/calendar";

/**
 * Meeting links for interviews and virtual batches.
 * ZOOM uses a Server-to-Server OAuth app (account-level). MEET and TEAMS piggyback on the host's calendar connection.
 * AUTO picks Zoom when configured, otherwise whatever calendar the host connected, otherwise none.
 */
export type MeetingProvider = "AUTO" | "ZOOM" | "MEET" | "TEAMS" | "NONE";
export const MEETING_PROVIDERS: { value: MeetingProvider; label: string }[] = [
  { value: "AUTO", label: "Automatic (Zoom if set up, else the host's calendar)" }, { value: "ZOOM", label: "Zoom" }, { value: "MEET", label: "Google Meet" }, { value: "TEAMS", label: "Microsoft Teams" }, { value: "NONE", label: "No link, we share our own" },
];

export const zoomConfigured = () => !!process.env.ZOOM_ACCOUNT_ID && !!process.env.ZOOM_CLIENT_ID && !!process.env.ZOOM_CLIENT_SECRET;

let zoomToken: { token: string; exp: number } | null = null;
async function zoomAccessToken() {
  if (zoomToken && zoomToken.exp > Date.now() + 30_000) return zoomToken.token;
  const res = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64")}` } });
  const j = (await res.json()) as { access_token?: string; expires_in?: number; reason?: string };
  if (!res.ok || !j.access_token) throw new Error(j.reason || "Zoom token failed");
  zoomToken = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

async function createZoom(topic: string, startsAt: Date, durationMin: number) {
  const token = await zoomAccessToken();
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ topic, type: 2, start_time: startsAt.toISOString(), duration: durationMin, timezone: "UTC", settings: { join_before_host: true, waiting_room: false, mute_upon_entry: true } }) });
  const j = (await res.json()) as { join_url?: string; id?: number; message?: string };
  if (!res.ok || !j.join_url) throw new Error(j.message || "Zoom meeting failed");
  return { url: j.join_url, provider: "ZOOM" as const, externalId: String(j.id) };
}

export type MeetingResult = { url: string; provider: "ZOOM" | "MEET" | "TEAMS"; externalId?: string; calendarEventId?: string } | null;

/**
 * Create a meeting link for a host. For MEET/TEAMS a calendar event is created on the host's calendar with the conference
 * attached (attendees are invited by the calendar), so callers should not create a second event for the host.
 */
export async function createMeeting(opts: { provider: MeetingProvider; hostUserId: string; topic: string; startsAt: Date; durationMin: number; attendees?: string[]; description?: string }): Promise<MeetingResult> {
  const { provider, hostUserId, topic, startsAt, durationMin } = opts;
  const end = new Date(startsAt.getTime() + durationMin * 60000);
  const conns = await db.calendarConnection.findMany({ where: { userId: hostUserId } });
  const google = conns.find((c) => c.provider === "GOOGLE"), ms = conns.find((c) => c.provider === "MICROSOFT");
  const order: MeetingProvider[] = provider === "AUTO" ? ["ZOOM", "MEET", "TEAMS"] : provider === "NONE" ? [] : [provider];
  for (const p of order) {
    try {
      if (p === "ZOOM" && zoomConfigured()) return await createZoom(topic, startsAt, durationMin);
      if (p === "MEET" && google) { const r = await createCalendarEvent(google, { title: topic, description: opts.description, start: startsAt, end, attendees: opts.attendees, withMeet: true }); if (r.meetUrl) return { url: r.meetUrl, provider: "MEET", calendarEventId: r.id }; }
      if (p === "TEAMS" && ms) { const r = await createCalendarEvent(ms, { title: topic, description: opts.description, start: startsAt, end, attendees: opts.attendees, withMeet: true }); if (r.meetUrl) return { url: r.meetUrl, provider: "TEAMS", calendarEventId: r.id }; }
    } catch (e) { console.error("[meetings]", p, (e as Error).message); }
  }
  return null;
}

/** What a company can currently get, for the settings page. */
export async function meetingCapabilities(hostUserId: string) {
  const conns = await db.calendarConnection.findMany({ where: { userId: hostUserId }, select: { provider: true } });
  return { zoom: zoomConfigured(), meet: conns.some((c) => c.provider === "GOOGLE"), teams: conns.some((c) => c.provider === "MICROSOFT") };
}
