import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// GET — list sessions
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (userRole === "MENTOR") {
    const sessions = await prisma.mentorSession.findMany({ where: { mentorUserId: userId }, orderBy: { createdAt: "desc" } });
    const enriched = await Promise.all(sessions.map(async (s) => {
      const student = await prisma.user.findUnique({ where: { id: s.studentId }, select: { name: true, email: true, profileImage: true } });
      return { ...s, student };
    }));
    return NextResponse.json({ sessions: enriched });
  }

  // Student sees own sessions
  const sessions = await prisma.mentorSession.findMany({ where: { studentId: userId }, orderBy: { createdAt: "desc" } });
  const enriched = await Promise.all(sessions.map(async (s) => {
    const mentor = await prisma.mentorProfile.findUnique({ where: { userId: s.mentorUserId }, select: { mentorNumber: true, currentCompany: true, currentRole: true } });
    const mentorUser = await prisma.user.findUnique({ where: { id: s.mentorUserId }, select: { name: true, profileImage: true } });
    return { ...s, mentor: { ...mentor, name: mentorUser?.name, profileImage: mentorUser?.profileImage } };
  }));
  return NextResponse.json({ sessions: enriched });
}

// POST — student requests a session
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId || userRole !== "STUDENT") return NextResponse.json({ error: "Only students can request sessions" }, { status: 403 });

  const { mentorProfileId, preferredDate, message, sessionType, duration, paymentId } = await req.json();
  if (!mentorProfileId || !preferredDate) return NextResponse.json({ error: "Mentor and date required" }, { status: 400 });

  const mentorProfile = await prisma.mentorProfile.findUnique({ where: { id: mentorProfileId }, include: { user: { select: { name: true } } } });
  if (!mentorProfile) return NextResponse.json({ error: "Mentor not found" }, { status: 404 });

  // Check time slot conflict — same mentor, same day, within 1 hour
  const requestedDate = new Date(preferredDate);
  const dayStart = new Date(requestedDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(requestedDate); dayEnd.setHours(23, 59, 59, 999);

  const existingSessions = await prisma.mentorSession.findMany({
    where: {
      mentorUserId: mentorProfile.userId,
      preferredDate: { gte: dayStart, lte: dayEnd },
      status: { in: ["REQUESTED", "ACCEPTED"] },
    },
  });

  for (const existing of existingSessions) {
    const diff = Math.abs(new Date(existing.preferredDate).getTime() - requestedDate.getTime());
    if (diff < 60 * 60 * 1000) { // Within 1 hour
      return NextResponse.json({ error: "This time slot is already booked. Please choose a different time." }, { status: 409 });
    }
  }

  // Determine price
  const isPaid = mentorProfile.compensation === "PAID";
  let price = 0;
  if (isPaid) {
    price = sessionType === "GROUP" ? (mentorProfile.groupSessionRate || mentorProfile.sessionRate || 0) : (mentorProfile.sessionRate || 0);
    if (price > 0 && !paymentId) {
      // Return price info for frontend to trigger payment
      return NextResponse.json({
        requiresPayment: true,
        price,
        mentorName: mentorProfile.user.name,
        sessionType: sessionType || "ONE_ON_ONE",
      });
    }
  }

  const mentorSession = await prisma.mentorSession.create({
    data: {
      mentorId: mentorProfile.id,
      studentId: userId,
      mentorUserId: mentorProfile.userId,
      sessionType: sessionType || "ONE_ON_ONE",
      preferredDate: requestedDate,
      message: message || null,
      duration: duration || "60 min",
      isPaid,
      price: price > 0 ? price : null,
      paymentId: paymentId || null,
    },
  });

  const studentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  createNotification({
    userId: mentorProfile.userId,
    type: "GENERAL",
    title: `New session request from ${studentUser?.name}`,
    message: `${studentUser?.name} wants a ${sessionType === "GROUP" ? "group" : "1-on-1"} session on ${requestedDate.toLocaleDateString()}.${isPaid ? ` Payment: ₹${price / 100}` : " Free"}${message ? ` — "${message}"` : ""}`,
  }).catch(() => {});

  return NextResponse.json({ session: mentorSession }, { status: 201 });
}
