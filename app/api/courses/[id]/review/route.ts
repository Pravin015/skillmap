import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reviews = await prisma.courseReview.findMany({
    where: { courseId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const avg = reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
  return NextResponse.json({ reviews, average: avg, count: reviews.length });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userName = (session?.user as { name?: string })?.name;
  if (!userId) return NextResponse.json({ error: "Please login" }, { status: 401 });

  const { id } = await params;
  const { rating, review } = await req.json();

  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });

  // Check if enrolled and completed
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId: id } },
  });
  if (!enrollment) return NextResponse.json({ error: "You must be enrolled to review" }, { status: 400 });

  // Check already reviewed
  const existing = await prisma.courseReview.findUnique({
    where: { courseId_userId: { courseId: id, userId } },
  });
  if (existing) return NextResponse.json({ error: "You already reviewed this course" }, { status: 400 });

  const newReview = await prisma.courseReview.create({
    data: { courseId: id, userId, userName: userName || "Student", rating, review: review || null },
  });

  // Update course average rating
  const allReviews = await prisma.courseReview.findMany({ where: { courseId: id }, select: { rating: true } });
  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  await prisma.course.update({ where: { id }, data: { rating: Math.round(avg * 10) / 10 } });

  return NextResponse.json({ review: newReview }, { status: 201 });
}
