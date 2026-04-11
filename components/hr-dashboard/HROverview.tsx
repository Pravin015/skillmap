"use client";

const syne = "font-[family-name:var(--font-syne)]";

const statCards = [
  { label: "Applications Received", value: "—", icon: "📩", color: "#4285f4" },
  { label: "Active Job Posts", value: "0", icon: "💼", color: "#22c55e" },
  { label: "Candidates Shortlisted", value: "—", icon: "⭐", color: "#f59e0b" },
  { label: "Interviews Scheduled", value: "—", icon: "📅", color: "#8b5cf6" },
];

const quickActions = [
  { label: "Post a new job", icon: "➕", tab: "create-job" },
  { label: "Search candidates", icon: "🔍", tab: "search" },
  { label: "Create hackathon", icon: "🏆", tab: "hackathon" },
  { label: "View leaderboard", icon: "📊", tab: "leaderboard" },
];

export default function HROverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <div className="w-8 h-1 rounded-full" style={{ background: s.color }} />
            </div>
            <div className={`${syne} text-2xl font-extrabold`}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => onNavigate(a.tab)}
              className="rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className={`${syne} font-bold text-sm`}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Hiring pipeline */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-2`}>Hiring Pipeline</h3>
        <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Track candidates through your hiring stages</p>
        <div className="grid grid-cols-5 gap-2">
          {["Applied", "Screening", "Interview", "Assessment", "Offer"].map((stage) => (
            <div key={stage} className="rounded-xl border-2 border-dashed p-4 text-center" style={{ borderColor: "var(--border)" }}>
              <div className={`${syne} text-xl font-extrabold mb-1`} style={{ color: "var(--border)" }}>0</div>
              <div className="text-[0.65rem] font-medium" style={{ color: "var(--muted)" }}>{stage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hackathon toppers */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`${syne} font-bold text-base`}>Hackathon Toppers</h3>
          <button onClick={() => onNavigate("leaderboard")} className={`text-xs ${syne} font-bold no-underline px-2.5 py-1 rounded-lg`} style={{ background: "var(--ink)", color: "var(--accent)" }}>View all</button>
        </div>
        <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Top performers from your hiring challenges</p>
        <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">🏆</div>
          <p className={`${syne} font-bold text-sm mb-1`}>No hackathons created yet</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Create a hackathon or quiz to find top talent</p>
          <button onClick={() => onNavigate("hackathon")} className={`mt-3 px-4 py-2 rounded-lg ${syne} font-bold text-xs`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Create hackathon</button>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-2`}>Recent Activity</h3>
        <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Your latest hiring activities will appear here</p>
        <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No activity yet — start by posting a job or creating a hackathon</p>
        </div>
      </div>
    </div>
  );
}
