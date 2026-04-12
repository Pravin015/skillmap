import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const submissions = await prisma.formSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    CONTACT: await prisma.formSubmission.count({ where: { type: "CONTACT" } }),
    PARTNER: await prisma.formSubmission.count({ where: { type: "PARTNER" } }),
    HIRE_FROM_US: await prisma.formSubmission.count({ where: { type: "HIRE_FROM_US" } }),
    JOB_POSTING: await prisma.formSubmission.count({ where: { type: "JOB_POSTING" } }),
    MENTOR_ONBOARDING: await prisma.formSubmission.count({ where: { type: "MENTOR_ONBOARDING" } }),
    COMPANY_ONBOARDING: await prisma.formSubmission.count({ where: { type: "COMPANY_ONBOARDING" } }),
    INSTITUTION_ONBOARDING: await prisma.formSubmission.count({ where: { type: "INSTITUTION_ONBOARDING" } }),
    pending: await prisma.formSubmission.count({ where: { status: "PENDING" } }),
  };

  return NextResponse.json({ submissions, counts });
}

// PATCH — update submission status
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id, status, notes } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "ID and status required" }, { status: 400 });

  const updated = await prisma.formSubmission.update({
    where: { id },
    data: { status, notes: notes || null },
  });

  return NextResponse.json({ submission: updated });
}
