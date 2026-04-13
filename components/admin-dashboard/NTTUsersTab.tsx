"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

const NTT_DOMAINS = ["@nttdata.com", "@ntt.com", "@ntt.in"];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organisation: string | null;
  createdAt: string;
}

const roleBadge: Record<string, string> = {
  STUDENT: "bg-indigo-100 text-indigo-700",
  MENTOR: "bg-amber-100 text-amber-700",
  HR: "bg-cyan-100 text-cyan-700",
  ORG: "bg-emerald-100 text-emerald-700",
  INSTITUTION: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
};

export default function NTTUsersTab({ users }: { users: User[] }) {
  const [nttUsers, setNttUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    const filtered = users.filter((u) =>
      NTT_DOMAINS.some((domain) => u.email.toLowerCase().endsWith(domain))
    );
    setNttUsers(filtered);
  }, [users]);

  const displayed = nttUsers.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const roleCounts = {
    ALL: nttUsers.length,
    STUDENT: nttUsers.filter((u) => u.role === "STUDENT").length,
    HR: nttUsers.filter((u) => u.role === "HR").length,
    MENTOR: nttUsers.filter((u) => u.role === "MENTOR").length,
    ORG: nttUsers.filter((u) => u.role === "ORG").length,
  };

  // Domain breakdown
  const domainBreakdown = NTT_DOMAINS.map((d) => ({
    domain: d,
    count: nttUsers.filter((u) => u.email.toLowerCase().endsWith(d)).length,
  }));

  async function handleRoleChange(userId: string, newRole: string) {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setActionMsg("Role updated successfully");
        // Update locally
        setNttUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
        setTimeout(() => setActionMsg(""), 3000);
      }
    } catch { setActionMsg("Failed to update role"); }
  }

  async function handleResetPassword(userId: string, userName: string) {
    if (!confirm(`Reset password for ${userName}?`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reset-password" }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(`New password for ${userName}: ${data.newPassword}`);
      }
    } catch { setActionMsg("Failed to reset password"); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0072C6" }}>
            NTT
          </div>
          <div>
            <h2 className={`${syne} font-bold text-xl`}>NTT Users</h2>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Manage users from @nttdata.com, @ntt.com, @ntt.in
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
          <div className={`${syne} text-2xl font-bold`} style={{ color: "#0072C6" }}>{nttUsers.length}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>Total NTT Users</div>
        </div>
        {domainBreakdown.map((d) => (
          <div key={d.domain} className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
            <div className={`${syne} text-2xl font-bold`} style={{ color: "var(--ink)" }}>{d.count}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>{d.domain}</div>
          </div>
        ))}
      </div>

      {/* Action Message */}
      {actionMsg && (
        <div className="rounded-xl p-3 text-sm font-mono" style={{ background: "rgba(232,255,71,0.2)", color: "var(--ink)" }}>
          {actionMsg}
          <button onClick={() => setActionMsg("")} className="ml-3 text-xs underline" style={{ color: "var(--muted)" }}>dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search NTT users by name or email..."
          className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={{ borderColor: "var(--border)" }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(roleCounts).map(([role, count]) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all"
              style={{
                background: roleFilter === role ? "var(--ink)" : "white",
                color: roleFilter === role ? "var(--accent)" : "var(--ink)",
                borderColor: roleFilter === role ? "var(--ink)" : "var(--border)",
              }}
            >
              {role === "ALL" ? "All" : role} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {displayed.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🏢</div>
          <p className={`${syne} font-bold text-base mb-1`}>No NTT users found</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Users signing up with @nttdata.com, @ntt.com, or @ntt.in emails will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3 hidden md:table-cell">Domain</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {displayed.map((u) => {
                  const domain = NTT_DOMAINS.find((d) => u.email.toLowerCase().endsWith(d)) || "";
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className={`${syne} font-bold text-sm`}>{u.name}</div>
                        <div className="text-xs" style={{ color: "var(--muted)" }}>{u.email}</div>
                        {u.organisation && <div className="text-[10px]" style={{ color: "var(--muted)" }}>{u.organisation}</div>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "#0072C615", color: "#0072C6" }}>
                          {domain}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border-none ${roleBadge[u.role] || "bg-gray-100 text-gray-700"}`}
                        >
                          {["STUDENT", "HR", "ORG", "MENTOR", "ADMIN"].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted)" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleResetPassword(u.id, u.name)}
                          className="text-[10px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-gray-100"
                          style={{ color: "var(--muted)" }}
                        >
                          Reset Pwd
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
