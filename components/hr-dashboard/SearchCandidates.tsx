"use client";

const syne = "font-[family-name:var(--font-syne)]";

export default function SearchCandidates() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Search Candidates</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Find candidates matching your requirements</p>
      </div>

      {/* Search bar */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-3">
          <input type="text" placeholder="Search by skills, domain, or location..." className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          <button className={`px-5 py-3 rounded-xl ${syne} font-bold text-sm shrink-0`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Search</button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {["Domain", "Experience", "Location", "Skills", "Graduation Year"].map((f) => (
            <select key={f} className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              <option>{f}</option>
            </select>
          ))}
        </div>
      </div>

      {/* Results placeholder */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <div className="rounded-xl border-2 border-dashed p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🔍</div>
          <p className={`${syne} font-bold text-base mb-1`}>Search for candidates</p>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--muted)" }}>Use the search bar above to find candidates by skills, domain, or location. Results with profile scores will appear here.</p>
        </div>
      </div>
    </div>
  );
}
