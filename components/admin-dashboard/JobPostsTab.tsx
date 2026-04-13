"use client";
import { useEffect, useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";

const statusBadge: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  UNDER_REVIEW: "bg-orange-100 text-orange-700",
};

interface Job {
  id: string; title: string; company: string; location: string;
  workMode: string; jobType: string; status: string; domain: string | null;
  experienceLevel: string; createdAt: string;
  postedBy: { name: string; email: string };
  _count: { applications: number };
}

export default function JobPostsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { fetchJobs(); }, []);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function updateStatus(jobId: string, status: string) {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchJobs();
  }

  async function deleteJob(jobId: string, title: string) {
    if (!confirm(`Delete "${title}"? This will also delete all its applications.`)) return;
    await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    fetchJobs();
  }

  const filtered = filter === "ALL" ? jobs : jobs.filter((j) => j.status === filter);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>All Job Posts</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{jobs.length} total job postings on the platform</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "ACTIVE", "CLOSED", "DRAFT", "UNDER_REVIEW"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs ${heading} font-bold`} style={{ background: filter === f ? "var(--ink)" : "white", color: filter === f ? "var(--primary)" : "var(--muted)", border: filter === f ? "none" : "1px solid var(--border)" }}>
            {f === "ALL" ? "All" : f.replace("_", " ")} ({f === "ALL" ? jobs.length : jobs.filter((j) => j.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">💼</div>
          <p className={`${heading} font-bold text-base mb-1`}>No job posts {filter !== "ALL" ? `with status "${filter.replace("_", " ")}"` : "yet"}</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Job posts will appear here when HRs create them</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div key={job.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${heading} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>{job.company.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className={`${heading} font-bold`}>{job.title}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{job.company} · {job.location} · {job.workMode} · {job.experienceLevel}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>Posted by: {job.postedBy.name} ({job.postedBy.email})</div>
                </div>
                <div className="text-center shrink-0">
                  <div className={`${heading} text-lg font-extrabold`}>{job._count.applications}</div>
                  <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>Apps</div>
                </div>
                <select value={job.status} onChange={(e) => updateStatus(job.id, e.target.value)} className={`text-[0.65rem] font-bold px-2 py-1 rounded-full border-none cursor-pointer ${statusBadge[job.status] || ""}`}>
                  {["ACTIVE", "CLOSED", "DRAFT", "UNDER_REVIEW"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
                <button onClick={() => deleteJob(job.id, job.title)} className="text-[0.65rem] font-medium px-2 py-1 rounded-lg text-red-500 border border-red-200 hover:bg-red-50 shrink-0">Delete</button>
              </div>
              <div className="text-[0.65rem] mt-2" style={{ color: "var(--muted)" }}>Created {new Date(job.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
