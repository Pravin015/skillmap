"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";

export default function WriteBlogPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as { role?: string })?.role;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!["ADMIN", "MENTOR", "HR"].includes(userRole || "")) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="text-5xl mb-4">🔒</div><p className={`${heading} font-bold text-xl`}>Access Denied</p><p className="text-sm" style={{ color: "var(--muted)" }}>Only Admin, Mentors, and HR can write blog posts</p></div></div>;
  }

  async function handlePublish(asDraft: boolean) {
    if (!title || !content) { setMessage({ type: "error", text: "Title and content required" }); return; }
    setSaving(true); setMessage(null);
    try {
      const res = await fetch("/api/blog", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, excerpt, coverImage, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), category: category || undefined, videoUrl: videoUrl || undefined, status: asDraft ? "DRAFT" : "PUBLISH" }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: data.error }); return; }
      const statusMsg = userRole === "ADMIN" ? "Published!" : asDraft ? "Saved as draft" : "Submitted for admin review";
      setMessage({ type: "success", text: statusMsg });
      setTimeout(() => router.push(`/blog/${data.post.slug}`), 2000);
    } catch { setMessage({ type: "error", text: "Failed to save" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className={`${heading} font-bold text-2xl`}>Write a Blog Post</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{userRole === "ADMIN" ? "Your posts are published immediately" : "Your post will be submitted for admin approval"}</p>
        </div>

        {message && <div className={`rounded-xl p-4 text-sm mb-6 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

        <div className="space-y-6">
          {/* Cover image */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${heading} font-bold text-base mb-4`}>Cover Image</h2>
            <div className="flex items-center gap-4">
              {coverImage ? <img src={coverImage} alt="" className="w-40 h-24 rounded-xl object-cover" /> : <div className="w-40 h-24 rounded-xl flex items-center justify-center text-2xl" style={{ background: "var(--border)" }}>🖼️</div>}
              <label className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs cursor-pointer`} style={{ background: "var(--primary)", color: "white" }}>
                {coverImage ? "Change" : "Upload"} <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 2 * 1024 * 1024) { alert("Max 2MB"); return; } const r = new FileReader(); r.onload = () => setCoverImage(r.result as string); r.readAsDataURL(f); }} />
              </label>
            </div>
          </div>

          {/* Title + Meta */}
          <div className="rounded-2xl border bg-white p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your blog post title" className={`${inputClass} text-lg font-bold`} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Excerpt</label>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary (auto-generated if empty)" rows={2} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Tags</label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="career, cybersecurity, tips (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option value="">Select</option><option>Career Advice</option><option>Industry Insights</option><option>Skill Building</option><option>Interview Prep</option><option>Success Stories</option><option>Tech Trends</option><option>Other</option>
                </select></div>
            </div>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Video URL (YouTube/Vimeo)</label>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          </div>

          {/* Content */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <label className={`block text-sm font-medium mb-1.5 ${heading}`}>Content * <span className="font-normal" style={{ color: "var(--muted)" }}>(HTML supported)</span></label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your blog post content here. HTML tags are supported for formatting: <h2>, <p>, <ul>, <li>, <strong>, <em>, <a href>, <blockquote>, etc." rows={20} className={`${inputClass} resize-none font-mono text-xs`} style={{ borderColor: "var(--border)" }} />
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Tip: Use &lt;h2&gt; for headings, &lt;p&gt; for paragraphs, &lt;ul&gt;&lt;li&gt; for lists, &lt;strong&gt; for bold</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => handlePublish(false)} disabled={saving} className={`px-6 py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
              {saving ? "Saving..." : userRole === "ADMIN" ? "Publish Now" : "Submit for Review"}
            </button>
            <button onClick={() => handlePublish(true)} disabled={saving} className={`px-6 py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50 border`} style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
