"use client";
import { useEffect, useState } from "react";
const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";

interface Lab { id: string; title: string; domain: string; difficulty: string; timeLimit: number; passingScore: number; status: string; _count: { problems: number; attempts: number }; createdAt: string }
interface Problem { question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; explanation: string }

export default function LabsTab() {
  const [labs, setLabs] = useState<Lab[]>([]); const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false); const [editLabId, setEditLabId] = useState<string | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { fetchLabs(); }, []);
  async function fetchLabs() { const r = await fetch("/api/labs"); const d = await r.json(); setLabs(d.labs || []); setLoading(false); }

  async function handleCreateLab(e: React.FormEvent) {
    e.preventDefault(); const f = e.target as HTMLFormElement; const d = new FormData(f); setMsg(null);
    const res = await fetch("/api/labs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: d.get("title"), domain: d.get("domain"), description: d.get("description"), difficulty: d.get("difficulty"), timeLimit: d.get("timeLimit"), passingScore: d.get("passingScore") }) });
    const data = await res.json();
    if (res.ok) { setMsg({ type: "success", text: `Lab "${data.lab.title}" created! Now add problems.` }); setEditLabId(data.lab.id); setShowCreate(false); setProblems(Array.from({ length: 10 }, () => ({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", explanation: "" }))); fetchLabs(); }
    else setMsg({ type: "error", text: data.error });
  }

  async function handleSaveProblems() {
    if (!editLabId) return; setMsg(null);
    const valid = problems.filter((p) => p.question && p.optionA && p.optionB);
    if (valid.length === 0) { setMsg({ type: "error", text: "Add at least 1 problem" }); return; }
    const res = await fetch(`/api/labs/${editLabId}/problems`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problems: valid }) });
    if (res.ok) { setMsg({ type: "success", text: `${valid.length} problems saved!` }); fetchLabs(); }
  }

  async function togglePublish(id: string, current: string) {
    await fetch(`/api/labs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: current === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }) }); fetchLabs();
  }

  async function deleteLab(id: string) { if (!confirm("Delete this lab?")) return; await fetch(`/api/labs/${id}`, { method: "DELETE" }); fetchLabs(); }

  async function loadProblems(id: string) {
    setEditLabId(id);
    const r = await fetch(`/api/labs/${id}`); const d = await r.json();
    const existing = d.lab?.problems || [];
    const padded = [...existing, ...Array.from({ length: Math.max(0, 10 - existing.length) }, () => ({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", explanation: "" }))];
    setProblems(padded.slice(0, 10));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h2 className={`${heading} font-bold text-xl`}>Lab Templates</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{labs.length} templates</p></div>
        <button onClick={() => { setShowCreate(!showCreate); setEditLabId(null); }} className={`px-4 py-2.5 rounded-xl ${heading} font-bold text-sm`} style={{ background: "var(--primary)", color: "white" }}>{showCreate ? "Cancel" : "+ Create Lab"}</button></div>

      {msg && <div className={`rounded-xl p-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}

      {showCreate && (
        <form onSubmit={handleCreateLab} className="rounded-2xl border bg-white p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
          <h3 className={`${heading} font-bold text-base`}>New Lab Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={`block text-sm font-medium mb-1 ${heading}`}>Title *</label><input name="title" required placeholder="e.g. Cybersecurity Basics" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={`block text-sm font-medium mb-1 ${heading}`}>Domain *</label><select name="domain" required className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>Software Development</option><option>Cybersecurity</option><option>Cloud & DevOps</option><option>Data & Analytics</option><option>Consulting</option></select></div>
            <div><label className={`block text-sm font-medium mb-1 ${heading}`}>Difficulty</label><select name="difficulty" className={inputClass} style={{ borderColor: "var(--border)" }}><option>EASY</option><option>MEDIUM</option><option>HARD</option></select></div>
            <div><label className={`block text-sm font-medium mb-1 ${heading}`}>Time Limit (min)</label><input name="timeLimit" type="number" defaultValue={30} min={5} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={`block text-sm font-medium mb-1 ${heading}`}>Passing Score (%)</label><input name="passingScore" type="number" defaultValue={60} min={0} max={100} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          </div>
          <div><label className={`block text-sm font-medium mb-1 ${heading}`}>Description</label><textarea name="description" placeholder="What this lab tests..." rows={2} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>
          <button type="submit" className={`px-5 py-2.5 rounded-xl ${heading} font-bold text-sm`} style={{ background: "var(--primary)", color: "white" }}>Create & Add Problems</button>
        </form>
      )}

      {/* Problem editor */}
      {editLabId && (
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4"><h3 className={`${heading} font-bold text-base`}>Edit Problems</h3><button onClick={() => setEditLabId(null)} className="text-xs" style={{ color: "var(--muted)" }}>Close</button></div>
          <div className="space-y-4">
            {problems.map((p, i) => (
              <div key={i} className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                <div className={`${heading} font-bold text-xs mb-2`}>Q{i + 1}</div>
                <input value={p.question} onChange={(e) => { const u = [...problems]; u[i].question = e.target.value; setProblems(u); }} placeholder="Question" className={`${inputClass} mb-2`} style={{ borderColor: "var(--border)" }} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={p.optionA} onChange={(e) => { const u = [...problems]; u[i].optionA = e.target.value; setProblems(u); }} placeholder="A)" className={inputClass} style={{ borderColor: "var(--border)" }} />
                  <input value={p.optionB} onChange={(e) => { const u = [...problems]; u[i].optionB = e.target.value; setProblems(u); }} placeholder="B)" className={inputClass} style={{ borderColor: "var(--border)" }} />
                  <input value={p.optionC} onChange={(e) => { const u = [...problems]; u[i].optionC = e.target.value; setProblems(u); }} placeholder="C)" className={inputClass} style={{ borderColor: "var(--border)" }} />
                  <input value={p.optionD} onChange={(e) => { const u = [...problems]; u[i].optionD = e.target.value; setProblems(u); }} placeholder="D)" className={inputClass} style={{ borderColor: "var(--border)" }} />
                </div>
                <div className="flex gap-3 mt-2">
                  <select value={p.correctAnswer} onChange={(e) => { const u = [...problems]; u[i].correctAnswer = e.target.value; setProblems(u); }} className="rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: "var(--border)" }}><option>A</option><option>B</option><option>C</option><option>D</option></select>
                  <input value={p.explanation} onChange={(e) => { const u = [...problems]; u[i].explanation = e.target.value; setProblems(u); }} placeholder="Explanation (optional)" className="flex-1 rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: "var(--border)" }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSaveProblems} className={`mt-4 px-5 py-2.5 rounded-xl ${heading} font-bold text-sm`} style={{ background: "var(--primary)", color: "white" }}>Save Problems</button>
        </div>
      )}

      {/* Lab list */}
      {labs.length === 0 && !showCreate ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}><div className="text-4xl mb-3">🧪</div><p className={`${heading} font-bold text-base`}>No labs created</p></div>
      ) : (
        <div className="space-y-3">
          {labs.map((lab) => (
            <div key={lab.id} className="rounded-2xl border bg-white p-5 flex items-center gap-4 flex-wrap" style={{ borderColor: "var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className={`${heading} font-bold`}>{lab.title}</span><span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${lab.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{lab.status}</span><span className="text-[0.6rem] px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{lab.difficulty}</span></div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{lab.domain} · {lab._count.problems} problems · {lab.timeLimit} min · {lab.passingScore}% pass · {lab._count.attempts} attempts</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => loadProblems(lab.id)} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>Edit</button>
                <button onClick={() => togglePublish(lab.id, lab.status)} className={`px-3 py-1.5 rounded-lg ${heading} font-bold text-[0.7rem]`} style={{ background: "var(--primary)", color: "white" }}>{lab.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                <button onClick={() => deleteLab(lab.id)} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium text-red-500 border border-red-200 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
