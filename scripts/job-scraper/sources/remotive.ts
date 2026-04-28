// Remotive — official public JSON API. Remote jobs worldwide, many accept India-based candidates.
// Docs: https://remotive.com/api-documentation
// This is the most reliable source — API-backed, no HTML parsing.

import { fetchJson } from "../lib/fetcher";
import type { RawJob, SourceAdapter } from "../lib/types";

interface RemotiveResponse {
  "job-count": number;
  jobs: Array<{
    id: number;
    url: string;
    title: string;
    company_name: string;
    company_logo?: string;
    category: string;
    tags: string[];
    job_type: string;
    publication_date: string; // ISO
    candidate_required_location: string;
    salary?: string;
    description: string;
  }>;
}

export const remotive: SourceAdapter = {
  slug: "remotive",
  displayName: "Remotive",
  baseUrl: "https://remotive.com",
  vertical: "FULLTIME",
  defaultQuery: { category: "software-dev", limit: 40 },

  async *scrape({ query, maxItems = 40 }) {
    const params = new URLSearchParams();
    if (query?.category) params.set("category", String(query.category));
    if (query?.search) params.set("search", String(query.search));
    params.set("limit", String(Math.min(maxItems, 50)));

    const url = `https://remotive.com/api/remote-jobs?${params.toString()}`;
    const data = await fetchJson<RemotiveResponse>(url, { timeoutMs: 20000 });

    let count = 0;
    for (const j of data.jobs ?? []) {
      if (count >= maxItems) break;
      const raw: RawJob = {
        sourceJobId: String(j.id),
        title: j.title,
        company: j.company_name,
        companyLogoUrl: j.company_logo ?? null,
        location: j.candidate_required_location || "Remote",
        workMode: "Remote",
        salaryText: j.salary || null,
        experienceLevel: null,
        jobType: j.job_type || "Full-time",
        domain: j.category || null,
        description: j.description,
        skills: (j.tags || []).slice(0, 10),
        externalUrl: j.url,
        postedAt: j.publication_date ? new Date(j.publication_date) : null,
        vertical: "FULLTIME",
      };
      yield raw;
      count++;
    }
  },
};
