"use client";

const syne = "font-[family-name:var(--font-syne)]";

export default function CoursesCard({ domainKey }: { domainKey: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${syne} font-bold text-base`}>Recommended Courses</h3>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Courses tailored to your skill gaps in {domainKey || "your domain"}</p>

      <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
        <div className="text-3xl mb-3">📚</div>
        <p className={`${syne} font-bold text-sm mb-1`}>No courses assigned yet</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>Once your skill gap is analysed, personalised course recommendations will appear here</p>
      </div>

      {/* Platform badges preview */}
      <div className="flex flex-wrap gap-2 mt-4">
        {["YouTube", "Coursera", "Udemy", "Official docs"].map((p) => (
          <span key={p} className="text-[0.6rem] font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{p}</span>
        ))}
      </div>
    </div>
  );
}
