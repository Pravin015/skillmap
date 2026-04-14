import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(`form:${getClientIP(req)}`, 10, 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Too many submissions. Wait a minute." }, { status: 429 });
  const body = await req.json();
  const { type, name, email, phone, data } = body;

  if (!type || !name || !email) {
    return NextResponse.json({ error: "Type, name, and email are required" }, { status: 400 });
  }

  const validTypes = ["CONTACT", "PARTNER", "HIRE_FROM_US", "JOB_POSTING", "MENTOR_ONBOARDING", "COMPANY_ONBOARDING", "INSTITUTION_ONBOARDING"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid form type" }, { status: 400 });
  }

  const submission = await prisma.formSubmission.create({
    data: {
      type,
      name,
      email,
      phone: phone || null,
      data: JSON.stringify(data || {}),
    },
  });

  return NextResponse.json({ submission: { id: submission.id } }, { status: 201 });
}
