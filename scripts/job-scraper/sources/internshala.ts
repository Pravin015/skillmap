// Internshala — the canonical internship source in India. Powers Ashpranix internship listings.
// We parse the public listing page HTML (internshala.com/internships/...).
// Selectors: verified against the current public page structure as of 2026-04.
// If Internshala changes layout, the run will log `itemsFound=0` — check scrape runs admin page.

import * as cheerio from "cheerio";
import { fetchText } from "../lib/fetcher";
import type { RawJob, SourceAdapter } from "../lib/types";

export const internshala: SourceAdapter = {
  slug: "internshala",
  displayName: "Internshala",
  baseUrl: "https://internshala.com",
  vertical: "INTERNSHIP",
  defaultQuery: { keywords: "", location: "" },

  async *scrape({ query, maxItems = 40 }) {
    // Build URL: keywords + location become URL path segments per Internshala's scheme.
    const keywords = String(query?.keywords ?? "").trim();
    const location = String(query?.location ?? "").trim();
    const pathParts: string[] = [];
    if (keywords) pathParts.push(`keywords-${encodeURIComponent(keywords.replace(/\s+/g, "-"))}`);
    if (location) pathParts.push(`${encodeURIComponent(location.toLowerCase().replace(/\s+/g, "-"))}-internship`);
    const url = `https://internshala.com/internships/${pathParts.join("/")}${pathParts.length ? "/" : ""}`;

    const html = await fetchText(url, { timeoutMs: 20000 });
    const $ = cheerio.load(html);

    // Internship cards are div.individual_internship with data-internshipid.
    const cards = $("div.individual_internship").toArray();
    let count = 0;

    for (const el of cards) {
      if (count >= maxItems) break;
      const $c = $(el);
      const id = $c.attr("data-internshipid") || $c.attr("internshipid");
      // Titles/companies have leading/trailing whitespace + nested badges like "Actively hiring".
      // Collapse whitespace and strip the badge suffix if present.
      const clean = (s: string) => s.replace(/\s+/g, " ").replace(/\s*Actively hiring\s*$/i, "").trim();
      const title = clean($c.find(".job-internship-name, .profile h3, .profile").first().text());
      const company = clean($c.find(".company-name, .company h4, .company_name").first().text());
      const relHref = $c.find("a.view_detail_button, a.job-title-href").first().attr("href")
        || $c.find("a").first().attr("href");
      const externalUrl = relHref ? (relHref.startsWith("http") ? relHref : `https://internshala.com${relHref}`) : "";
      const location = $c.find(".location_link, .locations a, #location_names").first().text().trim() || "Work from home";
      const stipend = $c.find(".stipend, span.stipend").first().text().trim();
      const duration = $c.find(".item_body").filter((_, e) => $(e).prev().text().toLowerCase().includes("duration")).first().text().trim();
      const logoUrl = $c.find("img.internship_logo, .internship_logo img").first().attr("src") || null;

      if (!id || !title || !company || !externalUrl) continue;

      const raw: RawJob = {
        sourceJobId: id,
        title,
        company,
        companyLogoUrl: logoUrl,
        location,
        workMode: /work from home|remote/i.test(location) ? "Remote" : "On-site",
        salaryText: stipend || null,
        experienceLevel: "Fresher",
        jobType: "Internship",
        domain: null,
        description: duration ? `Duration: ${duration}` : null,
        skills: [],
        externalUrl,
        postedAt: null,
        vertical: "INTERNSHIP",
      };
      yield raw;
      count++;
    }
  },
};
