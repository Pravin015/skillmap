/** Time-zone helpers built on Intl only (no dependency). */

export const TIMEZONES = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Kuala_Lumpur", "Asia/Bangkok", "Asia/Jakarta", "Asia/Manila", "Asia/Tokyo", "Asia/Hong_Kong", "Asia/Riyadh", "Asia/Karachi", "Asia/Dhaka", "Asia/Colombo", "Asia/Kathmandu",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Amsterdam", "Europe/Madrid", "Europe/Zurich", "Africa/Johannesburg", "Africa/Nairobi", "Africa/Lagos",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "America/Sao_Paulo", "Australia/Sydney", "Australia/Perth", "Pacific/Auckland", "UTC",
];

/** Offset (ms) of `tz` from UTC at the given instant. */
function offsetAt(instant: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - instant.getTime();
}

/** "2026-09-16T11:00" typed by someone in `tz` → the real instant. Handles DST by iterating once. */
export function zonedToUtc(local: string, tz: string): Date | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const guess = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0));
  let utc = guess - offsetAt(new Date(guess), tz);
  utc = guess - offsetAt(new Date(utc), tz);
  const d = new Date(utc);
  return isNaN(d.getTime()) ? null : d;
}

export function fmtInTz(d: Date | string, tz = "Asia/Kolkata", opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) {
  const date = new Date(d);
  const label = new Intl.DateTimeFormat("en-IN", { ...opts, timeZone: tz }).format(date);
  const raw = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(date).find((p) => p.type === "timeZoneName")?.value ?? tz;
  const abbr = tz === "Asia/Kolkata" ? "IST" : raw;
  return `${label} ${abbr}`;
}

export const isTimezone = (tz: string) => { try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; } };
