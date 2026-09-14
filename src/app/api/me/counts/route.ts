import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Cheap change signature for live refresh: unread notifications, latest message across my conversations, latest in one conversation. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ sig: "anon" });
  const conversationId = new URL(req.url).searchParams.get("conversation");
  const [unread, latest, inConvo] = await Promise.all([
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    db.message.findFirst({ where: { conversation: { participants: { some: { userId: user.id } } } }, orderBy: { createdAt: "desc" }, select: { id: true } }),
    conversationId ? db.message.findFirst({ where: { conversationId, conversation: { participants: { some: { userId: user.id } } } }, orderBy: { createdAt: "desc" }, select: { id: true } }) : null,
  ]);
  return NextResponse.json({ sig: `${unread}:${latest?.id ?? ""}:${inConvo?.id ?? ""}`, unread }, { headers: { "Cache-Control": "no-store" } });
}
