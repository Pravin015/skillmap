"use client";
import { useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface User { id: string; name: string; email: string; role: string; organisation: string | null; createdAt: string }

export default function StudentsTab({ users, onRefresh }: { users: User[]; onRefresh?: () => void }) {
  const students = users.filter((u) => u.role === "STUDENT");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  async function resetPassword(userId: string, name: string) {
    if (!confirm(`Reset password for ${name}?`)) return;
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "reset-password" }) });
    const data = await res.json();
    if (res.ok) setMsg(`New password for ${name}: ${data.newPassword}`);
    else setMsg("Failed to reset password");
    setTimeout(() => setMsg(""), 10000);
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    onRefresh?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${syne} font-bold text-xl`}>All Students</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{students.length} registered students</p>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="rounded-xl border px-3 py-2 text-xs outline-none w-48" style={{ borderColor: "var(--border)" }} />
      </div>

      {msg && <div className="rounded-xl p-3 text-xs font-mono" style={{ background: "rgba(232,255,71,0.15)", color: "var(--ink)" }}>{msg} <button onClick={() => setMsg("")} className="ml-2 underline text-[10px]" style={{ color: "var(--muted)" }}>dismiss</button></div>}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🎓</div>
          <p className={`${syne} font-bold text-base mb-1`}>{search ? "No students match your search" : "No students yet"}</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className={`${syne} font-bold text-sm`}>{s.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted)" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <a href={`/profile/${s.id}`} target="_blank" className={`text-[10px] ${syne} font-bold no-underline px-2 py-1 rounded-lg`} style={{ background: "var(--ink)", color: "var(--accent)" }}>View ↗</a>
                        <button onClick={() => resetPassword(s.id, s.name)} className="text-[10px] px-2 py-1 rounded-lg border hover:bg-gray-100" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Reset Pwd</button>
                        <button onClick={() => deleteUser(s.id, s.name)} className="text-[10px] px-2 py-1 rounded-lg border hover:bg-red-50" style={{ borderColor: "var(--border)", color: "#ef4444" }}>Delete</button>
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
