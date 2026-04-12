import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(`forgot:${getClientIP(req)}`, 3, 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Too many requests. Wait a minute." }, { status: 429 });
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists — always show success
    return NextResponse.json({ success: true });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await prisma.emailOTP.deleteMany({ where: { email } });
  await prisma.emailOTP.create({ data: { email, otp, expiresAt } });

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL, to: email,
        subject: `${otp} — Reset your SkillMap password`,
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f3ef;font-family:'Segoe UI',sans-serif">
<div style="max-width:480px;margin:0 auto;padding:20px">
  <div style="background:#0a0a0f;border-radius:16px 16px 0 0;padding:20px 28px;text-align:center">
    <span style="font-weight:800;font-size:18px;color:#fff">Skill</span><span style="background:#e8ff47;color:#0a0a0f;padding:1px 6px;border-radius:4px;font-weight:800;font-size:18px">Map</span>
  </div>
  <div style="background:#fff;border-radius:0 0 16px 16px;padding:32px 28px;text-align:center;border:1px solid rgba(10,10,15,0.08);border-top:none">
    <h1 style="font-size:20px;font-weight:800;color:#0a0a0f;margin:0 0 8px">Reset your password</h1>
    <p style="font-size:14px;color:rgba(10,10,15,0.5);margin:0 0 24px">Use this code to set a new password</p>
    <div style="background:#0a0a0f;color:#e8ff47;font-size:36px;font-weight:800;letter-spacing:8px;padding:16px;border-radius:12px;margin:0 auto;display:inline-block">${otp}</div>
    <p style="font-size:12px;color:rgba(10,10,15,0.3);margin:20px 0 0">This code expires in 15 minutes</p>
  </div>
  <p style="text-align:center;font-size:11px;color:rgba(10,10,15,0.3);padding:16px">If you didn't request this, your account is safe — just ignore this email.</p>
</div></body></html>`,
      });
    } catch (err) { console.error("Failed to send reset OTP:", err); }
  }

  return NextResponse.json({ success: true });
}
