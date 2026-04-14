import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — create or update proctoring log
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, sessionId, sessionType, tabSwitches, fullscreenExits, copyAttempts, events, webcamUrl } = await req.json();

  if (action === "start") {
    // Create new proctoring log
    if (!sessionId || !sessionType) return NextResponse.json({ error: "sessionId and sessionType required" }, { status: 400 });

    const log = await prisma.proctoringLog.create({
      data: { sessionId, sessionType, userId, webcamUrl },
    });
    return NextResponse.json({ log }, { status: 201 });
  }

  if (action === "update") {
    // Update violation counts
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const existing = await prisma.proctoringLog.findFirst({ where: { sessionId, userId } });
    if (!existing) return NextResponse.json({ error: "Log not found" }, { status: 404 });

    const flagged = (tabSwitches || 0) >= 3 || (fullscreenExits || 0) >= 3 || (copyAttempts || 0) >= 5;

    const log = await prisma.proctoringLog.update({
      where: { id: existing.id },
      data: {
        ...(tabSwitches !== undefined && { tabSwitches }),
        ...(fullscreenExits !== undefined && { fullscreenExits }),
        ...(copyAttempts !== undefined && { copyAttempts }),
        ...(events && { events }),
        flagged,
      },
    });
    return NextResponse.json({ log });
  }

  if (action === "end") {
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const existing = await prisma.proctoringLog.findFirst({ where: { sessionId, userId } });
    if (!existing) return NextResponse.json({ error: "Log not found" }, { status: 404 });

    const log = await prisma.proctoringLog.update({
      where: { id: existing.id },
      data: {
        endedAt: new Date(),
        ...(tabSwitches !== undefined && { tabSwitches }),
        ...(fullscreenExits !== undefined && { fullscreenExits }),
        ...(copyAttempts !== undefined && { copyAttempts }),
        ...(events && { events }),
        flagged: (tabSwitches || existing.tabSwitches) >= 3 || (fullscreenExits || existing.fullscreenExits) >= 3,
      },
    });
    return NextResponse.json({ log });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// GET — fetch proctoring log for a session (admin/HR)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (sessionId) {
    const log = await prisma.proctoringLog.findFirst({ where: { sessionId } });
    return NextResponse.json({ log });
  }

  // Admin: get all flagged logs
  if (userRole === "ADMIN") {
    const logs = await prisma.proctoringLog.findMany({
      where: { flagged: true },
      orderBy: { startedAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ logs });
  }

  return NextResponse.json({ error: "sessionId required" }, { status: 400 });
}
