"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";

const statusBadge: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700", CLOSED: "bg-gray-100 text-gray-700",
  DRAFT: "bg-yellow-100 text-yellow-700", UNDER_REVIEW: "bg-orange-100 text-orange-700",
};

interface Job {
  id: string; title: string; company: string; location: string; workMode: string;
  experienceLevel: string; jobType: string; status: string; createdAt: string;
  _count: { applications: number };
}

export default function MyJobPosts({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchJobs(); }, []);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function toggleStatus(jobId: string, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "CLOSED" : "ACTIVE";
    await fetch(`/api/jobs/${jobId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    fetchJobs();
  }

  async function deleteJob(jobId: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    fetchJobs();
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${heading} font-bold text-xl`}>My Job Posts</h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted</p>
        </div>
        <button onClick={() => onNavigate("create-job")} className={`px-4 py-2.5 rounded-xl ${heading} font-bold text-sm`} style={{ background: "var(--primary)", color: "white" }}>+ New Post</button>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">📝</div>
          <p className={`${heading} font-bold text-base mb-1`}>No job posts yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Create your first job posting to start receiving applications</p>
          <button onClick={() => onNavigate("create-job")} className={`mt-3 px-4 py-2 rounded-lg ${heading} font-bold text-xs`} style={{ background: "var(--primary)", color: "white" }}>Create job post</button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${heading} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>{job.company.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className={`${heading} font-bold`}>{job.title}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{job.company} · {job.location} · {job.workMode} · {job.experienceLevel}</div>
                </div>
                <div className="text-center shrink-0">
                  <div className={`${heading} text-lg font-extrabold`}>{job._count.applications}</div>
                  <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>Applications</div>
                </div>
                <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusBadge[job.status] || ""}`}>{job.status}</span>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/jobs/${job.id}`} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border no-underline hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>View</Link>
                  <button onClick={() => toggleStatus(job.id, job.status)} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    {job.status === "ACTIVE" ? "Close" : "Reopen"}
                  </button>
                  <button onClick={() => deleteJob(job.id, job.title)} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium text-red-500 border border-red-200 hover:bg-red-50">Delete</button>
                </div>
              </div>
              <div className="text-[0.65rem] mt-2" style={{ color: "var(--muted)" }}>Posted {new Date(job.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
