"use client";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
const heading = "font-[family-name:var(--font-heading)]";

interface Module { id: string; title: string; content: string; videoUrl: string | null; duration: string | null; order: number }
interface CourseData { id: string; slug: string; title: string; description: string; coverImageUrl: string | null; duration: string | null; difficulty: string; skills: string[]; category: string | null; pricing: string; price: number | null; videoUrl: string | null; enrollmentCount: number; createdBy: { name: string; organisation: string | null }; modules: Module[]; _count: { enrollments: number }; createdAt: string }
interface Enrollment { id: string; progress: number; completedModules: string[] }

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: session } = useSession();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/courses/${slug}`).then((r) => r.json()).then((d) => { setCourse(d.course); setEnrollment(d.enrollment); if (d.course?.modules?.[0]) setActiveModule(d.course.modules[0].id); setLoading(false); });
  }, [slug]);

  async function handleEnroll() {
    if (!session) { window.location.href = "/auth/login"; return; }
    if (!course) return;
    setEnrolling(true);
    const res = await fetch(`/api/courses/${course.id}/enroll`, { method: "POST" });
    const data = await res.json();
    if (res.ok) { setEnrollment(data.enrollment); setMsg("Enrolled successfully!"); }
    else setMsg(data.error || "Enrollment failed");
    setEnrolling(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function markComplete(moduleId: string) {
    if (!course || !enrollment) return;
    await fetch(`/api/courses/${course.id}/progress`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleId }) });
    setEnrollment((prev) => prev ? { ...prev, completedModules: [...prev.completedModules, moduleId], progress: Math.round(((prev.completedModules.length + 1) / course.modules.length) * 100) } : prev);
  }

  if (loading || !course) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  const currentModule = course.modules.find((m) => m.id === activeModule);
  const diffColors: Record<string, string> = { Beginner: "#10b981", Intermediate: "#F59E0B", Advanced: "#ef4444" };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section style={{ background: "#0C1A1A", paddingTop: "7rem", paddingBottom: "3rem" }}>
        <div className="mx-auto max-w-5xl px-4">
          <Link href="/courses" className="text-xs no-underline mb-3 inline-block" style={{ color: "rgba(255,255,255,0.5)" }}>← Back to courses</Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${diffColors[course.difficulty]}15`, color: diffColors[course.difficulty] }}>{course.difficulty}</span>
            {course.pricing === "FREE" ? <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#10b98115", color: "#10b981" }}>Free</span> : <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#F59E0B15", color: "#F59E0B" }}>Rs.{(course.price || 0) / 100}</span>}
            {course.category && <span className="text-[10px]" style={{ color: "#4A6363" }}>{course.category}</span>}
          </div>
          <h1 className={`${heading} text-2xl md:text-3xl font-bold text-white mb-2`}>{course.title}</h1>
          <p className="text-sm mb-3" style={{ color: "#6B8F8F" }}>{course.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "#4A6363" }}>
            <span>By {course.createdBy.organisation || course.createdBy.name}</span>
            {course.duration && <span>{course.duration}</span>}
            <span>{course.modules.length} modules</span>
            <span>{course._count.enrollments} enrolled</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {msg && <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "#10b98115", color: "#10b981" }}>{msg}</div>}

        {/* Enroll / Progress bar */}
        {!enrollment ? (
          <div className="rounded-xl border bg-white p-5 mb-6 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <div>
              <p className={`${heading} font-bold text-sm`} style={{ color: "var(--ink)" }}>Start learning today</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{course.modules.length} modules · {course.duration || "Self-paced"}</p>
            </div>
            <button onClick={handleEnroll} disabled={enrolling} className="btn-primary" style={{ padding: "0.6rem 1.5rem" }}>{enrolling ? "Enrolling..." : "Enroll — Free"}</button>
          </div>
        ) : (
          <div className="rounded-xl border bg-white p-5 mb-6" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "var(--ink)" }}>Your Progress</span>
              <span className={`${heading} text-sm font-bold`} style={{ color: "var(--primary)" }}>{enrollment.progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${enrollment.progress}%`, background: "var(--primary)" }} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module sidebar */}
          <div className="lg:col-span-1">
            <h3 className={`${heading} text-sm font-bold mb-3`} style={{ color: "var(--ink)" }}>Modules ({course.modules.length})</h3>
            <div className="space-y-1">
              {course.modules.map((m, i) => {
                const isComplete = enrollment?.completedModules.includes(m.id);
                const isActive = activeModule === m.id;
                return (
                  <button key={m.id} onClick={() => setActiveModule(m.id)} className="w-full text-left rounded-lg p-3 transition-all" style={{ background: isActive ? "rgba(10,191,188,0.08)" : "white", border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs shrink-0" style={{ color: isComplete ? "#10b981" : "var(--muted)" }}>{isComplete ? "✓" : `${i + 1}.`}</span>
                      <span className="text-xs font-medium" style={{ color: isActive ? "var(--primary)" : "var(--ink)" }}>{m.title}</span>
                    </div>
                    {m.duration && <span className="text-[10px] ml-5" style={{ color: "var(--muted)" }}>{m.duration}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module content */}
          <div className="lg:col-span-2">
            {currentModule ? (
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${heading} text-lg font-bold mb-3`} style={{ color: "var(--ink)" }}>{currentModule.title}</h2>
                {currentModule.videoUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe src={currentModule.videoUrl} className="w-full h-full" allowFullScreen />
                  </div>
                )}
                <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }} dangerouslySetInnerHTML={{ __html: currentModule.content }} />
                {enrollment && !enrollment.completedModules.includes(currentModule.id) && (
                  <button onClick={() => markComplete(currentModule.id)} className="btn-primary mt-4" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>Mark as Complete ✓</button>
                )}
                {enrollment?.completedModules.includes(currentModule.id) && (
                  <div className="mt-4 text-sm font-medium" style={{ color: "#10b981" }}>✓ Completed</div>
                )}
              </div>
            ) : (
              <div className="text-center py-12" style={{ color: "var(--muted)" }}>Select a module to start learning</div>
            )}
          </div>
        </div>

        {/* Skills */}
        {course.skills.length > 0 && (
          <div className="mt-8">
            <h3 className={`${heading} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>Skills You'll Learn</h3>
            <div className="flex flex-wrap gap-2">
              {course.skills.map((s) => <span key={s} className="rounded-full px-3 py-1 text-xs" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--ink)" }}>{s}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
