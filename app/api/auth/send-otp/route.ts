import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { rateLimitAsync, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = await rateLimitAsync(`otp:${ip}`, 5, 60 * 1000); // 5 per minute
  if (!allowed) return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
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
        subject: `${otp} — Your AstraaHire verification code`,
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FAF7F2;font-family:'Poppins','Segoe UI',sans-serif">
<div style="max-width:480px;margin:0 auto;padding:20px">
  <div style="background:#ffffff;border-radius:16px 16px 0 0;padding:18px 24px;border:1px solid #E8E2D6;border-bottom:none">
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
      <tr>
        <td style="vertical-align:middle">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#7C3AED;border-radius:8px;width:30px;height:30px">
            <tr><td align="center" valign="middle" style="color:#ffffff;font-weight:600;font-size:15px;font-family:'Poppins','Segoe UI',sans-serif">A</td></tr>
          </table>
        </td>
        <td style="padding-left:10px;vertical-align:middle">
          <span style="font-weight:600;font-size:16px;color:#0F0E14;letter-spacing:-0.01em">AstraaHire</span>
        </td>
      </tr>
    </table>
  </div>
  <div style="background:#fff;border-radius:0 0 16px 16px;padding:32px 28px;text-align:center;border:1px solid #E8E2D6;border-top:none">
    <h1 style="font-size:20px;font-weight:600;color:#0F0E14;margin:0 0 8px;letter-spacing:-0.02em">Verify your email</h1>
    <p style="font-size:14px;color:#6B6776;margin:0 0 24px">Enter this code to complete your registration</p>
    <div style="background:#7C3AED;color:#ffffff;font-size:32px;font-weight:600;letter-spacing:8px;padding:16px 24px;border-radius:12px;margin:0 auto;display:inline-block">${otp}</div>
    <p style="font-size:12px;color:#9A95A6;margin:20px 0 0">This code expires in 10 minutes</p>
  </div>
  <p style="text-align:center;font-size:11px;color:#9A95A6;padding:16px">If you didn't request this, ignore this email.</p>
</div></body></html>`,
      });
    } catch (err) {
      console.error("Failed to send OTP:", err);
    }
  }

  return NextResponse.json({ success: true, message: "OTP sent to your email" });
}
