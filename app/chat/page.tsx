"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UserProfile, ChatMessage } from "@/lib/types";
import { companies, jobs, getCompany } from "@/lib/data";

const syne = "font-[family-name:var(--font-syne)]";

const quickPrompts = [
  "What should I focus on first?",
  "How long will it take to be ready?",
  "What free resources can I use?",
  "Create a week-by-week prep plan",
];

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>}>
      <ChatInner />
    </Suspense>
  );
}

function ChatInner() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("skillmap_profile");
    if (stored) setProfile(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!profile || messages.length > 0) return;
    const jobId = searchParams.get("job");
    const companyId = searchParams.get("company");
    if (jobId) {
      const job = jobs.find((j) => j.id === Number(jobId));
      if (job) { const company = getCompany(job.company); sendMessage(`I found the "${job.title}" role at ${company?.name} (${job.location}). The deadline is ${job.deadline}. Can you help me prepare for this specific role?`); }
    } else if (companyId) {
      const company = getCompany(companyId);
      if (company) sendMessage(`I want to prepare for ${profile.domain} roles at ${company.name}. What's my week-by-week plan?`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function sendMessage(content: string) {
    if (!content.trim() || isStreaming) return;
    const userMessage: ChatMessage = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: newMessages, profile }) });
      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try { const parsed = JSON.parse(data); if (parsed.text) { assistantContent += parsed.text; setMessages([...newMessages, { role: "assistant", content: assistantContent }]); } } catch { /* skip */ }
          }
        }
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't connect to the AI service. Please check the ANTHROPIC_API_KEY and try again." }]);
    } finally { setIsStreaming(false); }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "var(--ink)", color: "var(--accent)" }}>✦</div>
          <div>
            <h1 className={`${syne} font-bold text-base`} style={{ color: "var(--ink)" }}>AI Career Advisor</h1>
            {profile && <p className="text-xs" style={{ color: "var(--muted)" }}>Personalised for {profile.name} · {profile.domain}</p>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6" style={{ background: "var(--surface)" }}>
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "var(--ink)", color: "var(--accent)" }}>✦</div>
            <h2 className={`${syne} font-bold text-lg mb-2`} style={{ color: "var(--ink)" }}>Your AI career advisor</h2>
            <p className="mb-8 max-w-md text-sm" style={{ color: "var(--muted)" }}>Ask anything about your career path, skill preparation, or interview strategy. I have your profile context loaded.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickPrompts.map((prompt) => (
                <button key={prompt} onClick={() => sendMessage(prompt)} className={`rounded-xl border px-4 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${syne} font-medium`} style={{ borderColor: "var(--border)", color: "var(--ink)", background: "white" }}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs mr-2 mt-1 shrink-0" style={{ background: "var(--ink)", color: "var(--accent)" }}>✦</div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "" : ""}`} style={{ background: msg.role === "user" ? "var(--ink)" : "white", color: msg.role === "user" ? "var(--accent)" : "var(--ink)", border: msg.role === "assistant" ? "1px solid var(--border)" : "none" }}>
                {msg.role === "assistant" ? (
                  <div className="whitespace-pre-wrap">{msg.content || (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0ms]" style={{ background: "var(--muted)" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:150ms]" style={{ background: "var(--muted)" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:300ms]" style={{ background: "var(--muted)" }} />
                    </span>
                  )}</div>
                ) : msg.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask about your career path..."
            rows={1}
            className="flex-1 resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ink)]"
            style={{ borderColor: "var(--border)" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
            style={{ background: "var(--ink)", color: "var(--accent)" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
