// Indeed India — RSS feed. Legal public endpoint that Indeed has historically supported.
// Format: https://in.indeed.com/rss?q=<query>&l=<location>&sort=date
// Each <item> has title (role @ company - location), link, pubDate, description.

import { XMLParser } from "fast-xml-parser";
import { fetchText } from "../lib/fetcher";
import type { RawJob, SourceAdapter } from "../lib/types";

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  guid?: string | { "#text": string };
  source?: string;
}

interface RssFeed {
  rss?: { channel?: { item?: RssItem | RssItem[] } };
}

export const indeedRss: SourceAdapter = {
  slug: "indeed-in",
  displayName: "Indeed India",
  baseUrl: "https://in.indeed.com",
  vertical: "FULLTIME",
  defaultQuery: { q: "software engineer", l: "India" },

  async *scrape({ query, maxItems = 40 }) {
    const q = encodeURIComponent(String(query?.q ?? "software engineer"));
    const l = encodeURIComponent(String(query?.l ?? "India"));
    const url = `https://in.indeed.com/rss?q=${q}&l=${l}&sort=date`;

    const xml = await fetchText(url, { timeoutMs: 20000, headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml) as RssFeed;
    const items = parsed.rss?.channel?.item;
    const arr: RssItem[] = Array.isArray(items) ? items : items ? [items] : [];

    let count = 0;
    for (const item of arr) {
      if (count >= maxItems) break;
      const title = (item.title ?? "").toString();
      const link = (item.link ?? "").toString();
      if (!title || !link) continue;

      // Indeed RSS titles follow: "Role - Company - Location" (sometimes "Role at Company - Location").
      // We split on " - " and take role/company/location positionally.
      const parts = title.split(" - ").map((s) => s.trim()).filter(Boolean);
      let role = parts[0] ?? title;
      let company = parts[1] ?? "Unknown";
      let location = parts[2] ?? "India";
      if (role.includes(" at ")) {
        const [r, c] = role.split(" at ");
        role = r.trim();
        if (!parts[1]) company = c.trim();
      }

      const guid = typeof item.guid === "string" ? item.guid : item.guid?.["#text"];
      const sourceJobId = guid || link;

      const raw: RawJob = {
        sourceJobId: String(sourceJobId),
        title: role,
        company,
        location,
        workMode: /remote|work from home/i.test(title + " " + (item.description ?? "")) ? "Remote" : null,
        description: item.description ?? null,
        skills: [],
        externalUrl: link,
        postedAt: item.pubDate ? new Date(String(item.pubDate)) : null,
        vertical: "FULLTIME",
      };
      yield raw;
      count++;
    }
  },
};
