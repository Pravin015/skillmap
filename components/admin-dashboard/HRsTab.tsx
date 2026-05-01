"use client";
import { useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";

interface User { id: string; name: string; email: string; role: string; organisation: string | null; createdAt: string }

export default function HRsTab({ users, onRefresh }: { users: User[]; onRefresh?: () => void }) {
  const hrs = users.filter((u) => u.role === "HR");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  const filtered = hrs.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.email.toLowerCase().includes(q) || (h.organisation || "").toLowerCase().includes(q);
  });

  // Group by org
  const orgCounts = new Map<string, number>();
  hrs.forEach((h) => { const org = h.organisation || "No Org"; orgCounts.set(org, (orgCounts.get(org) || 0) + 1); });

  async function resetPassword(userId: string, name: string) {
    if (!confirm(`Reset password for ${name}?`)) return;
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "reset-password" }) });
    const data = await res.json();
    if (res.ok) setMsg(`New password for ${name}: ${data.newPassword}`);
    setTimeout(() => setMsg(""), 10000);
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete HR account ${name}? This cannot be undone.`)) return;
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    onRefresh?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`${heading} font-bold text-xl`}>All HR Accounts</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{hrs.length} HRs across {orgCounts.size} organisations</p>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or org..." className="rounded-xl border px-3 py-2 text-xs outline-none w-56" style={{ borderColor: "var(--border)" }} />
      </div>

      {msg && <div className="rounded-xl p-3 text-xs font-mono" style={{ background: "var(--primary-light)", color: "var(--ink)" }}>{msg} <button onClick={() => setMsg("")} className="ml-2 underline text-[10px]" style={{ color: "var(--muted)" }}>dismiss</button></div>}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">👥</div>
          <p className={`${heading} font-bold text-base mb-1`}>{search ? "No HRs match your search" : "No HR accounts yet"}</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  <th className="px-4 py-3">HR</th>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {filtered.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className={`${heading} font-bold text-sm`}>{h.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{h.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{h.organisation || "—"}</td>
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted)" }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => resetPassword(h.id, h.name)} className="text-[10px] px-2 py-1 rounded-lg border hover:bg-gray-100" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Reset Pwd</button>
                        <button onClick={() => deleteUser(h.id, h.name)} className="text-[10px] px-2 py-1 rounded-lg border hover:bg-red-50" style={{ borderColor: "var(--border)", color: "#ef4444" }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
