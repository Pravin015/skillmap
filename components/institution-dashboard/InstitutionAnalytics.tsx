"use client";
const heading = "font-[family-name:var(--font-heading)]";

export default function InstitutionAnalytics({ studentCount }: { studentCount: number }) {
  return (
    <div className="space-y-6">
      <div><h2 className={`${heading} font-bold text-xl`}>Analytics</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Placement and performance insights</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enrolled Students", value: studentCount.toString(), icon: "🎓" },
          { label: "Placement Rate", value: "—", icon: "📈" },
          { label: "Avg Profile Score", value: "—", icon: "⭐" },
          { label: "Companies Connected", value: "—", icon: "🤝" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className={`${heading} text-2xl font-extrabold`}>{m.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{m.label}</div>
          </div>
        ))}
      </div>
      {["Domain Distribution", "Placement Trend", "Top Hiring Companies"].map((title) => (
        <div key={title} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <h3 className={`${heading} font-bold text-base mb-2`}>{title}</h3>
          <div className="h-40 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Data will populate as students get placed</p>
          </div>
        </div>
      ))}
    </div>
  );
}
