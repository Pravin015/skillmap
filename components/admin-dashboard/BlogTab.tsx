"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const syne = "font-[family-name:var(--font-syne)]";

const statusBadge: Record<string, string> = { PUBLISHED: "bg-green-100 text-green-700", DRAFT: "bg-gray-100 text-gray-700", PENDING_REVIEW: "bg-yellow-100 text-yellow-700", REJECTED: "bg-red-100 text-red-700" };

interface Post { slug: string; title: string; authorName: string; authorRole: string; status: string; views: number; tags: string[]; createdAt: string }

export default function BlogTab() {
  const [posts, setPosts] = useState<Post[]>([]); const [loading, setLoading] = useState(true); const [filter, setFilter] = useState("ALL");

  useEffect(() => { fetchPosts(); }, []);
  async function fetchPosts() { const r = await fetch("/api/blog?status="); const d = await r.json(); setPosts(d.posts || []); setLoading(false); }

  async function handleAction(slug: string, action: string) {
    await fetch(`/api/blog/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    fetchPosts();
  }

  async function handleDelete(slug: string) { if (!confirm("Delete this post?")) return; await fetch(`/api/blog/${slug}`, { method: "DELETE" }); fetchPosts(); }

  const filtered = filter === "ALL" ? posts : posts.filter((p) => p.status === filter);
  const pending = posts.filter((p) => p.status === "PENDING_REVIEW").length;

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className={`${syne} font-bold text-xl`}>Blog Management</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{posts.length} posts · {pending} pending review</p></div>
        <Link href="/blog/write" className={`px-4 py-2.5 rounded-xl ${syne} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>+ Write Post</Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING_REVIEW", "PUBLISHED", "DRAFT", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs ${syne} font-bold`} style={{ background: filter === s ? "var(--ink)" : "white", color: filter === s ? "var(--primary)" : "var(--muted)", border: filter === s ? "none" : "1px solid var(--border)" }}>
            {s === "ALL" ? "All" : s.replace("_", " ")} ({s === "ALL" ? posts.length : posts.filter((p) => p.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}><div className="text-4xl mb-3">📝</div><p className={`${syne} font-bold text-base`}>No posts</p><Link href="/blog/write" className={`inline-block mt-3 px-4 py-2 rounded-lg ${syne} font-bold text-xs no-underline`} style={{ background: "var(--primary)", color: "white" }}>Write first post</Link></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.slug} className="rounded-2xl border bg-white p-5 flex items-center gap-4 flex-wrap" style={{ borderColor: "var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className={`${syne} font-bold`}>{p.title}</span><span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${statusBadge[p.status] || ""}`}>{p.status.replace("_", " ")}</span></div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>by {p.authorName} ({p.authorRole}) · {p.views} views · {new Date(p.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                {p.status === "PENDING_REVIEW" && (
                  <><button onClick={() => handleAction(p.slug, "approve")} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem]`} style={{ background: "var(--primary)", color: "white" }}>Publish</button>
                  <button onClick={() => handleAction(p.slug, "reject")} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium text-red-500 border border-red-200 hover:bg-red-50">Reject</button></>
                )}
                <Link href={`/blog/${p.slug}`} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border no-underline hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>View</Link>
                <button onClick={() => handleDelete(p.slug)} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium text-red-500 border border-red-200 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
