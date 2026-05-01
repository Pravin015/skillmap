// Adzuna — public job-search API. https://developer.adzuna.com/
// Free tier: 1000 calls/day. Needs ADZUNA_APP_ID + ADZUNA_APP_KEY env vars.
// India coverage is the best of any free API we tested.

import { fetchJson } from "../lib/fetcher";
import type { RawJob, SourceAdapter } from "../lib/types";

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  category?: { label?: string };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  contract_time?: string;      // "full_time" | "part_time"
  contract_type?: string;      // "permanent" | "contract"
  created?: string;
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

export const adzuna: SourceAdapter = {
  slug: "adzuna-in",
  displayName: "Adzuna India",
  baseUrl: "https://api.adzuna.com",
  vertical: "FULLTIME",
  defaultQuery: { country: "in", where: "India", what: "", pages: 3 },

  async *scrape({ query, maxItems = 120 }) {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) throw new Error("ADZUNA_APP_ID/ADZUNA_APP_KEY not set");

    const country = String(query?.country ?? "in");
    const what = String(query?.what ?? "");
    const where = String(query?.where ?? "");
    const pages = Math.min(Number(query?.pages ?? 3), 5);
    const perPage = 50;

    let emitted = 0;

    for (let page = 1; page <= pages; page++) {
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: String(perPage),
        "content-type": "application/json",
      });
      if (what) params.set("what", what);
      if (where) params.set("where", where);

      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;
      let data: AdzunaResponse;
      try {
        data = await fetchJson<AdzunaResponse>(url, { timeoutMs: 20000 });
      } catch (err) {
        if (page === 1) throw err;
        break; // partial page failure — stop here, what we have is fine
      }

      const rows = data.results ?? [];
      if (rows.length === 0) break;

      for (const j of rows) {
        if (emitted >= maxItems) return;
        const title = j.title?.replace(/<[^>]+>/g, "").trim() || "";
        const company = j.company?.display_name?.trim() || "";
        if (!title || !company) continue;

        const isIntern = /\bintern(ship)?\b/i.test(title) || j.contract_time === "part_time";

        let salaryText: string | null = null;
        if (j.salary_min || j.salary_max) {
          const fmt = (n?: number) => (n ? `₹${Math.round(n).toLocaleString("en-IN")}` : "?");
          salaryText = `${fmt(j.salary_min)} – ${fmt(j.salary_max)}${j.salary_is_predicted === "1" ? " (est.)" : ""}`;
        }

        const raw: RawJob = {
          sourceJobId: j.id,
          title,
          company,
          companyLogoUrl: null,
          location: j.location?.display_name?.trim() || "India",
          workMode: null, // normalizer will infer from description text
          salaryText,
          experienceLevel: null,
          jobType: isIntern ? "Internship" : j.contract_time === "part_time" ? "Part-time" : "Full-time",
          domain: j.category?.label ?? null,
          description: j.description,
          skills: [],
          externalUrl: j.redirect_url,
          postedAt: j.created ? new Date(j.created) : null,
          vertical: isIntern ? "INTERNSHIP" : "FULLTIME",
        };
        yield raw;
        emitted++;
      }

      if (rows.length < perPage) break;
    }
  },
};
