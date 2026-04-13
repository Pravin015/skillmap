"use client";
import Link from "next/link";
import { Job } from "@/lib/types";
import { COMPANY_COLORS, getCompany } from "@/lib/data";

const syne = "font-[family-name:var(--font-syne)]";

export default function OpeningsSection({ jobs }: { jobs: Job[] }) {
  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className={`${syne} font-bold text-base`}>Current Openings</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {jobs.length > 0 ? `${jobs.length} roles matching your profile` : "Roles matching your profile will appear here"}
          </p>
        </div>
        {jobs.length > 0 && (
          <Link href="/companies" className={`text-xs ${syne} font-bold no-underline px-2.5 py-1 rounded-lg`} style={{ background: "var(--primary)", color: "white" }}>View all</Link>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">💼</div>
          <p className={`${syne} font-bold text-sm mb-1`}>No openings yet</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Complete your onboarding to see matched roles from your dream companies</p>
          <Link href="/onboarding" className={`inline-block mt-3 px-4 py-2 rounded-lg ${syne} font-bold text-xs no-underline`} style={{ background: "var(--primary)", color: "white" }}>Setup preferences</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const company = getCompany(job.company);
            const color = COMPANY_COLORS[job.company] || "#6B7280";
            return (
              <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", borderLeftWidth: "3px", borderLeftColor: color }}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${syne} font-bold text-xs text-white shrink-0`} style={{ background: color }}>{company?.logo.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className={`${syne} font-bold text-sm`}>{job.title}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{company?.name} · {job.location}</div>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-[0.65rem]" style={{ color: "var(--muted)" }}>Deadline</div>
                  <div className={`text-xs ${syne} font-bold`}>{job.deadline}</div>
                </div>
                <Link href={`/chat?job=${job.id}`} className={`shrink-0 px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem] no-underline transition-transform hover:-translate-y-0.5`} style={{ background: "var(--primary)", color: "white" }}>Prep</Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
