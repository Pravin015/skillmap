"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Stats { totalApps: number; activeJobs: number; interviewCount: number; shortlisted: number; pipeline: Record<string, number> }

export default function HROverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState<Stats>({ totalApps: 0, activeJobs: 0, interviewCount: 0, shortlisted: 0, pipeline: {} });

  useEffect(() => {
    async function load() {
      try {
        const [appsRes, jobsRes] = await Promise.all([
          fetch("/api/applications").then((r) => r.json()),
          fetch("/api/jobs").then((r) => r.json()),
        ]);
        const apps = appsRes.applications || [];
        const jobs = jobsRes.jobs || [];
        const pipeline: Record<string, number> = {};
        apps.forEach((a: { status: string }) => { pipeline[a.status] = (pipeline[a.status] || 0) + 1; });
        setStats({
          totalApps: apps.length,
          activeJobs: jobs.filter((j: { status: string }) => j.status === "ACTIVE").length,
          interviewCount: pipeline["INTERVIEW"] || 0,
          shortlisted: (pipeline["SCREENING"] || 0) + (pipeline["INTERVIEW"] || 0) + (pipeline["ASSESSMENT"] || 0) + (pipeline["OFFER"] || 0),
          pipeline,
        });
      } catch { /* ignore */ }
    }
    load();
  }, []);

  const statCards = [
    { label: "Applications Received", value: stats.totalApps.toString(), icon: "📩", color: "#4285f4" },
    { label: "Active Job Posts", value: stats.activeJobs.toString(), icon: "💼", color: "#22c55e" },
    { label: "Candidates Shortlisted", value: stats.shortlisted.toString(), icon: "⭐", color: "#f59e0b" },
    { label: "In Interview", value: stats.interviewCount.toString(), icon: "📅", color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <button key={s.label} onClick={() => onNavigate(s.label.includes("Application") ? "applications" : s.label.includes("Job") ? "my-posts" : "applications")} className="rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3"><span className="text-2xl">{s.icon}</span><div className="w-8 h-1 rounded-full" style={{ background: s.color }} /></div>
            <div className={`${syne} text-2xl font-extrabold`}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Post a new job", icon: "➕", tab: "create-job" },
            { label: "Search candidates", icon: "🔍", tab: "search" },
            { label: "Create hackathon", icon: "🏆", tab: "hackathon" },
            { label: "View applications", icon: "📩", tab: "applications" },
          ].map((a) => (
            <button key={a.label} onClick={() => onNavigate(a.tab)} className="rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "var(--border)" }}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className={`${syne} font-bold text-sm`}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* CSV Exports */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-2`}>Export Data</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "My Applications", type: "my-applications" },
            { label: "My Job Posts", type: "my-jobs" },
            { label: "All Candidates", type: "candidates" },
          ].map((e) => (
            <a key={e.type} href={`/api/export?type=${e.type}`} download className={`px-3 py-2 rounded-xl ${syne} font-bold text-xs no-underline border transition-colors hover:bg-gray-50`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
              📥 {e.label}
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-2`}>Hiring Pipeline</h3>
        <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Live candidate status across your job posts</p>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {["APPLIED", "SCREENING", "INTERVIEW", "ASSESSMENT", "OFFER", "HIRED", "REJECTED"].map((stage) => (
            <div key={stage} className="rounded-xl border p-3 text-center" style={{ borderColor: stats.pipeline[stage] ? "var(--ink)" : "var(--border)", background: stats.pipeline[stage] ? "rgba(10,10,15,0.02)" : "transparent" }}>
              <div className={`${syne} text-lg font-extrabold`} style={{ color: stats.pipeline[stage] ? "var(--ink)" : "var(--border)" }}>{stats.pipeline[stage] || 0}</div>
              <div className="text-[0.55rem] font-medium mt-0.5" style={{ color: "var(--muted)" }}>{stage.charAt(0) + stage.slice(1).toLowerCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
