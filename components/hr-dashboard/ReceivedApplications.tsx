"use client";

const syne = "font-[family-name:var(--font-syne)]";

const filterTabs = ["All", "New", "Shortlisted", "Interview", "Rejected"];

export default function ReceivedApplications() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Received Applications</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Review applications with AI-powered profile score matching</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-xl text-sm ${syne} font-bold transition-colors`}
            style={{
              background: i === 0 ? "var(--ink)" : "white",
              color: i === 0 ? "var(--accent)" : "var(--muted)",
              border: i === 0 ? "none" : "1px solid var(--border)",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Score match legend */}
      <div className="rounded-xl border bg-white p-4 flex items-center gap-4 flex-wrap" style={{ borderColor: "var(--border)" }}>
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Score Match:</span>
        <div className="flex gap-3">
          {[
            { label: "90–100%", color: "#22c55e" },
            { label: "70–89%", color: "#f59e0b" },
            { label: "50–69%", color: "#f97316" },
            { label: "Below 50%", color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="grid grid-cols-[1fr_1fr_100px_100px_100px_80px] gap-4 px-6 py-3 text-xs font-medium border-b" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          <span>Candidate</span>
          <span>Applied For</span>
          <span>Score Match</span>
          <span>Applied</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {/* Empty state */}
        <div className="p-12 text-center">
          <div className="text-4xl mb-3">📩</div>
          <p className={`${syne} font-bold text-base mb-1`}>No applications received</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Applications will appear here once candidates apply to your job postings</p>
        </div>
      </div>
    </div>
  );
}
