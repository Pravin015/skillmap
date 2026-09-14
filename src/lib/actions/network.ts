"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { canMessage } from "@/lib/messaging";
import { saveUpload } from "@/lib/uploads";

export async function requestConnection(fd: FormData) {
  const user = await requireUser();
  const addresseeId = String(fd.get("userId"));
  if (addresseeId === user.id) return;
  const existing = await db.connection.findFirst({ where: { OR: [{ requesterId: user.id, addresseeId }, { requesterId: addresseeId, addresseeId: user.id }] } });
  if (existing) return;
  await db.connection.create({ data: { requesterId: user.id, addresseeId } });
  await notify(addresseeId, "connection", "New connection request", `${user.name} wants to connect.`, "/network");
  revalidatePath("/network");
  revalidatePath("/trainers/[slug]", "page");
}

export async function respondConnection(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const accept = String(fd.get("accept")) === "1";
  const conn = await db.connection.findFirst({ where: { id, addresseeId: user.id, status: "PENDING" } });
  if (!conn) return;
  await db.connection.update({ where: { id }, data: { status: accept ? "ACCEPTED" : "IGNORED", respondedAt: new Date() } });
  if (accept) await notify(conn.requesterId, "connection", "Connection accepted", `${user.name} accepted your request. You can now message each other.`, "/network");
  revalidatePath("/network");
}

export async function removeConnection(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  await db.connection.deleteMany({ where: { id, OR: [{ requesterId: user.id }, { addresseeId: user.id }] } });
  revalidatePath("/network");
}

export async function startConversation(fd: FormData) {
  const user = await requireUser();
  const otherId = String(fd.get("userId"));
  const requirementId = String(fd.get("requirementId") || "") || null;
  if (otherId === user.id) return;
  if (!(await canMessage(user.id, otherId))) redirect("/network?blocked=1");
  const existing = await db.conversation.findFirst({
    where: { AND: [{ participants: { some: { userId: user.id } } }, { participants: { some: { userId: otherId } } }] },
  });
  if (existing) redirect(`/messages/${existing.id}`);
  const convo = await db.conversation.create({ data: { requirementId, participants: { create: [{ userId: user.id }, { userId: otherId }] } } });
  redirect(`/messages/${convo.id}`);
}

export async function sendMessage(fd: FormData) {
  const user = await requireUser();
  const conversationId = String(fd.get("conversationId"));
  const body = String(fd.get("body") ?? "").trim();
  let attachmentUrl: string | null = null, attachmentName: string | null = null;
  try { const f = fd.get("attachment") as File | null; attachmentUrl = await saveUpload(f, "messages", ["image", "doc"], 10); if (attachmentUrl && f) attachmentName = f.name; } catch { /* ignore bad attachment */ }
  if (!body && !attachmentUrl) return;
  const convo = await db.conversation.findFirst({ where: { id: conversationId, participants: { some: { userId: user.id } } }, include: { participants: true } });
  if (!convo) return;
  await db.message.create({ data: { conversationId, senderId: user.id, body: body || (attachmentName ? `Sent ${attachmentName}` : ""), attachmentUrl, attachmentName } });
  await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });
  await db.conversationParticipant.update({ where: { conversationId_userId: { conversationId, userId: user.id } }, data: { lastReadAt: new Date() } });
  const others = convo.participants.filter((p) => p.userId !== user.id).map((p) => p.userId);
  await notify(others, "message", `New message from ${user.name}`, body.slice(0, 120), `/messages/${conversationId}`);
  revalidatePath(`/messages/${conversationId}`);
}

export async function markAllRead() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/dashboard/notifications");
  revalidatePath("/", "layout");
}

export async function toggleSaveTrainer(fd: FormData) {
  const user = await requireUser();
  if (!user.membership) return;
  const trainerId = String(fd.get("trainerId"));
  const key = { companyId_trainerId: { companyId: user.membership.company.id, trainerId } };
  const exists = await db.savedTrainer.findUnique({ where: key });
  if (exists) await db.savedTrainer.delete({ where: key });
  else await db.savedTrainer.create({ data: { companyId: user.membership.company.id, trainerId } });
  revalidatePath("/trainers/[slug]", "page");
  revalidatePath("/dashboard");
}
