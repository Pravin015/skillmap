import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToGCS, isGCSConfigured } from "@/lib/gcs";
import { resolveImage } from "@/lib/resolve-image";

// GET — list events
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const mine = searchParams.get("mine");

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;

  const where: Record<string, unknown> = {};

  // Public view: only approved events
  if (!userRole || userRole === "STUDENT") {
    where.status = "APPROVED";
  }
  // Admin sees all
  if (userRole === "ADMIN" && status) {
    where.status = status;
  }
  // Mentor sees own events
  if (mine === "true" && userId) {
    where.createdById = userId;
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      createdBy: { select: { name: true, role: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { date: "asc" },
  });

  // Resolve cover images
  const resolved = await Promise.all(events.map(async (e) => ({ ...e, coverImageUrl: await resolveImage(e.coverImageUrl) })));
  return NextResponse.json({ events: resolved });
}

// POST — create event (Mentor or Admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only mentors and admins can create events
  if (userRole !== "ADMIN") {
    // Check if user has a mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (!mentorProfile) {
      return NextResponse.json({ error: "Only mentors and admins can create events" }, { status: 403 });
    }
  }

  const body = await req.json();
  const { title, description, agenda, benefits, date, endDate, duration, eventType, location, pricing, price, minParticipants, maxParticipants, joinLink, joinInstructions, category, tags, coverImageUrl } = body;

  if (!title || !description || !date) {
    return NextResponse.json({ error: "Title, description, and date are required" }, { status: 400 });
  }

  // Auto-approve for verified mentors and admins
  let status: "PENDING_APPROVAL" | "APPROVED" = "PENDING_APPROVAL";
  if (userRole === "ADMIN") {
    status = "APPROVED";
  } else {
    const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (mentorProfile?.status === "VERIFIED") {
      status = "APPROVED";
    }
  }

  const event = await prisma.event.create({
    data: {
      createdById: userId,
      title,
      description,
      agenda: agenda || null,
      benefits: benefits || null,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      duration: duration || null,
      eventType: eventType || "VIRTUAL",
      location: location || null,
      pricing: pricing || "FREE",
      price: price ? parseInt(price) : null,
      minParticipants: minParticipants ? parseInt(minParticipants) : 1,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : 100,
      joinLink: joinLink || null,
      joinInstructions: joinInstructions || null,
      category: category || null,
      tags: tags || [],
      coverImageUrl: await (async () => {
        if (!coverImageUrl) return null;
        if (isGCSConfigured() && coverImageUrl.startsWith("data:image/")) {
          try {
            const ext = coverImageUrl.startsWith("data:image/png") ? "png" : "jpg";
            const path = await uploadToGCS(coverImageUrl, "event-covers", `event-${Date.now()}.${ext}`);
            return `gcs:${path}`;
          } catch { return coverImageUrl; }
        }
        return coverImageUrl;
      })(),
      status,
      approvedAt: status === "APPROVED" ? new Date() : null,
    },
  });

  return NextResponse.json({ event, autoApproved: status === "APPROVED" }, { status: 201 });
}
