"use client";
import { useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";

interface HR { id: string; name: string; email: string; phone: string | null; createdAt: string }

interface Props {
  hrs: HR[];
  onRefresh: () => void;
}

export default function ManageHR({ hrs, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [resetPwd, setResetPwd] = useState<{ hrId: string; pwd: string } | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/company/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: data.error }); return; }
      setTempPassword(data.tempPassword);
      setMessage({ type: "success", text: `HR account created for ${data.hr.name}` });
      setName(""); setEmail(""); setPhone("");
      onRefresh();
    } catch { setMessage({ type: "error", text: "Failed to create HR" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(hrId: string, hrName: string) {
    if (!confirm(`Delete HR account for ${hrName}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/company/hr?id=${hrId}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } catch { /* ignore */ }
  }

  async function handleResetPassword(hrId: string) {
    if (!confirm("Reset password for this HR? They will need the new password to log in.")) return;
    try {
      const res = await fetch("/api/company/hr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hrId }),
      });
      const data = await res.json();
      if (res.ok) setResetPwd({ hrId, pwd: data.newPassword });
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${syne} font-bold text-xl`}>Manage HR Accounts</h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Add, remove, or reset passwords for your HR team</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className={`px-4 py-2.5 rounded-xl ${syne} font-bold text-sm`} style={{ background: "var(--primary)", color: "white" }}>
          {showAdd ? "Cancel" : "+ Add HR"}
        </button>
      </div>

      {/* Add HR form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <h3 className={`${syne} font-bold text-base mb-4`}>Add New HR</h3>

          {message && (
            <div className={`rounded-xl p-3 text-sm mb-4 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          )}
          {tempPassword && (
            <div className="rounded-xl p-4 mb-4 border" style={{ background: "var(--primary-light)", borderColor: "rgba(232,255,71,0.3)" }}>
              <div className={`${syne} font-bold text-sm mb-1`}>Temporary Password (share with HR)</div>
              <code className="text-base font-mono font-bold select-all">{tempPassword}</code>
              <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>This password is shown only once. Copy it now and share it securely with the HR.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="HR's full name" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="hr@company.com" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>A temporary password will be generated. Share it with the HR so they can log in.</p>
          <button type="submit" disabled={saving} className={`mt-4 px-5 py-2.5 rounded-xl ${syne} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
            {saving ? "Creating..." : "Create HR Account"}
          </button>
        </form>
      )}

      {/* HR list */}
      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h3 className={`${syne} font-bold`}>Your HR Team</h3>
          <span className={`${syne} text-xs font-bold px-2 py-1 rounded-lg`} style={{ background: "var(--primary)", color: "white" }}>{hrs.length}</span>
        </div>

        {hrs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className={`${syne} font-bold text-base mb-1`}>No HR accounts yet</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Add your first HR to start managing job posts and candidates</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {hrs.map((hr) => (
              <div key={hr.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${syne} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>
                  {hr.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`${syne} font-bold text-sm`}>{hr.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{hr.email}</div>
                </div>
                <div className="text-xs hidden sm:block" style={{ color: "var(--muted)" }}>
                  Added {new Date(hr.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleResetPassword(hr.id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                  >
                    Reset Pwd
                  </button>
                  <button
                    onClick={() => handleDelete(hr.id, hr.name)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-500 border border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
                {resetPwd?.hrId === hr.id && (
                  <div className="absolute right-4 mt-16 rounded-xl p-3 border shadow-lg bg-white z-10" style={{ borderColor: "var(--border)" }}>
                    <div className="text-xs font-bold mb-1">New password:</div>
                    <code className="text-sm font-mono select-all">{resetPwd.pwd}</code>
                    <button onClick={() => setResetPwd(null)} className="block text-xs text-gray-400 mt-1">Dismiss</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
