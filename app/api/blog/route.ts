import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToGCS, isGCSConfigured } from "@/lib/gcs";

// GET — list blog posts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tag = searchParams.get("tag");
  const mine = searchParams.get("mine");

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;

  const where: Record<string, unknown> = {};

  // Public: only published
  if (!userRole || (userRole !== "ADMIN" && !mine)) {
    where.status = "PUBLISHED";
  }
  if (status && userRole === "ADMIN") where.status = status;
  if (tag) where.tags = { has: tag };
  if (mine === "true" && userId) where.authorId = userId;

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ posts });
}

// POST — create blog post
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;

  if (!userId || !["ADMIN", "MENTOR", "HR"].includes(userRole || "")) {
    return NextResponse.json({ error: "Only Admin, Mentors, and HR can write blog posts" }, { status: 403 });
  }

  const { title, content, excerpt, coverImage, tags, category, videoUrl, status } = await req.json();
  if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });

  // Generate slug
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  // Upload cover image to GCS if provided
  let coverImageUrl = null;
  if (coverImage && coverImage.startsWith("data:image/")) {
    if (isGCSConfigured()) {
      try {
        const ext = coverImage.startsWith("data:image/png") ? "png" : "jpg";
        const path = await uploadToGCS(coverImage, "blog-covers", `${slug}.${ext}`);
        coverImageUrl = `gcs:${path}`;
      } catch { coverImageUrl = coverImage; }
    } else {
      coverImageUrl = coverImage;
    }
  }

  // Estimate read time (avg 200 words/min)
  const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  // Admin publishes directly, others submit for review
  const postStatus = userRole === "ADMIN"
    ? (status === "DRAFT" ? "DRAFT" : "PUBLISHED")
    : (status === "DRAFT" ? "DRAFT" : "PENDING_REVIEW");

  const post = await prisma.blogPost.create({
    data: {
      slug, title, content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, "").slice(0, 200),
      coverImageUrl, authorId: userId,
      authorName: session?.user?.name || "Unknown",
      authorRole: userRole || "ADMIN",
      status: postStatus,
      tags: tags || [],
      category: category || null,
      videoUrl: videoUrl || null,
      readTime,
      publishedAt: postStatus === "PUBLISHED" ? new Date() : null,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
