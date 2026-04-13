"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceLevel: string;
  jobType: string;
  domain: string | null;
  skills: string[];
  status: string;
  openings: number;
  createdAt: string;
  deadline: string | null;
  _count: { applications: number };
}

const domains = ["All", "Software Development", "Cybersecurity", "Cloud & DevOps", "Data & Analytics", "Consulting", "Other"];
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("All");
  const [workMode, setWorkMode] = useState("All");
  const [experience, setExperience] = useState("All");
  const [salary, setSalary] = useState("All");
  const [location, setLocation] = useState("");
  const [userDomain, setUserDomain] = useState<string | null>(null);

  // Load user's domain preference
  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      if (d.profile?.fieldOfInterest) {
        setUserDomain(d.profile.fieldOfInterest);
        setDomain(d.profile.fieldOfInterest); // auto-set filter
      }
    }).catch(() => {});
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs?status=ACTIVE");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filtered = jobs.filter((job) => {
    if (search && !job.title.toLowerCase().includes(search.toLowerCase()) && !job.company.toLowerCase().includes(search.toLowerCase()) && !job.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))) return false;
    if (domain !== "All" && job.domain !== domain) return false;
    if (workMode !== "All" && job.workMode !== workMode) return false;
    if (experience !== "All" && job.experienceLevel !== experience) return false;
    if (location && !job.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (salary !== "All") {
      const range = salaryRanges.find((r) => r.label === salary);
      if (range) {
        const jobMax = job.salaryMax || 0;
        const jobMin = job.salaryMin || 0;
        if (jobMax < range.min || jobMin > range.max) return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      {/* Hero header */}
      <section className="py-12 px-4 md:px-8" style={{ background: "var(--ink)" }}>
        <div className="max-w-5xl mx-auto">
          <h1 className={`${heading} font-extrabold text-2xl md:text-3xl text-white mb-2`}>
            Job Openings
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {jobs.length} active openings across top companies
          </p>

          {/* Search bar */}
          <div className="mt-6 flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs by title, company, or skill..."
              className="flex-1 rounded-xl px-5 py-3.5 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location..."
              className="w-40 hidden md:block rounded-xl px-4 py-3.5 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        </div>
      </section>

      {/* Filters bar */}
      <section className="border-b py-4 px-4 md:px-8 overflow-x-auto" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto flex gap-3 flex-nowrap">
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
          {/* Mobile location */}
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location..."
            className="md:hidden shrink-0 w-32 rounded-xl border px-3 py-2 text-xs outline-none"
            style={{ borderColor: "var(--border)" }}
          />
          {(domain !== "All" || workMode !== "All" || experience !== "All" || salary !== "All" || location || search) && (
            <button
              onClick={() => { setDomain("All"); setWorkMode("All"); setExperience("All"); setSalary("All"); setLocation(""); setSearch(""); }}
              className="shrink-0 text-xs font-medium px-3 py-2 rounded-xl text-red-500 border border-red-200 hover:bg-red-50"
            >
              Clear all
            </button>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Showing {filtered.length} of {jobs.length} jobs{userDomain && domain === userDomain && <span> · filtered by your interest: <strong>{userDomain}</strong></span>}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border bg-white p-16 text-center" style={{ borderColor: "var(--border)" }}>
              <div className="text-5xl mb-4">🔍</div>
              <p className={`${heading} font-bold text-lg mb-2`}>No jobs match your filters</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Try adjusting your search or filters to see more results</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border bg-white p-5 md:p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg no-underline group" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start gap-4">
                    {/* Company avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${heading} font-extrabold text-lg text-white shrink-0`} style={{ background: "var(--ink)" }}>
                      {job.company.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className={`${heading} font-bold text-base md:text-lg group-hover:text-[var(--primary)] transition-colors`} style={{ color: "var(--ink)" }}>{job.title}</h2>
                          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{job.company}</p>
                        </div>
                        {(job.salaryMin || job.salaryMax) && (
                          <div className={`hidden sm:block shrink-0 text-right ${heading}`}>
                            <div className="font-extrabold text-base" style={{ color: "var(--ink)" }}>
                              {job.salaryMin && job.salaryMax ? `₹${job.salaryMin}–${job.salaryMax}` : job.salaryMax ? `Up to ₹${job.salaryMax}` : `₹${job.salaryMin}+`}
                            </div>
                            <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>LPA</div>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                          📍 {job.location}
                        </span>
                        <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${heading}`} style={{ background: job.workMode === "Remote" ? "rgba(34,197,94,0.1)" : job.workMode === "Hybrid" ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)", color: job.workMode === "Remote" ? "#16a34a" : job.workMode === "Hybrid" ? "#7c3aed" : "#2563eb" }}>
                          {job.workMode}
                        </span>
                        <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                          {job.experienceLevel}
                        </span>
                        <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                          {job.jobType}
                        </span>
                        {job.domain && (
                          <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${heading}`} style={{ background: "var(--primary)", color: "white" }}>
                            {job.domain}
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      {job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.skills.slice(0, 5).map((s) => (
                            <span key={s} className="text-[0.6rem] px-2 py-0.5 rounded-full" style={{ background: "rgba(10,10,15,0.04)", color: "var(--muted)" }}>{s}</span>
                          ))}
                          {job.skills.length > 5 && <span className="text-[0.6rem] py-0.5" style={{ color: "var(--muted)" }}>+{job.skills.length - 5} more</span>}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-4 mt-4 text-[0.65rem]" style={{ color: "var(--muted)" }}>
                        <span>{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        {job.deadline && (
                          <>
                            <span>·</span>
                            <span className="font-medium" style={{ color: "var(--ink)" }}>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                          </>
                        )}
                        {job.openings > 1 && (
                          <>
                            <span>·</span>
                            <span>{job.openings} openings</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
