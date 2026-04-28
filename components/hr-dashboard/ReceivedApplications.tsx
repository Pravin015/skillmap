"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";

const statusColors: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  SCREENING: "bg-yellow-100 text-yellow-700",
  INTERVIEW: "bg-[#EDE9FE] text-[#7C3AED]",
  ASSESSMENT: "bg-orange-100 text-orange-700",
  OFFER: "bg-green-100 text-green-700",
  HIRED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
};

interface App {
  id: string;
  status: string;
  scoreMatch: number;
  appliedAt: string;
  job: { title: string; company: string };
  user: {
    name: string; email: string;
    profile: { profileNumber: string; profileScore: number; fieldOfInterest: string | null; collegeName: string | null; skills: string[] } | null;
  };
}

export default function ReceivedApplications() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { fetchApps(); }, []);

  async function fetchApps() {
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      setApps(data.applications || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function updateStatus(appId: string, status: string) {
    await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchApps();
  }

  const filtered = filter === "ALL" ? apps : apps.filter((a) => a.status === filter);
  const scoreColor = (s: number) => s >= 90 ? "#22c55e" : s >= 70 ? "#f59e0b" : s >= 50 ? "#f97316" : "#ef4444";

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>Received Applications</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{apps.length} total applications</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "APPLIED", "SCREENING", "INTERVIEW", "ASSESSMENT", "OFFER", "HIRED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs ${heading} font-bold`} style={{ background: filter === s ? "var(--ink)" : "white", color: filter === s ? "var(--primary)" : "var(--muted)", border: filter === s ? "none" : "1px solid var(--border)" }}>
            {s === "ALL" ? "All" : s} ({s === "ALL" ? apps.length : apps.filter((a) => a.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">📩</div>
          <p className={`${heading} font-bold text-base mb-1`}>No applications {filter !== "ALL" ? `with status "${filter}"` : "received yet"}</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Applications will appear here when candidates apply to your job posts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div key={app.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${heading} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>
                  {app.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`${heading} font-bold text-sm`}>{app.user.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    Applied for: {app.job.title} · {app.user.profile?.collegeName || "—"}
                  </div>
                  {app.user.profile?.skills && app.user.profile.skills.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {app.user.profile.skills.slice(0, 4).map((s) => (
                        <span key={s} className="text-[0.6rem] px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-center shrink-0">
                  <div className={`${heading} text-lg font-bold`} style={{ color: scoreColor(app.scoreMatch) }}>{app.scoreMatch}%</div>
                  <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>Match</div>
                </div>
                <div className="shrink-0">
                  <select value={app.status} onChange={(e) => updateStatus(app.id, e.target.value)} className={`text-[0.65rem] font-bold px-2 py-1 rounded-full border-none cursor-pointer ${statusColors[app.status] || ""}`}>
                    {["APPLIED", "SCREENING", "INTERVIEW", "ASSESSMENT", "OFFER", "HIRED", "REJECTED"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {app.user.profile?.profileNumber ? (
                  <a href={`/profile/${app.user.profile.profileNumber}`} target="_blank" rel="noopener noreferrer" className={`shrink-0 px-3 py-1.5 rounded-lg ${heading} font-bold text-[0.7rem] no-underline cursor-pointer`} style={{ background: "var(--primary)", color: "white" }}>
                    View Profile ↗
                  </a>
                ) : (
                  <span className="shrink-0 px-3 py-1.5 rounded-lg text-[0.7rem] font-medium" style={{ background: "var(--border)", color: "var(--muted)" }}>No profile</span>
                )}
              </div>
              <div className="text-[0.65rem] mt-2" style={{ color: "var(--muted)" }}>Applied {new Date(app.appliedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
