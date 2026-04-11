"use client";

const syne = "font-[family-name:var(--font-syne)]";

interface User { id: string; name: string; email: string; role: string; organisation: string | null; createdAt: string }

export default function HRsTab({ users }: { users: User[] }) {
  const hrs = users.filter((u) => u.role === "HR");

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>All HR Accounts</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{hrs.length} HRs across all organisations</p>
      </div>

      {hrs.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">👥</div>
          <p className={`${syne} font-bold text-base mb-1`}>No HR accounts yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>HRs are created by organisations from the Company Dashboard</p>
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
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {hrs.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className={`${syne} font-bold text-sm`}>{h.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{h.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{h.organisation || "—"}</td>
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted)" }}>{new Date(h.createdAt).toLocaleDateString()}</td>
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
