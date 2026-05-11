import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// PATCH — update application status (HR/Admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session?.user || (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ["APPLIED", "SCREENING", "INTERVIEW", "ASSESSMENT", "OFFER", "HIRED", "REJECTED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { status },
    include: { job: { select: { title: true, company: true } } },
  });

  // Send notification to student
  const statusMap: Record<string, string> = {
    SCREENING: "APPLICATION_STATUS_CHANGED",
    INTERVIEW: "INTERVIEW_SCHEDULED",
    ASSESSMENT: "APPLICATION_STATUS_CHANGED",
    OFFER: "OFFER_RECEIVED",
    HIRED: "OFFER_RECEIVED",
    REJECTED: "REJECTED",
  };

  const notifType = statusMap[status] || "APPLICATION_STATUS_CHANGED";
  const statusMessages: Record<string, string> = {
    SCREENING: "Your application is being screened.",
    INTERVIEW: "An interview has been scheduled!",
    ASSESSMENT: "You've moved to the assessment stage.",
    OFFER: "Congratulations! You've received an offer!",
    HIRED: "You've been hired! Congratulations!",
    REJECTED: "Unfortunately, your application was not selected.",
  };

  createNotification({
    userId: updated.userId,
    type: notifType,
    title: `${updated.job.title} at ${updated.job.company} — ${status}`,
    message: statusMessages[status] || `Your application status changed to ${status}.`,
    data: { role: updated.job.title, company: updated.job.company, status },
  }).catch(() => {});

  return NextResponse.json({ application: updated });
}
