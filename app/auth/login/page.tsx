"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ink)]";

const roles = [
  { key: "STUDENT", label: "Student" },
  { key: "MENTOR", label: "Mentor" },
  { key: "HR", label: "HR" },
  { key: "ORG", label: "Organisation" },
  { key: "INSTITUTION", label: "Institution" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "STUDENT";

  const [activeRole, setActiveRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role: activeRole,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Check if must change password
        const sess = await fetch("/api/auth/session").then((r) => r.json()).catch(() => null);
        if (sess?.user?.mustChangePassword) {
          window.location.href = "/auth/change-password";
          return;
        }
        const redirectMap: Record<string, string> = {
          ADMIN: "/admin",
          MENTOR: "/mentor-dashboard",
          HR: "/hr-dashboard",
          ORG: "/company-dashboard",
          INSTITUTION: "/institution-dashboard",
        };
        window.location.href = redirectMap[activeRole] || "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12" style={{ background: "var(--surface)" }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className={`${heading} font-bold text-2xl`} style={{ color: "var(--ink)" }}>Welcome back</h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>Sign in to your AstraaHire account</p>
        </div>

        {/* Role tabs */}
        <div className="mb-6 flex rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "white" }}>
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => { setActiveRole(role.key); setError(""); }}
              className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${heading}`}
              style={{
                background: activeRole === role.key ? "var(--ink)" : "transparent",
                color: activeRole === role.key ? "var(--primary)" : "var(--muted)",
              }}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <div className="h-1 -mx-6 -mt-6 mb-6 rounded-t-2xl" style={{ background: "var(--ink)" }} />

          {error && (
            <div className="rounded-xl p-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${heading}`}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputClass}
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${heading}`}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={inputClass}
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <div className="text-right"><Link href="/auth/forgot-password" className="text-xs no-underline" style={{ color: "var(--muted)" }}>Forgot password?</Link></div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-6 w-full py-3 rounded-xl ${heading} font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50`}
            style={{ background: "var(--primary)", color: "white" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="mt-4 text-center text-sm" style={{ color: "var(--muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href={`/auth/signup?role=${activeRole}`} className={`font-bold no-underline ${heading}`} style={{ color: "var(--ink)" }}>
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
