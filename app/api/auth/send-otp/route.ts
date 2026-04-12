import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend, FROM_EMAIL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Check if email already registered
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "This email is already registered. Please login instead." }, { status: 409 });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Delete old OTPs for this email
  await prisma.emailOTP.deleteMany({ where: { email } });

  // Save OTP
  await prisma.emailOTP.create({ data: { email, otp, expiresAt } });

  // Send email
  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `${otp} — Your SkillMap verification code`,
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f3ef;font-family:'Segoe UI',sans-serif">
<div style="max-width:480px;margin:0 auto;padding:20px">
  <div style="background:#0a0a0f;border-radius:16px 16px 0 0;padding:20px 28px;text-align:center">
    <span style="font-weight:800;font-size:18px;color:#fff">Skill</span><span style="background:#e8ff47;color:#0a0a0f;padding:1px 6px;border-radius:4px;font-weight:800;font-size:18px">Map</span>
  </div>
  <div style="background:#fff;border-radius:0 0 16px 16px;padding:32px 28px;text-align:center;border:1px solid rgba(10,10,15,0.08);border-top:none">
    <h1 style="font-size:20px;font-weight:800;color:#0a0a0f;margin:0 0 8px">Verify your email</h1>
    <p style="font-size:14px;color:rgba(10,10,15,0.5);margin:0 0 24px">Enter this code to complete your registration</p>
    <div style="background:#0a0a0f;color:#e8ff47;font-size:36px;font-weight:800;letter-spacing:8px;padding:16px;border-radius:12px;margin:0 auto;display:inline-block">${otp}</div>
    <p style="font-size:12px;color:rgba(10,10,15,0.3);margin:20px 0 0">This code expires in 10 minutes</p>
  </div>
  <p style="text-align:center;font-size:11px;color:rgba(10,10,15,0.3);padding:16px">If you didn't request this, ignore this email.</p>
</div></body></html>`,
      });
    } catch (err) {
      console.error("Failed to send OTP:", err);
    }
  }

  return NextResponse.json({ success: true, message: "OTP sent to your email" });
}
