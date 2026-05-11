"use client";
// /labs — practice labs powered by gamify (outerlayerx). Data comes
// from /api/external-labs which proxies to gamify's /api/v1/labs.
//
// Click → POST /api/external-labs/[slug]/start → opens gamify embed
// URL in a new tab (gamify renders the lab UI in their domain).
// Sessions are scoped to the AstraaHire user via gamify's
// externalUserId = our User.id pattern.
//
// Job-scoped mode (?job=<id>): when a student arrives from a job's
// "Open required labs →" CTA, we fetch that job's gated lab slugs and
// filter the catalog to just those. Shows a contextual banner so the
// student knows why they're here. The job's slugs come from the job
// detail API; we never expose other labs.
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface ExternalLab {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;          // EASY | MEDIUM | HARD
  timeLimit: number;
  xpReward: number;
  maxScore: number;
  tags: string[];
  taskCount: number;
  stats: { completions: number; avgScore: number };
}

const diffColors: Record<string, { bg: string; color: string }> = {
  EASY:   { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  MEDIUM: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
  HARD:   { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
};

// Wrapped in Suspense at module export so useSearchParams works under
// Next 16's static-rendering rules.
export default function LabsPage() {
  return (
    <Suspense fallback={null}>
      <LabsPageInner />
    </Suspense>
  );
}

interface JobContext {
  id: string;
  title: string;
  company: string;
  requiredSlugs: string[];
  minScore: number | null;
}

function LabsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [labs, setLabs] = useState<ExternalLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [diff, setDiff] = useState("All");
  const [search, setSearch] = useState("");
  const [startingSlug, setStartingSlug] = useState<string | null>(null);

  // Job-scoped state. Populated when ?job=<id> is in the URL.
  const jobId = searchParams.get("job");
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set());

  async function handleStart(slug: string) {
    if (!session) {
      router.push("/auth/login?callbackUrl=/labs");
      return;
    }
    setStartingSlug(slug);
    try {
      const res = await fetch(`/api/external-labs/${slug}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Couldn't start lab");
        return;
      }
      const url = data.embedUrl || data.labUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else alert("Lab session started but no URL was returned. Check your dashboard.");
    } catch {
      alert("Network error — try again.");
    } finally {
      setStartingSlug(null);
    }
  }

  useEffect(() => {
    fetch("/api/external-labs")
      .then((r) => r.json())
      .then((d) => {
        setLabs(d.labs || []);
        setConfigured(d.configured ?? false);
        if (d.error) setErr(d.error);
      })
      .catch(() => setErr("Couldn't load labs"))
      .finally(() => setLoading(false));
  }, []);

  // Job-scoped mode: pull the job's required lab slugs + the student's
  // current attempts so we can mark "done" on each lab in the filtered set.
  useEffect(() => {
    if (!jobId) { setJobContext(null); return; }
    (async () => {
      try {
        const r = await fetch(`/api/jobs/${jobId}`);
        const d = await r.json();
        if (!r.ok || !d.job) return;
        const slugs: string[] = d.job.gamifyLabSlugs?.length
          ? d.job.gamifyLabSlugs
          : (d.job.gamifyLabSlug ? [d.job.gamifyLabSlug] : []);
        setJobContext({
          id: d.job.id,
          title: d.job.title,
          company: d.job.company,
          requiredSlugs: slugs,
          minScore: d.job.gamifyMinScore ?? null,
        });
      } catch { /* leave context null; UI falls back to the full catalog */ }
    })();
  }, [jobId]);

  // Pull which gated labs the student has already cleared so we can mark
  // "✓ completed" cards. Pending-applications endpoint already computes
  // remainingLabs against best-score-per-slug, so we derive completed
  // slugs by subtracting that from the required set.
  useEffect(() => {
    if (!jobId || !jobContext) return;
    fetch("/api/pending-applications").then((r) => r.json()).then((d) => {
      const entry = (d.pending || []).find((p: { jobId: string }) => p.jobId === jobId);
      if (!entry) {
        // No pending intent → if labs were required, they're all done.
        setCompletedSlugs(new Set(jobContext.requiredSlugs));
        return;
      }
      const remaining = new Set<string>(entry.remainingLabs || []);
      setCompletedSlugs(new Set(jobContext.requiredSlugs.filter((s) => !remaining.has(s))));
    }).catch(() => {});
  }, [jobId, jobContext]);

  const filtered = labs.filter((l) => {
    // Job-scoped mode trumps every other filter — only the labs HR picked
    // for this role are surfaced. Students cannot see other labs from
    // this URL.
    if (jobContext) {
      if (!jobContext.requiredSlugs.includes(l.slug)) return false;
    }
    if (diff !== "All" && l.difficulty !== diff) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.title.toLowerCase().includes(q) &&
          !l.description.toLowerCase().includes(q) &&
          !l.tags.some((t) => t.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <section className="blob-bg blob-bg-soft pb-12 pt-8">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="section-eyebrow mx-auto">Practice labs</div>
          {jobContext ? (
            <>
              <h1 className="font-semibold mb-3" style={{ color: "var(--ink)" }}>
                Required labs for {jobContext.title}
              </h1>
              <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
                {jobContext.company} picked {jobContext.requiredSlugs.length} hands-on lab{jobContext.requiredSlugs.length === 1 ? "" : "s"} for this role.
                {jobContext.minScore ? <> Score at least <strong>{jobContext.minScore}</strong> on each so HR sees a clean pass.</> : <> Complete them so HR sees your real performance.</>}
              </p>
              <div className="mt-4">
                <Link href={`/jobs/${jobContext.id}`} className="text-xs underline" style={{ color: "var(--primary)" }}>← Back to job</Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-semibold mb-3" style={{ color: "var(--ink)" }}>
                Hands-on labs that recruiters actually look at
              </h1>
              <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
                Real environments. Real scoring. Demonstrate skills companies hire for —
                not just claim them on a resume.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Search + difficulty filters only in catalog mode. Job-scoped mode
          surfaces a small fixed set already, so filters would be noise. */}
      {!jobContext && (
        <section className="px-4 mb-6">
          <div className="max-w-5xl mx-auto card" style={{ padding: "16px" }}>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search labs by title, description, or tag…"
                className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
                style={{ borderColor: "var(--border)" }}
              />
              <select
                value={diff}
                onChange={(e) => setDiff(e.target.value)}
                className="rounded-xl border px-4 py-2.5 text-sm outline-none md:w-48"
                style={{ borderColor: "var(--border)" }}
              >
                <option value="All">All difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            </div>
          ) : configured === false ? (
            <div className="card text-center" style={{ padding: "48px 24px" }}>
              <div className="text-4xl mb-3">🧪</div>
              <p className="font-semibold mb-1" style={{ color: "var(--ink)" }}>Practice labs are launching soon</p>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                We&apos;re wiring up the lab platform — check back in a day or two.
              </p>
              <Link href="/courses" className="btn-outline">Browse courses instead →</Link>
            </div>
          ) : err ? (
            <div className="card text-center" style={{ padding: "48px 24px" }}>
              <div className="text-4xl mb-3">⚠️</div>
              <p className="font-semibold mb-1" style={{ color: "var(--ink)" }}>{err}</p>
              <button onClick={() => location.reload()} className="btn-outline mt-4">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center" style={{ padding: "48px 24px" }}>
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-semibold mb-1" style={{ color: "var(--ink)" }}>
                {jobContext ? "These labs aren't published yet" : "No labs match your search"}
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {jobContext
                  ? `${jobContext.company} chose ${jobContext.requiredSlugs.length} lab${jobContext.requiredSlugs.length === 1 ? "" : "s"} for this role, but they're not live yet. Try again in a few minutes, or ask the recruiter.`
                  : "Try broadening the difficulty filter."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                {filtered.length} lab{filtered.length === 1 ? "" : "s"} available
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((l) => {
                  const d = diffColors[l.difficulty] || diffColors.MEDIUM;
                  const starting = startingSlug === l.slug;
                  const isCompleted = jobContext ? completedSlugs.has(l.slug) : false;
                  return (
                    <button
                      key={l.id}
                      onClick={() => handleStart(l.slug)}
                      disabled={starting}
                      className="card text-left flex flex-col disabled:opacity-50 relative"
                      style={isCompleted ? { border: "2px solid #16a34a" } : undefined}
                    >
                      {isCompleted && (
                        <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a" }}>
                          ✓ Completed
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: d.bg, color: d.color }}>
                          {l.difficulty}
                        </span>
                        {!isCompleted && (
                          <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: "var(--surface-alt)", color: "var(--muted)" }}>
                            {l.category}
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-base mb-2" style={{ color: "var(--ink)" }}>
                        {l.title}
                      </p>

                      <p className="text-xs leading-relaxed mb-4 line-clamp-3" style={{ color: "var(--ink-soft)" }}>
                        {l.description}
                      </p>

                      {l.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {l.tags.slice(0, 4).map((t) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "var(--surface-alt)", color: "var(--ink-soft)" }}>
                              {t}
                            </span>
                          ))}
                          {l.tags.length > 4 && (
                            <span className="text-[10px]" style={{ color: "var(--muted)" }}>+{l.tags.length - 4}</span>
                          )}
                        </div>
                      )}

                      <div className="mt-auto pt-3 border-t flex items-center justify-between text-[11px]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                        <div className="flex items-center gap-3">
                          <span>⏱ {l.timeLimit}m</span>
                          <span>🎯 {l.taskCount} tasks</span>
                        </div>
                        <span className="font-bold" style={{ color: "var(--primary)" }}>
                          {starting ? "Starting…" : `+${l.xpReward} XP · Start →`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
