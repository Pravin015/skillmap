"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Company { id: string; name: string; email: string; organisation: string | null; phone: string | null; createdAt: string; hrCount: number }

export default function CompaniesTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/companies").then((r) => r.json()).then((d) => { setCompanies(d.companies || []); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Registered Companies</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{companies.length} organisations on the platform</p>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🏢</div>
          <p className={`${syne} font-bold text-base mb-1`}>No companies registered yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Companies will appear here after onboarding</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {companies.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${syne} font-extrabold text-lg text-white shrink-0`} style={{ background: "var(--ink)" }}>
                {(c.organisation || c.name).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`${syne} font-bold`}>{c.organisation || c.name}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{c.email}</div>
              </div>
              <div className="text-center shrink-0 hidden sm:block">
                <div className={`${syne} text-lg font-extrabold`}>{c.hrCount}</div>
                <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>HRs</div>
              </div>
              <div className="text-xs shrink-0 hidden md:block" style={{ color: "var(--muted)" }}>
                Joined {new Date(c.createdAt).toLocaleDateString()}
              </div>
              <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">Active</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
