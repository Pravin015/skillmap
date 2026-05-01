"use client";

import { useState } from "react";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";

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
  const [inputMode, setInputMode] = useState<"paste" | "upload">("upload");
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Please upload a PNG, JPG, or WEBP image. If you have a PDF, take a screenshot first.");
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFileData(base64);

      // For PDFs, Claude vision needs image/* media type — we'll send as-is and let the API handle it
      if (file.type === "application/pdf") {
        setFileType("application/pdf");
      } else {
        setFileType(file.type);
      }
    };
    reader.readAsDataURL(file);
  }

  function removeFile() {
    setFileData(null);
    setFileName("");
    setFileType("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    // Validate based on mode
    if (inputMode === "paste" && (!offerText.trim() || offerText.length < 50)) {
      setError("Please paste the complete offer letter (minimum 50 characters)");
      return;
    }
    if (inputMode === "upload" && !fileData) {
      setError("Please upload the offer letter file");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const body: Record<string, string | null> = {
        companyName: companyName.trim(),
        communicationChannel: channel,
      };

      if (inputMode === "paste") {
        body.offerText = offerText.trim();
      } else {
        body.fileData = fileData;
        body.fileType = fileType;
      }

      const res = await fetch("/api/offer-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    setFileData(null);
    setFileName("");
    setFileType("");
    setError("");
    setInputMode("upload");
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
          <h1 className={`${heading} text-2xl md:text-4xl font-bold text-white mb-3`}>
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
                <div className={`${heading} text-lg font-bold text-white`}>{s.num}</div>
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
              <h2 className={`${heading} text-lg font-bold mb-6`} style={{ color: "var(--ink)" }}>
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

              {/* Input Mode Tabs */}
              <div className="mb-4">
                <label className="text-xs font-medium block mb-2" style={{ color: "var(--ink)" }}>
                  Offer Letter *
                </label>
                <div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background: "var(--surface)" }}>
                  <button
                    type="button"
                    onClick={() => setInputMode("upload")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all ${heading}`}
                    style={{
                      background: inputMode === "upload" ? "var(--ink)" : "transparent",
                      color: inputMode === "upload" ? "var(--primary)" : "var(--muted)",
                    }}
                  >
                    📎 Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("paste")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all ${heading}`}
                    style={{
                      background: inputMode === "paste" ? "var(--ink)" : "transparent",
                      color: inputMode === "paste" ? "var(--primary)" : "var(--muted)",
                    }}
                  >
                    📝 Paste Text
                  </button>
                </div>

                {inputMode === "upload" ? (
                  /* File Upload */
                  <div>
                    {!fileData ? (
                      <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all hover:border-[var(--ink)] hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                        <div className="text-3xl mb-2">📄</div>
                        <p className={`${heading} text-sm font-bold mb-1`} style={{ color: "var(--ink)" }}>
                          Drop your offer letter here
                        </p>
                        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
                          or click to browse files
                        </p>
                        <div className="flex gap-2">
                          {["PNG", "JPG", "WEBP"].map((t) => (
                            <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "var(--surface)", color: "var(--muted)" }}>{t}</span>
                          ))}
                        </div>
                        <p className="text-[10px] mt-2" style={{ color: "var(--muted)" }}>Max 10MB</p>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--ink)", background: "rgba(124,58,237,0.05)" }}>
                        <div className="text-2xl">
                          {fileType.includes("pdf") ? "📑" : "🖼️"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`${heading} text-sm font-bold truncate`} style={{ color: "var(--ink)" }}>{fileName}</p>
                          <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                            {fileType.includes("pdf") ? "PDF Document" : "Image"} — Ready for analysis
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="text-xs px-2 py-1 rounded-lg border transition-colors hover:bg-red-50"
                          style={{ borderColor: "var(--border)", color: "#ef4444" }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] mt-2" style={{ color: "var(--muted)" }}>
                      Upload a screenshot or photo of the offer letter. AI will read it visually — checking letterhead, formatting, signatures, and all text content. For PDF files, take a screenshot first.
                    </p>
                  </div>
                ) : (
                  /* Text Paste */
                  <div>
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
                      rows={12}
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ink)] font-mono"
                      style={{ borderColor: "var(--border)", lineHeight: "1.6" }}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px]" style={{ color: offerText.length < 50 && offerText.length > 0 ? "#ef4444" : "var(--muted)" }}>
                        {offerText.length < 50 && offerText.length > 0 ? "Minimum 50 characters required" : "Paste the complete letter for accurate analysis"}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>{offerText.length} characters</span>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "#fef2f2", color: "#ef4444" }}>
                  {error}
                </div>
              )}

              {/* Privacy Note */}
              <div className="rounded-xl p-3 mb-6 text-xs" style={{ background: "var(--primary-light)", color: "var(--muted)" }}>
                <strong style={{ color: "var(--ink)" }}>🔒 Privacy:</strong> Your offer letter content is analyzed by AI and stored securely. We never share your data with third parties.
              </div>

              <button
                type="submit"
                disabled={loading || !companyName.trim() || (inputMode === "paste" && offerText.length < 50) || (inputMode === "upload" && !fileData)}
                className={`w-full rounded-xl px-6 py-3.5 text-sm font-bold transition-all disabled:opacity-50 ${heading}`}
                style={{ background: "var(--primary)", color: "white" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                    Analyzing 20 parameters...
                  </span>
                ) : (
                  "🔍 Analyze Offer Letter"
                )}
              </button>
            </div>

            {/* Common Scam Warning */}
            <div className="rounded-2xl border bg-white p-6 mt-6" style={{ borderColor: "var(--border)" }}>
              <h3 className={`${heading} text-sm font-bold mb-3`} style={{ color: "#ef4444" }}>⚠️ Common Job Scam Red Flags</h3>
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
                  <span className={`${heading} text-3xl font-bold`} style={{ color: verdictConfig[result.verdict]?.color }}>{result.trustScore}</span>
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>Trust Score</span>
                </div>
              </div>

              {/* Verdict Badge */}
              <div
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 ${heading} font-bold text-sm mb-4`}
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
              <h3 className={`${heading} text-sm font-bold mb-1`} style={{ color: verdictConfig[result.verdict]?.color }}>
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
                  <h3 className={`${heading} text-sm font-bold mb-3`} style={{ color: "#ef4444" }}>🚩 Red Flags Found ({result.redFlags.length})</h3>
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
                  <h3 className={`${heading} text-sm font-bold mb-3`} style={{ color: "#10b981" }}>✅ Positive Signals ({result.greenFlags.length})</h3>
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
              <h3 className={`${heading} text-sm font-bold mb-4`} style={{ color: "var(--ink)" }}>
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
                style={{ background: "var(--primary)", color: "white" }}
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
