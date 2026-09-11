"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isStaff, requireUser } from "@/lib/auth";
import { notify, audit } from "@/lib/notify";
import { saveUpload } from "@/lib/uploads";
import type { ActionState } from "@/lib/types";

const FEED_PATHS = ["/feed", "/dashboard"];
function refresh(extra: string[] = []) {
  for (const p of [...FEED_PATHS, ...extra]) revalidatePath(p);
  revalidatePath("/trainers/[slug]", "page");
  revalidatePath("/companies/[slug]", "page");
}

export async function createPost(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 2) return { error: "Write something first." };
  if (body.length > 3000) return { error: "Posts are limited to 3,000 characters." };
  let imageUrl: string | null = null, docUrl: string | null = null, docName: string | null = null;
  try {
    imageUrl = await saveUpload(fd.get("image") as File | null, "posts", ["image"], 8);
    const doc = fd.get("doc") as File | null;
    docUrl = await saveUpload(doc, "posts", ["doc"], 15);
    if (docUrl && doc) docName = doc.name;
  } catch (e) { return { error: (e as Error).message }; }

  const post = await db.post.create({ data: { authorId: user.id, companyId: user.membership?.company.id ?? null, body, imageUrl, docUrl, docName } });

  // Tell followers and connections.
  const [followers, companyFollowers, conns] = await Promise.all([
    db.follow.findMany({ where: { followingUserId: user.id }, select: { followerId: true } }),
    user.membership ? db.follow.findMany({ where: { companyId: user.membership.company.id }, select: { followerId: true } }) : [],
    db.connection.findMany({ where: { status: "ACCEPTED", OR: [{ requesterId: user.id }, { addresseeId: user.id }] }, select: { requesterId: true, addresseeId: true } }),
  ]);
  const audience = new Set<string>([...followers.map((f) => f.followerId), ...companyFollowers.map((f) => f.followerId), ...conns.map((c) => (c.requesterId === user.id ? c.addresseeId : c.requesterId))]);
  audience.delete(user.id);
  await notify([...audience], "post", `${user.name} posted`, body.slice(0, 120), `/feed/${post.id}`);
  refresh();
  return { ok: "Posted." };
}

export async function deletePost(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return;
  if (post.authorId !== user.id && !isStaff(user)) return;
  await db.post.update({ where: { id }, data: { deletedAt: new Date() } });
  if (post.authorId !== user.id) {
    await audit(user.id, "post.remove", id, { authorId: post.authorId });
    await notify(post.authorId, "moderation", "A post was removed by CorpGurus", post.body.slice(0, 100), "/feed");
  }
  refresh([`/feed/${id}`, "/admin/requirements"]);
}

export async function toggleLike(fd: FormData) {
  const user = await requireUser();
  const postId = String(fd.get("postId"));
  const key = { postId_userId: { postId, userId: user.id } };
  const existing = await db.postLike.findUnique({ where: key });
  if (existing) await db.postLike.delete({ where: key });
  else {
    const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true, body: true } });
    if (!post) return;
    await db.postLike.create({ data: { postId, userId: user.id } });
    if (post.authorId !== user.id) await notify(post.authorId, "post_like", `${user.name} liked your post`, post.body.slice(0, 100), `/feed/${postId}`);
  }
  refresh([`/feed/${postId}`]);
}

export async function addPostComment(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const postId = String(fd.get("postId"));
  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 1) return { error: "Write a comment first." };
  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true, body: true, deletedAt: true } });
  if (!post || post.deletedAt) return { error: "That post is no longer available." };
  await db.postComment.create({ data: { postId, authorId: user.id, body } });
  if (post.authorId !== user.id) await notify(post.authorId, "post_comment", `${user.name} commented on your post`, body.slice(0, 120), `/feed/${postId}`);
  refresh([`/feed/${postId}`]);
  return { ok: "Comment added." };
}

export async function deletePostComment(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const c = await db.postComment.findUnique({ where: { id } });
  if (!c || (c.authorId !== user.id && !isStaff(user))) return;
  await db.postComment.update({ where: { id }, data: { deletedAt: new Date() } });
  refresh([`/feed/${c.postId}`]);
}

export async function repost(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const postId = String(fd.get("postId"));
  const note = String(fd.get("body") ?? "").trim();
  const original = await db.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true, body: true, repostOfId: true, deletedAt: true } });
  if (!original || original.deletedAt) return { error: "That post is no longer available." };
  const targetId = original.repostOfId ?? original.id; // always repost the root post
  if (await db.post.findFirst({ where: { authorId: user.id, repostOfId: targetId, deletedAt: null } })) return { error: "You already reposted this." };
  await db.post.create({ data: { authorId: user.id, companyId: user.membership?.company.id ?? null, body: note, repostOfId: targetId } });
  if (original.authorId !== user.id) await notify(original.authorId, "repost", `${user.name} reposted your post`, original.body.slice(0, 100), `/feed/${targetId}`);
  refresh([`/feed/${postId}`]);
  return { ok: "Reposted to your followers." };
}

export async function toggleFollow(fd: FormData) {
  const user = await requireUser();
  const userId = String(fd.get("userId") || "") || null;
  const companyId = String(fd.get("companyId") || "") || null;
  if (userId === user.id) return;
  if (userId) {
    const key = { followerId_followingUserId: { followerId: user.id, followingUserId: userId } };
    const existing = await db.follow.findUnique({ where: key });
    if (existing) await db.follow.delete({ where: key });
    else { await db.follow.create({ data: { followerId: user.id, followingUserId: userId } }); await notify(userId, "follow", `${user.name} started following you`, "Their feed now shows your posts.", "/feed"); }
  } else if (companyId) {
    const key = { followerId_companyId: { followerId: user.id, companyId } };
    const existing = await db.follow.findUnique({ where: key });
    if (existing) await db.follow.delete({ where: key });
    else await db.follow.create({ data: { followerId: user.id, companyId } });
  }
  refresh(["/network"]);
}
