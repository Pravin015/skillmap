"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const heading = "font-[family-name:var(--font-heading)]";

interface Post { slug: string; title: string; excerpt: string | null; coverImageUrl: string | null; authorName: string; authorRole: string; tags: string[]; category: string | null; readTime: number | null; views: number; publishedAt: string | null; videoUrl: string | null }

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]); const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState("");

  useEffect(() => {
    const url = tag ? `/api/blog?tag=${tag}` : "/api/blog";
    fetch(url).then((r) => r.json()).then((d) => setPosts(d.posts || [])).finally(() => setLoading(false));
  }, [tag]);

  const allTags = [...new Set(posts.flatMap((p) => p.tags))];

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <section className="py-12 px-4 md:px-8" style={{ background: "var(--ink)" }}>
        <div className="max-w-5xl mx-auto">
          <h1 className={`${heading} font-bold text-3xl md:text-4xl text-white mb-2`}>Blog</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Career advice, industry insights, and skill-building tips from mentors and experts</p>
        </div>
      </section>

      {allTags.length > 0 && (
        <section className="py-4 px-4 md:px-8 border-b" style={{ background: "white", borderColor: "var(--border)" }}>
          <div className="max-w-5xl mx-auto flex gap-2 flex-wrap">
            <button onClick={() => setTag("")} className={`px-3 py-1.5 rounded-xl text-xs ${heading} font-bold`} style={{ background: !tag ? "var(--ink)" : "white", color: !tag ? "var(--primary)" : "var(--muted)", border: !tag ? "none" : "1px solid var(--border)" }}>All</button>
            {allTags.map((t) => (
              <button key={t} onClick={() => setTag(t)} className={`px-3 py-1.5 rounded-xl text-xs ${heading} font-bold`} style={{ background: tag === t ? "var(--ink)" : "white", color: tag === t ? "var(--primary)" : "var(--muted)", border: tag === t ? "none" : "1px solid var(--border)" }}>{t}</button>
            ))}
          </div>
        </section>
      )}

      <section className="py-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border bg-white p-16 text-center" style={{ borderColor: "var(--border)" }}>
              <div className="text-5xl mb-4">📝</div>
              <p className={`${heading} font-bold text-lg mb-2`}>No blog posts yet</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Articles from mentors and experts will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block rounded-2xl border bg-white overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg no-underline group" style={{ borderColor: "var(--border)" }}>
                  {post.coverImageUrl && (
                    <div className="h-44 overflow-hidden"><img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>
                  )}
                  {post.videoUrl && !post.coverImageUrl && (
                    <div className="h-44 flex items-center justify-center" style={{ background: "var(--ink)" }}><span className="text-4xl">▶️</span></div>
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {post.tags.slice(0, 3).map((t) => (<span key={t} className="text-[0.6rem] px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{t}</span>))}
                    </div>
                    <h2 className={`${heading} font-bold text-base mb-2 group-hover:text-[var(--primary)] transition-colors line-clamp-2`} style={{ color: "var(--ink)" }}>{post.title}</h2>
                    <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: "var(--muted)" }}>{post.excerpt}</p>
                    <div className="flex items-center justify-between text-[0.65rem]" style={{ color: "var(--muted)" }}>
                      <span>{post.authorName} · <span className="capitalize">{post.authorRole.toLowerCase()}</span></span>
                      <span>{post.readTime} min read · {post.views} views</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
