"use client";

const heading = "font-[family-name:var(--font-heading)]";

interface HR { id: string; name: string; email: string; phone: string | null; createdAt: string }

export default function HRTracker({ hrs }: { hrs: HR[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>HR Performance Tracker</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Track each HR&apos;s activity, job posts, and hiring performance</p>
      </div>

      {hrs.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">📊</div>
          <p className={`${heading} font-bold text-base mb-1`}>No HRs to track</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Add HR accounts first to see their activity here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hrs.map((hr) => (
            <div key={hr.id} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${heading} font-bold text-sm text-white`} style={{ background: "var(--ink)" }}>
                  {hr.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className={`${heading} font-bold`}>{hr.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{hr.email}</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Job Posts", value: "0" },
                  { label: "Applications", value: "—" },
                  { label: "Interviews", value: "—" },
                  { label: "Offers Made", value: "—" },
                  { label: "Hired", value: "—" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--border)" }}>
                    <div className={`${heading} text-lg font-extrabold`}>{m.value}</div>
                    <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent job posts placeholder */}
              <div className="mt-4 rounded-xl border-2 border-dashed p-4 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                No job posts yet from this HR
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
