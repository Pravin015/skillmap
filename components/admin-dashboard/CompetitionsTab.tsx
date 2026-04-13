"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Competition { id: string; title: string; slug: string; type: string; status: string; companyName: string | null; difficulty: string; startDate: string; endDate: string; _count: { participants: number; submissions: number } }

const statusColors: Record<string, string> = { DRAFT: "#6b7280", OPEN: "#10b981", LIVE: "#ef4444", JUDGING: "#f59e0b", COMPLETED: "#6b7280", CANCELLED: "#ef4444" };

export default function CompetitionsTab() {
  const [comps, setComps] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { fetchComps(); }, []);

  async function fetchComps() {
    // Admin sees all — pass no status filter, override default
    const res = await fetch("/api/competitions?status=ALL");
    // API returns filtered by status, but for admin we need all. Let's fetch all statuses.
    const allRes = await Promise.all(
      ["DRAFT", "OPEN", "LIVE", "JUDGING", "COMPLETED"].map((s) => fetch(`/api/competitions?status=${s}`).then((r) => r.json()).then((d) => d.competitions || []))
    );
    setComps(allRes.flat());
    setLoading(false);
  }

  async function updateStatus(slug: string, status: string) {
    await fetch(`/api/competitions/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setComps((prev) => prev.map((c) => c.slug === slug ? { ...c, status } : c));
  }

  const filtered = filter === "ALL" ? comps : comps.filter((c) => c.status === filter);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Competitions</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{comps.length} total competitions</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "DRAFT", "OPEN", "LIVE", "JUDGING", "COMPLETED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className="rounded-full px-3 py-1.5 text-[10px] font-medium border transition-all" style={{ background: filter === s ? "var(--ink)" : "white", color: filter === s ? "var(--primary)" : "var(--muted)", borderColor: filter === s ? "var(--ink)" : "var(--border)" }}>
            {s} ({s === "ALL" ? comps.length : comps.filter((c) => c.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No competitions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border bg-white p-4 flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`${syne} text-sm font-bold`} style={{ color: "var(--ink)" }}>{c.title}</span>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: `${statusColors[c.status]}15`, color: statusColors[c.status] }}>{c.status}</span>
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>{c.type}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                  {c.companyName || "—"} · {c._count.participants} participants · {c._count.submissions} submissions · {c.difficulty}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {c.status === "DRAFT" && <button onClick={() => updateStatus(c.slug, "OPEN")} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "#10b98115", color: "#10b981" }}>Approve</button>}
                {c.status === "OPEN" && <button onClick={() => updateStatus(c.slug, "LIVE")} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "#3b82f615", color: "#3b82f6" }}>Go Live</button>}
                {(c.status !== "COMPLETED" && c.status !== "CANCELLED") && <button onClick={() => updateStatus(c.slug, "CANCELLED")} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "#ef444415", color: "#ef4444" }}>Cancel</button>}
                <a href={`/competitions/${c.slug}`} target="_blank" className="text-[10px] px-2 py-1 rounded-lg border no-underline" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>View ↗</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
