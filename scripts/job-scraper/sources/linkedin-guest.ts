// LinkedIn guest job search — public endpoint that LinkedIn's own unauthenticated job page uses.
// Returns an HTML fragment of <li> job cards. We only read what's publicly visible to anyone
// browsing without an account, and we redirect users out (no application scraping).
//
// If LinkedIn blocks this endpoint, the run will fail cleanly and we show the last good cache.

import * as cheerio from "cheerio";
import { fetchText } from "../lib/fetcher";
import type { RawJob, SourceAdapter } from "../lib/types";

export const linkedinGuest: SourceAdapter = {
  slug: "linkedin-guest",
  displayName: "LinkedIn",
  baseUrl: "https://www.linkedin.com",
  vertical: "FULLTIME",
  defaultQuery: { keywords: "software engineer", location: "India", start: 0 },

  async *scrape({ query, maxItems = 40 }) {
    const keywords = encodeURIComponent(String(query?.keywords ?? "software engineer"));
    const location = encodeURIComponent(String(query?.location ?? "India"));
    const pageSize = 25;
    let start = Number(query?.start ?? 0);
    let yielded = 0;

    while (yielded < maxItems) {
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${keywords}&location=${location}&start=${start}`;
      let html: string;
      try {
        html = await fetchText(url, { timeoutMs: 20000, headers: { Referer: "https://www.linkedin.com/jobs/search/" } });
      } catch {
        break; // bail on first failed page; whatever we have so far is kept
      }
      const $ = cheerio.load(html);
      const cards = $("li").toArray();
      if (cards.length === 0) break;

      for (const el of cards) {
        if (yielded >= maxItems) break;
        const $c = $(el);
        const urn = $c.find("[data-entity-urn]").attr("data-entity-urn") || $c.attr("data-entity-urn");
        const sourceJobId = (urn?.split(":").pop()) || "";
        const title = $c.find(".base-search-card__title, h3.base-search-card__title").text().trim();
        const company = $c.find(".base-search-card__subtitle, h4.base-search-card__subtitle").text().trim();
        const location = $c.find(".job-search-card__location").text().trim() || "India";
        const externalUrl = $c.find("a.base-card__full-link, a.base-search-card__info-link").attr("href")
          || $c.find("a").first().attr("href") || "";
        const postedAtIso = $c.find("time").attr("datetime");
        const logoUrl = $c.find("img.artdeco-entity-image, img").first().attr("src") || $c.find("img").first().attr("data-delayed-url") || null;

        if (!sourceJobId || !title || !company || !externalUrl) continue;

        const raw: RawJob = {
          sourceJobId,
          title,
          company,
          companyLogoUrl: logoUrl,
          location,
          workMode: null,
          description: null,
          skills: [],
          externalUrl: externalUrl.split("?")[0], // strip tracking params
          postedAt: postedAtIso ? new Date(postedAtIso) : null,
          vertical: "FULLTIME",
        };
        yield raw;
        yielded++;
      }

      if (cards.length < pageSize) break;
      start += pageSize;
    }
  },
};
