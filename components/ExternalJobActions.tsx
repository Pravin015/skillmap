"use client";

// Client-side actions for an external job detail page:
//   1. On mount, if ?ref=… was present, POST to /api/b2b/track-referral
//      so we can attribute the visit.
//   2. "Apply" button → POST /api/external-jobs/[id]/click → open the
//      source URL in a new tab (clickCount++ tracked server-side).
//   3. If the user arrived with ?action=apply, kick the apply flow on mount.
import { useEffect, useRef, useState } from "react";

interface Props {
  jobId: string;
  sourceName: string;
  ref: string | null;
  institute: string | null;
  student: string | null;
  autoApply: boolean;
}

export default function ExternalJobActions({ jobId, sourceName, ref, institute, student, autoApply }: Props) {
  const [redirecting, setRedirecting] = useState(false);
  const tracked = useRef(false);
  const autoFired = useRef(false);

  useEffect(() => {
    if (!ref || tracked.current) return;
    tracked.current = true;
    fetch("/api/b2b/track-referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, institute, student, externalJobId: jobId }),
    }).catch(() => {});
  }, [ref, institute, student, jobId]);

  async function apply() {
    setRedirecting(true);
    try {
      const r = await fetch(`/api/external-jobs/${jobId}/click`, { method: "POST" });
      const d = await r.json();
      if (d.externalUrl) window.location.href = d.externalUrl;
    } finally { setRedirecting(false); }
  }

  useEffect(() => {
    if (autoApply && !autoFired.current) {
      autoFired.current = true;
      apply();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApply]);

  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
      <button onClick={apply} disabled={redirecting} className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50" style={{ background: "var(--primary)", color: "white" }}>
        {redirecting ? "Redirecting..." : `Apply on ${sourceName} ↗`}
      </button>
      <p className="text-[11px] mt-2 text-center" style={{ color: "var(--muted)" }}>
        You&apos;ll be redirected to the original job posting to complete your application.
      </p>
    </div>
  );
}
