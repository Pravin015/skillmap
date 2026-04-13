"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ink)]";

export default function ChangePasswordPage() {
  const { data: session } = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12" style={{ background: "var(--surface)" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className={`${heading} font-bold text-2xl`} style={{ color: "var(--ink)" }}>Set Your Password</h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            Welcome{session?.user?.name ? `, ${session.user.name}` : ""}! Please set a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <div className="h-1 -mx-6 -mt-6 mb-6 rounded-t-2xl" style={{ background: "var(--primary)" }} />

          {error && <div className="rounded-xl p-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${heading}`}>New Password *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${heading}`}>Confirm Password *</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Re-enter password" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
          </div>

          <button type="submit" disabled={loading} className={`mt-6 w-full py-3 rounded-xl ${heading} font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
            {loading ? "Saving..." : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
