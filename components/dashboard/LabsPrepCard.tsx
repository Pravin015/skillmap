"use client";
import { labFeatures } from "@/lib/mock-dashboard";

const syne = "font-[family-name:var(--font-syne)]";

export default function LabsPrepCard() {
  return (
    <div className="rounded-2xl border overflow-hidden relative" style={{ borderColor: "var(--border)", background: "var(--ink)" }}>
      {/* Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] opacity-10" style={{ background: "var(--accent)" }} />
      <div className="p-6 relative">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`${syne} font-bold text-base text-white`}>Labs & Interview Prep</h3>
          <span className={`${syne} text-[0.55rem] font-bold px-2 py-0.5 rounded-full`} style={{ background: "var(--accent)", color: "var(--ink)" }}>COMING SOON</span>
        </div>
        <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>Hands-on practice tailored to your target companies</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {labFeatures.map((f) => (
            <div key={f.title} className="rounded-xl p-4 border transition-colors hover:border-[rgba(232,255,71,0.3)]" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className={`${syne} font-bold text-sm text-white mb-1`}>{f.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <button className={`mt-5 w-full py-3 rounded-xl ${syne} font-bold text-sm border transition-colors hover:border-[var(--accent)]`} style={{ borderColor: "rgba(255,255,255,0.15)", color: "var(--accent)", background: "transparent" }}>
          Notify me when it launches
        </button>
      </div>
    </div>
  );
}
