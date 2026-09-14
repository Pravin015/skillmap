import type { AppStatus, CertStatus, ConnStatus, DeliveryMode, ReqStatus, Role } from "@prisma/client";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function money(amount: number | null | undefined, currency = "INR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function rateRange(min?: number | null, max?: number | null, currency = "INR") {
  if (min == null && max == null) return "Rate on request";
  if (min != null && max != null) return `${money(min, currency)} – ${money(max, currency)} / day`;
  return `${money(min ?? max, currency)} / day`;
}

export function fmtDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export function dateRange(a: Date | string, b: Date | string) {
  const s = new Date(a), e = new Date(b);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const f = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", o).format(d);
  return sameMonth
    ? `${f(s, { day: "numeric" })}–${f(e, { day: "numeric", month: "short", year: "numeric" })}`
    : `${f(s, { day: "numeric", month: "short" })} – ${f(e, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function timeAgo(d: Date | string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(d);
}

export const modeLabel: Record<DeliveryMode, string> = { ONSITE: "Onsite", VIRTUAL: "Virtual", HYBRID: "Hybrid" };
export const reqStatusLabel: Record<ReqStatus, string> = {
  OPEN: "Open", SHORTLISTING: "Shortlisting", AWARDED: "Awarded", COMPLETED: "Completed", CANCELLED: "Cancelled",
};
export const appStatusLabel: Record<AppStatus, string> = {
  APPLIED: "Applied", SHORTLISTED: "Shortlisted", AWARDED: "Awarded", DECLINED: "Declined", WITHDRAWN: "Withdrawn",
};
export const certStatusLabel: Record<CertStatus, string> = { PENDING: "Pending review", VERIFIED: "Verified", REJECTED: "Rejected", EXPIRED: "Expired" };
export const connStatusLabel: Record<ConnStatus, string> = { PENDING: "Pending", ACCEPTED: "Connected", IGNORED: "Ignored" };
export const roleLabel: Record<Role, string> = { TRAINER: "Trainer", COMPANY: "Company", ADMIN: "Administrator", SUPER_ADMIN: "Super admin" };

export const DELIVERY_MODES: DeliveryMode[] = ["ONSITE", "VIRTUAL", "HYBRID"];
export const CURRENCIES = ["INR", "USD"];
export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];
export const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Marathi", "Bengali", "Malayalam", "Gujarati"];

export function parseList(v: FormDataEntryValue | null) {
  return String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function daysBetween(a: Date, b: Date) {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}
