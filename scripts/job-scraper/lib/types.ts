import type { JobVertical } from "@/lib/generated/prisma/client";

// The shape every source adapter returns for each listing.
// Keep it loose — normalize.ts trims/validates before DB insert.
export interface RawJob {
  sourceJobId: string; // stable upstream id; fallback = hash of url
  title: string;
  company: string;
  companyLogoUrl?: string | null;
  location: string;
  workMode?: string | null;
  salaryText?: string | null;
  experienceLevel?: string | null;
  jobType?: string | null;
  domain?: string | null;
  description?: string | null;
  skills?: string[];
  externalUrl: string;
  postedAt?: Date | null;
  expiresAt?: Date | null;
  vertical: JobVertical;
}

export interface SourceAdapter {
  slug: string;
  displayName: string;
  baseUrl: string;
  vertical: JobVertical;
  defaultQuery?: Record<string, unknown>;
  // Yield raw jobs one-by-one so we can stream-insert and cap counts.
  scrape(opts: {
    query?: Record<string, unknown>;
    maxItems?: number;
  }): AsyncGenerator<RawJob>;
}

export interface RunSummary {
  sourceSlug: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  itemsFound: number;
  itemsInserted: number;
  itemsUpdated: number;
  itemsSkipped: number;
  durationMs: number;
  error?: string;
}
