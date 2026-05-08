"use client";
// Drop-in card for /onboarding and /profile/edit. Three modes:
//   1. Paste LinkedIn profile text → AI extracts → pre-fills profile
//   2. Paste LinkedIn URL alongside (just stored as a link if no text)
//   3. Skip — user fills manually
//
// Calls /api/profile/enrich (rate-limited 5/day). On success we POST
// directly to /api/profile so the data is saved without forcing the
// user through another form. They can still edit anything after.
import { useState } from "react";

interface EnrichedProfile {
  headline?: string | null;
  bio?: string | null;
  collegeName?: string | null;
  academicScore?: string | null;
  academicType?: string | null;
  fieldOfInterest?: string | null;
  skills?: string[];
  experiences?: Array<{ company?: string; role?: string; duration?: string; description?: string }>;
  certifications?: Array<{ title?: string; issuer?: string; year?: string }>;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
}

interface Props {
  onImported?: (data: EnrichedProfile) => void;
  // If true, the component saves directly to /api/profile after enrich.
  // If false, it just hands the parsed data to onImported and lets the
  // parent decide what to do with it.
  autoSave?: boolean;
}

export default function ImportProfile({ onImported, autoSave = true }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<EnrichedProfile | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleEnrich() {
    if (text.trim().length < 100) {
      setError("Paste at least 100 characters from your LinkedIn profile or resume.");
      return;
    }
    setLoading(true);
    setError(null);
    setEnriched(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, linkedinUrl: linkedinUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't parse that text.");
        return;
      }
      setEnriched(data.enriched);

      // Hand to parent first (so it can mirror into form state)
      onImported?.(data.enriched);

      // Optionally also persist directly. The user can still edit
      // afterwards — this just means the data isn't lost if they navigate
      // away before submitting the full form.
      if (autoSave) {
        try {
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              collegeName: data.enriched.collegeName,
              fieldOfInterest: data.enriched.fieldOfInterest,
              bio: data.enriched.bio,
              academicScore: data.enriched.academicScore,
              academicType: data.enriched.academicType,
              skills: data.enriched.skills || [],
              linkedinUrl: data.enriched.linkedinUrl,
              githubUrl: data.enriched.githubUrl,
              portfolioUrl: data.enriched.portfolioUrl,
              experiences: data.enriched.experiences || [],
              certifications: data.enriched.certifications || [],
            }),
          });
          setSaved(true);
        } catch {
          // Non-fatal — parent still got the data via onImported.
        }
      }
    } catch {
      setError("Network error — try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed p-5 text-left transition hover:border-[var(--primary)]"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚡</span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
              Import from LinkedIn or resume
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Skip 8 minutes of typing — paste your profile text and we&apos;ll pre-fill everything.
            </p>
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>Try it →</span>
        </div>
      </button>
    );
  }

  if (enriched) {
    return (
      <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start gap-3 mb-3">
          <span className="text-xl">✓</span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
              Profile imported{saved ? " and saved" : ""}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              We pre-filled your profile with what we found. You can edit any field below.
            </p>
          </div>
        </div>

        <ul className="text-xs space-y-1 mb-4" style={{ color: "var(--ink-soft)" }}>
          {enriched.collegeName && <li>• College: <strong>{enriched.collegeName}</strong></li>}
          {enriched.fieldOfInterest && <li>• Field: <strong>{enriched.fieldOfInterest}</strong></li>}
          {enriched.skills && enriched.skills.length > 0 && <li>• Skills: <strong>{enriched.skills.length}</strong> extracted</li>}
          {enriched.experiences && enriched.experiences.length > 0 && <li>• Experiences: <strong>{enriched.experiences.length}</strong></li>}
          {enriched.certifications && enriched.certifications.length > 0 && <li>• Certifications: <strong>{enriched.certifications.length}</strong></li>}
        </ul>

        <button
          type="button"
          onClick={() => { setOpen(false); setText(""); setLinkedinUrl(""); setEnriched(null); setSaved(false); }}
          className="text-xs underline"
          style={{ color: "var(--muted)" }}
        >
          Import again with different text
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>Import from LinkedIn or resume</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Open your LinkedIn profile → press <kbd className="px-1 py-0.5 rounded bg-gray-100 text-[10px] font-mono">Ctrl/⌘ + A</kbd>{" "}
            <kbd className="px-1 py-0.5 rounded bg-gray-100 text-[10px] font-mono">Ctrl/⌘ + C</kbd> → paste below.
            Or paste any resume text. We use AI to extract skills, education, and experience.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs"
          style={{ color: "var(--muted)" }}
        >
          ✕
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink)" }}>
          LinkedIn URL <span style={{ color: "var(--muted)" }}>(optional)</span>
        </label>
        <input
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/your-handle"
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border)" }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink)" }}>
          Paste profile or resume text <span style={{ color: "var(--muted)" }}>(at least 100 chars)</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={`Example:\n\nPriya Sharma\nFull-Stack Developer | B.Tech CSE 2025 from VIT Vellore\n\nAbout: Passionate about building scalable web apps...\n\nExperience\nFrontend Engineer Intern · Razorpay (Jun 2024 - Aug 2024)\n- Built admin dashboard with React + Next.js\n- Migrated legacy charts to Recharts, cut load time 40%\n\nSkills: React, Next.js, TypeScript, Node.js, PostgreSQL, ...`}
          className="w-full rounded-xl border px-3 py-2 text-xs font-mono outline-none resize-y"
          style={{ borderColor: "var(--border)" }}
        />
        <p className="text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>
          {text.length.toLocaleString()} / 15,000 characters · 5 imports allowed per day
        </p>
      </div>

      {error && <div className="rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleEnrich}
          disabled={loading || text.trim().length < 100}
          className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "var(--primary)", color: "white" }}
        >
          {loading ? "Analysing…" : "Import & pre-fill profile"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border"
          style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
