"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import ProctoringGuard from "@/components/ProctoringGuard";
const heading = "font-[family-name:var(--font-heading)]";

interface Problem { id: string; question: string; optionA: string; optionB: string; optionC: string; optionD: string; order: number }
interface Lab { id: string; title: string; domain: string; description: string | null; difficulty: string; timeLimit: number; passingScore: number; problems: Problem[] }

export default function LabPage() {
  return <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>}><LabInner /></Suspense>;
}

function LabInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const labId = params.id as string;
  const jobId = searchParams.get("jobId");

  const [lab, setLab] = useState<Lab | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; passed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/labs/${labId}`).then((r) => r.json()).then((d) => { if (d.lab) { setLab(d.lab); setTimeLeft(d.lab.timeLimit * 60); } }).finally(() => setLoading(false));
  }, [labId]);

  const handleSubmit = useCallback(async () => {
    if (submitted || submitting || !attemptId) return;
    setSubmitting(true);
    const ansArr = Object.entries(answers).map(([problemId, selectedAnswer]) => ({ problemId, selectedAnswer }));
    const res = await fetch(`/api/labs/attempt/${attemptId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: ansArr }) });
    const data = await res.json();
    if (res.ok) { setResult({ score: data.score, total: data.total, percentage: data.percentage, passed: data.passed }); setSubmitted(true); }
    setSubmitting(false);
  }, [submitted, submitting, attemptId, answers]);

  // Timer
  useEffect(() => {
    if (!started || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, submitted, handleSubmit]);

  async function startLab() {
    const res = await fetch("/api/labs/attempt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ labTemplateId: labId, jobId }) });
    const data = await res.json();
    if (res.ok) { setAttemptId(data.attempt.id); setStarted(true); }
    else if (data.attemptId) { setAttemptId(data.attemptId); setSubmitted(true); }
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const urgentTime = timeLeft < 300; // < 5 min

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;
  if (!lab) return <div className="flex min-h-[60vh] items-center justify-center"><p>Lab not found</p></div>;

  // Result screen
  if (submitted && result) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4" style={{ background: "var(--surface)" }}>
        <div className="max-w-md w-full text-center">
          <div className="rounded-2xl border bg-white p-8" style={{ borderColor: "var(--border)" }}>
            <div className="text-5xl mb-4">{result.passed ? "🎉" : "😔"}</div>
            <h1 className={`${heading} font-bold text-2xl mb-2`}>{result.passed ? "Lab Passed!" : "Lab Not Passed"}</h1>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>{lab.title}</p>
            <div className={`${heading} text-5xl font-bold mb-2`} style={{ color: result.passed ? "#22c55e" : "#ef4444" }}>{result.percentage}%</div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{result.score}/{result.total} correct · Passing: {lab.passingScore}%</p>
            <div className="mt-6 flex gap-3 justify-center">
              {jobId && <Link href={`/jobs/${jobId}`} className={`px-5 py-2.5 rounded-xl ${heading} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>Back to Job</Link>}
              <Link href="/dashboard" className={`px-5 py-2.5 rounded-xl ${heading} font-bold text-sm no-underline border`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-start screen
  if (!started) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4" style={{ background: "var(--surface)" }}>
        <div className="max-w-lg w-full">
          <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
            <div className="text-4xl mb-4">🧪</div>
            <h1 className={`${heading} font-bold text-2xl mb-2`}>{lab.title}</h1>
            {lab.description && <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{lab.description}</p>}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><div className={`${heading} text-lg font-bold`}>{lab.problems.length}</div><div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>Questions</div></div>
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><div className={`${heading} text-lg font-bold`}>{lab.timeLimit}m</div><div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>Time Limit</div></div>
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><div className={`${heading} text-lg font-bold`}>{lab.passingScore}%</div><div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>To Pass</div></div>
            </div>
            <div className="rounded-xl p-3 text-xs mb-6" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.1)" }}>
              ⚠️ Once started, the timer cannot be paused. Make sure you have a stable internet connection.
            </div>
            <button onClick={startLab} className={`px-8 py-3 rounded-xl ${heading} font-bold text-sm`} style={{ background: "var(--primary)", color: "white" }}>Start Lab →</button>
          </div>
        </div>
      </div>
    );
  }

  // Lab in progress
  return (
    <ProctoringGuard sessionId={attemptId || ""} sessionType="LAB" strictMode={true} maxViolations={4} onAutoSubmit={handleSubmit} enabled={!!attemptId}>
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      {/* Timer bar */}
      <div className="sticky top-24 z-40 border-b py-3 px-4" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className={`${heading} font-bold text-sm`}>{lab.title}</div>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: "var(--muted)" }}>{Object.keys(answers).length}/{lab.problems.length} answered</span>
            <div className={`${heading} font-bold text-lg px-4 py-1.5 rounded-xl ${urgentTime ? "animate-pulse" : ""}`} style={{ background: urgentTime ? "rgba(239,68,68,0.1)" : "var(--ink)", color: urgentTime ? "#dc2626" : "var(--primary)" }}>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {lab.problems.map((p, i) => (
          <div key={p.id} className="rounded-2xl border bg-white p-6" style={{ borderColor: answers[p.id] ? "var(--ink)" : "var(--border)" }}>
            <div className="flex items-start gap-3 mb-4">
              <span className={`${heading} font-bold text-sm shrink-0 w-8 h-8 rounded-lg flex items-center justify-center`} style={{ background: answers[p.id] ? "var(--ink)" : "var(--border)", color: answers[p.id] ? "var(--primary)" : "var(--muted)" }}>{i + 1}</span>
              <p className="text-sm font-medium leading-relaxed">{p.question}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-11">
              {(["A", "B", "C", "D"] as const).map((opt) => {
                const text = opt === "A" ? p.optionA : opt === "B" ? p.optionB : opt === "C" ? p.optionC : p.optionD;
                const selected = answers[p.id] === opt;
                return (
                  <button key={opt} onClick={() => setAnswers({ ...answers, [p.id]: opt })} className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${selected ? "font-bold" : ""}`} style={{ background: selected ? "var(--ink)" : "white", color: selected ? "var(--primary)" : "var(--ink)", borderColor: selected ? "var(--ink)" : "var(--border)" }}>
                    <span className="font-bold mr-2">{opt}.</span>{text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-center pt-4">
          <button onClick={handleSubmit} disabled={submitting} className={`px-10 py-3.5 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
            {submitting ? "Submitting..." : `Submit Lab (${Object.keys(answers).length}/${lab.problems.length} answered)`}
          </button>
        </div>
      </div>
    </div>
    </ProctoringGuard>
  );
}
