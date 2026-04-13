"use client";
import { useState } from "react";
const syne = "font-[family-name:var(--font-syne)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";

export default function AddStudent({ onRefresh }: { onRefresh: () => void }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [degree, setDegree] = useState(""); const [gradYear, setGradYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tempPwd, setTempPwd] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMessage(null); setTempPwd("");
    try {
      const res = await fetch("/api/institution/students", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, degree, gradYear }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: data.error }); return; }
      setTempPwd(data.tempPassword);
      setMessage({ type: "success", text: `Student ${data.student.name} created (ID: ${data.student.profileNumber})` });
      setName(""); setEmail(""); setDegree(""); setGradYear("");
      onRefresh();
    } catch { setMessage({ type: "error", text: "Failed to create student" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Add Student</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Create a student account linked to your institution</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 space-y-5" style={{ borderColor: "var(--border)" }}>
        {message && <div className={`rounded-xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}
        {tempPwd && (
          <div className="rounded-xl p-4 border" style={{ background: "var(--primary-light)", borderColor: "rgba(232,255,71,0.3)" }}>
            <div className={`${syne} font-bold text-sm mb-1`}>Temporary Password</div>
            <code className="text-base font-mono font-bold select-all">{tempPwd}</code>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Share this with the student. Shown only once.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Full Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Student's name" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Email *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="student@email.com" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Degree</label>
            <select value={degree} onChange={(e) => setDegree(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>B.Tech/BE</option><option>BCA</option><option>B.Sc</option><option>BBA</option><option>B.Com</option><option>BA</option><option>MBA</option><option>MCA</option><option>Other</option></select></div>
          <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Graduation Year</label>
            <select value={gradYear} onChange={(e) => setGradYear(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>2024</option><option>2025</option><option>2026</option><option>2027</option></select></div>
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>A temporary password will be generated. The student&apos;s profile will be linked to your institution.</p>
        <button type="submit" disabled={saving} className={`px-6 py-3 rounded-xl ${syne} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>{saving ? "Creating..." : "Create Student Account"}</button>
      </form>
    </div>
  );
}
