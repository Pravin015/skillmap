"use client";
// Red reminder banner shown on the student dashboard when they have one or
// more PendingApplyIntents — i.e. they tried to apply for a job but were
// blocked by a lab gate and haven't completed the labs yet.
//
// Pulls from /api/pending-applications. The endpoint already cross-checks
// against actual lab attempts, so this component just renders whatever it
// gets back.
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
  const readyCount = pending.filter((p) => p.readyToApply).length;

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
                {readyCount > 0 && readyCount === pending.length
                  ? `You're ready to apply to ${pending.length} job${pending.length === 1 ? "" : "s"}!`
                  : `${totalRemaining} hands-on lab${totalRemaining === 1 ? "" : "s"} still needed`}
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {readyCount === pending.length
                  ? "Your labs are complete — head back to the job page and submit your application."
                  : `You started applying for ${pending.length} job${pending.length === 1 ? "" : "s"} but the lab gates are still open. Finish the labs below to unlock your application${pending.length === 1 ? "" : "s"}.`}
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
            {pending.map((p) => (
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
                  {p.readyToApply ? (
                    <Link
                      href={`/jobs/${p.jobSlug || p.jobId}`}
                      className={`px-3 py-1.5 rounded-lg ${heading} font-bold text-xs no-underline`}
                      style={{ background: "#16a34a", color: "white" }}
                    >
                      Apply now →
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/labs"
                        className={`px-3 py-1.5 rounded-lg ${heading} font-bold text-xs no-underline`}
                        style={{ background: "var(--primary)", color: "white" }}
                      >
                        Open labs →
                      </Link>
                      <Link
                        href={`/jobs/${p.jobSlug || p.jobId}`}
                        className="px-3 py-1.5 rounded-lg text-xs border no-underline"
                        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                      >
                        View job
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
