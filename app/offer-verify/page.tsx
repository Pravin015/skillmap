"use client";

import { useState } from "react";
import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

interface Parameter {
  score: number;
  finding: string;
}

interface AnalysisResult {
  id: string;
  trustScore: number;
  verdict: string;
  riskLevel: string;
  parameters: Record<string, Parameter>;
  redFlags: string[];
  greenFlags: string[];
  recommendation: string;
  detailedAnalysis: string;
}

const parameterLabels: Record<string, { label: string; icon: string }> = {
  EMAIL_DOMAIN: { label: "Email Domain", icon: "📧" },
  UPFRONT_FEES: { label: "Upfront Fees", icon: "💰" },
  COMPANY_LEGITIMACY: { label: "Company Legitimacy", icon: "🏢" },
  SALARY_REALISM: { label: "Salary Realism", icon: "💵" },
  OFFICE_ADDRESS: { label: "Office Address", icon: "📍" },
  HR_CONTACT: { label: "HR Contact Info", icon: "👤" },
  GRAMMAR_LANGUAGE: { label: "Grammar & Language", icon: "📝" },
  LEGAL_TERMS: { label: "Legal Terms", icon: "⚖️" },
  CTC_BREAKDOWN: { label: "CTC Breakdown", icon: "📊" },
  JOINING_DATE: { label: "Joining Date", icon: "📅" },
  REFERENCE_ID: { label: "Reference/Offer ID", icon: "🔢" },
  LETTERHEAD_FORMAT: { label: "Letterhead & Format", icon: "📄" },
  URGENCY_PRESSURE: { label: "Urgency/Pressure", icon: "⏰" },
  COMMUNICATION_CHANNEL: { label: "Communication Channel", icon: "📱" },
  PERKS_REALISM: { label: "Perks Realism", icon: "🎁" },
  DESIGNATION_MATCH: { label: "Designation Match", icon: "🏷️" },
  BOND_CLAUSES: { label: "Bond/Penalty Clauses", icon: "📋" },
  PAYMENT_REQUEST: { label: "Payment Requests", icon: "🚨" },
  INTERVIEW_PROCESS: { label: "Interview Process", icon: "🎤" },
  AUTHORIZED_SIGNATORY: { label: "Authorized Signatory", icon: "✍️" },
};

const verdictConfig: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  LIKELY_GENUINE: { label: "Likely Genuine", color: "#10b981", bg: "#10b98115", emoji: "✅" },
  SUSPICIOUS: { label: "Suspicious", color: "#f59e0b", bg: "#f59e0b15", emoji: "⚠️" },
  LIKELY_FAKE: { label: "Likely Fake", color: "#ef4444", bg: "#ef444415", emoji: "🚫" },
  DEFINITE_SCAM: { label: "Definite Scam", color: "#dc2626", bg: "#dc262615", emoji: "🚨" },
};

const channelOptions = [
  "Official Email (@company.com)",
  "Personal Email (Gmail/Yahoo/Outlook)",
  "WhatsApp",
  "Telegram",
  "SMS",
  "Job Portal (Naukri/LinkedIn)",
  "Walk-in / Physical",
  "Not Sure",
];

export default function OfferVerifyPage() {
  const [companyName, setCompanyName] = useState("");
  const [offerText, setOfferText] = useState("");
  const [channel, setChannel] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !offerText.trim()) return;
    if (offerText.length < 50) { setError("Please paste the complete offer letter (minimum 50 characters)"); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/offer-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim(), offerText: offerText.trim(), communicationChannel: channel }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Analysis failed"); setLoading(false); return; }
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setResult(null);
    setCompanyName("");
    setOfferText("");
    setChannel("");
    setError("");
  }

  function getScoreColor(score: number) {
    if (score >= 7) return "#10b981";
    if (score >= 4) return "#f59e0b";
    return "#ef4444";
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section style={{ background: "var(--ink)" }}>
        <div className="mx-auto max-w-4xl px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold mb-4" style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>
            <span>🛡️</span> Protect Yourself from Fraud
          </div>
          <h1 className={`${syne} text-2xl md:text-4xl font-extrabold text-white mb-3`}>
            Fake Offer Letter Detector
          </h1>
          <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Paste your offer letter and we&apos;ll analyze it against 20 fraud parameters using AI. Protect yourself from fake job scams.
          </p>

          {/* Warning Stats */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {[
              { num: "56%", label: "of Indian graduates targeted by job scams" },
              { num: "Rs.1,200Cr", label: "lost to job fraud annually" },
              { num: "20", label: "parameters we check" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl px-4 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className={`${syne} text-lg font-bold text-white`}>{s.num}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {!result ? (
          /* ═══ INPUT FORM ═══ */
          <form onSubmit={handleSubmit}>
            <div className="rounded-2xl border bg-white p-6 md:p-8" style={{ borderColor: "var(--border)" }}>
              <h2 className={`${syne} text-lg font-bold mb-6`} style={{ color: "var(--ink)" }}>
                Submit Offer Letter for Verification
              </h2>

              {/* Company Name */}
              <div className="mb-4">
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Company Name *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Tata Consultancy Services, Infosys, Google..."
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ink)]"
                  style={{ borderColor: "var(--border)" }}
                  required
                />
              </div>

              {/* Communication Channel */}
              <div className="mb-4">
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>How did you receive this offer?</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="">Select channel...</option>
                  {channelOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Offer Letter Text */}
              <div className="mb-4">
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>
                  Offer Letter Content *
                </label>
                <p className="text-[10px] mb-2" style={{ color: "var(--muted)" }}>
                  Paste the complete offer letter text below. Include everything — from, to, subject, body, salary details, terms, signature.
                </p>
                <textarea
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  placeholder={`Paste the full offer letter here...

Example:
From: hr@company.com
Subject: Offer of Employment

Dear [Name],

We are pleased to offer you the position of [Role] at [Company]...
CTC: Rs. X,XX,XXX per annum...
Joining Date: ...
Terms and Conditions: ...

Regards,
[HR Name]
[Designation]`}
                  rows={14}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ink)] font-mono"
                  style={{ borderColor: "var(--border)", lineHeight: "1.6" }}
                  required
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px]" style={{ color: offerText.length < 50 && offerText.length > 0 ? "#ef4444" : "var(--muted)" }}>
                    {offerText.length < 50 && offerText.length > 0 ? "Minimum 50 characters required" : "Paste the complete letter for accurate analysis"}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>{offerText.length} characters</span>
                </div>
              </div>

              {error && (
                <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "#fef2f2", color: "#ef4444" }}>
                  {error}
                </div>
              )}

              {/* Privacy Note */}
              <div className="rounded-xl p-3 mb-6 text-xs" style={{ background: "rgba(232,255,71,0.1)", color: "var(--muted)" }}>
                <strong style={{ color: "var(--ink)" }}>🔒 Privacy:</strong> Your offer letter content is analyzed by AI and stored securely. We never share your data with third parties.
              </div>

              <button
                type="submit"
                disabled={loading || !companyName.trim() || offerText.length < 50}
                className={`w-full rounded-xl px-6 py-3.5 text-sm font-bold transition-all disabled:opacity-50 ${syne}`}
                style={{ background: "var(--ink)", color: "var(--accent)" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
                    Analyzing 20 parameters...
                  </span>
                ) : (
                  "🔍 Analyze Offer Letter"
                )}
              </button>
            </div>

            {/* Common Scam Warning */}
            <div className="rounded-2xl border bg-white p-6 mt-6" style={{ borderColor: "var(--border)" }}>
              <h3 className={`${syne} text-sm font-bold mb-3`} style={{ color: "#ef4444" }}>⚠️ Common Job Scam Red Flags</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "Asking for money before joining (registration fee, training fee, security deposit)",
                  "Offer received via WhatsApp or Telegram from unknown numbers",
                  "No interview was conducted but you received an offer",
                  "Payment to personal UPI or bank account requested",
                  "Gmail/Yahoo email instead of official company email",
                  "Unrealistic salary (e.g., Rs.25 LPA for fresher at unknown company)",
                  "Pressure to accept within 24-48 hours",
                  "No physical office address mentioned in the letter",
                ].map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--muted)" }}>
                    <span className="text-red-500 shrink-0 mt-0.5">●</span>
                    {flag}
                  </div>
                ))}
              </div>
            </div>
          </form>
        ) : (
          /* ═══ RESULTS ═══ */
          <div className="space-y-4">
            {/* Trust Score Card */}
            <div className="rounded-2xl border bg-white p-6 md:p-8 text-center" style={{ borderColor: "var(--border)" }}>
              <div className="mb-4">
                <span className="text-4xl">{verdictConfig[result.verdict]?.emoji || "❓"}</span>
              </div>

              {/* Score Circle */}
              <div className="relative mx-auto mb-4" style={{ width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="60" fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle
                    cx="70" cy="70" r="60" fill="none"
                    stroke={verdictConfig[result.verdict]?.color || "#6b7280"}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(result.trustScore / 100) * 377} 377`}
                    transform="rotate(-90 70 70)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`${syne} text-3xl font-extrabold`} style={{ color: verdictConfig[result.verdict]?.color }}>{result.trustScore}</span>
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>Trust Score</span>
                </div>
              </div>

              {/* Verdict Badge */}
              <div
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 ${syne} font-bold text-sm mb-4`}
                style={{ background: verdictConfig[result.verdict]?.bg, color: verdictConfig[result.verdict]?.color }}
              >
                {verdictConfig[result.verdict]?.label || result.verdict}
              </div>

              <div className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                Risk Level: <strong style={{ color: result.riskLevel === "CRITICAL" || result.riskLevel === "HIGH" ? "#ef4444" : result.riskLevel === "MEDIUM" ? "#f59e0b" : "#10b981" }}>{result.riskLevel}</strong>
              </div>

              <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "var(--muted)" }}>
                {result.detailedAnalysis}
              </p>
            </div>

            {/* Recommendation */}
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: verdictConfig[result.verdict]?.color,
                background: verdictConfig[result.verdict]?.bg,
              }}
            >
              <h3 className={`${syne} text-sm font-bold mb-1`} style={{ color: verdictConfig[result.verdict]?.color }}>
                💡 Recommendation
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>
                {result.recommendation}
              </p>
            </div>

            {/* Red & Green Flags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.redFlags.length > 0 && (
                <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
                  <h3 className={`${syne} text-sm font-bold mb-3`} style={{ color: "#ef4444" }}>🚩 Red Flags Found ({result.redFlags.length})</h3>
                  <div className="space-y-2">
                    {result.redFlags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--ink)" }}>
                        <span className="text-red-500 shrink-0 mt-0.5">✕</span>
                        {flag}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.greenFlags.length > 0 && (
                <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
                  <h3 className={`${syne} text-sm font-bold mb-3`} style={{ color: "#10b981" }}>✅ Positive Signals ({result.greenFlags.length})</h3>
                  <div className="space-y-2">
                    {result.greenFlags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--ink)" }}>
                        <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                        {flag}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Parameter Scores */}
            <div className="rounded-2xl border bg-white p-5 md:p-6" style={{ borderColor: "var(--border)" }}>
              <h3 className={`${syne} text-sm font-bold mb-4`} style={{ color: "var(--ink)" }}>
                📊 Detailed Parameter Analysis (20 checks)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.parameters && Object.entries(result.parameters).map(([key, param]) => {
                  const info = parameterLabels[key] || { label: key, icon: "📌" };
                  const score = param.score;
                  return (
                    <div key={key} className="flex items-start gap-3 rounded-xl p-3" style={{ background: score < 4 ? "#fef2f2" : score < 7 ? "#fffbeb" : "#f0fdf4" }}>
                      <span className="text-lg shrink-0">{info.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: "var(--ink)" }}>{info.label}</span>
                          <span className="text-xs font-bold" style={{ color: getScoreColor(score) }}>
                            {score}/10
                          </span>
                        </div>
                        {/* Score Bar */}
                        <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(0,0,0,0.08)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${score * 10}%`, background: getScoreColor(score) }}
                          />
                        </div>
                        <p className="text-[10px] leading-snug" style={{ color: "var(--muted)" }}>{param.finding}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:shadow-sm"
                style={{ borderColor: "var(--border)", color: "var(--ink)" }}
              >
                Check Another Letter
              </button>
              <Link
                href="/mock-interview"
                className="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-center no-underline transition-all hover:opacity-90"
                style={{ background: "var(--ink)", color: "var(--accent)" }}
              >
                Practice Mock Interview →
              </Link>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl p-3 text-center text-[10px]" style={{ background: "rgba(0,0,0,0.03)", color: "var(--muted)" }}>
              <strong>Disclaimer:</strong> This analysis is AI-powered and provides an assessment based on common fraud patterns.
              It is not a legal opinion. If you suspect fraud, report to <strong>cybercrime.gov.in</strong> or call <strong>1930</strong> (National Cyber Crime Helpline).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
