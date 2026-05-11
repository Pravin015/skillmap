"use client";
// Admin moderation queue — list + triage abuse reports.
import { useEffect, useState, useCallback } from "react";

const heading = "font-[family-name:var(--font-heading)]";

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  targetUrl: string | null;
  reason: string;
  details: string | null;
  status: "OPEN" | "UNDER_REVIEW" | "ACTION_TAKEN" | "DISMISSED";
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reporter: { id: string; name: string; email: string; role: string };
}

const STATUS_STYLES: Record<Report["status"], { bg: string; color: string }> = {
  OPEN: { bg: "rgba(220,38,38,0.1)", color: "#dc2626" },
  UNDER_REVIEW: { bg: "rgba(202,138,4,0.1)", color: "#ca8a04" },
  ACTION_TAKEN: { bg: "rgba(16,185,129,0.1)", color: "#16a34a" },
  DISMISSED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
};

const STATUS_LABEL: Record<Report["status"], string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Reviewing",
  ACTION_TAKEN: "Action taken",
  DISMISSED: "Dismissed",
};

const REASON_LABEL: Record<string, string> = {
  SPAM: "Spam",
  SCAM_OR_FRAUD: "Scam / fraud",
  HARASSMENT_OR_ABUSE: "Harassment",
  IMPERSONATION: "Impersonation",
  OFFENSIVE_CONTENT: "Offensive content",
  COPYRIGHT: "Copyright",
  MISLEADING_INFO: "Misleading info",
  OTHER: "Other",
};

const TARGET_LABEL: Record<string, string> = {
  JOB: "Job",
  BLOG_POST: "Blog post",
  COURSE: "Course",
  MENTOR_PROFILE: "Mentor",
  USER: "User",
  COMPANY: "Company",
  COMPETITION: "Competition",
  EVENT: "Event",
  OTHER: "Other",
};

export default function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | Report["status"]>("OPEN");
  const [openId, setOpenId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "ALL" ? "/api/reports" : `/api/reports?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setReports(data.reports || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function updateStatus(id: string, status: Report["status"]) {
    setSavingId(id);
    try {
      await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, resolution: status === "ACTION_TAKEN" || status === "DISMISSED" ? resolution : null }),
      });
      setOpenId(null);
      setResolution("");
      fetchReports();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>Abuse Reports</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          User-submitted flags on jobs, mentors, blog posts, etc. Triage the queue daily.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "OPEN", "UNDER_REVIEW", "ACTION_TAKEN", "DISMISSED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition"
            style={{
              background: filter === f ? "var(--primary)" : "var(--surface-alt)",
              color: filter === f ? "white" : "var(--muted)",
            }}
          >
            {f === "ALL" ? "All" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-3xl mb-3">🎉</p>
          <p className="font-semibold mb-1" style={{ color: "var(--ink)" }}>No reports in this view</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {filter === "OPEN" ? "Inbox zero. Check back tomorrow." : "Nothing matches this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const isOpen = openId === r.id;
            const s = STATUS_STYLES[r.status];
            return (
              <div key={r.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
                        {STATUS_LABEL[r.status]}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                        {TARGET_LABEL[r.targetType] || r.targetType}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {REASON_LABEL[r.reason] || r.reason}
                      </span>
                    </div>
                    <p className="text-sm font-mono" style={{ color: "var(--ink)" }}>
                      Target: <span className="font-semibold">{r.targetId}</span>
                    </p>
                    {r.targetUrl && (
                      <a href={r.targetUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "var(--primary)" }}>
                        Open reported page ↗
                      </a>
                    )}
                  </div>
                  <div className="text-right text-xs" style={{ color: "var(--muted)" }}>
                    <p>by {r.reporter.name} ({r.reporter.role})</p>
                    <p>{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {r.details && (
                  <p className="text-sm mb-3 p-3 rounded-lg" style={{ background: "var(--surface-alt)", color: "var(--ink-soft)" }}>
                    &ldquo;{r.details}&rdquo;
                  </p>
                )}

                {r.status === "ACTION_TAKEN" || r.status === "DISMISSED" ? (
                  r.resolution && (
                    <div className="text-xs p-3 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                      <strong style={{ color: "var(--ink)" }}>Resolution:</strong> {r.resolution}
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    {!isOpen ? (
                      <div className="flex gap-2 flex-wrap">
                        {r.status === "OPEN" && (
                          <button
                            onClick={() => updateStatus(r.id, "UNDER_REVIEW")}
                            disabled={savingId === r.id}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                            style={{ background: "rgba(202,138,4,0.1)", color: "#ca8a04" }}
                          >
                            Mark reviewing
                          </button>
                        )}
                        <button
                          onClick={() => { setOpenId(r.id); setResolution(""); }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{ background: "rgba(16,185,129,0.1)", color: "#16a34a" }}
                        >
                          Take action
                        </button>
                        <button
                          onClick={() => { setOpenId(r.id); setResolution(""); }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
                          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 p-3 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                        <textarea
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          rows={2}
                          placeholder="What did you do? (visible to admins only)"
                          className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                          style={{ borderColor: "var(--border)" }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(r.id, "ACTION_TAKEN")}
                            disabled={savingId === r.id || !resolution.trim()}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                            style={{ background: "#16a34a", color: "white" }}
                          >
                            Action taken
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, "DISMISSED")}
                            disabled={savingId === r.id || !resolution.trim()}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                            style={{ background: "#6b7280", color: "white" }}
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => { setOpenId(null); setResolution(""); }}
                            className="text-xs px-3 py-1.5"
                            style={{ color: "var(--muted)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
