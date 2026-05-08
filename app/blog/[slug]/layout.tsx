// Server-side metadata for blog posts.
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost
    .findUnique({
      where: { slug },
      select: { title: true, excerpt: true, coverImageUrl: true, authorName: true },
    })
    .catch(() => null);

  if (!post) return { title: "Article — AstraaHire" };

  const title = `${post.title} — AstraaHire`;
  const desc = (post.excerpt || "").slice(0, 200).replace(/\s+/g, " ").trim();
  const url = `https://astraahire.com/blog/${slug}`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url,
      type: "article",
      siteName: "AstraaHire",
      ...(post.coverImageUrl ? { images: [{ url: post.coverImageUrl }] } : {}),
      authors: post.authorName ? [post.authorName] : undefined,
    },
    twitter: { card: "summary_large_image", title, description: desc, ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}) },
    alternates: { canonical: url },
  };
}

export default function BlogLayout({ children }: Props) {
  return children;
}
