"use client";

const heading = "font-[family-name:var(--font-heading)]";

export default function CompanySettings({ orgName }: { orgName: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>Company Settings</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Manage your organisation profile and preferences</p>
      </div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${heading} font-bold text-base mb-4`}>Organisation Profile</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${heading} font-extrabold text-xl text-white`} style={{ background: "var(--ink)" }}>
            {orgName.charAt(0)}
          </div>
          <div>
            <div className={`${heading} font-bold text-lg`}>{orgName}</div>
            <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Verified Organisation</span>
          </div>
        </div>
        <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Company profile editing will be available soon. Contact support to update your organisation details.</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${heading} font-bold text-base mb-2`}>Notification Preferences</h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Configure how you receive updates</p>
        <div className="space-y-3">
          {[
            { label: "New applications", desc: "Get notified when candidates apply to your jobs" },
            { label: "HR activity alerts", desc: "Get alerted when HRs post or modify jobs" },
            { label: "Hackathon results", desc: "Get notified when hackathon/quiz results are ready" },
            { label: "Weekly digest", desc: "Receive a weekly summary of all hiring activity" },
          ].map((n) => (
            <label key={n.label} className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className={`${heading} font-bold text-sm`}>{n.label}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{n.desc}</div>
              </div>
              <input type="checkbox" defaultChecked className="accent-[var(--ink)] w-4 h-4" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
