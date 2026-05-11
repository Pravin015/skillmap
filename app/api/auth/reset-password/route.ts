import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const { email, otp, newPassword } = await req.json();
  if (!email || !otp || !newPassword) return NextResponse.json({ error: "All fields required" }, { status: 400 });
  if (newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const record = await prisma.emailOTP.findFirst({
    where: { email, otp, verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  if (new Date() > record.expiresAt) return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });

  await prisma.emailOTP.update({ where: { id: record.id }, data: { verified: true } });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { email }, data: { password: hashed, mustChangePassword: false } });

  createNotification({ userId: user.id, type: "PASSWORD_CHANGED", title: "Password reset", message: "Your password was reset successfully. If you didn't do this, contact support immediately." }).catch(() => {});

  return NextResponse.json({ success: true });
}
