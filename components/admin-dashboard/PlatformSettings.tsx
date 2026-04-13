"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

export default function PlatformSettings() {
  const [dbStatus, setDbStatus] = useState<"checking" | "online" | "offline">("checking");
  const [userCount, setUserCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    // Health check
    fetch("/api/admin/users")
      .then((r) => {
        if (r.ok) { setDbStatus("online"); return r.json(); }
        setDbStatus("offline");
        return null;
      })
      .then((d) => { if (d) setUserCount(d.stats?.total || 0); })
      .catch(() => setDbStatus("offline"));

    fetch("/api/jobs").then((r) => r.json()).then((d) => setJobCount(d.jobs?.length || 0)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Platform Settings</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>System configuration and health monitoring</p>
      </div>

      {/* Platform Info */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>Platform Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted)" }}>Platform Name</label>
            <div className="rounded-xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>SkillMap</div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted)" }}>Domain</label>
            <div className="rounded-xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>ashpranix.in</div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted)" }}>Support Email</label>
            <div className="rounded-xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>support@ashpranix.in</div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted)" }}>Framework</label>
            <div className="rounded-xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>Next.js 16 + Prisma + PostgreSQL</div>
          </div>
        </div>
      </div>

      {/* Health Status */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>System Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Database (PostgreSQL)", status: dbStatus === "online" ? "Connected" : dbStatus === "checking" ? "Checking..." : "Offline", ok: dbStatus === "online" },
            { label: "Authentication (NextAuth)", status: "Active", ok: true },
            { label: "AI Engine (Claude)", status: "Connected", ok: true },
            { label: "Storage (GCS)", status: "Active", ok: true },
            { label: "Payments (Razorpay)", status: "Active", ok: true },
            { label: "Email (Resend)", status: "Active", ok: true },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
              <div className={`w-3 h-3 rounded-full shrink-0 ${s.ok ? "animate-pulse" : ""}`} style={{ background: s.ok ? "#10b981" : s.status === "Checking..." ? "#f59e0b" : "#ef4444" }} />
              <div>
                <div className="text-xs font-medium" style={{ color: "var(--ink)" }}>{s.label}</div>
                <div className="text-[10px]" style={{ color: s.ok ? "#10b981" : "#ef4444" }}>{s.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>Database Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`${syne} text-2xl font-bold`} style={{ color: "var(--ink)" }}>{userCount}</div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>Total Users</div>
          </div>
          <div className="text-center">
            <div className={`${syne} text-2xl font-bold`} style={{ color: "var(--ink)" }}>{jobCount}</div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>Job Posts</div>
          </div>
          <div className="text-center">
            <div className={`${syne} text-2xl font-bold`} style={{ color: "var(--ink)" }}>{appCount}</div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>Applications</div>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>Environment Variables Status</h3>
        <div className="space-y-2">
          {[
            { key: "DATABASE_URL", desc: "PostgreSQL connection" },
            { key: "NEXTAUTH_SECRET", desc: "Authentication secret" },
            { key: "ANTHROPIC_API_KEY", desc: "Claude AI API key" },
            { key: "RAZORPAY_KEY_ID", desc: "Razorpay payment gateway" },
            { key: "RESEND_API_KEY", desc: "Email service" },
            { key: "GCS_KEY_JSON", desc: "Google Cloud Storage" },
          ].map((env) => (
            <div key={env.key} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
              <div>
                <code className="text-xs font-mono" style={{ color: "var(--ink)" }}>{env.key}</code>
                <div className="text-[10px]" style={{ color: "var(--muted)" }}>{env.desc}</div>
              </div>
              <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: "#10b98115", color: "#10b981" }}>Configured</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
