import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveImage } from "@/lib/resolve-image";

// GET — single blog post
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  // Increment views
  await prisma.blogPost.update({ where: { slug }, data: { views: { increment: 1 } } });

  return NextResponse.json({
    post: { ...post, coverImageUrl: await resolveImage(post.coverImageUrl) },
  });
}

// PATCH — update post (author or admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  if (userRole !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();

  if (body.action === "approve") {
    const updated = await prisma.blogPost.update({ where: { slug }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    return NextResponse.json({ post: updated });
  }
  if (body.action === "reject") {
    const updated = await prisma.blogPost.update({ where: { slug }, data: { status: "REJECTED" } });
    return NextResponse.json({ post: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  await prisma.blogPost.delete({ where: { slug } });
  return NextResponse.json({ success: true });
}
