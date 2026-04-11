"use client";
import { useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

export default function CreateHackathon() {
  const [type, setType] = useState<"hackathon" | "quiz">("hackathon");

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Create Hackathon / Quiz</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Design hiring challenges to find top talent</p>
      </div>

      {/* Type toggle */}
      <div className="flex rounded-xl border p-1 w-fit" style={{ borderColor: "var(--border)", background: "white" }}>
        {(["hackathon", "quiz"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-5 py-2.5 rounded-lg text-sm ${syne} font-bold capitalize transition-all`}
            style={{
              background: type === t ? "var(--ink)" : "transparent",
              color: type === t ? "var(--accent)" : "var(--muted)",
            }}
          >
            {t === "hackathon" ? "🏆 Hackathon" : "📝 Quiz"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="rounded-2xl border bg-white p-6 space-y-5" style={{ borderColor: "var(--border)" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>{type === "hackathon" ? "Hackathon" : "Quiz"} Title *</label>
            <input type="text" placeholder={type === "hackathon" ? "e.g. Code Sprint 2026" : "e.g. Cybersecurity Assessment"} className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Domain *</label>
            <select className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }}>
              <option value="">Select domain</option>
              <option>Software Development</option>
              <option>Cybersecurity</option>
              <option>Cloud & DevOps</option>
              <option>Data & Analytics</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Start Date *</label>
            <input type="date" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>End Date *</label>
            <input type="date" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Max Participants</label>
            <input type="number" placeholder="e.g. 500" min="1" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Difficulty Level</label>
            <select className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Prize / Reward</label>
            <input type="text" placeholder="e.g. Direct interview, ₹10,000" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Duration</label>
            <input type="text" placeholder={type === "hackathon" ? "e.g. 48 hours" : "e.g. 60 minutes"} className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Description *</label>
          <textarea placeholder={`Describe the ${type}, rules, evaluation criteria...`} rows={4} className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors resize-none" style={{ borderColor: "var(--border)" }} />
        </div>

        <div className="flex gap-3 pt-2">
          <button className={`px-6 py-3 rounded-xl ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
            Create {type === "hackathon" ? "Hackathon" : "Quiz"}
          </button>
          <button className={`px-6 py-3 rounded-xl ${syne} font-bold text-sm border transition-colors hover:bg-gray-50`} style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            Save as Draft
          </button>
        </div>
      </div>

      {/* Existing */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-2`}>Your Hackathons & Quizzes</h3>
        <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">🏅</div>
          <p className={`${syne} font-bold text-sm mb-1`}>No challenges created yet</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Your hackathons and quizzes will be listed here once created</p>
        </div>
      </div>
    </div>
  );
}
