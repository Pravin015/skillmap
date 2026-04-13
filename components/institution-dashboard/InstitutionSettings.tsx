"use client";
const heading = "font-[family-name:var(--font-heading)]";

export default function InstitutionSettings({ orgName }: { orgName: string }) {
  return (
    <div className="space-y-6">
      <div><h2 className={`${heading} font-bold text-xl`}>Settings</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Manage your institution profile</p></div>
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${heading} font-bold text-xl text-white`} style={{ background: "var(--ink)" }}>{orgName.charAt(0)}</div>
          <div><div className={`${heading} font-bold text-lg`}>{orgName}</div><span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Verified Institution</span></div>
        </div>
        <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Profile editing coming soon. Contact support to update details.</p>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${heading} font-bold text-base mb-4`}>Notifications</h3>
        <div className="space-y-3">
          {[
            { label: "New student applications", desc: "When your students apply to jobs" },
            { label: "Placement updates", desc: "When students receive offers" },
            { label: "Weekly report", desc: "Summary of all student activity" },
          ].map((n) => (
            <label key={n.label} className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
              <div><div className={`${heading} font-bold text-sm`}>{n.label}</div><div className="text-xs" style={{ color: "var(--muted)" }}>{n.desc}</div></div>
              <input type="checkbox" defaultChecked className="accent-[var(--ink)] w-4 h-4" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
