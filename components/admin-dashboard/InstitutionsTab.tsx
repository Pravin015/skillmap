"use client";
import { useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface User { id: string; name: string; email: string; role: string; organisation: string | null; createdAt: string }

export default function InstitutionsTab({ users, onRefresh }: { users: User[]; onRefresh?: () => void }) {
  const institutions = users.filter((u) => u.role === "INSTITUTION");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  const filtered = institutions.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || (i.organisation || "").toLowerCase().includes(q);
  });

  async function resetPassword(userId: string, name: string) {
    if (!confirm(`Reset password for ${name}?`)) return;
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "reset-password" }) });
    const data = await res.json();
    if (res.ok) setMsg(`New password for ${name}: ${data.newPassword}`);
    setTimeout(() => setMsg(""), 10000);
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete institution ${name}? This cannot be undone.`)) return;
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    onRefresh?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`${syne} font-bold text-xl`}>Institutions</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{institutions.length} registered institutions</p>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search institutions..." className="rounded-xl border px-3 py-2 text-xs outline-none w-48" style={{ borderColor: "var(--border)" }} />
      </div>

      {msg && <div className="rounded-xl p-3 text-xs font-mono" style={{ background: "rgba(232,255,71,0.15)", color: "var(--ink)" }}>{msg} <button onClick={() => setMsg("")} className="ml-2 underline text-[10px]" style={{ color: "var(--muted)" }}>dismiss</button></div>}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🏫</div>
          <p className={`${syne} font-bold text-base mb-1`}>{search ? "No institutions match" : "No institutions registered"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inst) => (
            <div key={inst.id} className="rounded-2xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${syne} font-extrabold text-lg text-white shrink-0`} style={{ background: "var(--ink)" }}>{(inst.organisation || inst.name).charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className={`${syne} font-bold`}>{inst.organisation || inst.name}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{inst.email}</div>
              </div>
              <div className="text-xs hidden sm:block" style={{ color: "var(--muted)" }}>Joined {new Date(inst.createdAt).toLocaleDateString()}</div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => resetPassword(inst.id, inst.name)} className="text-[10px] px-2 py-1 rounded-lg border hover:bg-gray-100" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Reset Pwd</button>
                <button onClick={() => deleteUser(inst.id, inst.name)} className="text-[10px] px-2 py-1 rounded-lg border hover:bg-red-50" style={{ borderColor: "var(--border)", color: "#ef4444" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
