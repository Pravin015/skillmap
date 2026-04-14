import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list attendees for an event (creator or admin only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id }, select: { createdById: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Only creator or admin
  if (event.createdById !== userId && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Only event creator or admin can view attendees" }, { status: 403 });
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: id },
    include: {
      user: {
        select: {
          name: true,
          profile: { select: { collegeName: true, fieldOfInterest: true, experienceLevel: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({
    attendees: registrations.map((r) => ({
      registrationId: r.id,
      userId: r.userId,
      name: r.user.name,
      college: r.user.profile?.collegeName || "—",
      domain: r.user.profile?.fieldOfInterest || "—",
      level: r.user.profile?.experienceLevel === "FRESHER" ? "Fresher" : "Experienced",
      paid: r.paid,
      joinedAt: r.joinedAt,
    })),
    total: registrations.length,
  });
}

// DELETE — remove a participant
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id }, select: { createdById: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.createdById !== userId && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Only creator or admin" }, { status: 403 });
  }

  const { registrationId } = await req.json();
  if (!registrationId) return NextResponse.json({ error: "Registration ID required" }, { status: 400 });

  await prisma.eventRegistration.delete({ where: { id: registrationId } });
  return NextResponse.json({ success: true });
}
