import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — fetch user's notifications
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
}

// PATCH — mark notifications as read
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, all } = await req.json();

  if (all) {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  } else if (ids?.length) {
    await prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { read: true } });
  }

  return NextResponse.json({ success: true });
}
