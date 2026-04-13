"use client";
import { useState } from "react";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ink)]";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1=email, 2=otp+new password, 3=done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      await res.json();
      setStep(2); // Always proceed (don't reveal if email exists)
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (newPassword !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp, newPassword }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setStep(3);
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12" style={{ background: "var(--surface)" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className={`${heading} font-extrabold text-2xl`} style={{ color: "var(--ink)" }}>
            {step === 3 ? "Password Reset!" : "Forgot Password"}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            {step === 1 && "Enter your email and we'll send a reset code"}
            {step === 2 && `Enter the 6-digit code sent to ${email}`}
            {step === 3 && "You can now login with your new password"}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <div className="h-1 -mx-6 -mt-6 mb-6 rounded-t-2xl" style={{ background: "var(--ink)" }} />
            {error && <div className="rounded-xl p-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            <button type="submit" disabled={loading} className={`mt-6 w-full py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>{loading ? "Sending..." : "Send Reset Code"}</button>
            <p className="mt-4 text-center text-sm" style={{ color: "var(--muted)" }}>Remember your password? <Link href="/auth/login" className={`font-bold no-underline ${heading}`} style={{ color: "var(--ink)" }}>Login</Link></p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <div className="h-1 -mx-6 -mt-6 mb-6 rounded-t-2xl" style={{ background: "var(--primary)" }} />
            {error && <div className="rounded-xl p-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
            <div className="space-y-4">
              <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Verification Code</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required maxLength={6} placeholder="Enter 6-digit code" className={`${inputClass} text-center text-lg tracking-[0.3em] font-bold`} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Re-enter password" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            </div>
            <button type="submit" disabled={loading} className={`mt-6 w-full py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>{loading ? "Resetting..." : "Reset Password"}</button>
            <button type="button" onClick={() => handleSendOTP({ preventDefault: () => {} } as React.FormEvent)} className="mt-2 w-full text-center text-xs" style={{ color: "var(--muted)" }}>Didn&apos;t receive code? Resend</button>
          </form>
        )}

        {step === 3 && (
          <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
            <div className="text-5xl mb-4">✅</div>
            <p className={`${heading} font-bold text-lg mb-2`}>Password updated!</p>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>You can now login with your new password.</p>
            <Link href="/auth/login" className={`inline-block px-6 py-3 rounded-xl ${heading} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>Go to Login →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
