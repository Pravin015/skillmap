"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DOMAINS_WITH_ALL } from "@/lib/domains";

const heading = "font-[family-name:var(--font-heading)]";

interface Job {
  id: string;
  slug: string | null;
  title: string;
  company: string;
  location: string;
  workMode: string;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceLevel: string;
  jobType: string;
  domain: string | null;
  department: string | null;
  description: string;
  skills: string[];
  status: string;
  openings: number;
  createdAt: string;
  deadline: string | null;
  _count: { applications: number };
}

// "Posted 2d ago" relative-time helper
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400_000);
  if (days < 1) {
    const hours = Math.floor(diff / 3600_000);
    if (hours < 1) return "Just now";
    return `${hours}h ago`;
  }
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface ExternalJob {
  id: string;
  title: string;
  company: string;
  companyLogoUrl: string | null;
  location: string;
  workMode: string | null;
  salaryText: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceLevel: string | null;
  jobType: string | null;
  domain: string | null;
  description: string | null;
  skills: string[];
  externalUrl: string;
  postedAt: string | null;
  firstSeenAt: string;
  vertical: "INTERNSHIP" | "FULLTIME";
  source: { slug: string; displayName: string };
}

const domains = DOMAINS_WITH_ALL;
const workModes = ["All", "On-site", "Remote", "Hybrid"];
const experienceLevels = ["All", "Fresher", "1 year", "2 years", "3 years", "5 years", "10+ years"];
const salaryRanges = [
  { label: "All", min: 0, max: 999 },
  { label: "0–5 LPA", min: 0, max: 5 },
  { label: "5–10 LPA", min: 5, max: 10 },
  { label: "10–20 LPA", min: 10, max: 20 },
  { label: "20–40 LPA", min: 20, max: 40 },
  { label: "40+ LPA", min: 40, max: 999 },
];

type SourceFilter = "All" | "Platform" | "External";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("All");
  const [workMode, setWorkMode] = useState("All");
  const [experience, setExperience] = useState("All");
  const [salary, setSalary] = useState("All");
  const [location, setLocation] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [userDomain, setUserDomain] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      if (d.profile?.fieldOfInterest) {
        setUserDomain(d.profile.fieldOfInterest);
        setDomain(d.profile.fieldOfInterest);
      }
    }).catch(() => {});
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const [intRes, extRes] = await Promise.all([
        fetch("/api/jobs?status=ACTIVE"),
        fetch("/api/external-jobs?vertical=FULLTIME&limit=100"),
      ]);
      const intData = await intRes.json();
      const extData = await extRes.json();
      setJobs(intData.jobs || []);
      setExternalJobs(extData.jobs || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Record an external-job click for analytics, then open the source page.
  const openExternal = (job: ExternalJob) => {
    fetch(`/api/external-jobs/${job.id}/click`, { method: "POST", keepalive: true }).catch(() => {});
    window.open(job.externalUrl, "_blank", "noopener,noreferrer");
  };

  const matchesFilters = (title: string, company: string, skills: string[], jobDomain: string | null, jobMode: string | null, jobExp: string | null, jobLoc: string, salMin: number | null, salMax: number | null) => {
    if (search) {
      const s = search.toLowerCase();
      if (!title.toLowerCase().includes(s) && !company.toLowerCase().includes(s) && !skills.some((x) => x.toLowerCase().includes(s))) return false;
    }
    if (domain !== "All" && jobDomain !== domain) return false;
    if (workMode !== "All" && jobMode !== workMode) return false;
    if (experience !== "All" && jobExp !== experience) return false;
    if (location && !jobLoc.toLowerCase().includes(location.toLowerCase())) return false;
    if (salary !== "All") {
      const range = salaryRanges.find((r) => r.label === salary);
      if (range) {
        const jobMax = salMax || 0;
        const jobMin = salMin || 0;
        if (jobMax < range.min || jobMin > range.max) return false;
      }
    }
    return true;
  };

  const filteredInternal = sourceFilter === "External" ? [] : jobs.filter((j) => matchesFilters(j.title, j.company, j.skills, j.domain, j.workMode, j.experienceLevel, j.location, j.salaryMin, j.salaryMax));
  const filteredExternal = sourceFilter === "Platform" ? [] : externalJobs.filter((j) => matchesFilters(j.title, j.company, j.skills, j.domain, j.workMode, j.experienceLevel, j.location, j.salaryMin, j.salaryMax));
  const totalCount = jobs.length + externalJobs.length;
  const filteredCount = filteredInternal.length + filteredExternal.length;

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <section className="blob-bg blob-bg-soft py-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="section-eyebrow mx-auto">Open roles</div>
          <h1 className="font-semibold mb-3" style={{ color: "var(--ink)" }}>Job Openings</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            {totalCount} openings — {jobs.length} on-platform + {externalJobs.length} from partner portals
          </p>
          <div className="max-w-xl mx-auto flex gap-2 p-1.5 bg-white rounded-full border" style={{ borderColor: "var(--border)" }}>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, company, or skill…" className="flex-1 px-4 py-2 text-sm bg-transparent outline-none" style={{ color: "var(--ink)" }} />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location…" className="w-32 hidden md:block px-3 py-2 text-sm bg-transparent outline-none border-l" style={{ color: "var(--ink)", borderColor: "var(--border)" }} />
          </div>
        </div>
      </section>

      <section className="border-b py-4 px-4 md:px-8 overflow-x-auto" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto flex gap-3 flex-nowrap items-center">
          <div className="shrink-0 flex rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {(["All", "Platform", "External"] as SourceFilter[]).map((opt) => (
              <button key={opt} onClick={() => setSourceFilter(opt)} className={`px-3 py-2 text-xs ${heading} font-bold ${sourceFilter === opt ? "text-white" : ""}`} style={{ background: sourceFilter === opt ? "var(--ink)" : "white", color: sourceFilter === opt ? "white" : "var(--muted)" }}>{opt}</button>
            ))}
          </div>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs outline-none ${heading} font-bold`} style={{ borderColor: "var(--border)" }}>
            {domains.map((d) => <option key={d} value={d}>{d === "All" ? "All Domains" : d}</option>)}
          </select>
          <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs outline-none ${heading} font-bold`} style={{ borderColor: "var(--border)" }}>
            {workModes.map((w) => <option key={w} value={w}>{w === "All" ? "Work Mode" : w}</option>)}
          </select>
          <select value={experience} onChange={(e) => setExperience(e.target.value)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs outline-none ${heading} font-bold`} style={{ borderColor: "var(--border)" }}>
            {experienceLevels.map((e) => <option key={e} value={e}>{e === "All" ? "Experience" : e}</option>)}
          </select>
          <select value={salary} onChange={(e) => setSalary(e.target.value)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs outline-none ${heading} font-bold`} style={{ borderColor: "var(--border)" }}>
            {salaryRanges.map((s) => <option key={s.label} value={s.label}>{s.label === "All" ? "Salary Range" : s.label}</option>)}
          </select>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location..." className="md:hidden shrink-0 w-32 rounded-xl border px-3 py-2 text-xs outline-none" style={{ borderColor: "var(--border)" }} />
          {(domain !== "All" || workMode !== "All" || experience !== "All" || salary !== "All" || location || search || sourceFilter !== "All") && (
            <button onClick={() => { setDomain("All"); setWorkMode("All"); setExperience("All"); setSalary("All"); setLocation(""); setSearch(""); setSourceFilter("All"); }} className="shrink-0 text-xs font-medium px-3 py-2 rounded-xl text-red-500 border border-red-200 hover:bg-red-50">Clear all</button>
          )}
        </div>
      </section>

      <section className="py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Showing {filteredCount} of {totalCount} jobs{userDomain && domain === userDomain && <span> · filtered by your interest: <strong>{userDomain}</strong></span>}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
          ) : filteredCount === 0 ? (
            <div className="rounded-2xl border bg-white p-16 text-center" style={{ borderColor: "var(--border)" }}>
              <div className="text-5xl mb-4">🔍</div>
              <p className={`${heading} font-bold text-lg mb-2`}>No jobs match your filters</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Try adjusting your search or filters to see more results</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredInternal.map((job) => {
                // Salary normalised — handle case where HR entered raw
                // rupees instead of LPA. Same logic as detail page.
                const toLPA = (n: number) => (n > 1000 ? n / 100000 : n);
                const fmtLPA = (n: number) => {
                  const v = toLPA(n);
                  return v % 1 === 0 ? String(v) : v.toFixed(1);
                };
                const salary = (job.salaryMin || job.salaryMax)
                  ? job.salaryMin && job.salaryMax
                    ? `₹${fmtLPA(job.salaryMin)} – ${fmtLPA(job.salaryMax)} LPA`
                    : job.salaryMax
                      ? `Up to ₹${fmtLPA(job.salaryMax)} LPA`
                      : `₹${fmtLPA(job.salaryMin!)}+ LPA`
                  : null;

                const isDeadlineSoon = job.deadline
                  ? new Date(job.deadline).getTime() - Date.now() < 7 * 86400_000
                  : false;

                return (
                  <Link
                    key={`int-${job.id}`}
                    href={`/jobs/${job.slug || job.id}`}
                    className="rounded-2xl border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg no-underline group flex flex-col"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {/* Top: logo + company + location + posted-time */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-base text-white shrink-0" style={{ background: "var(--ink)" }}>
                        {job.company.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
                          {job.company}
                        </p>
                        <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          <span className="truncate">📍 {job.location}</span>
                          <span>·</span>
                          <span className="shrink-0">{relativeTime(job.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Title — text-base, NO h2/h3 (avoids global-rule oversize) */}
                    <p className="text-base font-semibold mb-2 line-clamp-2 leading-snug group-hover:text-[var(--primary)] transition-colors" style={{ color: "var(--ink)" }}>
                      {job.title}
                    </p>

                    {/* Department / domain badge if either present */}
                    {(job.department || job.domain) && (
                      <p className="text-xs mb-3" style={{ color: "var(--primary)" }}>
                        {job.department || job.domain}
                      </p>
                    )}

                    {/* Description preview — the biggest readability win */}
                    {job.description && (
                      <p className="text-xs leading-relaxed mb-4 line-clamp-3" style={{ color: "var(--ink-soft)" }}>
                        {job.description}
                      </p>
                    )}

                    {/* Pills row — work mode + job type + experience */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.workMode && (
                        <span
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            background:
                              job.workMode === "Remote" ? "rgba(34,197,94,0.1)" :
                              job.workMode === "Hybrid" ? "rgba(124,58,237,0.1)" :
                              "rgba(59,130,246,0.1)",
                            color:
                              job.workMode === "Remote" ? "#16a34a" :
                              job.workMode === "Hybrid" ? "#7c3aed" :
                              "#2563eb",
                          }}
                        >
                          {job.workMode}
                        </span>
                      )}
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}>
                        {job.jobType}
                      </span>
                      {job.experienceLevel && (
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}>
                          {job.experienceLevel}
                        </span>
                      )}
                      {job.openings > 1 && (
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: "var(--surface-alt)", color: "var(--ink-soft)" }}>
                          {job.openings} openings
                        </span>
                      )}
                    </div>

                    {/* Skills — show 5 with +N overflow */}
                    {job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.skills.slice(0, 5).map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "var(--surface-alt)", color: "var(--ink-soft)" }}>
                            {s}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="text-[10px] py-0.5 font-medium" style={{ color: "var(--muted)" }}>
                            +{job.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer: salary + applied count + deadline. Bigger now. */}
                    <div className="mt-auto pt-4 border-t flex items-end justify-between" style={{ borderColor: "var(--border)" }}>
                      <div>
                        {salary ? (
                          <>
                            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                              {salary}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                              {job._count.applications} {job._count.applications === 1 ? "applicant" : "applicants"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                              Salary undisclosed
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                              {job._count.applications} applicants
                            </p>
                          </>
                        )}
                      </div>
                      {job.deadline && (
                        <div className="text-right">
                          <p className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: isDeadlineSoon ? "#dc2626" : "var(--muted)" }}>
                            {isDeadlineSoon ? "⏰ Closing soon" : "Apply by"}
                          </p>
                          <p className="text-xs font-semibold" style={{ color: isDeadlineSoon ? "#dc2626" : "var(--ink)" }}>
                            {new Date(job.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}

              {filteredExternal.map((job) => (
                <button
                  key={`ext-${job.id}`}
                  onClick={() => openExternal(job)}
                  className="text-left rounded-2xl border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg group flex flex-col"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    {job.companyLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" decoding="async" src={job.companyLogoUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white border" style={{ borderColor: "var(--border)" }} />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-base text-white shrink-0" style={{ background: "var(--muted)" }}>
                        {job.company.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{job.company}</p>
                      <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        <span className="truncate">📍 {job.location}</span>
                        {job.postedAt && <><span>·</span><span className="shrink-0">{relativeTime(job.postedAt)}</span></>}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shrink-0" style={{ background: "rgba(124,58,237,0.1)", color: "var(--primary)" }}>
                      via {job.source.displayName.split(" ")[0]}
                    </span>
                  </div>

                  <p className="text-base font-semibold mb-2 line-clamp-2 leading-snug group-hover:text-[var(--primary)] transition-colors" style={{ color: "var(--ink)" }}>
                    {job.title}
                  </p>

                  {job.domain && (
                    <p className="text-xs mb-3" style={{ color: "var(--primary)" }}>
                      {job.domain}
                    </p>
                  )}

                  {job.description && (
                    <p className="text-xs leading-relaxed mb-4 line-clamp-3" style={{ color: "var(--ink-soft)" }}>
                      {job.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.workMode && (
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background:
                            job.workMode === "Remote" ? "rgba(34,197,94,0.1)" :
                            job.workMode === "Hybrid" ? "rgba(124,58,237,0.1)" :
                            "rgba(59,130,246,0.1)",
                          color:
                            job.workMode === "Remote" ? "#16a34a" :
                            job.workMode === "Hybrid" ? "#7c3aed" :
                            "#2563eb",
                        }}
                      >
                        {job.workMode}
                      </span>
                    )}
                    {job.jobType && (
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}>
                        {job.jobType}
                      </span>
                    )}
                  </div>

                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.skills.slice(0, 5).map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "var(--surface-alt)", color: "var(--ink-soft)" }}>
                          {s}
                        </span>
                      ))}
                      {job.skills.length > 5 && (
                        <span className="text-[10px] py-0.5 font-medium" style={{ color: "var(--muted)" }}>
                          +{job.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t flex items-end justify-between" style={{ borderColor: "var(--border)" }}>
                    <div>
                      {job.salaryText ? (
                        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{job.salaryText}</p>
                      ) : (
                        <p className="text-xs" style={{ color: "var(--muted)" }}>Salary on source portal</p>
                      )}
                    </div>
                    <span className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--primary)" }}>
                      Apply on {job.source.displayName.split(" ")[0]} ↗
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
