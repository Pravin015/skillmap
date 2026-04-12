"use client";
const syne = "font-[family-name:var(--font-syne)]";

interface Props { studentCount: number; orgName: string; onNavigate: (tab: string) => void }

export default function InstitutionOverview({ studentCount, orgName, onNavigate }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-extrabold text-xl`}>{orgName}</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Institution dashboard — manage students and track placements</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: studentCount.toString(), icon: "🎓", color: "#8b5cf6" },
          { label: "Active Applications", value: "—", icon: "📩", color: "#4285f4" },
          { label: "Students Placed", value: "—", icon: "🎯", color: "#22c55e" },
          { label: "Partner Companies", value: "—", icon: "🏢", color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3"><span className="text-2xl">{s.icon}</span><div className="w-8 h-1 rounded-full" style={{ background: s.color }} /></div>
            <div className={`${syne} text-2xl font-extrabold`}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Add Student", icon: "➕", tab: "add-student" },
            { label: "My Students", icon: "🎓", tab: "students" },
            { label: "Browse Companies", icon: "🏢", tab: "companies" },
            { label: "Analytics", icon: "📊", tab: "analytics" },
          ].map((a) => (
            <button key={a.label} onClick={() => onNavigate(a.tab)} className="rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "var(--border)" }}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className={`${syne} font-bold text-sm`}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-2`}>Placement Pipeline</h3>
        <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Track your students through the hiring process</p>
        <div className="grid grid-cols-5 gap-2">
          {["Applied", "Screening", "Interview", "Offer", "Placed"].map((stage) => (
            <div key={stage} className="rounded-xl border-2 border-dashed p-4 text-center" style={{ borderColor: "var(--border)" }}>
              <div className={`${syne} text-xl font-extrabold`} style={{ color: "var(--border)" }}>0</div>
              <div className="text-[0.6rem] font-medium" style={{ color: "var(--muted)" }}>{stage}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
