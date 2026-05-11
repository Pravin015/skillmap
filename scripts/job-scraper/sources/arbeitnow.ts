// Arbeitnow — free job-board API. https://www.arbeitnow.com/api/job-board-api
// No key required. Heavy on remote + EU tech; complements Adzuna's India coverage.

import { fetchJson } from "../lib/fetcher";
import type { RawJob, SourceAdapter } from "../lib/types";

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number; // unix seconds
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  links?: { next?: string };
}

export const arbeitnow: SourceAdapter = {
  slug: "arbeitnow",
  displayName: "Arbeitnow (Remote + Tech)",
  baseUrl: "https://www.arbeitnow.com",
  vertical: "FULLTIME",
  // Arbeitnow's API has no keyword filter, so we pull the global feed and
  // drop everything that isn't a cybersecurity-flavoured role. Match against
  // title + tags + a description snippet so we catch SOC analyst, pen-tester,
  // GRC, infosec, etc., not just exact-string "cyber security".
  // `pages` is bumped to 5 because we now discard most rows.
  defaultQuery: { pages: 5, keywords: "cyber|security|infosec|soc|pen[- ]?test|grc|threat|vulnerab|siem|firewall|incident response" },

  async *scrape({ query, maxItems = 100 }) {
    const pages = Math.min(Number(query?.pages ?? 5), 5);
    const keywordSrc = String(query?.keywords ?? "cyber|security|infosec|soc|pen[- ]?test|grc|threat|vulnerab|siem|firewall|incident response");
    const keywordRe = new RegExp(keywordSrc, "i");
    let emitted = 0;

    for (let page = 1; page <= pages; page++) {
      const url = `https://www.arbeitnow.com/api/job-board-api?page=${page}`;
      let data: ArbeitnowResponse;
      try {
        data = await fetchJson<ArbeitnowResponse>(url, { timeoutMs: 20000 });
      } catch (err) {
        if (page === 1) throw err;
        break;
      }

      const rows = data.data ?? [];
      if (rows.length === 0) break;

      for (const j of rows) {
        if (emitted >= maxItems) return;

        // Filter: keep only rows whose title, tags, or first 500 chars of
        // description match the cybersecurity regex.
        const haystack = `${j.title} ${(j.tags ?? []).join(" ")} ${(j.description ?? "").slice(0, 500)}`;
        if (!keywordRe.test(haystack)) continue;

        const types = (j.job_types ?? []).join(" ").toLowerCase();
        const isIntern = /\bintern(ship)?\b/i.test(j.title) || /intern/.test(types);

        const raw: RawJob = {
          sourceJobId: j.slug,
          title: j.title,
          company: j.company_name,
          companyLogoUrl: null,
          location: j.location || (j.remote ? "Remote" : "Unknown"),
          workMode: j.remote ? "Remote" : null,
          salaryText: null,
          experienceLevel: null,
          jobType: isIntern ? "Internship" : "Full-time",
          domain: (j.tags ?? [])[0] ?? null,
          description: j.description,
          skills: (j.tags ?? []).slice(0, 10),
          externalUrl: j.url,
          postedAt: j.created_at ? new Date(j.created_at * 1000) : null,
          vertical: isIntern ? "INTERNSHIP" : "FULLTIME",
        };
        yield raw;
        emitted++;
      }

      if (!data.links?.next) break;
    }
  },
};
