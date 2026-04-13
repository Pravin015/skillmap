"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const heading = "font-[family-name:var(--font-heading)]";

interface InterviewHistory {
  id: string;
  type: string;
  interviewType: string;
  difficulty: string;
  status: string;
  score: number | null;
  feedback: string | null;
  duration: number | null;
  questionsAsked: number | null;
  totalQuestions: number;
  createdAt: string;
  company: { name: string; slug: string; domain: string };
  responses: { question: string; answer: string; aiFeedback: string | null; score: number | null; order: number }[];
}

interface Stats {
  total: number;
  completed: number;
  avgScore: number;
  bestScore: number;
}

const difficultyColors: Record<string, string> = { EASY: "#10b981", MEDIUM: "#f59e0b", HARD: "#ef4444" };
const statusLabels: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6" },
  COMPLETED: { label: "Completed", color: "#10b981" },
  ABANDONED: { label: "Abandoned", color: "#6b7280" },
};

export default function HistoryPage() {
  const { data: session } = useSession();
  const [interviews, setInterviews] = useState<InterviewHistory[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, avgScore: 0, bestScore: 0 });
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetchHistory();
  }, [session, filter]);

  async function fetchHistory() {
    setLoading(true);
    const params = filter !== "ALL" ? `?type=${filter}` : "";
    const res = await fetch(`/api/mock-interviews/history${params}`);
    const data = await res.json();
    setInterviews(data.interviews || []);
    setStats(data.stats || { total: 0, completed: 0, avgScore: 0, bestScore: 0 });
    setLoading(false);
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Please login to view your interview history.</p>
          <Link href="/auth/login" className="rounded-xl px-6 py-2.5 text-sm font-bold no-underline" style={{ background: "var(--primary)", color: "white" }}>
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <section style={{ background: "var(--ink)" }}>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Link href="/mock-interview" className="text-xs no-underline mb-3 inline-block" style={{ color: "rgba(255,255,255,0.5)" }}>
            ← Back to Mock Interviews
          </Link>
          <h1 className={`${heading} text-xl md:text-2xl font-bold text-white mb-4`}>Interview History</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Sessions", value: stats.total },
              { label: "Completed", value: stats.completed },
              { label: "Avg Score", value: `${stats.avgScore}/100` },
              { label: "Best Score", value: `${stats.bestScore}/100` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className={`${heading} text-lg font-bold text-white`}>{s.value}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {["ALL", "AI", "SELF"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full px-4 py-1.5 text-xs font-medium border transition-all"
              style={{
                background: filter === f ? "var(--ink)" : "white",
                color: filter === f ? "var(--primary)" : "var(--ink)",
                borderColor: filter === f ? "var(--ink)" : "var(--border)",
              }}
            >
              {f === "ALL" ? "All" : f === "AI" ? "AI Interviews" : "Self Practice"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>No interview sessions yet.</p>
            <Link href="/mock-interview" className="rounded-xl px-6 py-2.5 text-sm font-bold no-underline" style={{ background: "var(--primary)", color: "white" }}>
              Start Practicing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map((interview) => {
              const isExpanded = expandedId === interview.id;
              const status = statusLabels[interview.status] || { label: interview.status, color: "#6b7280" };
              return (
                <div key={interview.id} className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : interview.id)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: "var(--ink)" }}>
                      {interview.company.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>{interview.company.name}</span>
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ background: `${status.color}15`, color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px]" style={{ color: "var(--muted)" }}>
                        <span>{interview.interviewType.replace("_", " ")}</span>
                        <span className="rounded-full px-1.5 py-0.5" style={{ background: `${difficultyColors[interview.difficulty]}15`, color: difficultyColors[interview.difficulty] }}>
                          {interview.difficulty}
                        </span>
                        <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                        {interview.duration && <span>{interview.duration} min</span>}
                      </div>
                    </div>
                    {interview.score != null && (
                      <div className="text-right shrink-0">
                        <div className={`${heading} text-lg font-bold`} style={{ color: interview.score >= 70 ? "#10b981" : interview.score >= 40 ? "#f59e0b" : "#ef4444" }}>
                          {interview.score}
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--muted)" }}>/100</div>
                      </div>
                    )}
                    <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border)" }}>
                      {interview.feedback && (
                        <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                          <strong style={{ color: "var(--ink)" }}>AI Summary:</strong> {interview.feedback}
                        </div>
                      )}
                      {interview.responses.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {interview.responses.map((r, i) => (
                            <div key={i} className="rounded-lg border p-3 text-xs" style={{ borderColor: "var(--border)" }}>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium" style={{ color: "var(--ink)" }}>Q{r.order + 1}: {r.question.slice(0, 80)}{r.question.length > 80 ? "..." : ""}</span>
                                {r.score != null && (
                                  <span className="font-bold" style={{ color: r.score >= 7 ? "#10b981" : r.score >= 4 ? "#f59e0b" : "#ef4444" }}>
                                    {r.score}/10
                                  </span>
                                )}
                              </div>
                              <p style={{ color: "var(--muted)" }}>
                                <strong>Answer:</strong> {r.answer.slice(0, 150)}{r.answer.length > 150 ? "..." : ""}
                              </p>
                              {r.aiFeedback && (
                                <p className="mt-1" style={{ color: "var(--muted)" }}>
                                  <strong>Feedback:</strong> {r.aiFeedback}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
