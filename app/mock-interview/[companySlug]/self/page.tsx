"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Question {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  sampleAnswer: string | null;
  tips: string | null;
  tags: string[];
  order: number;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string;
}

const difficultyColors: Record<string, string> = {
  EASY: "#10b981",
  MEDIUM: "#f59e0b",
  HARD: "#ef4444",
};

function SelfPrepContent({ companySlug }: { companySlug: string }) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [company, setCompany] = useState<Company | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [practiced, setPracticed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/mock-interviews/companies/${companySlug}`)
      .then((r) => r.json())
      .then((d) => {
        setCompany(d.company);
        const qs = d.company?.questions || [];
        setAllQuestions(qs);
        setLoading(false);
      });
  }, [companySlug]);

  const categories = [...new Set(allQuestions.map((q) => q.category))];

  const filtered = allQuestions.filter((q) => {
    if (selectedCategory !== "ALL" && q.category !== selectedCategory) return false;
    if (selectedDifficulty !== "ALL" && q.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const practicedCount = filtered.filter((q) => practiced.has(q.id)).length;

  async function togglePracticed(questionId: string) {
    const newPracticed = new Set(practiced);
    const wasPracticed = newPracticed.has(questionId);

    if (wasPracticed) {
      newPracticed.delete(questionId);
    } else {
      newPracticed.add(questionId);
    }
    setPracticed(newPracticed);

    if (session) {
      if (wasPracticed) {
        fetch(`/api/mock-interviews/questions/${questionId}/progress`, { method: "DELETE" });
      } else {
        fetch(`/api/mock-interviews/questions/${questionId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ practiced: true }),
        });
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <section style={{ background: "var(--ink)" }}>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center gap-2 text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Link href="/mock-interview" className="no-underline hover:underline" style={{ color: "rgba(255,255,255,0.5)" }}>Mock Interviews</Link>
            <span>/</span>
            <Link href={`/mock-interview/${companySlug}`} className="no-underline hover:underline" style={{ color: "rgba(255,255,255,0.5)" }}>{company?.name}</Link>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.8)" }}>Self Prep</span>
          </div>
          <h1 className={`${syne} text-xl md:text-2xl font-bold text-white mb-2`}>
            {company?.name} — Self Preparation
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            {allQuestions.length} questions · Practice at your own pace
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Progress */}
        <div className="rounded-xl border bg-white p-4 mb-6" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: "var(--ink)" }}>
              Progress: {practicedCount} of {filtered.length} practiced
            </span>
            <span className="text-xs font-bold" style={{ color: "var(--ink)" }}>
              {filtered.length > 0 ? Math.round((practicedCount / filtered.length) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${filtered.length > 0 ? (practicedCount / filtered.length) * 100 : 0}%`,
                background: "var(--ink)",
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["ALL", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all"
              style={{
                background: selectedCategory === cat ? "var(--ink)" : "white",
                color: selectedCategory === cat ? "var(--accent)" : "var(--ink)",
                borderColor: selectedCategory === cat ? "var(--ink)" : "var(--border)",
              }}
            >
              {cat === "ALL" ? "All" : cat.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {["ALL", "EASY", "MEDIUM", "HARD"].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDifficulty(d)}
              className="rounded-full px-3 py-1 text-[10px] font-medium border transition-all"
              style={{
                background: selectedDifficulty === d ? (d === "ALL" ? "var(--ink)" : difficultyColors[d]) : "white",
                color: selectedDifficulty === d ? "white" : "var(--muted)",
                borderColor: selectedDifficulty === d ? "transparent" : "var(--border)",
              }}
            >
              {d === "ALL" ? "All Levels" : d}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-3">
          {filtered.map((q, i) => {
            const isExpanded = expandedId === q.id;
            const isPracticed = practiced.has(q.id);
            return (
              <div
                key={q.id}
                className="rounded-xl border bg-white overflow-hidden transition-all"
                style={{
                  borderColor: isPracticed ? "#10b981" : "var(--border)",
                  borderLeftWidth: isPracticed ? "3px" : "1px",
                }}
              >
                {/* Question Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="w-full flex items-start gap-3 p-4 text-left"
                >
                  <span className="text-xs font-bold mt-0.5 shrink-0" style={{ color: "var(--muted)" }}>
                    {i + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>{q.question}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: `${difficultyColors[q.difficulty]}15`, color: difficultyColors[q.difficulty] }}
                      >
                        {q.difficulty}
                      </span>
                      {q.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(0,0,0,0.05)", color: "var(--muted)" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border)" }}>
                    {q.sampleAnswer && (
                      <div className="mt-3">
                        <h4 className="text-xs font-bold mb-1" style={{ color: "var(--ink)" }}>Sample Answer</h4>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{q.sampleAnswer}</p>
                      </div>
                    )}
                    {q.tips && (
                      <div className="mt-3 rounded-lg p-3" style={{ background: "rgba(232,255,71,0.1)" }}>
                        <h4 className="text-xs font-bold mb-1" style={{ color: "var(--ink)" }}>💡 Tips</h4>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{q.tips}</p>
                      </div>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePracticed(q.id);
                        }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                        style={{
                          background: isPracticed ? "#10b981" : "var(--surface)",
                          color: isPracticed ? "white" : "var(--muted)",
                        }}
                      >
                        {isPracticed ? "✓ Practiced" : "Mark as Practiced"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: "var(--muted)" }}>
            No questions found for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}

export default function SelfPrepPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    }>
      <SelfPrepContent companySlug={companySlug} />
    </Suspense>
  );
}
