import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Please login to enroll" }, { status: 401 });

  const { id } = await params;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course || course.status !== "PUBLISHED") return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Check already enrolled
  const existing = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId: id } },
  });
  if (existing) return NextResponse.json({ error: "Already enrolled" }, { status: 400 });

  const enrollment = await prisma.courseEnrollment.create({
    data: { userId, courseId: id },
  });

  // Increment enrollment count
  await prisma.course.update({
    where: { id },
    data: { enrollmentCount: { increment: 1 } },
  });

  return NextResponse.json({ enrollment }, { status: 201 });
}
