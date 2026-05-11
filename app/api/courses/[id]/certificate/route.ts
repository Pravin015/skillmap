import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — generate certificate after 100% completion
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userName = (session?.user as { name?: string })?.name;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Check enrollment at 100%
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId: id } },
  });
  if (!enrollment || enrollment.progress < 100) {
    return NextResponse.json({ error: "Complete all modules before requesting a certificate" }, { status: 400 });
  }

  // Check if cert already issued
  const existing = await prisma.courseCertificate.findUnique({
    where: { courseId_userId: { courseId: id, userId } },
  });
  if (existing) return NextResponse.json({ certificate: existing });

  const course = await prisma.course.findUnique({ where: { id }, select: { title: true } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Generate unique certificate ID
  const certId = "CERT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

  const certificate = await prisma.courseCertificate.create({
    data: {
      courseId: id,
      userId,
      userName: userName || "Student",
      courseTitle: course.title,
      certificateId: certId,
    },
  });

  return NextResponse.json({ certificate }, { status: 201 });
}

// GET — get certificate for this course+user
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const certificate = await prisma.courseCertificate.findUnique({
    where: { courseId_userId: { courseId: id, userId } },
  });
  return NextResponse.json({ certificate });
}
