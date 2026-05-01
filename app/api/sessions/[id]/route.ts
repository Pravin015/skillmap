import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// PATCH — mentor accepts/rejects, student rates
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Mentor accepts
  if (body.action === "accept") {
    const updated = await prisma.mentorSession.update({
      where: { id },
      data: { status: "ACCEPTED", meetingLink: body.meetingLink || null, mentorNotes: body.mentorNotes || null },
    });
    const mentor = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    createNotification({
      userId: updated.studentId,
      type: "GENERAL",
      title: `Session accepted by ${mentor?.name}!`,
      message: `Your ${updated.sessionType === "GROUP" ? "group" : "1-on-1"} session has been accepted.${updated.meetingLink ? " Join link is ready in your dashboard." : " Mentor will share the meeting link."}`,
    }).catch(() => {});
    return NextResponse.json({ session: updated });
  }

  // Mentor rejects
  if (body.action === "reject") {
    const updated = await prisma.mentorSession.update({ where: { id }, data: { status: "REJECTED", rejectedReason: body.reason || null } });
    const mentor = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    createNotification({
      userId: updated.studentId,
      type: "GENERAL",
      title: `Session declined by ${mentor?.name}`,
      message: `Your session request was declined.${body.reason ? ` Reason: ${body.reason}` : ""} You can try booking with another mentor.`,
    }).catch(() => {});
    return NextResponse.json({ session: updated });
  }

  // Mentor marks complete
  if (body.action === "complete") {
    const updated = await prisma.mentorSession.update({ where: { id }, data: { status: "COMPLETED" } });
    // Update mentor stats
    await prisma.mentorProfile.update({ where: { userId }, data: { totalSessions: { increment: 1 }, menteesHelped: { increment: 1 } } });
    return NextResponse.json({ session: updated });
  }

  // Student rates
  if (body.action === "rate") {
    const updated = await prisma.mentorSession.update({ where: { id }, data: { rating: body.rating, review: body.review || null } });
    // Update mentor average rating
    const allRated = await prisma.mentorSession.findMany({ where: { mentorUserId: updated.mentorUserId, rating: { not: null } }, select: { rating: true } });
    const avg = allRated.reduce((a, b) => a + (b.rating || 0), 0) / allRated.length;
    await prisma.mentorProfile.update({ where: { userId: updated.mentorUserId }, data: { rating: Math.round(avg * 10) / 10 } });
    return NextResponse.json({ session: updated });
  }

  // Cancel
  if (body.action === "cancel") {
    const updated = await prisma.mentorSession.update({ where: { id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ session: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
