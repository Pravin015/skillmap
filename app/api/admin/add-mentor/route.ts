import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateProfileNumber } from "@/lib/profile-number";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { name, email, phone, currentCompany, currentRole, yearsOfExperience, areaOfExpertise, compensation, linkedinUrl } = await req.json();

  if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const tempPassword = Math.random().toString(36).slice(-8) + "M1!";
  const hashed = await bcrypt.hash(tempPassword, 12);

  // Create user
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: "STUDENT", phone: phone || null },
  });

  // Create mentor profile — auto-verified by admin
  const mentorNumber = "MN" + generateProfileNumber().slice(2);
  await prisma.mentorProfile.create({
    data: {
      userId: user.id,
      mentorNumber,
      status: "VERIFIED",
      verifiedAt: new Date(),
      currentCompany: currentCompany || null,
      currentRole: currentRole || null,
      yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : 0,
      areaOfExpertise: areaOfExpertise || [],
      compensation: compensation || "PAID",
      linkedinUrl: linkedinUrl || null,
    },
  });

  return NextResponse.json({ user: { name, email }, mentorNumber, tempPassword }, { status: 201 });
}
