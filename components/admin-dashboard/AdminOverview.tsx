"use client";

const syne = "font-[family-name:var(--font-syne)]";

interface Stats { total: number; students: number; hr: number; org: number; admin: number; institutions?: number; mentors?: number }

export default function AdminOverview({ stats, onNavigate }: { stats: Stats; onNavigate: (tab: string) => void }) {
  const cards = [
    { label: "Total Users", value: stats.total, icon: "👤", color: "#4285f4", tab: "users" },
    { label: "Students", value: stats.students, icon: "🎓", color: "#8b5cf6", tab: "students" },
    { label: "HR Accounts", value: stats.hr, icon: "👥", color: "#06b6d4", tab: "hrs" },
    { label: "Organisations", value: stats.org, icon: "🏢", color: "#22c55e", tab: "companies" },
    { label: "Mentors", value: stats.mentors || 0, icon: "🧑‍🏫", color: "#f59e0b", tab: "mentors" },
    { label: "Institutions", value: stats.institutions || 0, icon: "🏫", color: "#a855f7", tab: "institutions" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-extrabold text-xl`}>Platform Overview</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>SkillMap admin control panel</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <button key={c.label} onClick={() => onNavigate(c.tab)} className="rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{c.icon}</span>
              <div className="w-8 h-1 rounded-full" style={{ background: c.color }} />
            </div>
            <div className={`${syne} text-2xl font-extrabold`}>{c.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{c.label}</div>
          </button>
        ))}
      </div>

      {/* Platform growth */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-2`}>Platform Growth</h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>User signups over time</p>
        <div className="h-48 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Growth chart will populate as more users join</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Manage Users", icon: "👤", tab: "users" },
            { label: "Review Mentors", icon: "🧑‍🏫", tab: "mentors" },
            { label: "View Companies", icon: "🏢", tab: "companies" },
            { label: "Form Submissions", icon: "📋", tab: "forms" },
            { label: "All Job Posts", icon: "💼", tab: "jobs" },
            { label: "All Students", icon: "🎓", tab: "students" },
            { label: "All HRs", icon: "👥", tab: "hrs" },
            { label: "Settings", icon: "⚙️", tab: "settings" },
          ].map((a) => (
            <button key={a.label} onClick={() => onNavigate(a.tab)} className="rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "var(--border)" }}>
              <div className="text-xl mb-2">{a.icon}</div>
              <div className={`${syne} font-bold text-xs`}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-2`}>System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: "Database", status: "Online", color: "#22c55e" },
            { label: "Auth Service", status: "Online", color: "#22c55e" },
            { label: "AI Chat", status: "Needs API Key", color: "#f59e0b" },
            { label: "File Storage", status: "localStorage", color: "#06b6d4" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-3 flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <div>
                <div className="text-xs font-medium">{s.label}</div>
                <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>{s.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
