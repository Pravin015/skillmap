"use client";
// Public listing page for aggregated external jobs.
// Apply button hits /api/external-jobs/[id]/apply which 302s to the source.
import { useEffect, useState, useCallback } from "react";

const heading = "font-[family-name:var(--font-heading)]";

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
  skills: string[];
  description: string | null;
  vertical: "INTERNSHIP" | "FULLTIME";
  postedAt: string | null;
  clickCount: number;
  source: { slug: string; displayName: string };
}

const DOMAINS = ["All", "Cybersecurity", "Data & Analytics", "Software Development", "Cloud & DevOps", "Consulting", "Other"];
const WORK_MODES = ["All", "On-site", "Remote", "Hybrid"];
const VERTICALS = ["All", "FULLTIME", "INTERNSHIP"];

function relativeTime(iso: string | null): string {
  if (!iso) return "recently";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400_000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ExternalJobsPage() {
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [domain, setDomain] = useState("All");
  const [workMode, setWorkMode] = useState("All");
  const [vertical, setVertical] = useState("All");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    if (domain !== "All") params.set("domain", domain);
    if (workMode !== "All") params.set("workMode", workMode);
    if (vertical !== "All") params.set("vertical", vertical);
    params.set("limit", "80");
    try {
      const res = await fetch(`/api/external-jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [q, location, domain, workMode, vertical]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section className="blob-bg blob-bg-soft py-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="section-eyebrow mx-auto">Aggregated listings</div>
          <h1 className="font-semibold mb-3" style={{ color: "var(--ink)" }}>
            Live openings across the web
          </h1>
          <p className="text-sm max-w-xl mx-auto mb-6" style={{ color: "var(--muted)" }}>
            We pull openings from trusted job boards so you can browse everything in one place.
            When you apply, you&apos;ll be sent directly to the company&apos;s portal.
          </p>

          <div className="max-w-xl mx-auto flex gap-2 p-1.5 bg-white rounded-full border" style={{ borderColor: "var(--border)" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, company, or skill…"
              className="flex-1 px-4 py-2 text-sm bg-transparent outline-none"
              style={{ color: "var(--ink)" }}
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location…"
              className="w-32 hidden md:block px-3 py-2 text-sm bg-transparent outline-none border-l"
              style={{ color: "var(--ink)", borderColor: "var(--border)" }}
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b py-4 px-4 md:px-8 overflow-x-auto" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto flex gap-3 flex-nowrap">
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs outline-none ${heading} font-bold`} style={{ borderColor: "var(--border)" }}>
            {DOMAINS.map((d) => <option key={d} value={d}>{d === "All" ? "All Domains" : d}</option>)}
          </select>
          <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs outline-none ${heading} font-bold`} style={{ borderColor: "var(--border)" }}>
            {WORK_MODES.map((w) => <option key={w} value={w}>{w === "All" ? "All Modes" : w}</option>)}
          </select>
          <select value={vertical} onChange={(e) => setVertical(e.target.value)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs outline-none ${heading} font-bold`} style={{ borderColor: "var(--border)" }}>
            {VERTICALS.map((v) => <option key={v} value={v}>{v === "All" ? "Any Type" : v === "FULLTIME" ? "Full-time" : "Internships"}</option>)}
          </select>
        </div>
      </section>

      {/* Results */}
      <section className="py-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3">🔍</div>
              <p className={`${heading} font-bold text-base mb-1`}>No openings match your filters</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Try broadening your search — we update listings every 6 hours.</p>
            </div>
          ) : (
            <>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                {jobs.length} openings • Apply links redirect to the source portal
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-2xl border bg-white p-5 flex flex-col" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className={`${heading} text-base font-bold truncate`} style={{ color: "var(--ink)" }}>{job.title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          <span className="font-semibold" style={{ color: "var(--ink)" }}>{job.company}</span> • {job.location}
                        </p>
                      </div>
                      <span className="shrink-0 text-[9px] rounded-full px-2 py-1 font-bold" style={{ background: "var(--surface-alt, #f5f5f5)", color: "var(--muted)" }}>
                        via {job.source.displayName}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.workMode && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#7C3AED15", color: "#7C3AED" }}>{job.workMode}</span>}
                      {job.jobType && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#F59E0B15", color: "#F59E0B" }}>{job.jobType}</span>}
                      {job.domain && <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--surface-alt, #f5f5f5)", color: "var(--muted)" }}>{job.domain}</span>}
                      {job.salaryText && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#10b98115", color: "#10b981" }}>{job.salaryText}</span>}
                    </div>

                    {job.description && (
                      <p className="text-xs line-clamp-2 mb-3" style={{ color: "var(--muted)" }}>{job.description}</p>
                    )}

                    {job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {job.skills.slice(0, 5).map((s) => (
                          <span key={s} className="rounded-full px-2 py-0.5 text-[9px]" style={{ background: "var(--surface-alt, #f5f5f5)", color: "var(--muted)" }}>{s}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3 border-t text-[10px]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                      <span>Posted {relativeTime(job.postedAt)}</span>
                      <a
                        href={`/api/external-jobs/${job.id}/apply`}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="rounded-lg px-3 py-1.5 text-[11px] font-bold no-underline"
                        style={{ background: "var(--primary)", color: "white" }}
                      >
                        Apply on {job.source.displayName.split(" ")[0]} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-center mt-8" style={{ color: "var(--muted)" }}>
                Listings aggregated from public sources. AstraaHire does not accept applications on behalf of these employers.
                When you click Apply, you leave AstraaHire and apply directly on the source portal.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
