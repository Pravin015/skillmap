"use client";
// /testing-platform — admin-only QA dashboard.
// Cycles status (Not tested → Pending → Done) per checklist item,
// persists via /api/testing-platform/status. Notes are shared across
// admins so testers can hand off context.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CHECKLIST, type ChecklistStatus } from "./data";

type FilterMode = "all" | "not_tested" | "pending" | "done";

interface ServerStatus {
  status: ChecklistStatus;
  notes: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

const STATUS_LABELS: Record<ChecklistStatus, string> = {
  not_tested: "Not tested",
  pending: "Pending",
  done: "Done",
};

const STATUS_ORDER: ChecklistStatus[] = ["not_tested", "pending", "done"];

const SEVERITY_STYLES: Record<NonNullable<NonNullable<typeof CHECKLIST[number]["items"][number]["severity"]>>, { bg: string; color: string }> = {
  critical: { bg: "#fee2e2", color: "#dc2626" },
  high:     { bg: "#ffedd5", color: "#ea580c" },
  medium:   { bg: "#f3f4f6", color: "#6b7280" },
  low:      { bg: "#f3f4f6", color: "#9ca3af" },
};

export default function TestingPlatformPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const userRole = (session?.user as { role?: string })?.role;

  const allItems = useMemo(
    () => CHECKLIST.flatMap((c) => c.items.map((i) => ({ ...i, category: c.key }))),
    []
  );

  const [statusMap, setStatusMap] = useState<Record<string, ServerStatus>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterMode>("all");
  const [hydrated, setHydrated] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/login");
    if (authStatus === "authenticated" && userRole !== "ADMIN") router.push("/dashboard");
  }, [authStatus, userRole, router]);

  // Hydrate
  useEffect(() => {
    if (authStatus !== "authenticated" || userRole !== "ADMIN") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/testing-platform/status", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) { setErr(`Couldn't load (${res.status})`); setHydrated(true); }
          return;
        }
        const data = (await res.json()) as { statuses: Record<string, ServerStatus> };
        if (!cancelled) { setStatusMap(data.statuses || {}); setHydrated(true); }
      } catch {
        if (!cancelled) { setErr("Couldn't load — check your connection."); setHydrated(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [authStatus, userRole]);

  function getStatus(id: string): ChecklistStatus {
    return statusMap[id]?.status || "not_tested";
  }

  async function setStatus(id: string, next: ChecklistStatus, notes?: string) {
    const prev = statusMap[id];
    setStatusMap((m) => ({
      ...m,
      [id]: {
        status: next,
        notes: notes ?? prev?.notes ?? null,
        updatedAt: new Date().toISOString(),
        updatedBy: (session?.user as { name?: string })?.name ?? "you",
      },
    }));
    setErr(null);
    try {
      const res = await fetch("/api/testing-platform/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, status: next, notes }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setStatusMap((m) => ({ ...m, [id]: prev || { status: "not_tested", notes: null, updatedAt: "", updatedBy: null } }));
      setErr("Save failed — try again.");
    }
  }

  function cycle(id: string) {
    const cur = getStatus(id);
    const i = STATUS_ORDER.indexOf(cur);
    setStatus(id, STATUS_ORDER[(i + 1) % STATUS_ORDER.length]);
  }

  function toggleExpand(id: string) {
    setExpanded((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function resetAll() {
    if (!confirm("Reset every status to 'Not tested'? This affects every admin and cannot be undone.")) return;
    const prev = statusMap;
    setStatusMap({});
    try {
      const res = await fetch("/api/testing-platform/status", { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setStatusMap(prev);
      setErr("Reset failed.");
    }
  }

  const counts = useMemo(() => {
    const c = { done: 0, pending: 0, not_tested: 0, total: allItems.length };
    for (const it of allItems) c[getStatus(it.id)]++;
    return c;
  }, [allItems, statusMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const donePct = counts.total === 0 ? 0 : Math.round((counts.done / counts.total) * 100);

  if (authStatus === "loading" || (authStatus === "authenticated" && userRole !== "ADMIN")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Title */}
        <div className="mb-6">
          <div className="section-eyebrow">Internal QA</div>
          <h1 className="font-semibold mb-2" style={{ color: "var(--ink)", fontSize: "1.75rem" }}>
            Testing platform
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Source of truth for what works on AstraaHire. Click any pill to cycle status.
            Progress is shared across all admins — when a developer fixes something, mark it Done.
            Hand off context with notes.
          </p>
        </div>

        {err && (
          <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "#fef3c7", color: "#92400e" }}>
            ⚠ {err}
          </div>
        )}

        {/* Summary */}
        <div className="card mb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="font-semibold" style={{ color: "var(--ink)" }}>QA progress</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {counts.done} of {counts.total} done · {donePct}%
              </p>
            </div>
            <button onClick={resetAll} className="text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              ↺ Reset all
            </button>
          </div>

          <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
            <div className="h-full transition-all" style={{ width: `${donePct}%`, background: "linear-gradient(90deg, #7C3AED, #A78BFA)" }} />
          </div>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Pill kind="done" count={counts.done} />
            <Pill kind="pending" count={counts.pending} />
            <Pill kind="not_tested" count={counts.not_tested} />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 mt-4 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider mr-2" style={{ color: "var(--muted)" }}>Show</span>
            {(["all", "not_tested", "pending", "done"] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                style={{
                  background: filter === f ? "var(--primary)" : "var(--surface-alt)",
                  color: filter === f ? "white" : "var(--muted)",
                }}
              >
                {f === "all" ? "All" : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        {!hydrated ? (
          <div className="card text-center text-sm" style={{ color: "var(--muted)" }}>Loading…</div>
        ) : (
          <div className="space-y-5">
            {CHECKLIST.map((cat) => {
              const visible = cat.items.filter((it) => filter === "all" || getStatus(it.id) === filter);
              if (visible.length === 0) return null;
              return (
                <section key={cat.key} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{cat.title}</p>
                    {cat.description && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{cat.description}</p>}
                  </div>
                  <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {visible.map((item) => {
                      const status = getStatus(item.id);
                      const meta = statusMap[item.id];
                      const isOpen = expanded.has(item.id);
                      return (
                        <li key={item.id} className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <StatusButton status={status} onClick={() => cycle(item.id)} />
                            <div className="flex-1 min-w-0">
                              <button onClick={() => toggleExpand(item.id)} className="flex items-start gap-2 text-left w-full">
                                <span className="text-xs mt-0.5 shrink-0" style={{ color: "var(--muted-2)" }}>{isOpen ? "▾" : "▸"}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium" style={{
                                    color: status === "done" ? "var(--muted-2)" : "var(--ink)",
                                    textDecoration: status === "done" ? "line-through" : "none",
                                  }}>
                                    {item.title}
                                  </p>
                                  {item.severity && (
                                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: SEVERITY_STYLES[item.severity].bg, color: SEVERITY_STYLES[item.severity].color }}>
                                      {item.severity}
                                    </span>
                                  )}
                                </div>
                              </button>

                              {isOpen && (
                                <div className="mt-3 ml-5 space-y-3">
                                  <ol className="space-y-1.5 text-xs" style={{ color: "var(--ink-soft)" }}>
                                    {item.steps.map((step, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{i + 1}</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ol>

                                  <NoteEditor
                                    initial={meta?.notes || ""}
                                    onSave={(notes) => setStatus(item.id, status, notes)}
                                    lastUpdater={meta?.updatedBy}
                                    lastUpdate={meta?.updatedAt}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
function StatusButton({ status, onClick }: { status: ChecklistStatus; onClick: () => void }) {
  const styles: Record<ChecklistStatus, { bg: string; color: string; label: string }> = {
    done: { bg: "#d1fae5", color: "#047857", label: "✓ Done" },
    pending: { bg: "#fef3c7", color: "#92400e", label: "⏱ Pending" },
    not_tested: { bg: "var(--surface-alt)", color: "var(--muted)", label: "○ Not tested" },
  };
  const s = styles[status];
  return (
    <button onClick={onClick} title="Click to cycle status" className="mt-0.5 shrink-0 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </button>
  );
}

function Pill({ kind, count }: { kind: ChecklistStatus; count: number }) {
  const styles: Record<ChecklistStatus, { bg: string; color: string }> = {
    done: { bg: "#d1fae5", color: "#047857" },
    pending: { bg: "#fef3c7", color: "#92400e" },
    not_tested: { bg: "var(--surface-alt)", color: "var(--muted)" },
  };
  return (
    <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: styles[kind].bg, color: styles[kind].color }}>
      {STATUS_LABELS[kind]} · {count}
    </span>
  );
}

function NoteEditor({ initial, onSave, lastUpdater, lastUpdate }: {
  initial: string;
  onSave: (notes: string) => void;
  lastUpdater?: string | null;
  lastUpdate?: string;
}) {
  const [val, setVal] = useState(initial);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setVal(initial); }, [initial]);

  return (
    <div className="rounded-lg p-3 border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>Tester notes</p>
      <textarea
        value={val}
        onChange={(e) => { setVal(e.target.value); setSaved(false); }}
        rows={2}
        placeholder="What you found, repro details, dev notes…"
        className="w-full text-xs p-2 rounded border bg-white outline-none resize-none"
        style={{ borderColor: "var(--border)", color: "var(--ink)" }}
      />
      <div className="flex items-center justify-between mt-2 gap-2">
        <p className="text-[10px]" style={{ color: "var(--muted)" }}>
          {lastUpdater ? <>Last edit by <strong>{lastUpdater}</strong>{lastUpdate ? ` · ${new Date(lastUpdate).toLocaleString()}` : ""}</> : "No notes yet"}
        </p>
        <button
          onClick={() => { onSave(val); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
          disabled={val === initial}
          className="text-[10px] font-bold px-2.5 py-1 rounded-md disabled:opacity-40"
          style={{ background: saved ? "#d1fae5" : "var(--primary)", color: saved ? "#047857" : "white" }}
        >
          {saved ? "✓ Saved" : "Save note"}
        </button>
      </div>
    </div>
  );
}
