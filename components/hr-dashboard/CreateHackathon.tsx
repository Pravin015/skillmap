"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Lab { id: string; title: string; domain: string; difficulty: string }
interface Competition { id: string; title: string; slug: string; type: string; status: string; _count: { participants: number; submissions: number }; startDate: string; endDate: string }

export default function CreateHackathon() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [myComps, setMyComps] = useState<Competition[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [title, setTitle] = useState("");
  const [type, setType] = useState("HACKATHON");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [prizes, setPrizes] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [domain, setDomain] = useState("");
  const [regStart, setRegStart] = useState("");
  const [regEnd, setRegEnd] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("500");
  const [teamSize, setTeamSize] = useState("1");
  const [labId, setLabId] = useState("");
  const [hiringEnabled, setHiringEnabled] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/labs?status=PUBLISHED").then((r) => r.json()).then((d) => d.labs || []).catch(() => []),
      fetch("/api/competitions?mine=true").then((r) => r.json()).then((d) => d.competitions || []).catch(() => []),
    ]).then(([labData, compData]) => { setLabs(labData); setMyComps(compData); setLoading(false); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || !regStart || !startDate || !endDate) { setMsg("Please fill all required fields"); return; }
    setSaving(true); setMsg("");
    const res = await fetch("/api/competitions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type, description, rules, prizes, difficulty, domain, registrationStart: regStart, registrationEnd: regEnd || startDate, startDate, endDate, maxParticipants: parseInt(maxParticipants), teamSize: parseInt(teamSize), labTemplateId: labId || null, hiringEnabled }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`Competition "${title}" created successfully!`);
      setMyComps((prev) => [data.competition, ...prev]);
      setShowForm(false); setTitle(""); setDescription(""); setRules(""); setPrizes("");
    } else { setMsg(data.error || "Failed to create"); }
    setSaving(false);
  }

  async function updateStatus(slug: string, status: string) {
    await fetch(`/api/competitions/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setMyComps((prev) => prev.map((c) => c.slug === slug ? { ...c, status } : c));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${syne} font-bold text-xl`}>Competitions & Challenges</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Create hackathons, coding challenges, quizzes, and case studies</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`${syne} text-xs font-bold px-4 py-2 rounded-xl`} style={{ background: "var(--primary)", color: "white" }}>
          {showForm ? "Cancel" : "+ New Competition"}
        </button>
      </div>

      {msg && <div className="rounded-xl p-3 text-sm" style={{ background: msg.includes("Failed") ? "#fef2f2" : "var(--primary-light)", color: msg.includes("Failed") ? "#ef4444" : "var(--ink)" }}>{msg}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Title *</label><input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
            <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Type *</label><select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }}><option value="HACKATHON">Hackathon</option><option value="CODING">Coding Challenge</option><option value="QUIZ">Quiz</option><option value="CASE_STUDY">Case Study</option></select></div>
            <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Difficulty</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }}><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></div>
            <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Domain</label><input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Technology, Finance..." className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
            <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Registration Start *</label><input type="date" value={regStart} onChange={(e) => setRegStart(e.target.value)} required className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
            <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Registration End</label><input type="date" value={regEnd} onChange={(e) => setRegEnd(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
            <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Start Date *</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
            <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>End Date *</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
            <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Max Participants</label><input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
            <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Team Size</label><input type="number" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} min="1" max="10" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
          </div>
          <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
          <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Rules</label><textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
          <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Prizes</label><input value={prizes} onChange={(e) => setPrizes(e.target.value)} placeholder="1st: Rs.50K, 2nd: Rs.25K" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
          {labs.length > 0 && <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Attach Lab Assessment</label><select value={labId} onChange={(e) => setLabId(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }}><option value="">No assessment</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.title} ({l.difficulty})</option>)}</select></div>}
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hiringEnabled} onChange={(e) => setHiringEnabled(e.target.checked)} className="accent-[var(--ink)] w-4 h-4" /><span className="text-xs" style={{ color: "var(--ink)" }}>Enable hiring from results</span></label>
          <button type="submit" disabled={saving} className={`${syne} rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>{saving ? "Creating..." : "Create Competition"}</button>
        </form>
      )}

      {/* My Competitions */}
      <div>
        <h3 className={`${syne} text-sm font-bold mb-3`}>Your Competitions ({myComps.length})</h3>
        {myComps.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}><div className="text-3xl mb-2">🏆</div><p className="text-sm" style={{ color: "var(--muted)" }}>No competitions yet</p></div>
        ) : (
          <div className="space-y-2">
            {myComps.map((c) => (
              <div key={c.id} className="rounded-xl border bg-white p-4 flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className={`${syne} text-sm font-bold`} style={{ color: "var(--ink)" }}>{c.title}</span><span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: c.status === "OPEN" || c.status === "LIVE" ? "#10b98115" : "#6b728015", color: c.status === "OPEN" || c.status === "LIVE" ? "#10b981" : "#6b7280" }}>{c.status}</span></div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{c._count.participants} participants · {c._count.submissions} submissions</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {c.status === "DRAFT" && <button onClick={() => updateStatus(c.slug, "OPEN")} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "#10b98115", color: "#10b981" }}>Publish</button>}
                  {c.status === "OPEN" && <button onClick={() => updateStatus(c.slug, "LIVE")} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "#ef444415", color: "#ef4444" }}>Go Live</button>}
                  {c.status === "LIVE" && <button onClick={() => updateStatus(c.slug, "JUDGING")} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "#f59e0b15", color: "#f59e0b" }}>End & Judge</button>}
                  {c.status === "JUDGING" && <button onClick={() => updateStatus(c.slug, "COMPLETED")} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "#6b728015", color: "#6b7280" }}>Complete</button>}
                  <a href={`/competitions/${c.slug}/leaderboard`} target="_blank" className="text-[10px] px-2 py-1 rounded-lg border no-underline" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Leaderboard ↗</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
