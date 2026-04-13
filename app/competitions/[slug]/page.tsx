"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";

const syne = "font-[family-name:var(--font-syne)]";

interface Competition {
  id: string; title: string; slug: string; description: string; rules: string | null;
  prizes: string | null; type: string; difficulty: string; domain: string | null;
  companyName: string | null; companyLogo: string | null;
  registrationStart: string; registrationEnd: string; startDate: string; endDate: string;
  maxParticipants: number; teamSize: number; labTemplateId: string | null;
  entryFee: number | null; hiringEnabled: boolean; status: string;
  createdBy: { name: string; organisation: string | null };
  _count: { participants: number; submissions: number };
}

const typeLabels: Record<string, string> = { HACKATHON: "Hackathon", CODING: "Coding Challenge", QUIZ: "Quiz", CASE_STUDY: "Case Study" };
const statusColors: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Draft", color: "#6b7280", bg: "#6b728015" },
  OPEN: { label: "Registration Open", color: "#10b981", bg: "#10b98115" },
  LIVE: { label: "Live Now", color: "#ef4444", bg: "#ef444415" },
  JUDGING: { label: "Judging", color: "#f59e0b", bg: "#f59e0b15" },
  COMPLETED: { label: "Completed", color: "#6b7280", bg: "#6b728015" },
};

export default function CompetitionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: session } = useSession();
  const [comp, setComp] = useState<Competition | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/competitions/${slug}`)
      .then((r) => r.json())
      .then((d) => { setComp(d.competition); setIsRegistered(d.isRegistered); setHasSubmitted(d.hasSubmitted); setLoading(false); });
  }, [slug]);

  async function handleRegister() {
    if (!session) { window.location.href = "/auth/login"; return; }
    setRegistering(true); setMsg("");
    const res = await fetch(`/api/competitions/${slug}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json();
    if (data.requiresPayment) { setMsg(`This competition requires ₹${data.amount / 100} entry fee. Payment integration coming soon.`); }
    else if (res.ok) { setIsRegistered(true); setMsg("Successfully registered!"); }
    else { setMsg(data.error || "Registration failed"); }
    setRegistering(false);
  }

  if (loading || !comp) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;
  }

  const sc = statusColors[comp.status] || statusColors.DRAFT;
  const isActive = comp.status === "OPEN" || comp.status === "LIVE";
  const canSubmit = isRegistered && (comp.status === "LIVE" || comp.status === "OPEN") && !hasSubmitted;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <section style={{ background: "var(--ink)" }}>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Link href="/competitions" className="text-xs no-underline mb-3 inline-block" style={{ color: "rgba(255,255,255,0.5)" }}>← Back to competitions</Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>{typeLabels[comp.type] || comp.type}</span>
            {comp.hiringEnabled && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#10b98120", color: "#10b981" }}>🎯 Hiring</span>}
          </div>
          <h1 className={`${syne} text-2xl md:text-3xl font-bold text-white mb-2`}>{comp.title}</h1>
          {comp.companyName && <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Hosted by <strong className="text-white">{comp.companyName}</strong></p>}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Description */}
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
              <h2 className={`${syne} text-sm font-bold mb-3`}>About this Competition</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{comp.description}</p>
            </div>

            {comp.rules && (
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${syne} text-sm font-bold mb-3`}>Rules</h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{comp.rules}</p>
              </div>
            )}

            {comp.prizes && (
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${syne} text-sm font-bold mb-3`}>🎁 Prizes</h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{comp.prizes}</p>
              </div>
            )}

            {/* Leaderboard Link */}
            {(comp.status === "LIVE" || comp.status === "JUDGING" || comp.status === "COMPLETED") && (
              <Link href={`/competitions/${slug}/leaderboard`} className="block rounded-2xl border bg-white p-6 text-center transition-all hover:shadow-md no-underline" style={{ borderColor: "var(--primary)" }}>
                <span className="text-2xl mb-2 block">🏅</span>
                <span className={`${syne} text-sm font-bold`} style={{ color: "var(--ink)" }}>View Leaderboard</span>
                <span className="block text-xs mt-1" style={{ color: "var(--muted)" }}>{comp._count.submissions} submissions</span>
              </Link>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Action Card */}
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              {msg && <div className="rounded-xl p-3 mb-3 text-xs" style={{ background: msg.includes("Success") ? "#10b98115" : "#f59e0b15", color: msg.includes("Success") ? "#10b981" : "#f59e0b" }}>{msg}</div>}

              {!isRegistered && isActive && (
                <button onClick={handleRegister} disabled={registering} className={`w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50 ${syne}`} style={{ background: "var(--primary)", color: "white" }}>
                  {registering ? "Registering..." : comp.entryFee ? `Register (₹${comp.entryFee / 100})` : "Register — Free"}
                </button>
              )}
              {isRegistered && !hasSubmitted && canSubmit && (
                <Link href={comp.labTemplateId ? `/labs/${comp.labTemplateId}` : `/competitions/${slug}/submit`} className={`block w-full rounded-xl py-3 text-sm font-bold text-center no-underline ${syne}`} style={{ background: "var(--primary)", color: "var(--ink)" }}>
                  {comp.labTemplateId ? "Start Assessment" : "Submit Solution"}
                </Link>
              )}
              {isRegistered && hasSubmitted && (
                <div className="rounded-xl py-3 text-sm font-bold text-center" style={{ background: "#10b98115", color: "#10b981" }}>✓ Submitted</div>
              )}
              {!isActive && !isRegistered && (
                <div className="rounded-xl py-3 text-sm text-center" style={{ color: "var(--muted)" }}>Registration closed</div>
              )}
            </div>

            {/* Info */}
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <h3 className={`${syne} text-xs font-bold mb-3`}>Details</h3>
              <div className="space-y-2 text-xs" style={{ color: "var(--muted)" }}>
                <div className="flex justify-between"><span>Type</span><strong style={{ color: "var(--ink)" }}>{typeLabels[comp.type]}</strong></div>
                <div className="flex justify-between"><span>Difficulty</span><strong style={{ color: "var(--ink)" }}>{comp.difficulty}</strong></div>
                {comp.domain && <div className="flex justify-between"><span>Domain</span><strong style={{ color: "var(--ink)" }}>{comp.domain}</strong></div>}
                <div className="flex justify-between"><span>Team Size</span><strong style={{ color: "var(--ink)" }}>{comp.teamSize === 1 ? "Individual" : `Up to ${comp.teamSize}`}</strong></div>
                <div className="flex justify-between"><span>Max Participants</span><strong style={{ color: "var(--ink)" }}>{comp.maxParticipants}</strong></div>
                <div className="flex justify-between"><span>Registered</span><strong style={{ color: "var(--ink)" }}>{comp._count.participants}</strong></div>
                <hr style={{ borderColor: "var(--border)" }} />
                <div className="flex justify-between"><span>Registration</span><strong style={{ color: "var(--ink)" }}>{new Date(comp.registrationStart).toLocaleDateString()} — {new Date(comp.registrationEnd).toLocaleDateString()}</strong></div>
                <div className="flex justify-between"><span>Competition</span><strong style={{ color: "var(--ink)" }}>{new Date(comp.startDate).toLocaleDateString()} — {new Date(comp.endDate).toLocaleDateString()}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
