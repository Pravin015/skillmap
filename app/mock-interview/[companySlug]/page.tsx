"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect, use } from "react";

const heading = "font-[family-name:var(--font-heading)]";

interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string;
  description: string | null;
  interviewTypes: string[];
  _count: { interviews: number };
}

interface QuestionsByCategory {
  [key: string]: { id: string; category: string; difficulty: string; question: string }[];
}

export default function CompanyDetailPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = use(params);
  const { data: session } = useSession();
  const [company, setCompany] = useState<Company | null>(null);
  const [questionsByCategory, setQuestionsByCategory] = useState<QuestionsByCategory>({});
  const [loading, setLoading] = useState(true);

  // AI interview config
  const [aiType, setAiType] = useState("TECHNICAL");
  const [aiDifficulty, setAiDifficulty] = useState("MEDIUM");
  const [aiQuestions, setAiQuestions] = useState(5);

  useEffect(() => {
    fetch(`/api/mock-interviews/companies/${companySlug}`)
      .then((r) => r.json())
      .then((d) => {
        setCompany(d.company);
        setQuestionsByCategory(d.questionsByCategory || {});
        if (d.company?.interviewTypes?.[0]) setAiType(d.company.interviewTypes[0]);
        setLoading(false);
      });
  }, [companySlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <p style={{ color: "var(--muted)" }}>Company not found.</p>
      </div>
    );
  }

  const totalQuestions = Object.values(questionsByCategory).flat().length;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section className="relative" style={{ background: "var(--ink)" }}>
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <Link href="/mock-interview" className="text-xs no-underline mb-4 inline-block" style={{ color: "rgba(255,255,255,0.5)" }}>
            ← Back to companies
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white" style={{ background: "rgba(255,255,255,0.1)" }}>
              {company.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className={`${heading} text-2xl md:text-3xl font-bold text-white`}>{company.name}</h1>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{company.domain}</span>
            </div>
          </div>
          {company.description && (
            <p className="text-sm max-w-2xl" style={{ color: "rgba(255,255,255,0.6)" }}>{company.description}</p>
          )}
          <div className="flex gap-4 mt-4 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span>{totalQuestions} questions</span>
            <span>·</span>
            <span>{company._count.interviews} sessions completed</span>
          </div>
        </div>
      </section>

      {/* 3 Option Cards */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className={`${heading} text-lg font-bold mb-6`} style={{ color: "var(--ink)" }}>
          Choose your preparation mode
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Prepare by Yourself */}
          <div className="rounded-2xl border bg-white p-6 flex flex-col" style={{ borderColor: "var(--border)" }}>
            <div className="text-3xl mb-3">📝</div>
            <h3 className={`${heading} text-base font-bold mb-2`} style={{ color: "var(--ink)" }}>Prepare by Yourself</h3>
            <p className="text-xs mb-4 flex-1" style={{ color: "var(--muted)" }}>
              Browse curated interview questions with sample answers and tips. Track your progress as you practice.
            </p>
            <div className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              {totalQuestions} questions across {Object.keys(questionsByCategory).length} categories
            </div>
            <Link
              href={`/mock-interview/${companySlug}/self`}
              className="rounded-xl border px-4 py-2.5 text-xs font-medium text-center transition-all hover:shadow-sm no-underline"
              style={{ borderColor: "var(--border)", color: "var(--ink)" }}
            >
              Start Practice
            </Link>
          </div>

          {/* AI Interview */}
          <div className="rounded-2xl border bg-white p-6 flex flex-col" style={{ borderColor: "var(--ink)" }}>
            <div className="text-3xl mb-3">🤖</div>
            <h3 className={`${heading} text-base font-bold mb-2`} style={{ color: "var(--ink)" }}>AI Interview</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              Real-time mock interview powered by AI. Get instant feedback on every answer with a score breakdown.
            </p>

            <div className="space-y-3 mb-4 flex-1">
              <div>
                <label className="text-[10px] font-medium block mb-1" style={{ color: "var(--muted)" }}>Interview Type</label>
                <select
                  value={aiType}
                  onChange={(e) => setAiType(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                  style={{ borderColor: "var(--border)" }}
                >
                  {company.interviewTypes.map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-medium block mb-1" style={{ color: "var(--muted)" }}>Difficulty</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-medium block mb-1" style={{ color: "var(--muted)" }}>Questions</label>
                  <select
                    value={aiQuestions}
                    onChange={(e) => setAiQuestions(parseInt(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                    <option value={10}>10</option>
                  </select>
                </div>
              </div>
            </div>

            {session ? (
              <Link
                href={`/mock-interview/${companySlug}/ai?type=${aiType}&difficulty=${aiDifficulty}&questions=${aiQuestions}`}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-center transition-all hover:opacity-90 no-underline"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Start AI Interview
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-center transition-all hover:opacity-90 no-underline"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Login to Start
              </Link>
            )}
          </div>

          {/* Mentor Interview */}
          <div className="rounded-2xl border bg-white p-6 flex flex-col" style={{ borderColor: "var(--border)" }}>
            <div className="text-3xl mb-3">👨‍🏫</div>
            <h3 className={`${heading} text-base font-bold mb-2`} style={{ color: "var(--ink)" }}>Prepare with Mentor</h3>
            <p className="text-xs mb-4 flex-1" style={{ color: "var(--muted)" }}>
              Book a 1-on-1 session with an experienced mentor who can conduct a realistic interview and give personalized feedback.
            </p>
            <Link
              href="/companies"
              className="rounded-xl border px-4 py-2.5 text-xs font-medium text-center transition-all hover:shadow-sm no-underline"
              style={{ borderColor: "var(--border)", color: "var(--ink)" }}
            >
              Find Mentors
            </Link>
          </div>
        </div>
      </section>

      {/* Question Categories Preview */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className={`${heading} text-lg font-bold mb-4`} style={{ color: "var(--ink)" }}>
          Question Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(questionsByCategory).map(([cat, questions]) => (
            <Link
              key={cat}
              href={`/mock-interview/${companySlug}/self?category=${cat}`}
              className="rounded-xl border bg-white p-4 text-center transition-all hover:shadow-sm no-underline"
              style={{ borderColor: "var(--border)" }}
            >
              <div className={`${heading} text-xl font-bold`} style={{ color: "var(--ink)" }}>{questions.length}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {cat.replace("_", " ")} Questions
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
