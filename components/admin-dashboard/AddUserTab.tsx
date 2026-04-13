"use client";
import { useState } from "react";
const syne = "font-[family-name:var(--font-syne)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${syne}`;

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
      if (role === "MENTOR") {
        // Use dedicated mentor API
        const res = await fetch("/api/admin/add-mentor", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: d.get("name"), email: d.get("email"), phone: d.get("phone"),
            currentCompany: d.get("currentCompany"), currentRole: d.get("currentRole"),
            yearsOfExperience: d.get("yearsOfExperience"),
            areaOfExpertise: (d.get("areaOfExpertise") as string)?.split(",").map((s) => s.trim()).filter(Boolean) || [],
            compensation: d.get("compensation") || "PAID",
            linkedinUrl: d.get("linkedinUrl"),
          }),
        });
        const data = await res.json();
        if (!res.ok) { setMessage({ type: "error", text: data.error }); return; }
        setTempPwd(data.tempPassword);
        setMessage({ type: "success", text: `Mentor account created — ID: ${data.mentorNumber} (auto-verified)` });
        form.reset(); onRefresh();
      } else {
        const pwd = Math.random().toString(36).slice(-8) + "A1!";
        const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: d.get("name"), email: d.get("email"), password: pwd, role, organisation: d.get("organisation") || undefined, phone: d.get("phone") || undefined, degree: d.get("degree") || undefined, gradYear: d.get("gradYear") || undefined }),
        });
        const data = await res.json();
        if (!res.ok) { setMessage({ type: "error", text: data.error }); return; }
        setTempPwd(pwd);
        setMessage({ type: "success", text: `${role} account created for ${data.name}` });
        form.reset(); onRefresh();
      }
    } catch { setMessage({ type: "error", text: "Failed to create user" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div><h2 className={`${syne} font-bold text-xl`}>Add User</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Create any type of user account</p></div>

      <div className="flex gap-2 flex-wrap">
        {["STUDENT", "HR", "ORG", "INSTITUTION", "MENTOR", "ADMIN"].map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`px-4 py-2 rounded-xl text-xs ${syne} font-bold`} style={{ background: role === r ? "var(--ink)" : "white", color: role === r ? "var(--primary)" : "var(--muted)", border: role === r ? "none" : "1px solid var(--border)" }}>{r}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 space-y-5" style={{ borderColor: "var(--border)" }}>
        {message && <div className={`rounded-xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}
        {tempPwd && (
          <div className="rounded-xl p-4 border" style={{ background: "var(--primary-light)", borderColor: "rgba(232,255,71,0.3)" }}>
            <div className={`${syne} font-bold text-sm mb-1`}>Temporary Password</div>
            <code className="text-base font-mono font-bold select-all">{tempPwd}</code>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Share with the user. Shown only once.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelClass}>Full Name *</label><input name="name" required placeholder="User's name" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={labelClass}>Email *</label><input name="email" type="email" required placeholder="user@email.com" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={labelClass}>Phone</label><input name="phone" placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>

          {(role === "HR" || role === "ORG" || role === "INSTITUTION") && (
            <div><label className={labelClass}>Organisation Name *</label><input name="organisation" required placeholder="Company/Institute name" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          )}

          {role === "STUDENT" && (
            <>
              <div><label className={labelClass}>Degree</label><select name="degree" className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>B.Tech/BE</option><option>BCA</option><option>B.Sc</option><option>BBA</option><option>MBA</option><option>MCA</option><option>Other</option></select></div>
              <div><label className={labelClass}>Graduation Year</label><select name="gradYear" className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>2024</option><option>2025</option><option>2026</option><option>2027</option></select></div>
            </>
          )}

          {role === "MENTOR" && (
            <>
              <div><label className={labelClass}>Current Company *</label><input name="currentCompany" required placeholder="e.g. TCS, Google" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Current Role *</label><input name="currentRole" required placeholder="e.g. Senior Analyst" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Years of Experience *</label><input name="yearsOfExperience" type="number" required min="1" placeholder="e.g. 5" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Compensation</label><select name="compensation" className={inputClass} style={{ borderColor: "var(--border)" }}><option value="PAID">Paid</option><option value="VOLUNTEER">Volunteer</option></select></div>
              <div className="md:col-span-2"><label className={labelClass}>Areas of Expertise</label><input name="areaOfExpertise" placeholder="Cybersecurity, Cloud, Data (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div className="md:col-span-2"><label className={labelClass}>LinkedIn URL</label><input name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/..." className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            </>
          )}
        </div>

        {role === "MENTOR" && (
          <div className="rounded-xl p-3 text-xs border" style={{ background: "rgba(34,197,94,0.05)", borderColor: "rgba(34,197,94,0.2)", color: "#16a34a" }}>
            Mentors added by admin are <strong>auto-verified</strong>. They can create events immediately.
          </div>
        )}

        <p className="text-xs" style={{ color: "var(--muted)" }}>Creating as: <strong className={syne}>{role}</strong>. A temporary password will be auto-generated.</p>
        <button type="submit" disabled={saving} className={`px-6 py-3 rounded-xl ${syne} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>{saving ? "Creating..." : `Create ${role} Account`}</button>
      </form>
    </div>
  );
}
