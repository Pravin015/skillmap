"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Verification {
  id: string; companyName: string; trustScore: number; verdict: string;
  riskLevel: string; redFlags: string[]; createdAt: string; userId: string | null;
}

const verdictColors: Record<string, string> = {
  LIKELY_GENUINE: "#10b981", SUSPICIOUS: "#f59e0b", LIKELY_FAKE: "#ef4444", DEFINITE_SCAM: "#dc2626",
};

export default function OfferChecksTab() {
  const [checks, setChecks] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/admin/offer-checks").then((r) => r.json()).then((d) => { setChecks(d.checks || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? checks : checks.filter((c) => c.verdict === filter);
  const scamCount = checks.filter((c) => c.verdict === "DEFINITE_SCAM" || c.verdict === "LIKELY_FAKE").length;

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Offer Letter Verifications</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{checks.length} total checks · {scamCount} scams detected</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Checks", value: checks.length, color: "#3b82f6" },
          { label: "Genuine", value: checks.filter((c) => c.verdict === "LIKELY_GENUINE").length, color: "#10b981" },
          { label: "Suspicious", value: checks.filter((c) => c.verdict === "SUSPICIOUS").length, color: "#f59e0b" },
          { label: "Scams", value: scamCount, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
            <div className={`${syne} text-xl font-bold`} style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["ALL", "LIKELY_GENUINE", "SUSPICIOUS", "LIKELY_FAKE", "DEFINITE_SCAM"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="rounded-full px-3 py-1.5 text-[10px] font-medium border transition-all" style={{ background: filter === f ? "var(--ink)" : "white", color: filter === f ? "var(--primary)" : "var(--muted)", borderColor: filter === f ? "var(--ink)" : "var(--border)" }}>
            {f === "ALL" ? `All (${checks.length})` : `${f.replace("_", " ")} (${checks.filter((c) => c.verdict === f).length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No offer verifications found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border bg-white p-4 flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
              <div className={`${syne} text-lg font-bold w-12 text-center`} style={{ color: verdictColors[c.verdict] || "#6b7280" }}>{c.trustScore}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`${syne} text-sm font-bold`} style={{ color: "var(--ink)" }}>{c.companyName}</span>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: `${verdictColors[c.verdict]}15`, color: verdictColors[c.verdict] }}>{c.verdict.replace(/_/g, " ")}</span>
                </div>
                {c.redFlags.length > 0 && <div className="text-[10px] mt-0.5" style={{ color: "#ef4444" }}>{c.redFlags.slice(0, 2).join(" · ")}</div>}
              </div>
              <div className="text-[10px] shrink-0" style={{ color: "var(--muted)" }}>{new Date(c.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
