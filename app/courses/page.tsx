"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
const heading = "font-[family-name:var(--font-heading)]";

interface Course { id: string; slug: string; title: string; description: string; coverImageUrl: string | null; duration: string | null; difficulty: string; skills: string[]; category: string | null; pricing: string; price: number | null; status: string; enrollmentCount: number; createdBy: { name: string; organisation: string | null }; _count: { modules: number; enrollments: number }; createdAt: string }

const diffColors: Record<string, string> = { Beginner: "#10b981", Intermediate: "#F59E0B", Advanced: "#ef4444" };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState("ALL");
  const [pricing, setPricing] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (difficulty !== "ALL") params.set("difficulty", difficulty);
    if (pricing !== "ALL") params.set("pricing", pricing);
    fetch(`/api/courses?${params}`).then((r) => r.json()).then((d) => { setAllCourses(d.courses || []); setCourses(d.courses || []); setLoading(false); });
  }, [difficulty, pricing]);

  useEffect(() => {
    if (!search.trim()) { setCourses(allCourses); return; }
    const q = search.toLowerCase();
    setCourses(allCourses.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.skills.some((s) => s.toLowerCase().includes(q)) || (c.category || "").toLowerCase().includes(q)));
  }, [search, allCourses]);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section className="blob-bg blob-bg-soft pb-12 pt-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="section-eyebrow mx-auto">Courses</div>
          <h1 className="font-semibold mb-3" style={{ color: "var(--ink)" }}>Learn what companies actually want</h1>
          <p className="text-sm md:text-base max-w-xl mx-auto mb-6" style={{ color: "var(--muted)" }}>Courses built by institutions and verified experts. Learn the exact skills that get you hired.</p>
          <div className="max-w-md mx-auto">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, skill, or category…" className="w-full rounded-full px-5 py-3 text-sm outline-none bg-white border" style={{ borderColor: "var(--border)", color: "var(--ink)" }} />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap gap-4">
          <div className="flex gap-1.5">
            {["ALL", "Beginner", "Intermediate", "Advanced"].map((d) => (
              <button key={d} onClick={() => setDifficulty(d)} className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all" style={{ background: difficulty === d ? "var(--ink)" : "white", color: difficulty === d ? "var(--primary)" : "var(--muted)", borderColor: difficulty === d ? "var(--ink)" : "var(--border)" }}>{d === "ALL" ? "All Levels" : d}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {["ALL", "FREE", "PAID"].map((p) => (
              <button key={p} onClick={() => setPricing(p)} className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all" style={{ background: pricing === p ? "var(--ink)" : "white", color: pricing === p ? "var(--primary)" : "var(--muted)", borderColor: pricing === p ? "var(--ink)" : "var(--border)" }}>{p === "ALL" ? "All" : p}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📚</div>
            <p className={`${heading} font-bold text-base mb-1`}>No courses found</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Check back soon for new courses!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`} className="card-dark no-underline" style={{ padding: "1.5rem" }}>
                {course.coverImageUrl && <img src={course.coverImageUrl} alt={course.title} className="w-full h-40 object-cover rounded-lg mb-3" />}
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${diffColors[course.difficulty] || "#6b7280"}15`, color: diffColors[course.difficulty] || "#6b7280" }}>{course.difficulty}</span>
                  {course.pricing === "FREE" ? (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#10b98115", color: "#10b981" }}>Free</span>
                  ) : (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#F59E0B15", color: "#F59E0B" }}>Rs.{(course.price || 0) / 100}</span>
                  )}
                  {course.category && <span className="text-[10px]" style={{ color: "#9A95A6" }}>{course.category}</span>}
                </div>
                <h3 className={`${heading} text-base font-bold mb-1`} style={{ color: "#fff" }}>{course.title}</h3>
                <p className="text-xs mb-3 line-clamp-2" style={{ color: "#6B6776" }}>{course.description}</p>
                {course.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {course.skills.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-full px-2 py-0.5 text-[9px]" style={{ background: "rgba(255,255,255,0.05)", color: "#6B6776" }}>{s}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)", color: "#9A95A6" }}>
                  <span>{course.createdBy.organisation || course.createdBy.name}</span>
                  <span>{course._count.modules} modules · {course._count.enrollments} enrolled</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
