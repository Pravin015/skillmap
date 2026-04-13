"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: string;
  scoreMatch: number;
  appliedAt: string;
  user: { id: string; name: string; email: string; profileImage: string | null; profile: { collegeName: string | null; skills: string[]; fieldOfInterest: string | null } | null };
  job: { title: string; company: string };
}

interface CandidateReport {
  user: { name: string; email: string; phone: string | null; profile: { collegeName: string | null; skills: string[]; resumeUrl: string | null; linkedinUrl: string | null; githubUrl: string | null; bio: string | null } | null };
  summary: { profileScore: number; labAvgScore: number | null; mockInterviewAvg: number | null; labsCompleted: number; interviewsCompleted: number };
  labAttempts: { lab: string; percentage: number; passed: boolean }[];
  mockInterviews: { company: string; type: string; score: number | null }[];
}

const STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "ASSESSMENT", "OFFER", "HIRED"];
const stageColors: Record<string, string> = {
  APPLIED: "#6b7280", SCREENING: "#3b82f6", INTERVIEW: "#8b5cf6",
  ASSESSMENT: "#f59e0b", OFFER: "#10b981", HIRED: "#059669",
};

export default function CandidatePipeline() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [report, setReport] = useState<CandidateReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [notes, setNotes] = useState<{ id: string; authorName: string; content: string; createdAt: string }[]>([]);
  const [newNote, setNewNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [jobFilter, setJobFilter] = useState("ALL");

  useEffect(() => { fetchApplications(); }, []);

  async function fetchApplications() {
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function moveToStage(appId: string, newStatus: string) {
    await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a));
    if (selectedApp?.id === appId) setSelectedApp({ ...selectedApp, status: newStatus });
  }

  async function bulkMove() {
    if (selectedIds.size === 0 || !bulkStatus) return;
    await fetch("/api/applications/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationIds: Array.from(selectedIds), status: bulkStatus }),
    });
    setApplications((prev) => prev.map((a) => selectedIds.has(a.id) ? { ...a, status: bulkStatus } : a));
    setSelectedIds(new Set());
    setBulkStatus("");
  }

  async function openReport(app: Application) {
    setSelectedApp(app);
    setReportLoading(true);
    setReport(null);
    setNotes([]);
    try {
      const [reportRes, notesRes] = await Promise.all([
        fetch(`/api/candidates/${app.userId}/report`),
        fetch(`/api/applications/${app.id}/notes`),
      ]);
      const reportData = await reportRes.json();
      const notesData = await notesRes.json();
      setReport(reportData);
      setNotes(notesData.notes || []);
    } catch { /* ignore */ }
    finally { setReportLoading(false); }
  }

  async function addNote() {
    if (!newNote.trim() || !selectedApp) return;
    const res = await fetch(`/api/applications/${selectedApp.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote }),
    });
    const data = await res.json();
    if (data.note) setNotes((prev) => [data.note, ...prev]);
    setNewNote("");
  }

  // Get unique jobs for filter
  const uniqueJobs = [...new Map(applications.map((a) => [a.jobId, { id: a.jobId, title: a.job.title }])).values()];
  const filtered = jobFilter === "ALL" ? applications : applications.filter((a) => a.jobId === jobFilter);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`${syne} font-bold text-xl`}>Candidate Pipeline</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{filtered.length} candidates across {STAGES.length} stages</p>
        </div>

        {/* Job Filter */}
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="rounded-xl border px-3 py-2 text-xs outline-none"
          style={{ borderColor: "var(--border)" }}
        >
          <option value="ALL">All Jobs ({applications.length})</option>
          {uniqueJobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title} ({applications.filter((a) => a.jobId === j.id).length})</option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="rounded-xl border p-3 flex items-center gap-3" style={{ background: "var(--primary-light)", borderColor: "var(--primary)" }}>
          <span className="text-xs font-medium">{selectedIds.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="rounded-lg border px-2 py-1 text-xs"
            style={{ borderColor: "var(--border)" }}
          >
            <option value="">Move to...</option>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="REJECTED">REJECTED</option>
          </select>
          <button onClick={bulkMove} disabled={!bulkStatus} className={`${syne} text-xs font-bold px-3 py-1 rounded-lg disabled:opacity-40`} style={{ background: "var(--primary)", color: "white" }}>
            Move
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs" style={{ color: "var(--muted)" }}>Clear</button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageApps = filtered.filter((a) => a.status === stage);
          return (
            <div key={stage} className="min-w-[220px] flex-1">
              {/* Stage Header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: stageColors[stage] }} />
                <span className={`${syne} text-xs font-bold`} style={{ color: "var(--ink)" }}>{stage}</span>
                <span className="text-[10px] rounded-full px-1.5" style={{ background: "var(--surface)", color: "var(--muted)" }}>{stageApps.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2 rounded-xl p-2 min-h-[200px]" style={{ background: "var(--surface)" }}>
                {stageApps.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-xl bg-white border p-3 cursor-pointer transition-all hover:shadow-md"
                    style={{ borderColor: selectedIds.has(app.id) ? "var(--ink)" : "var(--border)", borderWidth: selectedIds.has(app.id) ? 2 : 1 }}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          e.target.checked ? next.add(app.id) : next.delete(app.id);
                          setSelectedIds(next);
                        }}
                        className="mt-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0" onClick={() => openReport(app)}>
                        <div className={`${syne} text-xs font-bold truncate`} style={{ color: "var(--ink)" }}>{app.user.name}</div>
                        <div className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{app.user.email}</div>
                        <div className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>{app.job.title}</div>
                      </div>
                      <div className="shrink-0">
                        <div
                          className={`${syne} text-[10px] font-bold px-1.5 py-0.5 rounded`}
                          style={{ background: app.scoreMatch >= 70 ? "#10b98115" : app.scoreMatch >= 40 ? "#f59e0b15" : "#ef444415", color: app.scoreMatch >= 70 ? "#10b981" : app.scoreMatch >= 40 ? "#f59e0b" : "#ef4444" }}
                        >
                          {app.scoreMatch}%
                        </div>
                      </div>
                    </div>

                    {/* Quick move buttons */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {STAGES.filter((s) => s !== stage).slice(0, 3).map((s) => (
                        <button
                          key={s}
                          onClick={(e) => { e.stopPropagation(); moveToStage(app.id, s); }}
                          className="text-[8px] px-1.5 py-0.5 rounded border transition-colors hover:bg-gray-100"
                          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                        >
                          → {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {stageApps.length === 0 && (
                  <div className="text-center py-6 text-[10px]" style={{ color: "var(--muted)" }}>No candidates</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Side Panel */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedApp(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="sticky top-0 z-10 border-b p-4 flex items-center justify-between" style={{ background: "white", borderColor: "var(--border)" }}>
              <div>
                <h3 className={`${syne} text-base font-bold`} style={{ color: "var(--ink)" }}>{selectedApp.user.name}</h3>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{selectedApp.user.email}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-xl" style={{ color: "var(--muted)" }}>×</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Status + Move */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Status:</span>
                <select
                  value={selectedApp.status}
                  onChange={(e) => moveToStage(selectedApp.id, e.target.value)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold border-none`}
                  style={{ background: `${stageColors[selectedApp.status]}20`, color: stageColors[selectedApp.status] }}
                >
                  {[...STAGES, "REJECTED"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-xs font-bold ml-auto" style={{ color: selectedApp.scoreMatch >= 70 ? "#10b981" : "#f59e0b" }}>
                  Score: {selectedApp.scoreMatch}%
                </span>
              </div>

              {reportLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                </div>
              ) : report ? (
                <>
                  {/* Profile */}
                  <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                    <h4 className={`${syne} text-xs font-bold mb-2`}>Profile</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--muted)" }}>
                      {report.user.profile?.collegeName && <div><strong>College:</strong> {report.user.profile.collegeName}</div>}
                      {report.user.phone && <div><strong>Phone:</strong> {report.user.phone}</div>}
                      {report.user.profile?.bio && <div className="col-span-2"><strong>Bio:</strong> {report.user.profile.bio}</div>}
                    </div>
                    {report.user.profile?.skills && report.user.profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {report.user.profile.skills.map((s) => (
                          <span key={s} className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--surface)", color: "var(--ink)" }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {report.user.profile?.resumeUrl && <a href={report.user.profile.resumeUrl} target="_blank" className="text-[10px] px-2 py-1 rounded-lg no-underline" style={{ background: "var(--primary)", color: "white" }}>Resume</a>}
                      {report.user.profile?.linkedinUrl && <a href={report.user.profile.linkedinUrl} target="_blank" className="text-[10px] px-2 py-1 rounded-lg border no-underline" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>LinkedIn</a>}
                      {report.user.profile?.githubUrl && <a href={report.user.profile.githubUrl} target="_blank" className="text-[10px] px-2 py-1 rounded-lg border no-underline" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>GitHub</a>}
                    </div>
                  </div>

                  {/* Assessment Scores */}
                  <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                    <h4 className={`${syne} text-xs font-bold mb-2`}>Assessment Summary</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Profile Score", value: report.summary.profileScore, max: 100 },
                        { label: "Lab Avg", value: report.summary.labAvgScore, max: 100 },
                        { label: "Mock Interview", value: report.summary.mockInterviewAvg, max: 100 },
                      ].map((s) => (
                        <div key={s.label} className="text-center rounded-lg p-2" style={{ background: "var(--surface)" }}>
                          <div className={`${syne} text-lg font-bold`} style={{ color: s.value != null ? (s.value >= 70 ? "#10b981" : s.value >= 40 ? "#f59e0b" : "#ef4444") : "var(--muted)" }}>
                            {s.value != null ? s.value : "—"}
                          </div>
                          <div className="text-[9px]" style={{ color: "var(--muted)" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-2 text-[10px]" style={{ color: "var(--muted)" }}>
                      <span>{report.summary.labsCompleted} labs completed</span>
                      <span>{report.summary.interviewsCompleted} mock interviews</span>
                    </div>
                  </div>

                  {/* Lab Results */}
                  {report.labAttempts.length > 0 && (
                    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                      <h4 className={`${syne} text-xs font-bold mb-2`}>Lab Assessments</h4>
                      {report.labAttempts.map((l, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 text-xs" style={{ borderColor: "var(--border)" }}>
                          <span style={{ color: "var(--ink)" }}>{l.lab}</span>
                          <span style={{ color: l.passed ? "#10b981" : "#ef4444" }}>{l.percentage}% {l.passed ? "✓" : "✗"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mock Interviews */}
                  {report.mockInterviews.length > 0 && (
                    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                      <h4 className={`${syne} text-xs font-bold mb-2`}>Mock Interview Scores</h4>
                      {report.mockInterviews.map((m, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 text-xs" style={{ borderColor: "var(--border)" }}>
                          <span style={{ color: "var(--ink)" }}>{m.company} — {m.type}</span>
                          <span style={{ color: (m.score || 0) >= 70 ? "#10b981" : "#f59e0b" }}>{m.score || 0}/100</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}

              {/* Notes */}
              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                <h4 className={`${syne} text-xs font-bold mb-2`}>Notes</h4>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addNote()}
                    placeholder="Add a note..."
                    className="flex-1 rounded-lg border px-3 py-2 text-xs outline-none"
                    style={{ borderColor: "var(--border)" }}
                  />
                  <button onClick={addNote} className={`${syne} text-xs font-bold px-3 py-2 rounded-lg`} style={{ background: "var(--primary)", color: "white" }}>Add</button>
                </div>
                {notes.length === 0 && <p className="text-[10px] text-center py-2" style={{ color: "var(--muted)" }}>No notes yet</p>}
                {notes.map((n) => (
                  <div key={n.id} className="border-b py-2 last:border-0" style={{ borderColor: "var(--border)" }}>
                    <div className="flex justify-between text-[10px]" style={{ color: "var(--muted)" }}>
                      <span className="font-medium">{n.authorName}</span>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ink)" }}>{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
