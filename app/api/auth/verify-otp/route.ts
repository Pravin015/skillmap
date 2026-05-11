import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();
  if (!email || !otp) return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });

  const record = await prisma.emailOTP.findFirst({
    where: { email, otp, verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  if (new Date() > record.expiresAt) return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });

  // Mark as verified
  await prisma.emailOTP.update({ where: { id: record.id }, data: { verified: true } });

  return NextResponse.json({ verified: true });
}
