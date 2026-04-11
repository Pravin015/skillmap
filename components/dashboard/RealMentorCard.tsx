"use client";

const syne = "font-[family-name:var(--font-syne)]";

export default function RealMentorCard() {
  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${syne} font-bold text-base`}>Real Mentors</h3>
        <span className={`text-[0.6rem] px-2 py-0.5 rounded-full ${syne} font-bold`} style={{ background: "var(--accent)", color: "var(--ink)" }}>COMING SOON</span>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Book 1-on-1 calls with professionals from your dream companies</p>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <div className="w-10 h-10 rounded-full shrink-0" style={{ background: "var(--border)" }} />
            <div className="flex-1">
              <div className="h-3 w-28 rounded" style={{ background: "var(--border)" }} />
              <div className="h-2.5 w-40 rounded mt-1.5" style={{ background: "var(--border)" }} />
            </div>
            <div className="h-8 w-20 rounded-lg" style={{ background: "var(--border)" }} />
          </div>
        ))}
      </div>
      <p className="text-center text-xs mt-4" style={{ color: "var(--muted)" }}>Mentors will appear once the feature launches</p>
    </div>
  );
}
