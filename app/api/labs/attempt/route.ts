import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — start a lab attempt
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { labTemplateId, jobId } = await req.json();
  if (!labTemplateId) return NextResponse.json({ error: "Lab template ID required" }, { status: 400 });

  // Check if already attempted for this job
  if (jobId) {
    const existing = await prisma.labAttempt.findFirst({ where: { userId, jobId, labTemplateId } });
    if (existing) return NextResponse.json({ error: "Already attempted this lab for this job", attemptId: existing.id }, { status: 409 });
  }

  const attempt = await prisma.labAttempt.create({
    data: { userId, jobId: jobId || null, labTemplateId },
  });

  return NextResponse.json({ attempt }, { status: 201 });
}
