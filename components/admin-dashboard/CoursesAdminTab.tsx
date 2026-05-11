"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const heading = "font-[family-name:var(--font-heading)]";

interface Course { id: string; slug: string; title: string; difficulty: string; category: string | null; pricing: string; status: string; creatorRole: string; createdBy: { name: string; organisation: string | null }; _count: { modules: number; enrollments: number }; createdAt: string }

export default function CoursesAdminTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { fetchCourses(); }, []);

  async function fetchCourses() {
    const allRes = await Promise.all(["DRAFT", "PENDING_REVIEW", "PUBLISHED"].map((s) => fetch(`/api/courses?status=${s}`).then((r) => r.json()).then((d) => d.courses || []).catch(() => [])));
    setCourses(allRes.flat());
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/courses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  }

  async function deleteCourse(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = filter === "ALL" ? courses : courses.filter((c) => c.status === filter);
  const statusColors: Record<string, string> = { DRAFT: "#6b7280", PENDING_REVIEW: "#F59E0B", PUBLISHED: "#10b981" };

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${heading} font-bold text-xl`}>Courses</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{courses.length} total courses</p>
        </div>
        <Link href="/courses/create" className="btn-primary no-underline text-xs" style={{ padding: "0.5rem 1rem" }}>+ Create Course</Link>
      </div>

      <div className="flex gap-2">
        {["ALL", "DRAFT", "PENDING_REVIEW", "PUBLISHED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className="rounded-full px-3 py-1.5 text-[10px] font-medium border transition-all" style={{ background: filter === s ? "var(--ink)" : "white", color: filter === s ? "var(--primary)" : "var(--muted)", borderColor: filter === s ? "var(--ink)" : "var(--border)" }}>
            {s.replace("_", " ")} ({s === "ALL" ? courses.length : courses.filter((c) => c.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}><div className="text-3xl mb-2">📚</div><p className="text-sm" style={{ color: "var(--muted)" }}>No courses found</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border bg-white p-4 flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`${heading} text-sm font-bold`} style={{ color: "var(--ink)" }}>{c.title}</span>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: `${statusColors[c.status]}15`, color: statusColors[c.status] }}>{c.status.replace("_", " ")}</span>
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>{c.difficulty} · {c.pricing}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                  {c.createdBy.organisation || c.createdBy.name} ({c.creatorRole}) · {c._count.modules} modules · {c._count.enrollments} enrolled
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {c.status === "PENDING_REVIEW" && <button onClick={() => updateStatus(c.id, "PUBLISHED")} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "#10b98115", color: "#10b981" }}>Publish</button>}
                {c.status === "PENDING_REVIEW" && <button onClick={() => updateStatus(c.id, "DRAFT")} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "#F59E0B15", color: "#F59E0B" }}>Reject</button>}
                <a href={`/courses/${c.slug}`} target="_blank" className="text-[10px] px-2 py-1 rounded-lg border no-underline" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>View ↗</a>
                <button onClick={() => deleteCourse(c.id, c.title)} className="text-[10px] px-2 py-1 rounded-lg border" style={{ borderColor: "var(--border)", color: "#ef4444" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
