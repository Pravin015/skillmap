"use client";
import { useState } from "react";
const syne = "font-[family-name:var(--font-syne)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";

export default function AddUserTab({ onRefresh }: { onRefresh: () => void }) {
  const [role, setRole] = useState("STUDENT");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tempPwd, setTempPwd] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMessage(null); setTempPwd("");
    const form = e.target as HTMLFormElement;
    const d = new FormData(form);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: d.get("name"), email: d.get("email"), password: Math.random().toString(36).slice(-8) + "A1!", role, organisation: d.get("organisation") || undefined, phone: d.get("phone") || undefined, degree: d.get("degree") || undefined, gradYear: d.get("gradYear") || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: data.error }); return; }
      setTempPwd(Math.random().toString(36).slice(-8) + "A1!"); // show the generated pwd
      setMessage({ type: "success", text: `${role} account created for ${data.name}` });
      form.reset(); onRefresh();
    } catch { setMessage({ type: "error", text: "Failed to create user" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div><h2 className={`${syne} font-bold text-xl`}>Add User</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Create any type of user account manually</p></div>

      <div className="flex gap-2 flex-wrap">
        {["STUDENT", "HR", "ORG", "INSTITUTION", "ADMIN"].map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`px-4 py-2 rounded-xl text-xs ${syne} font-bold`} style={{ background: role === r ? "var(--ink)" : "white", color: role === r ? "var(--accent)" : "var(--muted)", border: role === r ? "none" : "1px solid var(--border)" }}>{r}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 space-y-5" style={{ borderColor: "var(--border)" }}>
        {message && <div className={`rounded-xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}
        {tempPwd && (
          <div className="rounded-xl p-4 border" style={{ background: "rgba(232,255,71,0.1)", borderColor: "rgba(232,255,71,0.3)" }}>
            <div className={`${syne} font-bold text-sm mb-1`}>Temporary Password</div>
            <code className="text-base font-mono font-bold select-all">{tempPwd}</code>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Share this with the user. They should change it after first login.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Full Name *</label><input name="name" required placeholder="User's name" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Email *</label><input name="email" type="email" required placeholder="user@email.com" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          {(role === "HR" || role === "ORG" || role === "INSTITUTION") && (
            <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Organisation Name</label><input name="organisation" placeholder="Company/Institute name" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          )}
          <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Phone</label><input name="phone" placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          {role === "STUDENT" && (
            <>
              <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Degree</label><select name="degree" className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>B.Tech/BE</option><option>BCA</option><option>B.Sc</option><option>BBA</option><option>MBA</option><option>MCA</option><option>Other</option></select></div>
              <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Graduation Year</label><select name="gradYear" className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>2024</option><option>2025</option><option>2026</option><option>2027</option></select></div>
            </>
          )}
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>Creating as: <strong className={syne}>{role}</strong>. A temporary password will be auto-generated.</p>
        <button type="submit" disabled={saving} className={`px-6 py-3 rounded-xl ${syne} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--ink)", color: "var(--accent)" }}>{saving ? "Creating..." : `Create ${role} Account`}</button>
      </form>
    </div>
  );
}
