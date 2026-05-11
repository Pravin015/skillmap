// Single source of truth for the "field of interest" / job-domain list.
// Imported by: signup, onboarding, profile editor, job creation, job filter,
// labs, mentor onboarding, candidate search, company onboarding, etc.
// Keep alphabetical within tier, with most-used at top.
//
// To add a new domain: append to DOMAINS, update the bucketDomain regex
// in scripts/job-scraper/lib/normalize.ts so external-job ingest can
// auto-categorise into it.

export const DOMAINS = [
  "Software Development",
  "Data & Analytics",
  "Cybersecurity",
  "Cloud & DevOps",
  "Digital Marketing",
  "Social Media",
  "Sales",
  "Consulting & Finance",
  "Product Management",
  "Design",
  "Other",
] as const;

export type Domain = typeof DOMAINS[number];

// "All" prefix is used by filter dropdowns; the constant excludes it
// so signup/profile flows don't show a confusing "All" option.
export const DOMAINS_WITH_ALL = ["All", ...DOMAINS] as const;
