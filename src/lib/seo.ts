import type { Metadata } from "next";

/** Site-wide SEO constants and helpers. Keyword strategy lives in SEO.md. */
export const SITE = {
  name: "CorpGurus",
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3210").replace(/\/$/, ""),
  tagline: "Hire verified freelance corporate trainers in India",
  description: "CorpGurus is India's marketplace and professional network for freelance corporate trainers. Companies post training requirements; verified trainers apply with day rates. Cloud, cybersecurity, networking, data & AI, leadership, sales and compliance training.",
  locale: "en_IN",
  twitter: "@corpgurus",
  email: "hello@corpgurus.com",
};

export const absolute = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

/** Build page metadata with canonical, Open Graph and Twitter cards in one call. */
export function pageMeta({ title, description, path, image, noindex, keywords, type = "website" }: { title: string; description: string; path: string; image?: string; noindex?: boolean; keywords?: string[]; type?: "website" | "article" | "profile" }): Metadata {
  const url = absolute(path);
  const img = image ?? absolute("/opengraph-image");
  return {
    title, description, keywords,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: { title, description, url, siteName: SITE.name, locale: SITE.locale, type, images: [{ url: img, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [img], site: SITE.twitter },
  };
}

export const slugifyCity = (city: string) => city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ---------- JSON-LD builders ---------- */

export const organizationLd = () => ({
  "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: absolute("/icons/icon-512.png"), email: SITE.email,
  description: SITE.description, areaServed: "IN", sameAs: [],
});

export const websiteLd = () => ({
  "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url,
  potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/search?q={search_term_string}` }, "query-input": "required name=search_term_string" },
});

export const faqLd = (items: [string, string][]) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

export const breadcrumbLd = (items: [string, string][]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absolute(path) })),
});

export const personLd = (t: { name: string; slug: string; headline: string; cities: string[]; skills: string[]; avatarUrl?: string | null; verified: boolean }) => ({
  "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: {
    "@type": "Person", name: t.name, url: absolute(`/trainers/${t.slug}`), jobTitle: t.headline, image: t.avatarUrl ?? undefined, knowsAbout: t.skills,
    address: t.cities.length ? { "@type": "PostalAddress", addressLocality: t.cities[0], addressCountry: "IN" } : undefined,
    description: `${t.name} is a ${t.verified ? "verified " : ""}freelance corporate trainer on CorpGurus. ${t.headline}`,
  },
});

export const jobPostingLd = (r: { id: string; title: string; description: string; createdAt: Date; startDate: Date; endDate: Date; city: string | null; mode: string; budgetMin: number | null; budgetMax: number | null; currency: string; skills: string[]; company: { name: string; slug: string; logoUrl: string | null } }) => ({
  "@context": "https://schema.org", "@type": "JobPosting", title: r.title, description: r.description, datePosted: r.createdAt.toISOString(), validThrough: r.startDate.toISOString(),
  employmentType: "CONTRACTOR", url: absolute(`/requirements/${r.id}`), industry: "Corporate training", skills: r.skills.join(", "),
  hiringOrganization: { "@type": "Organization", name: r.company.name, sameAs: absolute(`/companies/${r.company.slug}`), logo: r.company.logoUrl ?? undefined },
  jobLocationType: r.mode === "VIRTUAL" ? "TELECOMMUTE" : undefined,
  jobLocation: r.city ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: r.city, addressCountry: "IN" } } : undefined,
  applicantLocationRequirements: { "@type": "Country", name: "India" },
  baseSalary: r.budgetMax ? { "@type": "MonetaryAmount", currency: r.currency, value: { "@type": "QuantitativeValue", minValue: r.budgetMin ?? undefined, maxValue: r.budgetMax, unitText: "DAY" } } : undefined,
});
