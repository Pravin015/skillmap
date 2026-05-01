import { createHash } from "node:crypto";
import type { RawJob } from "./types";

const WORK_MODES = ["remote", "hybrid", "on-site", "onsite", "work from home", "wfh"];

export function normalizeWorkMode(raw?: string | null): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes("remote") || s.includes("work from home") || s.includes("wfh")) return "Remote";
  if (s.includes("hybrid")) return "Hybrid";
  if (s.includes("on-site") || s.includes("onsite") || s.includes("in office") || s.includes("in-office")) return "On-site";
  // Fall back to title-case of first matching token.
  for (const tok of WORK_MODES) if (s.includes(tok)) return tok.replace(/\b\w/g, (c) => c.toUpperCase());
  return null;
}

// Cleans HTML snippets and collapses whitespace. We don't store full JDs.
export function cleanText(raw?: string | null, maxLen = 500): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  if (!collapsed) return null;
  return collapsed.length > maxLen ? collapsed.slice(0, maxLen - 1) + "…" : collapsed;
}

// Parse "₹3,00,000 - ₹6,00,000 per year" or "₹15,000/month" into LPA min/max.
// Returns null for both when unparseable.
export function parseSalary(raw?: string | null): { min: number | null; max: number | null } {
  if (!raw) return { min: null, max: null };
  const s = raw.toLowerCase().replace(/[₹,]/g, "");
  const nums = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(lakh|lpa|k|crore|cr)?/g)];
  if (nums.length === 0) return { min: null, max: null };

  const toLpa = (n: number, unit: string | undefined): number => {
    if (!unit) {
      // assume annual in rupees if >= 10000; monthly stipends <10000 → approx
      if (n >= 100000) return Math.round(n / 100000);
      if (n >= 10000) return Math.round((n * 12) / 100000);
      return n; // tiny numbers, probably already in LPA
    }
    if (unit === "lakh" || unit === "lpa") return Math.round(n);
    if (unit === "crore" || unit === "cr") return Math.round(n * 100);
    if (unit === "k") {
      // usually monthly: 50k = 50000/month = 6 LPA
      return Math.round((n * 1000 * 12) / 100000);
    }
    return Math.round(n);
  };

  const values = nums.map((m) => toLpa(parseFloat(m[1]), m[2]));
  const isMonthly = s.includes("/month") || s.includes("per month") || s.includes("monthly");
  const scaled = isMonthly ? values.map((v) => Math.round((v * 12) / 100000 || v)) : values;
  const min = Math.min(...scaled);
  const max = Math.max(...scaled);
  return { min: isFinite(min) ? min : null, max: isFinite(max) ? max : null };
}

// Dedupe hash per source — combines enough to detect "same job reposted".
// We include sourceSlug so cross-posted jobs don't collide.
export function makeDedupeHash(sourceSlug: string, title: string, company: string, location: string): string {
  const key = [sourceSlug, title, company, location].map((x) => x.toLowerCase().replace(/\s+/g, " ").trim()).join("|");
  return createHash("sha256").update(key).digest("hex").slice(0, 32);
}

// Sanity check before insert — bail if required fields are missing or obviously junk.
export function validateRaw(raw: RawJob): string | null {
  if (!raw.title || raw.title.length < 3) return "title too short";
  if (!raw.company || raw.company.length < 2) return "company too short";
  if (!raw.externalUrl || !/^https?:\/\//.test(raw.externalUrl)) return "invalid externalUrl";
  if (!raw.sourceJobId) return "missing sourceJobId";
  return null;
}
