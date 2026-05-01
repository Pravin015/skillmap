"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
const heading = "font-[family-name:var(--font-heading)]";

export default function CreateCoursePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as { role?: string })?.role;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [skills, setSkills] = useState("");
  const [category, setCategory] = useState("");
  const [pricing, setPricing] = useState("FREE");
  const [price, setPrice] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [sequentialUnlock, setSequentialUnlock] = useState(false);
  const [modules, setModules] = useState([{ title: "", content: "", videoUrl: "", duration: "", hasQuiz: false, quizQuestions: "[]" }]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  if (userRole !== "ADMIN" && userRole !== "INSTITUTION") {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}><p style={{ color: "var(--muted)" }}>Only Admin and Institutions can create courses.</p></div>;
  }

  function addModule() { setModules([...modules, { title: "", content: "", videoUrl: "", duration: "", hasQuiz: false, quizQuestions: "[]" }]); }
  function removeModule(i: number) { setModules(modules.filter((_, idx) => idx !== i)); }
  function updateModule(i: number, field: string, value: string | boolean) { const m = [...modules]; (m[i] as Record<string, string | boolean>)[field] = field === "hasQuiz" ? !!value : value; setModules(m); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description) { setMsg("Title and description required"); return; }
    setSaving(true); setMsg("");

    const res = await fetch("/api/courses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, duration, difficulty, skills: skills.split(",").map((s) => s.trim()).filter(Boolean), category, pricing, price: pricing === "PAID" ? parseInt(price) * 100 : null, videoUrl, sequentialUnlock, modules: modules.filter((m) => m.title.trim()).map((m) => ({ ...m, hasQuiz: m.hasQuiz, quizQuestions: m.hasQuiz ? m.quizQuestions : null })) }),
    });
    const data = await res.json();
    if (res.ok) { router.push(`/courses/${data.course.slug}`); }
    else { setMsg(data.error || "Failed to create course"); setSaving(false); }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className={`${heading} text-2xl font-bold mb-2`} style={{ color: "var(--ink)" }}>Create New Course</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          {userRole === "ADMIN" ? "Your course will be published immediately." : "Your course will be submitted for admin review."}
        </p>

        {msg && <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "#fef2f2", color: "#ef4444" }}>{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${heading} text-sm font-bold mb-4`}>Course Details</h2>
            <div className="space-y-4">
              <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Title *</label><input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Python for Data Science — Complete Guide" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder="What students will learn, who this course is for..." className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Duration</label><input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 4 weeks" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
                <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Difficulty</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
                <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Category</label><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Technology" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
              </div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Skills (comma-separated)</label><input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, Data Analysis, Pandas, NumPy" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Course Intro Video URL</label><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube or Vimeo embed URL" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} /></div>
              <div className="flex items-center gap-4">
                <label className="text-xs font-medium" style={{ color: "var(--ink)" }}>Pricing:</label>
                <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="pricing" checked={pricing === "FREE"} onChange={() => setPricing("FREE")} /> <span className="text-xs">Free</span></label>
                <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="pricing" checked={pricing === "PAID"} onChange={() => setPricing("PAID")} /> <span className="text-xs">Paid</span></label>
                {pricing === "PAID" && <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price in Rs." className="rounded-xl border px-3 py-1.5 text-sm w-32 outline-none" style={{ borderColor: "var(--border)" }} />}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sequentialUnlock} onChange={(e) => setSequentialUnlock(e.target.checked)} className="accent-[var(--primary)] w-4 h-4" />
                <span className="text-xs" style={{ color: "var(--ink)" }}>Sequential unlock — students must complete modules in order</span>
              </label>
            </div>
          </div>

          {/* Modules */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${heading} text-sm font-bold`}>Course Modules ({modules.length})</h2>
              <button type="button" onClick={addModule} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--primary)", color: "white" }}>+ Add Module</button>
            </div>
            <div className="space-y-4">
              {modules.map((m, i) => (
                <div key={i} className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`${heading} text-xs font-bold`} style={{ color: "var(--primary)" }}>Module {i + 1}</span>
                    {modules.length > 1 && <button type="button" onClick={() => removeModule(i)} className="text-xs" style={{ color: "#ef4444" }}>Remove</button>}
                  </div>
                  <div className="space-y-3">
                    <input value={m.title} onChange={(e) => updateModule(i, "title", e.target.value)} placeholder="Module title" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
                    <textarea value={m.content} onChange={(e) => updateModule(i, "content", e.target.value)} placeholder="Module content (HTML or plain text)" rows={4} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={m.videoUrl} onChange={(e) => updateModule(i, "videoUrl", e.target.value)} placeholder="Video URL (optional)" className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
                      <input value={m.duration} onChange={(e) => updateModule(i, "duration", e.target.value)} placeholder="Duration (e.g., 15 min)" className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input type="checkbox" checked={m.hasQuiz} onChange={(e) => updateModule(i, "hasQuiz", e.target.checked ? "true" : "")} className="accent-[var(--primary)] w-4 h-4" />
                      <span className="text-xs" style={{ color: "var(--ink)" }}>Add quiz to this module</span>
                    </label>
                    {m.hasQuiz && (
                      <div className="mt-2 rounded-lg p-3" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                        <p className="text-[10px] mb-2" style={{ color: "var(--muted)" }}>Quiz JSON format: [{`{"question":"...", "options":["A","B","C","D"], "correctAnswer":0}`}]</p>
                        <textarea value={m.quizQuestions} onChange={(e) => updateModule(i, "quizQuestions", e.target.value)} rows={4} placeholder='[{"question":"What is Python?","options":["Language","Framework","Database","OS"],"correctAnswer":0}]' className="w-full rounded-lg border px-3 py-2 text-xs font-mono outline-none" style={{ borderColor: "var(--border)" }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full" style={{ padding: "0.9rem" }}>{saving ? "Creating..." : "Create Course"}</button>
        </form>
      </div>
    </div>
  );
}
