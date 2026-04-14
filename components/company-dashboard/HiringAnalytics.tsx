"use client";

const heading = "font-[family-name:var(--font-heading)]";

export default function HiringAnalytics({ hrCount }: { hrCount: number }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>Hiring Analytics</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Data-driven insights into your hiring performance</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg. Time to Hire", value: "—", sub: "days", icon: "⏱️" },
          { label: "Offer Acceptance Rate", value: "—", sub: "%", icon: "✅" },
          { label: "Cost per Hire", value: "—", sub: "INR", icon: "💰" },
          { label: "Active HR Members", value: hrCount.toString(), sub: "people", icon: "👥" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className={`${heading} text-2xl font-bold`}>{m.value}<span className="text-xs font-normal ml-1" style={{ color: "var(--muted)" }}>{m.sub}</span></div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <h3 className={`${heading} font-bold text-base mb-2`}>Hiring Trend</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Monthly hires over the last 6 months</p>
          <div className="h-48 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: "var(--border)" }}>
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Chart data will appear once hiring begins</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <h3 className={`${heading} font-bold text-base mb-2`}>Source of Hires</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Where your best candidates come from</p>
          <div className="h-48 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: "var(--border)" }}>
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Source analytics will populate with hiring data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Domain breakdown */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${heading} font-bold text-base mb-2`}>Hiring by Domain</h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Breakdown of positions filled across domains</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {["Software", "Cybersecurity", "Cloud", "Data", "Consulting"].map((d) => (
            <div key={d} className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--border)" }}>
              <div className={`${heading} text-lg font-bold`} style={{ color: "var(--border)" }}>0</div>
              <div className="text-[0.65rem] mt-0.5" style={{ color: "var(--muted)" }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Candidate quality */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${heading} font-bold text-base mb-2`}>Candidate Quality Score</h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Average profile score of candidates who applied vs. hired</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
            <div className={`${heading} text-3xl font-bold`} style={{ color: "var(--border)" }}>—</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Avg. Applicant Score</div>
          </div>
          <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
            <div className={`${heading} text-3xl font-bold`} style={{ color: "var(--border)" }}>—</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Avg. Hired Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
