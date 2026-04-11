"use client";

const syne = "font-[family-name:var(--font-syne)]";

const formTypes = [
  { label: "Contact Us", icon: "✉️", count: 0, path: "/forms/contact" },
  { label: "Partner Requests", icon: "🤝", count: 0, path: "/forms/partner" },
  { label: "Hire From Us", icon: "🎯", count: 0, path: "/forms/hire-from-us" },
  { label: "Mentor Onboarding", icon: "🧑‍🏫", count: 0, path: "/forms/mentor-onboarding" },
  { label: "Company Onboarding", icon: "🏢", count: 0, path: "/forms/company-onboarding" },
  { label: "Job Postings", icon: "💼", count: 0, path: "/forms/job-posting" },
];

export default function FormsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Form Submissions</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Review incoming requests and form submissions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {formTypes.map((f) => (
          <div key={f.label} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{f.icon}</span>
              <span className={`${syne} text-xs font-bold px-2 py-0.5 rounded-full`} style={{ background: f.count > 0 ? "var(--accent)" : "var(--border)", color: f.count > 0 ? "var(--ink)" : "var(--muted)" }}>{f.count} pending</span>
            </div>
            <div className={`${syne} font-bold text-sm`}>{f.label}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Submissions will appear here</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-2`}>Recent Submissions</h3>
        <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No form submissions yet. Submissions from all forms will be listed here for review.</p>
        </div>
      </div>
    </div>
  );
}
