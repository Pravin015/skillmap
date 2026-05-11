// Shared row-shaping helper for the partner job endpoints. Single source
// of truth for the v1 catalog row so list + detail + webhook payloads
// can't drift apart.
import type { ExternalJob, JobSource } from "@/lib/generated/prisma/client";

const APP_BASE_URL = process.env.NEXTAUTH_URL || "https://astraahire.com";

export interface PartnerJobRow {
  id: string;
  title: string;
  company: string;
  companyLogoUrl: string | null;
  location: string;
  workMode: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  salaryText: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  domain: string | null;
  description: string | null;
  skills: string[];
  vertical: string;
  externalUrl: string;
  applyUrl: string;
  source: { id: string; slug: string; name: string; logoUrl: string | null; vertical: string };
  postedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export function shapeExternalJob(
  job: ExternalJob & { source: JobSource }
): PartnerJobRow {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    companyLogoUrl: job.companyLogoUrl,
    location: job.location,
    workMode: job.workMode,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    salaryText: job.salaryText,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    domain: job.domain,
    description: job.description,
    skills: job.skills,
    vertical: job.vertical,
    // externalUrl = canonical job page on AstraaHire (we own the conversion).
    // applyUrl    = apply CTA — same page today, the page handles auth/redirect.
    externalUrl: `${APP_BASE_URL}/jobs/external/${job.id}`,
    applyUrl: `${APP_BASE_URL}/jobs/external/${job.id}?action=apply`,
    source: {
      id: job.source.id,
      slug: job.source.slug,
      name: job.source.displayName,
      logoUrl: null,
      vertical: job.source.vertical,
    },
    postedAt: job.postedAt ? job.postedAt.toISOString() : null,
    expiresAt: job.expiresAt ? job.expiresAt.toISOString() : null,
    isActive: job.isActive,
  };
}
