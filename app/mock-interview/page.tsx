"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  domain: string;
  description: string | null;
  interviewTypes: string[];
  _count: { questions: number; interviews: number };
}

const interviewTypeLabels: Record<string, { label: string; color: string }> = {
  TECHNICAL: { label: "Technical", color: "#3b82f6" },
  HR: { label: "HR", color: "#10b981" },
  BEHAVIORAL: { label: "Behavioral", color: "#f59e0b" },
  SYSTEM_DESIGN: { label: "System Design", color: "#8b5cf6" },
};

export default function MockInterviewPage() {
  const { data: session } = useSession();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, [selectedDomain, search]);

  async function fetchCompanies() {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedDomain !== "ALL") params.set("domain", selectedDomain);
    if (search) params.set("search", search);
    const res = await fetch(`/api/mock-interviews/companies?${params}`);
    const data = await res.json();
    setCompanies(data.companies || []);
    if (data.domains) setDomains(data.domains);
    setLoading(false);
  }

  const totalQuestions = companies.reduce((s, c) => s + c._count.questions, 0);
  const totalInterviews = companies.reduce((s, c) => s + c._count.interviews, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--ink)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(232,255,71,0.3) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
          <div className="inline-block rounded-full px-4 py-1.5 text-xs font-medium mb-6" style={{ background: "rgba(232,255,71,0.15)", color: "var(--accent)" }}>
            Interview Preparation
          </div>
          <h1 className={`${syne} text-3xl md:text-5xl font-bold text-white mb-4`}>
            Mock Interviews
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
            Practice with company-specific questions, get AI-powered feedback, or book a session with a mentor. Prepare for the real thing.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-0 px-5 py-3 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-center gap-6 md:gap-12 text-center">
          {[
            { label: "Companies", value: companies.length },
            { label: "Interview Questions", value: totalQuestions },
            { label: "AI Sessions", value: totalInterviews },
            { label: "Preparation Modes", value: 3 },
          ].map((s) => (
            <div key={s.label}>
              <div className={`${syne} text-xl md:text-2xl font-bold`} style={{ color: "var(--ink)" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        {/* Domain Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["ALL", ...domains].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
                selectedDomain === d ? "text-white" : ""
              }`}
              style={{
                background: selectedDomain === d ? "var(--ink)" : "white",
                color: selectedDomain === d ? "var(--accent)" : "var(--ink)",
                borderColor: selectedDomain === d ? "var(--ink)" : "var(--border)",
              }}
            >
              {d === "ALL" ? "All Domains" : d}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--muted)" }}>
            No companies found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="rounded-2xl border bg-white p-5 md:p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: "var(--border)" }}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: "var(--ink)" }}
                  >
                    {company.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`${syne} text-base font-bold truncate`} style={{ color: "var(--ink)" }}>
                      {company.name}
                    </h3>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{company.domain}</span>
                  </div>
                </div>

                {/* Description */}
                {company.description && (
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--muted)" }}>
                    {company.description}
                  </p>
                )}

                {/* Interview Types */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {company.interviewTypes.map((type) => {
                    const t = interviewTypeLabels[type];
                    return t ? (
                      <span
                        key={type}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: `${t.color}15`, color: t.color }}
                      >
                        {t.label}
                      </span>
                    ) : null;
                  })}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs mb-4" style={{ color: "var(--muted)" }}>
                  <span>{company._count.questions} questions</span>
                  <span>·</span>
                  <span>{company._count.interviews} sessions</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/mock-interview/${company.slug}/self`}
                    className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition-all hover:shadow-sm no-underline"
                    style={{ borderColor: "var(--border)", color: "var(--ink)" }}
                  >
                    <span>📝</span> Prepare by Yourself
                  </Link>
                  {session ? (
                    <Link
                      href={`/mock-interview/${company.slug}/ai`}
                      className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all hover:opacity-90 no-underline"
                      style={{ background: "var(--ink)", color: "var(--accent)" }}
                    >
                      <span>🤖</span> AI Interview
                    </Link>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all hover:opacity-90 no-underline"
                      style={{ background: "var(--ink)", color: "var(--accent)" }}
                    >
                      <span>🤖</span> Login for AI Interview
                    </Link>
                  )}
                  <Link
                    href="/companies"
                    className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition-all hover:shadow-sm no-underline"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                  >
                    <span>👨‍🏫</span> Prepare with Mentor
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
