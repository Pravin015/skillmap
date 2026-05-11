"use client";

import { use, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ink)]";

interface InviteCtx {
  kind: "MENTOR" | "HR" | "INSTITUTE_STUDENT" | "CANDIDATE";
  role: "MENTOR" | "HR" | "STUDENT";
  organisation: string | null;
  collegeName: string | null;
  label: string | null;
  expiresAt: string;
  invitedBy: string | null;
  invitedByOrg: string | null;
}

const KIND_COPY: Record<InviteCtx["kind"], { headline: string; sub: string }> = {
  MENTOR: {
    headline: "You're invited to join AstraaHire as a Mentor",
    sub: "Help students grow — share your experience, run sessions, build a verified mentor profile.",
  },
  HR: {
    headline: "You're invited to join AstraaHire as HR",
    sub: "Post jobs, review applications, hire faster from a curated pool of candidates.",
  },
  INSTITUTE_STUDENT: {
    headline: "Your college invited you to AstraaHire",
    sub: "Get matched to jobs, internships, and labs — your profile is linked to your institution from day one.",
  },
  CANDIDATE: {
    headline: "You've been invited to apply",
    sub: "Create your AstraaHire account in 30 seconds and apply to the role this recruiter has in mind for you.",
  },
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [invite, setInvite] = useState<InviteCtx | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // signup form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invites/links/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Invite invalid");
        setInvite(d.invite);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, inviteToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitErr(data.error || "Signup failed");
        setSubmitting(false);
        return;
      }
      const loginRes = await signIn("credentials", { redirect: false, email, password });
      if (loginRes?.error) {
        setSubmitErr("Account created — please sign in.");
        window.location.href = "/auth/login";
        return;
      }
      // Route by role
      const dest =
        invite?.role === "MENTOR" ? "/mentor-dashboard" :
        invite?.role === "HR" ? "/hr-dashboard" :
        "/dashboard";
      window.location.href = dest;
    } catch {
      setSubmitErr("Something went wrong");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center rounded-2xl border bg-white p-8" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🔗</div>
          <h1 className={`${heading} font-bold text-lg mb-2`}>Invite unavailable</h1>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>{error || "This link is no longer valid."}</p>
          <Link href="/auth/signup" className={`inline-block px-5 py-2.5 rounded-xl ${heading} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>
            Sign up normally →
          </Link>
        </div>
      </div>
    );
  }

  const copy = KIND_COPY[invite.kind];
  const inviterLabel = invite.invitedByOrg || invite.invitedBy;
  const contextChip =
    invite.kind === "INSTITUTE_STUDENT" && invite.collegeName ? invite.collegeName :
    (invite.kind === "HR" || invite.kind === "CANDIDATE") && invite.organisation ? invite.organisation :
    null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12" style={{ background: "var(--surface)" }}>
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          {contextChip && (
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              {contextChip}
            </span>
          )}
          <h1 className={`${heading} font-bold text-2xl`} style={{ color: "var(--ink)" }}>{copy.headline}</h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{copy.sub}</p>
          {inviterLabel && (
            <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
              Invited by <strong>{inviterLabel}</strong>
              {invite.label ? ` · ${invite.label}` : ""}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <div className="h-1 -mx-6 -mt-6 mb-6 rounded-t-2xl" style={{ background: "var(--primary)" }} />

          {submitErr && (
            <div className="rounded-xl p-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
              {submitErr}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${heading}`}>Full name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${heading}`}>Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${heading}`}>Phone *</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${heading}`}>Password *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
          </div>

          <button type="submit" disabled={submitting} className={`mt-5 w-full py-3 rounded-xl ${heading} font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
            {submitting ? "Creating account..." : `Accept invite & continue →`}
          </button>

          <p className="mt-4 text-center text-xs" style={{ color: "var(--muted)" }}>
            By accepting you agree to AstraaHire&apos;s Terms and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
}
