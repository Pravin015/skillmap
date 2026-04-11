"use client";

const syne = "font-[family-name:var(--font-syne)]";

export default function PlatformSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Platform Settings</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Configure platform-wide settings</p>
      </div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>General</h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Platform Name</label>
            <input type="text" defaultValue="SkillMap" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }} readOnly />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Support Email</label>
            <input type="email" defaultValue="support@skillmap.com" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }} readOnly />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>Feature Toggles</h3>
        <div className="space-y-3">
          {[
            { label: "AI Chat", desc: "Enable AI career advisor chat", enabled: true },
            { label: "Mentor Bookings", desc: "Allow students to book mentor calls", enabled: false },
            { label: "Hackathon Module", desc: "Enable hackathon/quiz creation for HRs", enabled: false },
            { label: "Job Applications", desc: "Allow students to apply directly from dashboard", enabled: false },
            { label: "Maintenance Mode", desc: "Show maintenance page to all non-admin users", enabled: false },
          ].map((f) => (
            <label key={f.label} className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className={`${syne} font-bold text-sm`}>{f.label}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{f.desc}</div>
              </div>
              <input type="checkbox" defaultChecked={f.enabled} className="accent-[var(--ink)] w-4 h-4" />
            </label>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: "var(--muted)" }}>Feature toggles are placeholders — they will be functional once backend support is added.</p>
      </div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>Danger Zone</h3>
        <div className="rounded-xl border border-red-200 p-4 flex items-center justify-between">
          <div>
            <div className={`${syne} font-bold text-sm text-red-600`}>Reset Platform Data</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>Delete all users, profiles, and data. This cannot be undone.</div>
          </div>
          <button className="px-4 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-200 cursor-not-allowed opacity-50" disabled>Reset All</button>
        </div>
      </div>
    </div>
  );
}
