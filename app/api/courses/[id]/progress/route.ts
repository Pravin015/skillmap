import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { moduleId, progress } = await req.json();

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId: id } },
  });
  if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 400 });

  const completedModules = [...enrollment.completedModules];
  if (moduleId && !completedModules.includes(moduleId)) {
    completedModules.push(moduleId);
  }

  // Calculate progress
  const totalModules = await prisma.courseModule.count({ where: { courseId: id } });
  const newProgress = progress || (totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0);

  const updated = await prisma.courseEnrollment.update({
    where: { userId_courseId: { userId, courseId: id } },
    data: { completedModules, progress: Math.min(100, newProgress), lastAccessedAt: new Date() },
  });

  return NextResponse.json({ enrollment: updated });
}
