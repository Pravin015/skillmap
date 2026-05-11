"use client";
// Reminder banner shown on the student dashboard when they have one or
// more PendingApplyIntents — i.e. they've applied to a job whose lab
// gates aren't fully cleared yet. Since labs are soft-gated now (apply
// succeeds either way), this is purely a nudge: "your HR card looks
// incomplete; finish your labs so the recruiter sees real performance".
//
// Pulls from /api/pending-applications which cross-checks against actual
// lab attempts, so this component just renders whatever comes back.
import { useEffect, useState } from "react";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";

interface Pending {
  id: string;
  jobId: string;
  jobSlug: string | null;
  jobTitle: string;
  company: string;
  deadline: string | null;
  requiredLabs: string[];
  remainingLabs: string[];
  readyToApply: boolean;
}

export default function PendingLabsBanner() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/pending-applications").then((r) => r.json()).then((d) => setPending(d.pending || [])).catch(() => {});
  }, []);

  if (dismissed || pending.length === 0) return null;

  const totalRemaining = pending.reduce((sum, p) => sum + p.remainingLabs.length, 0);
  // "readyToApply" is API legacy naming — under soft-gate it means "all
  // gated labs cleared, HR card now shows full scores, banner can drop".
  // We hide rows that are fully cleared so the banner doesn't shout when
  // there's nothing left to do.
  const open = pending.filter((p) => !p.readyToApply);
  if (open.length === 0) return null;

  return (
    <div
      className="rounded-2xl border-2 p-4 mb-6"
      style={{
        borderColor: "rgba(239, 68, 68, 0.4)",
        background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0 animate-pulse">🔴</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className={`${heading} font-bold text-base`} style={{ color: "#dc2626" }}>
                {totalRemaining} hands-on lab{totalRemaining === 1 ? "" : "s"} still pending
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                You&apos;ve applied to {open.length} job{open.length === 1 ? "" : "s"} that asked for hands-on labs. Your application is in — but finish the labs so the recruiter sees your real performance instead of an empty score slot.
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs px-2 py-1 rounded-lg shrink-0"
              style={{ color: "var(--muted)" }}
              title="Hide for now (reappears on next login)"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 mt-3">
            {open.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border p-3 flex items-center gap-3 flex-wrap bg-white"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className={`${heading} font-bold text-sm truncate`}>{p.jobTitle}</div>
                  <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                    {p.company}
                    {p.deadline && <> · Deadline {new Date(p.deadline).toLocaleDateString()}</>}
                  </div>
                  {p.remainingLabs.length > 0 && (
                    <div className="text-[11px] mt-1.5 flex flex-wrap gap-1">
                      {p.remainingLabs.slice(0, 4).map((slug) => (
                        <span key={slug} className="px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>{slug}</span>
                      ))}
                      {p.remainingLabs.length > 4 && (
                        <span style={{ color: "var(--muted)" }}>+{p.remainingLabs.length - 4} more</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {/* Job-scoped lab list — student only sees the labs HR
                      attached to this job, not the entire catalog. */}
                  <Link
                    href={`/labs?job=${p.jobId}`}
                    className={`px-3 py-1.5 rounded-lg ${heading} font-bold text-xs no-underline`}
                    style={{ background: "var(--primary)", color: "white" }}
                  >
                    Open required labs →
                  </Link>
                  <Link
                    href={`/jobs/${p.jobSlug || p.jobId}`}
                    className="px-3 py-1.5 rounded-lg text-xs border no-underline"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                  >
                    View job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
