"use client";
import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

interface User { id: string; name: string; email: string; role: string; organisation: string | null; createdAt: string }

export default function StudentsTab({ users }: { users: User[] }) {
  const students = users.filter((u) => u.role === "STUDENT");

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>All Students</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{students.length} registered students</p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🎓</div>
          <p className={`${syne} font-bold text-base mb-1`}>No students yet</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className={`${syne} font-bold text-sm`}>{s.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted)" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link href="#" className={`text-[0.7rem] ${syne} font-bold no-underline px-2.5 py-1 rounded-lg`} style={{ background: "var(--ink)", color: "var(--accent)" }}>View</Link>
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
