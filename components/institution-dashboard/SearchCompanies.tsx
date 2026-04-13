"use client";
import { useEffect, useState } from "react";
const syne = "font-[family-name:var(--font-syne)]";

interface Company { id: string; name: string; email: string; organisation: string | null; hrCount: number; jobCount: number }

export default function SearchCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/institution/companies").then((r) => r.json()).then((d) => setCompanies(d.companies || [])).finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter((c) => !search || (c.organisation || c.name).toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className={`${syne} font-bold text-xl`}>Browse Companies</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{companies.length} companies on SkillMap</p></div>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies..." className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}><div className="text-4xl mb-3">🏢</div><p className={`${syne} font-bold text-base`}>{companies.length === 0 ? "No companies registered yet" : "No results"}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${syne} font-extrabold text-lg text-white shrink-0`} style={{ background: "var(--ink)" }}>{(c.organisation || c.name).charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className={`${syne} font-bold`}>{c.organisation || c.name}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{c.hrCount} HRs · {c.jobCount} job posts</div>
              </div>
              <button className={`shrink-0 px-4 py-2 rounded-xl ${syne} font-bold text-xs`} style={{ background: "var(--primary)", color: "white" }}>Connect</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
