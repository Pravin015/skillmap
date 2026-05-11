import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// POST — register for event
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || !userId) {
    return NextResponse.json({ error: "Please login to join events" }, { status: 401 });
  }

  const { eventId } = await req.json();
  if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { registrations: true } } },
  });

  if (!event || event.status !== "APPROVED") {
    return NextResponse.json({ error: "Event not found or not active" }, { status: 404 });
  }

  // Check capacity
  if (event._count.registrations >= event.maxParticipants) {
    return NextResponse.json({ error: "Event is full" }, { status: 400 });
  }

  // Check already registered
  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already registered for this event" }, { status: 409 });
  }

  const participantUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  // For free events, register directly
  if (event.pricing === "FREE") {
    const reg = await prisma.eventRegistration.create({ data: { eventId, userId, paid: true } });

    // Notify mentor
    createNotification({ userId: event.createdById, type: "MENTOR_EVENT_REGISTRATION", title: `New registration: ${event.title}`, message: `${participantUser?.name || "A user"} registered for your event "${event.title}".`, data: { eventTitle: event.title, eventId, participantName: participantUser?.name || "User", totalRegistrations: (event._count.registrations + 1).toString(), maxParticipants: event.maxParticipants.toString() } }).catch(() => {});

    return NextResponse.json({ registration: reg, joinLink: event.joinLink });
  }

  // For paid events, register as unpaid
  const reg = await prisma.eventRegistration.create({ data: { eventId, userId, paid: false } });

  // Notify mentor
  createNotification({ userId: event.createdById, type: "MENTOR_EVENT_REGISTRATION", title: `New registration: ${event.title}`, message: `${participantUser?.name || "A user"} registered for your event "${event.title}" (payment pending).`, data: { eventTitle: event.title, eventId, participantName: participantUser?.name || "User", totalRegistrations: (event._count.registrations + 1).toString(), maxParticipants: event.maxParticipants.toString() } }).catch(() => {});

  return NextResponse.json({ registration: reg, requiresPayment: true, amount: event.price, eventTitle: event.title });
}
