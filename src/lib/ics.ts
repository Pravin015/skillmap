/** Minimal iCalendar builder for interview invites. */
const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);

export function buildIcs({ uid, title, description, location, start, durationMin, organizer, attendee, url }: { uid: string; title: string; description: string; location?: string; start: Date; durationMin: number; organizer: { name: string; email: string }; attendee: { name: string; email: string }; url?: string }) {
  const end = new Date(start.getTime() + durationMin * 60000);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CorpGurus//Interviews//EN", "METHOD:REQUEST", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${uid}@corpgurus`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(description)}`, location ? `LOCATION:${esc(location)}` : "", url ? `URL:${url}` : "",
    `ORGANIZER;CN=${esc(organizer.name)}:mailto:${organizer.email}`, `ATTENDEE;CN=${esc(attendee.name)};RSVP=FALSE:mailto:${attendee.email}`,
    "STATUS:CONFIRMED", "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", `DESCRIPTION:${esc(title)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n") + "\r\n";
}
