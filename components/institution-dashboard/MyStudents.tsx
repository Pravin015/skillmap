"use client";
import { useState } from "react";
import Link from "next/link";
const syne = "font-[family-name:var(--font-syne)]";

interface Student {
  profileNumber: string; profileScore: number; fieldOfInterest: string | null; collegeName: string | null;
  userId: string; applicationCount: number;
  user: { id: string; name: string; email: string; degree: string | null; gradYear: string | null; createdAt: string };
}

export default function MyStudents({ students, onRefresh, onNavigate }: { students: Student[]; onRefresh: () => void; onNavigate: (tab: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = students.filter((s) => !search || s.user.name.toLowerCase().includes(search.toLowerCase()) || s.user.email.toLowerCase().includes(search.toLowerCase()));
  const scoreColor = (s: number) => s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Remove ${name} from your institution? This deletes their account.`)) return;
    await fetch(`/api/institution/students?id=${userId}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`${syne} font-bold text-xl`}>My Students</h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{students.length} students enrolled</p>
        </div>
        <button onClick={() => onNavigate("add-student")} className={`px-4 py-2.5 rounded-xl ${syne} font-bold text-sm`} style={{ background: "var(--ink)", color: "var(--accent)" }}>+ Add Student</button>
      </div>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🎓</div>
          <p className={`${syne} font-bold text-base mb-1`}>{students.length === 0 ? "No students yet" : "No results"}</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{students.length === 0 ? "Add your first student to get started" : "Try a different search"}</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((s) => (
              <div key={s.userId} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${syne} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>
                  {s.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`${syne} font-bold text-sm`}>{s.user.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{s.user.email} · {s.user.degree || "—"} · {s.user.gradYear || "—"}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{s.fieldOfInterest || "No domain set"} · {s.applicationCount} applications</div>
                </div>
                <div className="text-center shrink-0 hidden sm:block">
                  <div className={`${syne} text-lg font-extrabold`} style={{ color: scoreColor(s.profileScore) }}>{s.profileScore}</div>
                  <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>Score</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/profile/${s.profileNumber}`} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem] no-underline`} style={{ background: "var(--ink)", color: "var(--accent)" }}>View</Link>
                  <button onClick={() => handleDelete(s.userId, s.user.name)} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium text-red-500 border border-red-200 hover:bg-red-50">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
