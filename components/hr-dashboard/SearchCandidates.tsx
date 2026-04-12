"use client";
import { useState } from "react";
import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

interface Candidate {
  profileNumber: string;
  collegeName: string | null;
  experienceLevel: string;
  fieldOfInterest: string | null;
  profileScore: number;
  skills: string[];
  user: { name: string; degree: string | null; gradYear: string | null };
}

export default function SearchCandidates() {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("");
  const [experience, setExperience] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (domain) params.set("domain", domain);
    if (experience) params.set("experience", experience);

    try {
      const res = await fetch(`/api/candidates?${params}`);
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch { setCandidates([]); }
    finally { setLoading(false); }
  }

  const scoreColor = (s: number) => s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Search Candidates</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Find candidates by skills, domain, or college</p>
      </div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-3">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search by name, email, skills, college, company..." className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)]" style={{ borderColor: "var(--border)" }} />
          <button onClick={handleSearch} disabled={loading} className={`px-5 py-3 rounded-xl ${syne} font-bold text-sm shrink-0 disabled:opacity-50`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        <div className="flex gap-3 mt-4 flex-wrap">
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: "var(--border)" }}>
            <option value="">All Domains</option>
            <option>Software Development</option><option>Cybersecurity</option><option>Cloud & DevOps</option><option>Data & Analytics</option><option>Consulting & Finance</option>
          </select>
          <select value={experience} onChange={(e) => setExperience(e.target.value)} className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: "var(--border)" }}>
            <option value="">All Experience</option>
            <option value="FRESHER">Fresher</option><option value="EXPERIENCED">Experienced</option>
          </select>
        </div>
      </div>

      {searched && (
        <div className="rounded-2xl border bg-white" style={{ borderColor: "var(--border)" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-medium">{candidates.length} candidate{candidates.length !== 1 ? "s" : ""} found</span>
          </div>
          {candidates.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <p className={`${syne} font-bold text-sm mb-1`}>No candidates found</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Try different search terms or filters</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {candidates.map((c) => (
                <div key={c.profileNumber} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${syne} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>
                    {c.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`${syne} font-bold text-sm`}>{c.user.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {c.collegeName || "—"} · {c.user.degree || "—"} · {c.user.gradYear || "—"}
                    </div>
                    {c.skills.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {c.skills.slice(0, 5).map((s) => (
                          <span key={s} className="text-[0.6rem] px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{s}</span>
                        ))}
                        {c.skills.length > 5 && <span className="text-[0.6rem]" style={{ color: "var(--muted)" }}>+{c.skills.length - 5}</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-center shrink-0">
                    <div className={`${syne} text-lg font-extrabold`} style={{ color: scoreColor(c.profileScore) }}>{c.profileScore}</div>
                    <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>Score</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full" style={{ background: c.experienceLevel === "FRESHER" ? "var(--accent)" : "rgba(139,92,246,0.1)", color: c.experienceLevel === "FRESHER" ? "var(--ink)" : "#7c3aed" }}>
                      {c.experienceLevel === "FRESHER" ? "Fresher" : "Experienced"}
                    </span>
                    <Link href={`/profile/${c.profileNumber}`} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem] no-underline`} style={{ background: "var(--ink)", color: "var(--accent)" }}>View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🔍</div>
          <p className={`${syne} font-bold text-base mb-1`}>Search for candidates</p>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--muted)" }}>Use the search bar above to find candidates. Results show profile scores for easy shortlisting.</p>
        </div>
      )}
    </div>
  );
}
