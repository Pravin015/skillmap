import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// GET — list invites (HR sees sent, Student sees received)
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (userRole === "HR" || userRole === "ORG" || userRole === "ADMIN") {
    const invites = await prisma.candidateInvite.findMany({
      where: { hrId: userId },
      orderBy: { createdAt: "desc" },
    });
    // Enrich with user names
    const enriched = await Promise.all(invites.map(async (inv) => {
      const candidate = await prisma.user.findUnique({ where: { id: inv.candidateId }, select: { name: true, email: true } });
      const job = inv.jobId ? await prisma.jobPosting.findUnique({ where: { id: inv.jobId }, select: { title: true } }) : null;
      return { ...inv, candidateName: candidate?.name, candidateEmail: candidate?.email, jobTitle: job?.title };
    }));
    return NextResponse.json({ invites: enriched });
  }

  // Student sees received invites
  const invites = await prisma.candidateInvite.findMany({
    where: { candidateId: userId },
    orderBy: { createdAt: "desc" },
  });
  const enriched = await Promise.all(invites.map(async (inv) => {
    const hr = await prisma.user.findUnique({ where: { id: inv.hrId }, select: { name: true, organisation: true } });
    const job = inv.jobId ? await prisma.jobPosting.findUnique({ where: { id: inv.jobId }, select: { title: true, company: true } }) : null;
    return { ...inv, hrName: hr?.name, company: hr?.organisation, jobTitle: job?.title, jobCompany: job?.company };
  }));
  return NextResponse.json({ invites: enriched });
}

// POST — HR sends invite to candidate(s)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;

  if (!userId || (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Only HR can send invites" }, { status: 403 });
  }

  const { candidateIds, jobId, message } = await req.json();
  if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return NextResponse.json({ error: "Select at least one candidate" }, { status: 400 });
  }

  const hr = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, organisation: true } });
  const job = jobId ? await prisma.jobPosting.findUnique({ where: { id: jobId }, select: { title: true, company: true } }) : null;

  let sent = 0;
  for (const candidateId of candidateIds) {
    try {
      await prisma.candidateInvite.create({
        data: { hrId: userId, candidateId, jobId: jobId || null, message: message || null },
      });

      // Notify candidate
      createNotification({
        userId: candidateId,
        type: "INVITE_RECEIVED",
        title: `${hr?.organisation || hr?.name} invited you!`,
        message: job ? `You've been invited to apply for ${job.title} at ${job.company}. ${message || ""}` : `${hr?.organisation || hr?.name} is interested in your profile. ${message || ""}`,
        data: { company: hr?.organisation || hr?.name || "" },
      }).catch(() => {});

      sent++;
    } catch { /* skip duplicates */ }
  }

  return NextResponse.json({ sent, total: candidateIds.length });
}
