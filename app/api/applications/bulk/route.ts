import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { applicationIds, status } = await req.json();
  if (!applicationIds || !Array.isArray(applicationIds) || !status) {
    return NextResponse.json({ error: "applicationIds and status required" }, { status: 400 });
  }

  const validStatuses = ["APPLIED", "SCREENING", "INTERVIEW", "ASSESSMENT", "OFFER", "HIRED", "REJECTED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Update all
  const result = await prisma.application.updateMany({
    where: { id: { in: applicationIds } },
    data: { status },
  });

  // Notify candidates (async, non-blocking)
  (async () => {
    try {
      const apps = await prisma.application.findMany({
        where: { id: { in: applicationIds } },
        include: { job: { select: { title: true, company: true } } },
      });
      for (const app of apps) {
        await createNotification({
          userId: app.userId,
          type: "APPLICATION_STATUS_CHANGED",
          title: `Application status updated`,
          message: `Your application for ${app.job.title} at ${app.job.company} has been moved to ${status}.`,
          data: { jobId: app.jobId, status } as Record<string, string>,
        });
      }
    } catch { /* non-blocking */ }
  })();

  return NextResponse.json({ updated: result.count });
}
