"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface LeaderboardEntry {
  rank: number; userId: string; name: string; email: string; college: string;
  score: number; submittedAt: string; submissionUrl: string | null;
}

const podiumColors = ["#f59e0b", "#94a3b8", "#cd7f32"]; // gold, silver, bronze

export default function LeaderboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [competition, setCompetition] = useState<{ title: string; type: string; hiringEnabled: boolean } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/competitions/${slug}/leaderboard`)
      .then((r) => r.json())
      .then((d) => { setCompetition(d.competition); setLeaderboard(d.leaderboard || []); setLoading(false); });
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <section style={{ background: "var(--ink)" }}>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Link href={`/competitions/${slug}`} className="text-xs no-underline mb-3 inline-block" style={{ color: "rgba(255,255,255,0.5)" }}>← Back to competition</Link>
          <h1 className={`${syne} text-2xl font-bold text-white`}>🏅 Leaderboard</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{competition?.title}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Podium */}
        {leaderboard.length >= 3 && (
          <div className="flex justify-center items-end gap-4 mb-8">
            {[1, 0, 2].map((idx) => {
              const entry = leaderboard[idx];
              if (!entry) return null;
              const heights = [160, 200, 130];
              return (
                <div key={entry.userId} className="text-center">
                  <div className={`${syne} font-bold text-sm mb-2`} style={{ color: "var(--ink)" }}>{entry.name}</div>
                  <div className="text-xs mb-2" style={{ color: "var(--muted)" }}>{entry.score} pts</div>
                  <div className="rounded-t-xl flex items-end justify-center pb-3" style={{ background: podiumColors[idx], width: 100, height: heights[idx] }}>
                    <span className={`${syne} text-2xl font-extrabold text-white`}>{idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Table */}
        {leaderboard.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--muted)" }}>No submissions yet</p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  <th className="px-4 py-3 w-16">Rank</th>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3 hidden sm:table-cell">College</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3 hidden md:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {leaderboard.map((entry) => (
                  <tr key={entry.userId} className={`hover:bg-gray-50 ${entry.rank <= 3 ? "font-medium" : ""}`}>
                    <td className="px-4 py-3">
                      <span className={`${syne} text-sm font-bold`} style={{ color: entry.rank <= 3 ? podiumColors[entry.rank - 1] : "var(--muted)" }}>
                        {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`${syne} text-sm font-bold`} style={{ color: "var(--ink)" }}>{entry.name}</div>
                      <div className="text-[10px]" style={{ color: "var(--muted)" }}>{entry.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted)" }}>{entry.college || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`${syne} text-sm font-bold`} style={{ color: entry.score >= 70 ? "#10b981" : entry.score >= 40 ? "#f59e0b" : "#ef4444" }}>{entry.score}</span>
                    </td>
                    <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: "var(--muted)" }}>{new Date(entry.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
