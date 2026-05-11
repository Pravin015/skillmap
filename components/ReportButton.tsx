"use client";
// Reusable "Report" button. Drop on any user-generated content card
// (job, blog post, course, mentor profile, etc.) and pass targetType
// + targetId. Opens an inline modal with reason + details, posts to
// /api/reports.
import { useState } from "react";

const REASONS = [
  { v: "SPAM", label: "Spam or duplicate content" },
  { v: "SCAM_OR_FRAUD", label: "Scam, fraud, or fake offer" },
  { v: "HARASSMENT_OR_ABUSE", label: "Harassment or abuse" },
  { v: "IMPERSONATION", label: "Impersonation" },
  { v: "OFFENSIVE_CONTENT", label: "Offensive or explicit content" },
  { v: "MISLEADING_INFO", label: "Misleading information" },
  { v: "COPYRIGHT", label: "Copyright violation" },
  { v: "OTHER", label: "Something else" },
];

interface Props {
  targetType: "JOB" | "BLOG_POST" | "COURSE" | "MENTOR_PROFILE" | "USER" | "COMPANY" | "COMPETITION" | "EVENT" | "OTHER";
  targetId: string;
  className?: string;
  // If `compact` then we render as a tiny "Report" link instead of a button.
  compact?: boolean;
}

export default function ReportButton({ targetType, targetId, className, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Pick a reason.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details,
          targetUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't submit report.");
      } else {
        setDone(true);
        setReason("");
        setDetails("");
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || (compact ? "text-[11px] underline" : "text-xs font-medium px-3 py-1.5 rounded-lg border")}
        style={compact
          ? { color: "var(--muted)" }
          : { borderColor: "var(--border)", color: "var(--muted)", background: "white" }
        }
      >
        {compact ? "Report" : "🚩 Report"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(15,14,20,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-3">✓</p>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--ink)" }}>Report received</h3>
                <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                  We&apos;ll review it within 24 hours. Thanks for keeping AstraaHire safe.
                </p>
                <button
                  onClick={() => { setOpen(false); setDone(false); }}
                  className="px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1" style={{ color: "var(--ink)" }}>Report this content</h3>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Help us keep AstraaHire safe. Reports are reviewed by our team.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink)" }}>Why are you reporting this?</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value="">Choose a reason…</option>
                    {REASONS.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                    Details <span style={{ color: "var(--muted)" }}>(optional)</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    placeholder="What specifically is wrong? Anything that helps us investigate."
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none resize-y"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                {error && <div className="rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border"
                    style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !reason}
                    className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    style={{ background: "var(--primary)", color: "white" }}
                  >
                    {submitting ? "Submitting…" : "Submit report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
