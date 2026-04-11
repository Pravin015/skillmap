"use client";

const syne = "font-[family-name:var(--font-syne)]";

export default function JobPostsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>All Job Posts</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>View and manage job postings across the platform</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["All", "Active", "Closed", "Under Review"].map((f, i) => (
          <button key={f} className={`px-4 py-2 rounded-xl text-xs ${syne} font-bold`} style={{ background: i === 0 ? "var(--ink)" : "white", color: i === 0 ? "var(--accent)" : "var(--muted)", border: i === 0 ? "none" : "1px solid var(--border)" }}>{f}</button>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
        <div className="text-4xl mb-3">💼</div>
        <p className={`${syne} font-bold text-base mb-1`}>No job posts yet</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Job posts from HRs and companies will appear here for review and management</p>
      </div>
    </div>
  );
}
