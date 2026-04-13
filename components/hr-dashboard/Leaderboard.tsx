"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Competition { id: string; title: string; slug: string; type: string; status: string; _count: { participants: number; submissions: number } }

export default function Leaderboard() {
  const [comps, setComps] = useState<Competition[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [leaderboard, setLeaderboard] = useState<{ rank: number; name: string; score: number; college: string; submittedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => {
    fetch("/api/competitions?mine=true").then((r) => r.json()).then((d) => { setComps(d.competitions || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedSlug) { setLeaderboard([]); return; }
    setLbLoading(true);
    fetch(`/api/competitions/${selectedSlug}/leaderboard`).then((r) => r.json()).then((d) => { setLeaderboard(d.leaderboard || []); setLbLoading(false); });
  }, [selectedSlug]);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Competition Leaderboards</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>View rankings for your competitions</p>
      </div>

      {comps.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-2">🏅</div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No competitions created yet. Create one from the Hackathon tab.</p>
        </div>
      ) : (
        <>
          <select value={selectedSlug} onChange={(e) => setSelectedSlug(e.target.value)} className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }}>
            <option value="">Select a competition...</option>
            {comps.map((c) => <option key={c.slug} value={c.slug}>{c.title} ({c.status} · {c._count.submissions} submissions)</option>)}
          </select>

          {lbLoading && <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>}

          {selectedSlug && !lbLoading && leaderboard.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>No submissions yet for this competition</p>
            </div>
          )}

          {leaderboard.length > 0 && (
            <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    <th className="px-4 py-3 w-16">Rank</th>
                    <th className="px-4 py-3">Participant</th>
                    <th className="px-4 py-3 hidden sm:table-cell">College</th>
                    <th className="px-4 py-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {leaderboard.map((e) => (
                    <tr key={e.rank} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><span className={`${syne} text-sm font-bold`} style={{ color: e.rank <= 3 ? ["#f59e0b", "#94a3b8", "#cd7f32"][e.rank - 1] : "var(--muted)" }}>{e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : `#${e.rank}`}</span></td>
                      <td className="px-4 py-3"><span className={`${syne} text-sm font-bold`} style={{ color: "var(--ink)" }}>{e.name}</span></td>
                      <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted)" }}>{e.college || "—"}</td>
                      <td className="px-4 py-3"><span className={`${syne} text-sm font-bold`} style={{ color: e.score >= 70 ? "#10b981" : "#f59e0b" }}>{e.score}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
