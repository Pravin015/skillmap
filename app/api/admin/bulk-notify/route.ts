import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  if (userRole !== "ADMIN") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { targetRole, title, message, sendEmail } = await req.json();
  if (!title || !message) return NextResponse.json({ error: "Title and message required" }, { status: 400 });

  // Get target users
  const where: Record<string, unknown> = {};
  if (targetRole && targetRole !== "ALL") where.role = targetRole;

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  // Send notifications (batch, non-blocking)
  let count = 0;
  for (const user of users) {
    try {
      await createNotification({
        userId: user.id,
        type: "GENERAL",
        title,
        message,
        sendEmail: sendEmail || false,
      });
      count++;
    } catch { /* skip failures */ }
  }

  return NextResponse.json({ success: true, count });
}
