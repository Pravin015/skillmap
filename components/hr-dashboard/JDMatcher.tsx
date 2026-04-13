"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
const heading = "font-[family-name:var(--font-heading)]";

interface Candidate {
  userId: string; profileNumber: string; collegeName: string | null; experienceLevel: string;
  fieldOfInterest: string | null; profileScore: number; skills: string[];
  aiMatchPercent: number; aiReason: string;
  user: { id: string; name: string; email: string; degree: string | null; gradYear: string | null };
}

interface Job { id: string; title: string }

export default function JDMatcher() {
  const [jd, setJd] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [inviteJobId, setInviteJobId] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviting, setInviting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => { fetch("/api/jobs").then((r) => r.json()).then((d) => setJobs(d.jobs || [])).catch(() => {}); }, []);

  async function handleMatch() {
    setLoading(true); setCandidates([]); setSelected(new Set()); setResult(null); setSearched(true);
    try {
      const res = await fetch("/api/candidates/match-jd", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobDescription: jd }) });
      const data = await res.json();
      if (!res.ok) { setResult({ type: "error", text: data.error }); return; }
      setCandidates(data.candidates || []);
      if (data.fallback) setResult({ type: "error", text: "AI unavailable — showing keyword-based matches instead" });
    } catch { setResult({ type: "error", text: "Failed to match" }); }
    finally { setLoading(false); }
  }

  function toggleSelect(profileNumber: string) {
    const s = new Set(selected);
    s.has(profileNumber) ? s.delete(profileNumber) : s.add(profileNumber);
    setSelected(s);
  }

  function selectAll() {
    if (selected.size === candidates.length) setSelected(new Set());
    else setSelected(new Set(candidates.map((c) => c.profileNumber)));
  }

  async function sendInvites() {
    setInviting(true); setResult(null);
    const userIds = candidates.filter((c) => selected.has(c.profileNumber)).map((c) => c.userId || c.user.id).filter(Boolean);
    if (userIds.length === 0) { setResult({ type: "error", text: "No valid candidates to invite" }); setInviting(false); return; }

    const res = await fetch("/api/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidateIds: userIds, jobId: inviteJobId || undefined, message: inviteMsg || undefined }) });
    const data = await res.json();
    if (res.ok) { setResult({ type: "success", text: `${data.sent} invite${data.sent !== 1 ? "s" : ""} sent!` }); setSelected(new Set()); }
    else setResult({ type: "error", text: data.error });
    setInviting(false);
  }

  const scoreColor = (s: number) => s >= 80 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6">
      <div><h2 className={`${heading} font-bold text-xl`}>AI JD Matcher</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Paste a job description — AI finds the best matching candidates from our database</p></div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <label className={`block text-sm font-medium mb-1.5 ${heading}`}>Paste Job Description *</label>
        <textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description here — include role, skills, experience requirements, responsibilities..." rows={6} className="w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none focus:border-[var(--ink)]" style={{ borderColor: "var(--border)" }} />
        <button onClick={handleMatch} disabled={loading || jd.length < 20} className={`mt-3 px-6 py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
          {loading ? "🤖 AI is matching..." : "Find matching candidates →"}
        </button>
      </div>

      {result && <div className={`rounded-xl p-3 text-sm ${result.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{result.text}</div>}

      {searched && !loading && candidates.length > 0 && (
        <>
          {/* Bulk actions */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={selectAll} className={`px-3 py-1.5 rounded-lg text-xs font-medium border`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>{selected.size === candidates.length ? "Deselect all" : `Select all (${candidates.length})`}</button>
              {selected.size > 0 && <span className={`${heading} text-xs font-bold`} style={{ color: "var(--primary)", background: "var(--ink)", padding: "4px 10px", borderRadius: "8px" }}>{selected.size} selected</span>}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {candidates.map((c) => (
              <div key={c.profileNumber} className={`rounded-2xl border bg-white p-5 transition-all ${selected.has(c.profileNumber) ? "ring-2 ring-[var(--primary)]" : ""}`} style={{ borderColor: selected.has(c.profileNumber) ? "var(--ink)" : "var(--border)" }}>
                <div className="flex items-center gap-4">
                  <input type="checkbox" checked={selected.has(c.profileNumber)} onChange={() => toggleSelect(c.profileNumber)} className="w-4 h-4 accent-[var(--ink)] shrink-0" />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${heading} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>{c.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`${heading} font-bold text-sm`}>{c.user.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{c.collegeName || "—"} · {c.user.degree || ""} · {c.fieldOfInterest || "—"}</div>
                    <div className="text-xs mt-0.5 italic" style={{ color: "var(--muted)" }}>{c.aiReason}</div>
                    {c.skills.length > 0 && <div className="flex gap-1 mt-1 flex-wrap">{c.skills.slice(0, 5).map((s) => <span key={s} className="text-[0.6rem] px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{s}</span>)}</div>}
                  </div>
                  <div className="text-center shrink-0">
                    <div className={`${heading} text-xl font-extrabold`} style={{ color: scoreColor(c.aiMatchPercent) }}>{c.aiMatchPercent}%</div>
                    <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>AI Match</div>
                  </div>
                  <Link href={`/profile/${c.profileNumber}`} target="_blank" className={`shrink-0 px-3 py-1.5 rounded-lg ${heading} font-bold text-[0.7rem] no-underline`} style={{ background: "var(--primary)", color: "white" }}>View ↗</Link>
                </div>
              </div>
            ))}
          </div>

          {/* Invite panel */}
          {selected.size > 0 && (
            <div className="rounded-2xl p-6 sticky bottom-4" style={{ background: "var(--ink)" }}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className={`${heading} font-bold text-white text-sm mb-2`}>Send invite to {selected.size} candidate{selected.size !== 1 ? "s" : ""}</div>
                  <div className="flex gap-2">
                    <select value={inviteJobId} onChange={(e) => setInviteJobId(e.target.value)} className="flex-1 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <option value="">General invite (no job)</option>
                      {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                    <input value={inviteMsg} onChange={(e) => setInviteMsg(e.target.value)} placeholder="Message (optional)" className="flex-1 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }} />
                  </div>
                </div>
                <button onClick={sendInvites} disabled={inviting} className={`px-6 py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "var(--ink)" }}>
                  {inviting ? "Sending..." : `Send ${selected.size} invite${selected.size !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {searched && !loading && candidates.length === 0 && (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🔍</div>
          <p className={`${heading} font-bold text-base mb-1`}>No matching candidates found</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Try a different or more specific job description</p>
        </div>
      )}
    </div>
  );
}
