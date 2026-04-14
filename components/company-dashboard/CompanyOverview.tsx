"use client";

const heading = "font-[family-name:var(--font-heading)]";

interface Props {
  orgName: string;
  hrCount: number;
  onNavigate: (tab: string) => void;
}

const statCards = [
  { key: "hr", label: "HR Accounts", icon: "👥", color: "#4285f4" },
  { key: "jobs", label: "Active Job Posts", icon: "💼", color: "#22c55e" },
  { key: "hired", label: "People Hired", icon: "🎯", color: "#8b5cf6" },
  { key: "interviews", label: "In Interview", icon: "📅", color: "#f59e0b" },
  { key: "applications", label: "Total Applications", icon: "📩", color: "#ef4444" },
  { key: "hackathons", label: "Hackathons", icon: "🏆", color: "#06b6d4" },
];

export default function CompanyOverview({ orgName, hrCount, onNavigate }: Props) {
  const stats: Record<string, string> = {
    hr: hrCount.toString(),
    jobs: "—", hired: "—", interviews: "—", applications: "—", hackathons: "—",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>{orgName} Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Overview of your organisation&apos;s hiring activity on AstraaHire</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.key} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <div className="w-8 h-1 rounded-full" style={{ background: s.color }} />
            </div>
            <div className={`${heading} text-2xl font-bold`}>{stats[s.key]}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${heading} font-bold text-base mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Add HR", icon: "➕", tab: "manage-hr" },
            { label: "Track HRs", icon: "📊", tab: "hr-tracker" },
            { label: "Hiring Analytics", icon: "📈", tab: "analytics" },
            { label: "Company Settings", icon: "⚙️", tab: "settings" },
          ].map((a) => (
            <button key={a.label} onClick={() => onNavigate(a.tab)} className="rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "var(--border)" }}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className={`${heading} font-bold text-sm`}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Hiring funnel */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${heading} font-bold text-base mb-2`}>Hiring Funnel</h3>
        <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Track candidates through your entire hiring pipeline</p>
        <div className="grid grid-cols-6 gap-2">
          {["Applied", "Screened", "Interview", "Assessment", "Offer", "Hired"].map((stage, i) => (
            <div key={stage} className="text-center">
              <div className="rounded-xl border-2 border-dashed p-3 mb-1" style={{ borderColor: "var(--border)" }}>
                <div className={`${heading} text-xl font-bold`} style={{ color: "var(--border)" }}>0</div>
              </div>
              <div className="text-[0.6rem] font-medium" style={{ color: "var(--muted)" }}>{stage}</div>
              {i < 5 && <div className="text-xs mt-1" style={{ color: "var(--border)" }}>→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${heading} font-bold text-base mb-2`}>Recent Activity</h3>
        <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No activity yet. Add HRs and start posting jobs to see activity here.</p>
        </div>
      </div>
    </div>
  );
}
