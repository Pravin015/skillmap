"use client";

import { useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const heading = "font-[family-name:var(--font-heading)]";

export default function SubmitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!submissionUrl && !submissionText) { setMsg("Please provide a submission URL or write your answer"); return; }
    setSubmitting(true); setMsg("");

    const res = await fetch(`/api/competitions/${slug}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionUrl: submissionUrl || null, submissionText: submissionText || null }),
    });
    const data = await res.json();
    if (res.ok) { router.push(`/competitions/${slug}?submitted=true`); }
    else { setMsg(data.error || "Submission failed"); setSubmitting(false); }
  }

  if (!session) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}><p>Please login to submit.</p></div>;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className={`${heading} text-xl font-bold mb-6`} style={{ color: "var(--ink)" }}>Submit Your Solution</h1>

        {msg && <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "#fef2f2", color: "#ef4444" }}>{msg}</div>}

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Project / Solution URL</label>
            <input value={submissionUrl} onChange={(e) => setSubmissionUrl(e.target.value)} placeholder="GitHub repo, Google Drive, Figma, etc." className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
            <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>Link to your project, presentation, or solution document</p>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Description / Written Answer</label>
            <textarea value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} placeholder="Describe your approach, key decisions, and solution..." rows={8} className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
          </div>

          <button type="submit" disabled={submitting} className={`w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50 ${heading}`} style={{ background: "var(--primary)", color: "white" }}>
            {submitting ? "Submitting..." : "Submit Solution"}
          </button>
        </form>
      </div>
    </div>
  );
}
