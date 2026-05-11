"use client";
import { useEffect, useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";

const statusColors: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  SCREENING: "bg-yellow-100 text-yellow-700",
  INTERVIEW: "bg-[#EDE9FE] text-[#7C3AED]",
  ASSESSMENT: "bg-orange-100 text-orange-700",
  OFFER: "bg-green-100 text-green-700",
  HIRED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-700",
};

interface App {
  id: string;
  status: string;
  scoreMatch: number;
  appliedAt: string;
  job: { title: string; company: string; location: string; status: string };
}

export default function ApplicationsCard() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => setApps(d.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${heading} font-bold text-base`}>Companies Applied</h3>
        <span className={`${heading} text-xs font-bold px-2 py-1 rounded-lg`} style={{ background: apps.length > 0 ? "var(--ink)" : "var(--border)", color: apps.length > 0 ? "var(--primary)" : "var(--muted)" }}>{apps.length}</span>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Track your application status across companies</p>

      {loading ? (
        <div className="flex justify-center py-6"><div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
      ) : apps.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">📋</div>
          <p className={`${heading} font-bold text-sm mb-1`}>No applications yet</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Browse job openings and apply to start tracking here</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {apps.map((app) => (
            <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${heading} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>{app.job.company.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className={`${heading} font-bold text-sm`}>{app.job.company}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{app.job.title}</div>
              </div>
              <div className="text-right shrink-0">
                <span className={`inline-block text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${statusColors[app.status] || "bg-gray-100 text-gray-700"}`}>{app.status}</span>
                <div className="text-[0.6rem] mt-1" style={{ color: "var(--muted)" }}>{new Date(app.appliedAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
