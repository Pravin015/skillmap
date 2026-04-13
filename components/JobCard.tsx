import Link from "next/link";
import { Job } from "@/lib/types";
import { COMPANY_COLORS, getCompany } from "@/lib/data";
import CompanyLogo from "./CompanyLogo";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const company = getCompany(job.company);
  const color = COMPANY_COLORS[job.company] || "#6B7280";

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo
          companyId={job.company}
          letter={company?.logo?.charAt(0) || "?"}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-600">{company?.name}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location}
        </span>
        <span className="text-gray-300">|</span>
        <span>{job.posted}</span>
        <span className="text-gray-300">|</span>
        <span>{job.experience}</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Deadline: <span className="font-medium text-gray-700">{job.deadline}</span>
      </div>
      <div className="mt-4">
        <Link
          href={`/chat?job=${job.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-[#E0F7F7] px-3 py-1.5 text-xs font-medium text-[#0ABFBC] transition-colors hover:bg-[#E0F7F7]"
        >
          View prep plan
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
