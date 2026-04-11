import companiesData from "@/data/companies.json";
import jobsData from "@/data/jobs.json";
import { Company, Job } from "./types";

export const companies: Company[] = companiesData.companies as unknown as Company[];
export const jobs: Job[] = jobsData.jobs as Job[];

export const COMPANY_COLORS: Record<string, string> = {
  tcs: "#2563EB",
  google: "#EA4335",
  kpmg: "#1D4ED8",
  infosys: "#0EA5E9",
  deloitte: "#86BC25",
  wipro: "#7C3AED",
};

export const DOMAIN_MAP: Record<string, string> = {
  "Software Development": "software",
  Cybersecurity: "cybersecurity",
  "Cloud & DevOps": "cloud",
  "Data & Analytics": "data",
  "Consulting & Finance": "data",
};

export function getCompany(id: string): Company | undefined {
  return companies.find((c) => c.id === id);
}

export function getMatchingJobs(
  companyIds: string[],
  domainKey: string
): Job[] {
  return jobs.filter(
    (j) => companyIds.includes(j.company) && j.domain === domainKey && j.active
  );
}

export function getSimilarJobs(
  companyIds: string[],
  domainKey: string
): Job[] {
  return jobs.filter(
    (j) =>
      (companyIds.includes(j.company) || j.domain === domainKey) && j.active
  );
}
