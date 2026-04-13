"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface MockStat {
  id: string; userId: string; userName: string; companyName: string;
  interviewType: string; difficulty: string; status: string; score: number | null;
  totalQuestions: number; createdAt: string;
}

export default function MockInterviewStats() {
  const [interviews, setInterviews] = useState<MockStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/mock-stats").then((r) => r.json()).then((d) => { setInterviews(d.interviews || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const completed = interviews.filter((i) => i.status === "COMPLETED");
  const avgScore = completed.length > 0 ? Math.round(completed.reduce((s, i) => s + (i.score || 0), 0) / completed.length) : 0;

  // Popular companies
  const companyMap = new Map<string, number>();
  interviews.forEach((i) => companyMap.set(i.companyName, (companyMap.get(i.companyName) || 0) + 1));
  const topCompanies = [...companyMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Mock Interview Statistics</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{interviews.length} total sessions</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Sessions", value: interviews.length, color: "#3b82f6" },
          { label: "Completed", value: completed.length, color: "#10b981" },
          { label: "Avg Score", value: `${avgScore}/100`, color: avgScore >= 70 ? "#10b981" : "#f59e0b" },
          { label: "In Progress", value: interviews.filter((i) => i.status === "IN_PROGRESS").length, color: "#8b5cf6" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
            <div className={`${syne} text-xl font-bold`} style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Popular Companies */}
      {topCompanies.length > 0 && (
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
          <h3 className={`${syne} text-sm font-bold mb-3`}>Most Practiced Companies</h3>
          <div className="space-y-2">
            {topCompanies.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-sm font-medium flex-1" style={{ color: "var(--ink)" }}>{name}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(count / topCompanies[0][1]) * 100}%`, background: "var(--ink)" }} />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: "var(--muted)" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className={`${syne} text-sm font-bold`}>Recent Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-[10px] font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2 hidden sm:table-cell">Type</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2 hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {interviews.slice(0, 20).map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs font-medium" style={{ color: "var(--ink)" }}>{i.userName}</td>
                  <td className="px-4 py-2 text-xs" style={{ color: "var(--muted)" }}>{i.companyName}</td>
                  <td className="px-4 py-2 text-[10px] hidden sm:table-cell" style={{ color: "var(--muted)" }}>{i.interviewType} · {i.difficulty}</td>
                  <td className="px-4 py-2">
                    {i.status === "COMPLETED" ? (
                      <span className="text-xs font-bold" style={{ color: (i.score || 0) >= 70 ? "#10b981" : (i.score || 0) >= 40 ? "#f59e0b" : "#ef4444" }}>{i.score}/100</span>
                    ) : (
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>{i.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[10px] hidden sm:table-cell" style={{ color: "var(--muted)" }}>{new Date(i.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
