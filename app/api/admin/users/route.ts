import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true,
      organisation: true, phone: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const mentorCount = await prisma.mentorProfile.count();
  const totalProfileViews = await prisma.profileView.count();

  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === "STUDENT").length,
    hr: users.filter((u) => u.role === "HR").length,
    org: users.filter((u) => u.role === "ORG").length,
    admin: users.filter((u) => u.role === "ADMIN").length,
    institutions: users.filter((u) => u.role === "INSTITUTION").length,
    mentorRole: users.filter((u) => u.role === "MENTOR").length,
    totalProfileViews,
    mentors: mentorCount,
  };

  return NextResponse.json({ users, stats });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  if (userId === (session.user as { id?: string })?.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}

// PATCH — change role or reset password
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId, action, newRole } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  if (userId === (session.user as { id?: string })?.id && action === "changeRole") {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  if (action === "changeRole") {
    const validRoles = ["STUDENT", "HR", "ORG", "ADMIN", "INSTITUTION", "MENTOR"];
    if (!validRoles.includes(newRole)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

    await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
    return NextResponse.json({ success: true });
  }

  if (action === "resetPassword") {
    const newPassword = Math.random().toString(36).slice(-8) + "X1!";
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return NextResponse.json({ newPassword });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
