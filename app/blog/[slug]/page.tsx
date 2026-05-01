"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
const heading = "font-[family-name:var(--font-heading)]";

interface Post { slug: string; title: string; content: string; excerpt: string | null; coverImageUrl: string | null; authorName: string; authorRole: string; tags: string[]; category: string | null; readTime: number | null; views: number; videoUrl: string | null; publishedAt: string | null; createdAt: string }

function getEmbedUrl(url: string): string | null {
  // YouTube
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null); const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(`/api/blog/${slug}`).then((r) => r.json()).then((d) => setPost(d.post || null)).finally(() => setLoading(false)); }, [slug]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;
  if (!post) return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="text-5xl mb-4">📝</div><h1 className={`${heading} font-bold text-xl`}>Post not found</h1><Link href="/blog" className={`inline-block mt-4 px-5 py-2.5 rounded-xl ${heading} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>Back to Blog</Link></div></div>;

  const embedUrl = post.videoUrl ? getEmbedUrl(post.videoUrl) : null;

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <article className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6"><Link href="/blog" className="text-xs no-underline" style={{ color: "var(--muted)" }}>← Back to Blog</Link></div>

        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="rounded-2xl overflow-hidden mb-8 border" style={{ borderColor: "var(--border)" }}>
            <img src={post.coverImageUrl} alt={post.title} className="w-full h-64 md:h-80 object-cover" />
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((t) => (<span key={t} className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${heading}`} style={{ background: "var(--primary)", color: "white" }}>{t}</span>))}
          </div>
        )}

        {/* Title */}
        <h1 className={`${heading} font-bold text-2xl md:text-4xl mb-4`} style={{ color: "var(--ink)" }}>{post.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-8 text-sm" style={{ color: "var(--muted)" }}>
          <span className={`${heading} font-bold`}>{post.authorName}</span>
          <span className="text-[0.65rem] px-2 py-0.5 rounded-full border capitalize" style={{ borderColor: "var(--border)" }}>{post.authorRole.toLowerCase()}</span>
          <span>{post.readTime} min read</span>
          <span>{post.views} views</span>
          {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
        </div>

        {/* Video embed */}
        {embedUrl && (
          <div className="rounded-2xl overflow-hidden mb-8 border" style={{ borderColor: "var(--border)" }}>
            <div className="relative pb-[56.25%] h-0">
              <iframe src={embedUrl} className="absolute top-0 left-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="rounded-2xl border bg-white p-6 md:p-10" style={{ borderColor: "var(--border)" }}>
          <div className="legal-content" dangerouslySetInnerHTML={{ __html: (() => { try { const DOMPurify = require("isomorphic-dompurify"); return DOMPurify.sanitize(post.content); } catch { return post.content; } })() }} />
        </div>

        {/* Share */}
        <div className="mt-8 flex items-center gap-3">
          <span className="text-sm" style={{ color: "var(--muted)" }}>Share:</span>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }} className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs border`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>📋 Copy link</button>
        </div>
      </article>
    </div>
  );
}
