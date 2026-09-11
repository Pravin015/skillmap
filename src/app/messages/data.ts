import "server-only";
import { db } from "@/lib/db";

export async function loadConversations(userId: string) {
  return db.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: { include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      requirement: { select: { title: true } },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}
export type ConversationRow = Awaited<ReturnType<typeof loadConversations>>[number];
