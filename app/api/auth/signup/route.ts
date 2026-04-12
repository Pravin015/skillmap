import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, organisation, phone, degree, gradYear } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    const validRoles = ["STUDENT", "HR", "ORG", "ADMIN", "INSTITUTION", "MENTOR"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        organisation: organisation || null,
        phone: phone || null,
        degree: degree || null,
        gradYear: gradYear || null,
      },
    });

    // Welcome notification
    createNotification({ userId: user.id, type: "ACCOUNT_CREATED", title: "Welcome to SkillMap!", message: `Hi ${user.name}, welcome to SkillMap! Complete your profile to start getting matched with jobs.` }).catch(() => {});

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
