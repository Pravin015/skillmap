"use client";

const syne = "font-[family-name:var(--font-syne)]";

export default function ApplicationsCard() {
  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${syne} font-bold text-base`}>Companies Applied</h3>
        <span className={`${syne} text-xs font-bold px-2 py-1 rounded-lg`} style={{ background: "var(--border)", color: "var(--muted)" }}>0</span>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Track your application status across companies</p>

      <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
        <div className="text-3xl mb-3">📋</div>
        <p className={`${syne} font-bold text-sm mb-1`}>No applications yet</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>When you apply to roles, your application status will be tracked here</p>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-2 mt-4">
        {[
          { label: "Applied", color: "bg-blue-100 text-blue-700" },
          { label: "Under Review", color: "bg-yellow-100 text-yellow-700" },
          { label: "Interview", color: "bg-purple-100 text-purple-700" },
          { label: "Offer", color: "bg-green-100 text-green-700" },
        ].map((s) => (
          <span key={s.label} className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
        ))}
      </div>
    </div>
  );
}
