import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET all HRs belonging to this org
export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || (userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get the org user's organisation name
  const orgUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!orgUser?.organisation) {
    return NextResponse.json({ error: "No organisation set" }, { status: 400 });
  }

  const hrs = await prisma.user.findMany({
    where: { role: "HR", organisation: orgUser.organisation },
    select: {
      id: true, name: true, email: true, phone: true,
      createdAt: true, organisation: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ hrs, organisation: orgUser.organisation });
}

// POST — add a new HR
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || (userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const orgUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!orgUser?.organisation) {
    return NextResponse.json({ error: "No organisation set" }, { status: 400 });
  }

  const { name, email, phone } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  // Generate a temporary password
  const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const hr = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "HR",
      organisation: orgUser.organisation,
      phone: phone || null,
    },
  });

  return NextResponse.json({
    hr: { id: hr.id, name: hr.name, email: hr.email },
    tempPassword, // Show once to org admin so they can share with the HR
  }, { status: 201 });
}

// DELETE — remove an HR
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || (userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const hrId = searchParams.get("id");
  if (!hrId) return NextResponse.json({ error: "HR ID required" }, { status: 400 });

  // Verify this HR belongs to the same org
  const orgUser = await prisma.user.findUnique({ where: { id: userId } });
  const hrUser = await prisma.user.findUnique({ where: { id: hrId } });

  if (!hrUser || hrUser.role !== "HR" || hrUser.organisation !== orgUser?.organisation) {
    return NextResponse.json({ error: "HR not found in your organisation" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: hrId } });
  return NextResponse.json({ success: true });
}

// PATCH — reset HR password
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || (userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { hrId } = await req.json();
  if (!hrId) return NextResponse.json({ error: "HR ID required" }, { status: 400 });

  const orgUser = await prisma.user.findUnique({ where: { id: userId } });
  const hrUser = await prisma.user.findUnique({ where: { id: hrId } });

  if (!hrUser || hrUser.role !== "HR" || hrUser.organisation !== orgUser?.organisation) {
    return NextResponse.json({ error: "HR not found in your organisation" }, { status: 404 });
  }

  const newPassword = Math.random().toString(36).slice(-8) + "B2!";
  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({ where: { id: hrId }, data: { password: hashed } });

  return NextResponse.json({ newPassword });
}
