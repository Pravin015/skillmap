import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// GET — single event with registrations
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, role: true, mentorProfile: { select: { mentorNumber: true, currentCompany: true, status: true } } } },
      registrations: {
        include: { user: { select: { name: true, email: true } } },
      },
      _count: { select: { registrations: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Check if current user is registered
  const isRegistered = userId ? event.registrations.some((r) => r.userId === userId) : false;
  const userRegistration = userId ? event.registrations.find((r) => r.userId === userId) : null;

  // Hide join link for paid events if user hasn't paid
  let joinLink = event.joinLink;
  if (event.pricing === "PAID" && (!userRegistration || !userRegistration.paid)) {
    joinLink = null;
  }

  return NextResponse.json({
    event: { ...event, joinLink },
    isRegistered,
    hasPaid: userRegistration?.paid || false,
  });
}

// PATCH — approve/reject (admin) or update (creator)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Admin approval/rejection
  if (body.action === "approve" && userRole === "ADMIN") {
    const updated = await prisma.event.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date() } });
    createNotification({ userId: updated.createdById, type: "MENTOR_EVENT_APPROVED", title: `Event approved: ${updated.title}`, message: `Your event "${updated.title}" has been approved and is now live!`, data: { eventTitle: updated.title, eventId: updated.id } }).catch(() => {});
    return NextResponse.json({ event: updated });
  }

  if (body.action === "reject" && userRole === "ADMIN") {
    const updated = await prisma.event.update({
      where: { id },
      data: { status: "REJECTED", rejectedReason: body.reason || null },
    });
    createNotification({ userId: updated.createdById, type: "MENTOR_EVENT_REJECTED", title: `Event not approved: ${updated.title}`, message: `Your event "${updated.title}" was not approved.${body.reason ? ` Reason: ${body.reason}` : ""}`, data: { eventTitle: updated.title, reason: body.reason } }).catch(() => {});
    return NextResponse.json({ event: updated });
  }

  if (body.action === "cancel") {
    const updated = await prisma.event.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ event: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  if (userRole !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
