"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, use, Suspense } from "react";
import { useSession } from "next-auth/react";
import ProctoringGuard from "@/components/ProctoringGuard";

const heading = "font-[family-name:var(--font-heading)]";

interface Message {
  role: "ai" | "user";
  content: string;
  feedback?: string;
  score?: number;
  question?: string;
  isComplete?: boolean;
}

interface Interview {
  id: string;
  companyId: string;
  interviewType: string;
  difficulty: string;
  totalQuestions: number;
  company: { name: string; slug: string; domain: string };
}

interface CompletedInterview extends Interview {
  score: number | null;
  feedback: string | null;
  duration: number | null;
  responses: { question: string; answer: string; aiFeedback: string | null; score: number | null; order: number }[];
}

function parseAIResponse(text: string) {
  const feedbackMatch = text.match(/---FEEDBACK---\s*([\s\S]*?)\s*---SCORE---/);
  const scoreMatch = text.match(/---SCORE---\s*(\d+)/);
  const questionMatch = text.match(/---NEXT_QUESTION---\s*([\s\S]*?)$/);

  return {
    feedback: feedbackMatch?.[1]?.trim() || "",
    score: parseInt(scoreMatch?.[1] || "0", 10),
    question: questionMatch?.[1]?.trim() || "",
    isComplete: questionMatch?.[1]?.trim() === "INTERVIEW_COMPLETE",
  };
}

function AIInterviewContent({ companySlug }: { companySlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [phase, setPhase] = useState<"setup" | "interview" | "completed">("setup");
  const [interview, setInterview] = useState<Interview | null>(null);
  const [completedData, setCompletedData] = useState<CompletedInterview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [questionNum, setQuestionNum] = useState(0);
  const [startTime] = useState(Date.now());
  const [companyName, setCompanyName] = useState("");

  // Config from URL
  const interviewType = searchParams.get("type") || "TECHNICAL";
  const difficulty = searchParams.get("difficulty") || "MEDIUM";
  const totalQuestions = parseInt(searchParams.get("questions") || "5", 10);

  useEffect(() => {
    // Fetch company name
    fetch(`/api/mock-interviews/companies/${companySlug}`)
      .then((r) => r.json())
      .then((d) => setCompanyName(d.company?.name || companySlug));
  }, [companySlug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startInterview() {
    // First, get the company ID
    const compRes = await fetch(`/api/mock-interviews/companies/${companySlug}`);
    const compData = await compRes.json();
    if (!compData.company) return;

    // Create interview
    const res = await fetch("/api/mock-interviews/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: compData.company.id,
        interviewType,
        difficulty,
        totalQuestions,
        type: "AI",
      }),
    });

    const data = await res.json();
    if (!data.interview) return;

    setInterview(data.interview);
    setPhase("interview");

    // Get first question from AI
    await streamResponse(data.interview.id, null);
  }

  async function streamResponse(interviewId: string, answer: string | null) {
    setStreaming(true);
    let fullText = "";

    try {
      const res = await fetch(`/api/mock-interviews/${interviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      // Add streaming AI message
      setMessages((prev) => [...prev, { role: "ai", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              fullText += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "ai", content: fullText };
                return updated;
              });
            } catch { /* skip malformed chunks */ }
          }
        }
      }

      // Parse the complete response
      const parsed = parseAIResponse(fullText);

      // Update the last message with parsed data
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai",
          content: fullText,
          feedback: parsed.feedback,
          score: parsed.score,
          question: parsed.question,
          isComplete: parsed.isComplete,
        };
        return updated;
      });

      if (answer) setQuestionNum((n) => n + 1);
      else setQuestionNum(1);

      if (parsed.isComplete) {
        // Complete the interview
        const completeRes = await fetch(`/api/mock-interviews/${interviewId}/complete`, {
          method: "POST",
        });
        const completeData = await completeRes.json();
        setCompletedData(completeData.interview);
        setPhase("completed");
      }
    } finally {
      setStreaming(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || streaming || !interview) return;
    const answer = input.trim();
    setInput("");

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: answer }]);

    // Stream AI response
    await streamResponse(interview.id, answer);
  }

  async function handleEndEarly() {
    if (!interview) return;
    const completeRes = await fetch(`/api/mock-interviews/${interview.id}/complete`, {
      method: "POST",
    });
    const completeData = await completeRes.json();
    setCompletedData(completeData.interview);
    setPhase("completed");
  }

  function formatDuration() {
    const mins = Math.round((Date.now() - startTime) / 60000);
    return `${mins} min`;
  }

  // ═══ SETUP PHASE ═══
  if (phase === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="max-w-md w-full mx-4">
          <div className="rounded-2xl border bg-white p-8" style={{ borderColor: "var(--border)" }}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🤖</div>
              <h1 className={`${heading} text-xl font-bold mb-1`} style={{ color: "var(--ink)" }}>
                AI Interview — {companyName}
              </h1>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {interviewType.replace("_", " ")} · {difficulty} · {totalQuestions} questions
              </p>
            </div>

            <div className="space-y-3 mb-6 text-xs" style={{ color: "var(--muted)" }}>
              <div className="flex items-start gap-2">
                <span>1.</span>
                <span>The AI interviewer will ask you questions one by one</span>
              </div>
              <div className="flex items-start gap-2">
                <span>2.</span>
                <span>Type your answer for each question and press Enter</span>
              </div>
              <div className="flex items-start gap-2">
                <span>3.</span>
                <span>You&apos;ll receive instant feedback and a score (1-10) for each answer</span>
              </div>
              <div className="flex items-start gap-2">
                <span>4.</span>
                <span>At the end, you&apos;ll see a comprehensive breakdown with your overall score</span>
              </div>
            </div>

            {!session ? (
              <Link
                href="/auth/login"
                className="block rounded-xl px-4 py-3 text-sm font-bold text-center no-underline"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Login to Start
              </Link>
            ) : (
              <button
                onClick={startInterview}
                className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Start Interview
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══ COMPLETED PHASE ═══
  if (phase === "completed" && completedData) {
    const score = completedData.score || 0;
    return (
      <div className="min-h-screen" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-2xl border bg-white p-6 md:p-8 text-center" style={{ borderColor: "var(--border)" }}>
            <div className="text-4xl mb-3">{score >= 70 ? "🎉" : score >= 40 ? "👍" : "💪"}</div>
            <h1 className={`${heading} text-xl font-bold mb-1`} style={{ color: "var(--ink)" }}>
              Interview Complete!
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              {completedData.company.name} · {completedData.interviewType.replace("_", " ")} · {completedData.difficulty}
            </p>

            {/* Score Circle */}
            <div className="relative mx-auto mb-6" style={{ width: 120, height: 120 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 327} 327`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`${heading} text-2xl font-bold`} style={{ color: "var(--ink)" }}>{score}</span>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>out of 100</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 mb-6 text-xs" style={{ color: "var(--muted)" }}>
              <div><span className="font-bold" style={{ color: "var(--ink)" }}>{completedData.responses?.length || 0}</span> questions</div>
              <div><span className="font-bold" style={{ color: "var(--ink)" }}>{completedData.duration || formatDuration()}</span> min</div>
            </div>

            {/* AI Feedback */}
            {completedData.feedback && (
              <div className="rounded-xl p-4 mb-6 text-left text-sm leading-relaxed" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                <h3 className="text-xs font-bold mb-2" style={{ color: "var(--ink)" }}>AI Feedback</h3>
                {completedData.feedback}
              </div>
            )}

            {/* Per-question breakdown */}
            {completedData.responses && completedData.responses.length > 0 && (
              <div className="text-left mb-6">
                <h3 className="text-xs font-bold mb-3" style={{ color: "var(--ink)" }}>Question Breakdown</h3>
                <div className="space-y-2">
                  {completedData.responses.map((r, i) => (
                    <div key={i} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: "var(--ink)" }}>Q{i + 1}</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: (r.score || 0) >= 7 ? "#10b98115" : (r.score || 0) >= 4 ? "#f59e0b15" : "#ef444415",
                            color: (r.score || 0) >= 7 ? "#10b981" : (r.score || 0) >= 4 ? "#f59e0b" : "#ef4444",
                          }}
                        >
                          {r.score}/10
                        </span>
                      </div>
                      <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
                        <strong>Your answer:</strong> {r.answer.slice(0, 100)}{r.answer.length > 100 ? "..." : ""}
                      </p>
                      {r.aiFeedback && (
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          <strong>Feedback:</strong> {r.aiFeedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href={`/mock-interview/${companySlug}/ai?type=${interviewType}&difficulty=${difficulty}&questions=${totalQuestions}`}
                onClick={() => window.location.reload()}
                className="flex-1 rounded-xl border px-4 py-2.5 text-xs font-medium text-center no-underline"
                style={{ borderColor: "var(--border)", color: "var(--ink)" }}
              >
                Try Again
              </Link>
              <Link
                href="/mock-interview/history"
                className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-center no-underline"
                style={{ background: "var(--primary)", color: "white" }}
              >
                View History
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ INTERVIEW PHASE ═══
  return (
    <ProctoringGuard sessionId={interview?.id || ""} sessionType="MOCK_INTERVIEW" strictMode={false} enabled={!!interview}>
    <div className="flex flex-col h-screen" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between shrink-0" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href={`/mock-interview/${companySlug}`} className="text-xs no-underline" style={{ color: "var(--muted)" }}>
            ← Exit
          </Link>
          <div>
            <h2 className={`${heading} text-sm font-bold`} style={{ color: "var(--ink)" }}>{companyName}</h2>
            <div className="flex gap-2 text-[10px]" style={{ color: "var(--muted)" }}>
              <span>{interviewType.replace("_", " ")}</span>
              <span>·</span>
              <span>{difficulty}</span>
              <span>·</span>
              <span>Q{questionNum}/{totalQuestions}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleEndEarly}
          className="rounded-lg border px-3 py-1.5 text-[10px] font-medium transition-all hover:shadow-sm"
          style={{ borderColor: "var(--border)", color: "#ef4444" }}
          disabled={streaming}
        >
          End Interview
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-3 text-sm" style={{ background: "var(--ink)", color: "white" }}>
                    {msg.content}
                  </div>
                </div>
              );
            }

            // AI message — show parsed sections if available
            const parsed = msg.feedback ? msg : parseAIResponse(msg.content);
            const pScore = parsed.score ?? 0;
            return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[85%] space-y-2">
                  {/* Feedback */}
                  {parsed.feedback && (
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 text-sm" style={{ background: "white", border: "1px solid var(--border)" }}>
                      <p style={{ color: "var(--ink)" }}>{parsed.feedback}</p>
                      {pScore > 0 && (
                        <div className="mt-2">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              background: pScore >= 7 ? "#10b98115" : pScore >= 4 ? "#f59e0b15" : "#ef444415",
                              color: pScore >= 7 ? "#10b981" : pScore >= 4 ? "#f59e0b" : "#ef4444",
                            }}
                          >
                            Score: {pScore}/10
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Next Question */}
                  {parsed.question && !parsed.isComplete && (
                    <div
                      className="rounded-2xl rounded-bl-md px-4 py-3 text-sm font-medium"
                      style={{ background: "var(--ink)", color: "white" }}
                    >
                      {parsed.question}
                    </div>
                  )}
                  {parsed.isComplete && (
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 text-sm text-center" style={{ background: "#10b98115", color: "#10b981", border: "1px solid #10b98130" }}>
                      Interview complete! Generating your results...
                    </div>
                  )}
                  {/* Fallback: show raw content if parsing failed */}
                  {!parsed.feedback && !parsed.question && msg.content && (
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 text-sm whitespace-pre-wrap" style={{ background: "white", border: "1px solid var(--border)", color: "var(--ink)" }}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {streaming && messages.length > 0 && !messages[messages.length - 1].content && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3" style={{ background: "white", border: "1px solid var(--border)" }}>
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full animate-bounce" style={{ background: "var(--muted)", animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full animate-bounce" style={{ background: "var(--muted)", animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full animate-bounce" style={{ background: "var(--muted)", animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 shrink-0" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-2xl flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: "var(--border)" }}
            disabled={streaming}
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            className="self-end rounded-xl px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: "var(--primary)", color: "white" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
    </ProctoringGuard>
  );
}

export default function AIInterviewPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    }>
      <AIInterviewContent companySlug={companySlug} />
    </Suspense>
  );
}
