import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

const author = { select: { id: true, name: true, avatarUrl: true, role: true, trainerProfile: { select: { slug: true, headline: true, verifiedAt: true } }, memberships: { select: { company: { select: { name: true, slug: true, domainVerifiedAt: true } } } } } } as const;

export const postInclude = {
  author,
  repostOf: { include: { author, _count: { select: { likes: true, comments: { where: { deletedAt: null } }, reposts: { where: { deletedAt: null } } } } } },
  _count: { select: { likes: true, comments: { where: { deletedAt: null } }, reposts: { where: { deletedAt: null } } } },
} satisfies Prisma.PostInclude;

export type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export async function loadPosts(where: Prisma.PostWhereInput, take = 30, viewerId?: string) {
  const posts = await db.post.findMany({ where: { deletedAt: null, ...where }, include: postInclude, orderBy: { createdAt: "desc" }, take });
  const liked = viewerId ? new Set((await db.postLike.findMany({ where: { userId: viewerId, postId: { in: posts.map((p) => p.repostOfId ?? p.id) } }, select: { postId: true } })).map((l) => l.postId)) : new Set<string>();
  return { posts, liked };
}

/** Authors whose posts belong in a viewer's "Following" feed: followed users, members of followed companies, and accepted connections. */
export async function followingScope(userId: string) {
  const [follows, conns] = await Promise.all([
    db.follow.findMany({ where: { followerId: userId }, select: { followingUserId: true, companyId: true } }),
    db.connection.findMany({ where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] }, select: { requesterId: true, addresseeId: true } }),
  ]);
  const userIds = new Set<string>([userId]);
  const companyIds = new Set<string>();
  for (const f of follows) { if (f.followingUserId) userIds.add(f.followingUserId); if (f.companyId) companyIds.add(f.companyId); }
  for (const c of conns) userIds.add(c.requesterId === userId ? c.addresseeId : c.requesterId);
  return { userIds: [...userIds], companyIds: [...companyIds] };
}
