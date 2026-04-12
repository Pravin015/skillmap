import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateProfileNumber } from "@/lib/profile-number";

// GET — list students belonging to this institution
export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || (userRole !== "INSTITUTION" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const students = await prisma.studentProfile.findMany({
    where: { institutionId: userId },
    include: {
      user: { select: { id: true, name: true, email: true, degree: true, gradYear: true, createdAt: true } },
      _count: { select: { experiences: true, certifications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get application counts for each student
  const studentsWithApps = await Promise.all(
    students.map(async (s) => {
      const appCount = await prisma.application.count({ where: { userId: s.userId } });
      return { ...s, applicationCount: appCount };
    })
  );

  return NextResponse.json({ students: studentsWithApps });
}

// POST — create a student account under this institution
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || (userRole !== "INSTITUTION" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, email, degree, gradYear } = await req.json();
  if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const institution = await prisma.user.findUnique({ where: { id: userId } });

  const tempPassword = Math.random().toString(36).slice(-8) + "S1!";
  const hashed = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "STUDENT",
      degree: degree || null,
      gradYear: gradYear || null,
    },
  });

  // Create student profile linked to institution
  const profile = await prisma.studentProfile.create({
    data: {
      userId: user.id,
      profileNumber: generateProfileNumber(),
      institutionId: userId,
      collegeName: institution?.organisation || institution?.name || null,
    },
  });

  return NextResponse.json({
    student: { id: user.id, name: user.name, email: user.email, profileNumber: profile.profileNumber },
    tempPassword,
  }, { status: 201 });
}

// DELETE — remove a student from institution
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || (userRole !== "INSTITUTION" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const studentUserId = searchParams.get("id");
  if (!studentUserId) return NextResponse.json({ error: "Student ID required" }, { status: 400 });

  // Verify student belongs to this institution
  const profile = await prisma.studentProfile.findFirst({
    where: { userId: studentUserId, institutionId: userId },
  });

  if (!profile) return NextResponse.json({ error: "Student not found in your institution" }, { status: 404 });

  await prisma.user.delete({ where: { id: studentUserId } });
  return NextResponse.json({ success: true });
}
