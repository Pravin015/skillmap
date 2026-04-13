"use client";
import { useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";
const roleBadge: Record<string, string> = {
  STUDENT: "bg-indigo-100 text-indigo-700",
  HR: "bg-cyan-100 text-cyan-700",
  ORG: "bg-emerald-100 text-emerald-700",
  ADMIN: "bg-red-100 text-red-700",
};

interface User { id: string; name: string; email: string; role: string; organisation: string | null; createdAt: string }

export default function UserManagement({ users, onRefresh }: { users: User[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [resetPwd, setResetPwd] = useState<{ id: string; pwd: string } | null>(null);

  const filtered = users.filter((u) => {
    if (filter !== "ALL" && u.role !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
    onRefresh();
  }

  async function handleResetPassword(userId: string) {
    if (!confirm("Reset this user's password?")) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "resetPassword" }),
    });
    const data = await res.json();
    if (data.newPassword) setResetPwd({ id: userId, pwd: data.newPassword });
  }

  async function handleChangeRole(userId: string, newRole: string) {
    if (!confirm(`Change role to ${newRole}?`)) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "changeRole", newRole }),
    });
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>User Management</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{users.length} total users on the platform</p>
      </div>

      {/* Search + filters */}
      <div className="flex gap-3 flex-wrap">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="flex-1 min-w-[200px] rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
        {["ALL", "STUDENT", "MENTOR", "HR", "ORG", "INSTITUTION", "ADMIN"].map((r) => (
          <button key={r} onClick={() => setFilter(r)} className={`px-4 py-2 rounded-xl text-xs ${syne} font-bold`} style={{ background: filter === r ? "var(--ink)" : "white", color: filter === r ? "var(--primary)" : "var(--muted)", border: filter === r ? "none" : "1px solid var(--border)" }}>
            {r === "ALL" ? "All" : r} {r !== "ALL" && `(${users.filter((u) => u.role === r).length})`}
          </button>
        ))}
      </div>

      {resetPwd && (
        <div className="rounded-xl p-4 border" style={{ background: "var(--primary-light)", borderColor: "rgba(232,255,71,0.3)" }}>
          <div className={`${syne} font-bold text-sm mb-1`}>New password generated:</div>
          <code className="text-base font-mono font-bold select-all">{resetPwd.pwd}</code>
          <button onClick={() => setResetPwd(null)} className="ml-4 text-xs underline" style={{ color: "var(--muted)" }}>Dismiss</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 hidden md:table-cell">Organisation</th>
                <th className="px-4 py-3 hidden sm:table-cell">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className={`${syne} font-bold text-sm`}>{u.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value)} className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border-none cursor-pointer ${roleBadge[u.role] || ""}`}>
                      {["STUDENT", "MENTOR", "HR", "ORG", "INSTITUTION", "ADMIN"].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: "var(--muted)" }}>{u.organisation || "—"}</td>
                  <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => handleResetPassword(u.id)} className="text-[0.65rem] font-medium px-2 py-1 rounded-lg border hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Reset Pwd</button>
                      {u.role !== "ADMIN" && (
                        <button onClick={() => handleDelete(u.id, u.name)} className="text-[0.65rem] font-medium px-2 py-1 rounded-lg text-red-500 border border-red-200 hover:bg-red-50">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No users match your filters</div>
        )}
      </div>
    </div>
  );
}
