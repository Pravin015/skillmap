import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // For free events, register directly
  if (event.pricing === "FREE") {
    const reg = await prisma.eventRegistration.create({
      data: { eventId, userId, paid: true }, // free = auto-paid
    });
    return NextResponse.json({ registration: reg, joinLink: event.joinLink });
  }

  // For paid events, register as unpaid (payment handled separately)
  const reg = await prisma.eventRegistration.create({
    data: { eventId, userId, paid: false },
  });

  return NextResponse.json({
    registration: reg,
    requiresPayment: true,
    amount: event.price,
    eventTitle: event.title,
  });
}
