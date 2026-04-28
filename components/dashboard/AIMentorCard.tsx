"use client";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";

export default function AIMentorCard() {
  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ background: "var(--ink)" }}>
      {/* Decorative mesh */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "radial-gradient(circle at 30% 50%, rgba(124,58,237,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(71,200,255,0.2) 0%, transparent 40%)"
      }} />
      <div className="relative p-6">
        <h3 className={`${heading} font-bold text-lg text-white mb-1`}>AI Assistant</h3>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
          Get personalised career guidance, skill gap analysis, and interview prep plans.
        </p>
        <div className="flex gap-3">
          <Link href="/chat" className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ${heading} font-bold text-sm no-underline transition-transform hover:-translate-y-0.5`} style={{ background: "var(--primary)", color: "var(--ink)" }}>
            <span>💬</span> Chat now
          </Link>
          <button className="flex-1 py-3 rounded-xl border text-sm font-medium cursor-not-allowed relative" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.35)", background: "transparent" }} disabled>
            🎙️ Voice
            <span className={`absolute -top-2 -right-1 text-[0.5rem] px-1.5 py-0.5 rounded-full ${heading} font-bold`} style={{ background: "var(--primary)", color: "var(--ink)" }}>SOON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
