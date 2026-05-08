"use client";
// Drop on /auth/login and /auth/signup. Shows Google + LinkedIn buttons
// only — call signIn() with the provider name. NextAuth handles the
// OAuth dance + the auth.ts signIn callback auto-provisions the user.
//
// If the corresponding OAuth env vars aren't set on the server, the
// provider is absent from the providers list and clicking the button
// just shows a friendly error. The buttons themselves stay visible
// because we don't want a server round-trip just to hide them.
import { signIn } from "next-auth/react";
import { useState } from "react";

interface Props {
  callbackUrl?: string;
  // If true, render compact icon-only buttons (used inside tight layouts).
  compact?: boolean;
}

export default function SocialSignIn({ callbackUrl = "/dashboard", compact }: Props) {
  const [loading, setLoading] = useState<"google" | "linkedin" | null>(null);

  async function go(provider: "google" | "linkedin") {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => go("google")}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border bg-white text-sm font-medium hover:bg-[var(--surface-alt)] transition disabled:opacity-50"
        style={{ borderColor: "var(--border)", color: "var(--ink)" }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
        </svg>
        {loading === "google" ? "Connecting…" : compact ? "Google" : "Continue with Google"}
      </button>

      <button
        type="button"
        onClick={() => go("linkedin")}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        style={{ background: "#0A66C2", color: "white" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        {loading === "linkedin" ? "Connecting…" : compact ? "LinkedIn" : "Continue with LinkedIn"}
      </button>

      <p className="text-[10px] text-center mt-2" style={{ color: "var(--muted)" }}>
        We&apos;ll create your account using your name + email. Your password is never collected.
      </p>
    </div>
  );
}
