"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Competition {
  id: string; title: string; slug: string; description: string; type: string;
  difficulty: string; domain: string | null; companyName: string | null;
  prizes: string | null; status: string; entryFee: number | null;
  registrationStart: string; registrationEnd: string; startDate: string; endDate: string;
  maxParticipants: number; teamSize: number;
  _count: { participants: number; submissions: number };
}

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  HACKATHON: { label: "Hackathon", color: "#8b5cf6", icon: "🏆" },
  CODING: { label: "Coding Challenge", color: "#3b82f6", icon: "💻" },
  QUIZ: { label: "Quiz", color: "#10b981", icon: "❓" },
  CASE_STUDY: { label: "Case Study", color: "#f59e0b", icon: "📊" },
};

const diffColors: Record<string, string> = { EASY: "#10b981", MEDIUM: "#f59e0b", HARD: "#ef4444" };
const statusColors: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "#10b981" },
  LIVE: { label: "Live Now", color: "#ef4444" },
  JUDGING: { label: "Judging", color: "#f59e0b" },
  COMPLETED: { label: "Completed", color: "#6b7280" },
};

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter !== "ALL") params.set("type", typeFilter);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    fetch(`/api/competitions?${params}`)
      .then((r) => r.json())
      .then((d) => { setCompetitions(d.competitions || []); setLoading(false); });
  }, [typeFilter, statusFilter]);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section style={{ background: "var(--ink)" }}>
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold mb-4" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            🏆 Compete & Get Hired
          </div>
          <h1 className={`${syne} text-2xl md:text-4xl font-extrabold text-white mb-3`}>
            Competitions & Hiring Challenges
          </h1>
          <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Participate in hackathons, coding challenges, quizzes, and case studies. Win prizes and get hired directly by top companies.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap gap-4">
          <div className="flex gap-1.5">
            {["ALL", "HACKATHON", "CODING", "QUIZ", "CASE_STUDY"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all" style={{ background: typeFilter === t ? "var(--ink)" : "white", color: typeFilter === t ? "var(--primary)" : "var(--muted)", borderColor: typeFilter === t ? "var(--ink)" : "var(--border)" }}>
                {t === "ALL" ? "All Types" : typeConfig[t]?.label || t}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {["ALL", "OPEN", "LIVE", "COMPLETED"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all" style={{ background: statusFilter === s ? "var(--ink)" : "white", color: statusFilter === s ? "var(--primary)" : "var(--muted)", borderColor: statusFilter === s ? "var(--ink)" : "var(--border)" }}>
                {s === "ALL" ? "All Status" : statusColors[s]?.label || s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🏆</div>
            <p className={`${syne} font-bold text-base mb-1`}>No competitions found</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Check back soon for new challenges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitions.map((comp) => {
              const tc = typeConfig[comp.type] || { label: comp.type, color: "#6b7280", icon: "📌" };
              const sc = statusColors[comp.status];
              const isOpen = comp.status === "OPEN" || comp.status === "LIVE";
              return (
                <Link key={comp.id} href={`/competitions/${comp.slug}`} className="rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg no-underline" style={{ borderColor: "var(--border)" }}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tc.icon}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${tc.color}15`, color: tc.color }}>{tc.label}</span>
                    </div>
                    {sc && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${sc.color}15`, color: sc.color }}>
                        {comp.status === "LIVE" ? "● " : ""}{sc.label}
                      </span>
                    )}
                  </div>

                  {/* Title + Company */}
                  <h3 className={`${syne} text-sm font-bold mb-1`} style={{ color: "var(--ink)" }}>{comp.title}</h3>
                  {comp.companyName && <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>by {comp.companyName}</p>}

                  {/* Description */}
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--muted)" }}>{comp.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: `${diffColors[comp.difficulty]}15`, color: diffColors[comp.difficulty] }}>{comp.difficulty}</span>
                    {comp.domain && <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(0,0,0,0.05)", color: "var(--muted)" }}>{comp.domain}</span>}
                    {comp.teamSize > 1 && <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(0,0,0,0.05)", color: "var(--muted)" }}>Team of {comp.teamSize}</span>}
                    {comp.entryFee ? <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "#f59e0b15", color: "#f59e0b" }}>₹{comp.entryFee / 100}</span> : <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "#10b98115", color: "#10b981" }}>Free</span>}
                    {comp.prizes && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "#8b5cf615", color: "#8b5cf6" }}>🎁 Prizes</span>}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[10px] pt-3 border-t" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    <span>{comp._count.participants} participants</span>
                    <span>{isOpen ? `Ends ${new Date(comp.endDate).toLocaleDateString()}` : `Ended ${new Date(comp.endDate).toLocaleDateString()}`}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
