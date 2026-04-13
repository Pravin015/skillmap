"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

interface CompanyData {
  profile: {
    id: string; name: string; slug: string; logo: string | null;
    industry: string | null; about: string | null; culture: string | null;
    website: string | null; location: string | null; size: string | null;
    founded: string | null; isVerified: boolean;
  };
  jobs: {
    id: string; title: string; location: string; workMode: string;
    salaryMin: number | null; salaryMax: number | null; experienceLevel: string;
    skills: string[]; deadline: string | null; status: string;
    _count: { applications: number };
  }[];
  stats: { totalJobs: number; totalHired: number };
}

export default function CompanyProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/company/profile?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => { if (d.profile) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🏢</div>
          <p className={`${syne} font-bold text-base mb-1`}>Company not found</p>
          <Link href="/companies" className="text-sm underline" style={{ color: "var(--muted)" }}>Browse all companies</Link>
        </div>
      </div>
    );
  }

  const { profile, jobs, stats } = data;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <section style={{ background: "var(--ink)" }}>
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex items-center gap-5 mb-4">
            {profile.logo ? (
              <img src={profile.logo} alt={profile.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white" style={{ background: "rgba(255,255,255,0.1)" }}>
                {profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`${syne} text-2xl md:text-3xl font-bold text-white`}>{profile.name}</h1>
                {profile.isVerified && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#10b98130", color: "#10b981" }}>Verified</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                {profile.industry && <span>{profile.industry}</span>}
                {profile.location && <span>📍 {profile.location}</span>}
                {profile.size && <span>👥 {profile.size} employees</span>}
                {profile.founded && <span>Est. {profile.founded}</span>}
              </div>
            </div>
          </div>
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-xs no-underline" style={{ color: "var(--accent)" }}>
              {profile.website} ↗
            </a>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="border-b" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap gap-8">
          {[
            { num: jobs.length, label: "Open Roles" },
            { num: stats.totalJobs, label: "Total Jobs Posted" },
            { num: stats.totalHired, label: "People Hired" },
          ].map((s) => (
            <div key={s.label}>
              <div className={`${syne} text-xl font-bold`} style={{ color: "var(--ink)" }}>{s.num}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — About + Culture */}
          <div className="lg:col-span-1 space-y-4">
            {profile.about && (
              <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
                <h3 className={`${syne} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>About</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{profile.about}</p>
              </div>
            )}
            {profile.culture && (
              <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
                <h3 className={`${syne} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>Culture</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{profile.culture}</p>
              </div>
            )}
          </div>

          {/* Right — Open Roles */}
          <div className="lg:col-span-2">
            <h2 className={`${syne} text-lg font-bold mb-4`} style={{ color: "var(--ink)" }}>
              Open Roles ({jobs.length})
            </h2>
            {jobs.length === 0 ? (
              <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm" style={{ color: "var(--muted)" }}>No open roles right now. Check back later!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md no-underline"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`${syne} text-sm font-bold`} style={{ color: "var(--ink)" }}>{job.title}</h3>
                      {job.salaryMin && (
                        <span className="text-xs font-medium shrink-0 ml-2" style={{ color: "var(--ink)" }}>
                          {job.salaryMin}–{job.salaryMax} LPA
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(0,0,0,0.05)", color: "var(--muted)" }}>📍 {job.location}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(0,0,0,0.05)", color: "var(--muted)" }}>{job.workMode}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(0,0,0,0.05)", color: "var(--muted)" }}>{job.experienceLevel}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {job.skills.slice(0, 5).map((s) => (
                        <span key={s} className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "var(--surface)", color: "var(--ink)" }}>{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-[10px]" style={{ color: "var(--muted)" }}>
                      <span>{job._count.applications} applicants</span>
                      {job.deadline && <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
