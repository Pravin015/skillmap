"use client";
import { coursesMap, Course } from "@/lib/mock-dashboard";

const heading = "font-[family-name:var(--font-heading)]";

const platformColors: Record<string, string> = {
  YouTube: "bg-red-100 text-red-700", Coursera: "bg-blue-100 text-blue-700", Udemy: "bg-[#EDE9FE] text-[#7C3AED]",
  "Khan Academy": "bg-green-100 text-green-700", "AWS Training": "bg-orange-100 text-orange-700",
  "HashiCorp Learn": "bg-cyan-100 text-cyan-700", NeetCode: "bg-emerald-100 text-emerald-700",
};

export default function CoursesCard({ domainKey }: { domainKey: string }) {
  const courses: Course[] = coursesMap[domainKey] || [];

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${heading} font-bold text-base`}>Recommended Courses</h3>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Based on your interest in {domainKey || "your domain"}</p>

      {courses.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">📚</div>
          <p className={`${heading} font-bold text-sm mb-1`}>No courses for this domain yet</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Complete your profile to get recommendations</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {courses.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className={`${heading} font-bold text-sm`}>{c.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full ${platformColors[c.platform] || "bg-gray-100 text-gray-700"}`}>{c.platform}</span>
                  <span className="text-[0.65rem]" style={{ color: "var(--muted)" }}>{c.duration} · {c.skill}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.free && <span className={`${heading} text-[0.6rem] font-bold px-1.5 py-0.5 rounded`} style={{ background: "var(--primary)", color: "var(--ink)" }}>FREE</span>}
                <a href={c.url} className={`px-3 py-1.5 rounded-lg ${heading} font-bold text-[0.7rem] no-underline`} style={{ background: "var(--primary)", color: "white" }}>Start</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
