import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const mentors = await prisma.mentorProfile.findMany({
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ mentors });
}

// PATCH — approve/reject/suspend mentor
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { mentorId, status } = await req.json();
  if (!mentorId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const validStatuses = ["VERIFIED", "UNVERIFIED", "SUSPENDED", "PENDING"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.mentorProfile.update({
    where: { id: mentorId },
    data: {
      status,
      verifiedAt: status === "VERIFIED" ? new Date() : null,
    },
  });

  return NextResponse.json({ mentor: updated });
}
