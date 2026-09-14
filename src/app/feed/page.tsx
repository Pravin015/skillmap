import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { followingScope, loadPosts } from "@/lib/feed";
import { PostCard } from "@/components/post-card";
import { PostComposer } from "@/components/post-composer";
import { FollowButton } from "@/components/post-actions";
import { Avatar, ButtonLink, Card, Empty } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Feed" };

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const user = await getCurrentUser();
  const view = user && tab !== "all" ? "following" : "all";

  let where = {};
  if (view === "following" && user) {
    const scope = await followingScope(user.id);
    where = { OR: [{ authorId: { in: scope.userIds } }, ...(scope.companyIds.length ? [{ companyId: { in: scope.companyIds } }] : [])] };
  }
  const { posts, liked } = await loadPosts(where, 40, user?.id);

  const suggestions = user
    ? await db.user.findMany({
        where: { id: { not: user.id }, status: "ACTIVE", role: { in: ["TRAINER", "COMPANY"] }, followers: { none: { followerId: user.id } }, posts: { some: { deletedAt: null } } },
        select: { id: true, name: true, avatarUrl: true, role: true, trainerProfile: { select: { slug: true, headline: true } }, memberships: { select: { company: { select: { name: true, slug: true } } } }, _count: { select: { followers: true } } },
        orderBy: { followers: { _count: "desc" } }, take: 5,
      })
    : [];
  const tone = user?.role === "TRAINER" ? "cyan" : user?.role === "COMPANY" ? "violet" : "amber";

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div><p className="mono text-[12px] uppercase tracking-[0.08em] text-cyan">Community</p><h1 className="text-2xl font-bold">Feed</h1></div>
          {user ? (
            <div className="flex rounded-lg border border-line bg-white p-0.5 text-sm">
              <Link href="/feed" className={cn("rounded-md px-3 py-1.5 font-medium", view === "following" ? "bg-navy text-white" : "text-muted hover:text-ink")}>Following</Link>
              <Link href="/feed?tab=all" className={cn("rounded-md px-3 py-1.5 font-medium", view === "all" ? "bg-navy text-white" : "text-muted hover:text-ink")}>Everyone</Link>
            </div>
          ) : null}
        </div>
        {user ? <PostComposer name={user.name} avatarUrl={user.avatarUrl} tone={tone} /> : (
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-muted">Sign in to post, like and follow trainers and companies.</p><ButtonLink href="/login?next=/feed" size="sm">Sign in</ButtonLink></Card>
        )}
        {posts.length ? posts.map((p) => <PostCard key={p.id} post={p} viewerId={user?.id} liked={liked.has(p.repostOfId ?? p.id)} isStaff={isStaff(user)} compact />) : (
          <Empty title={view === "following" ? "Nothing from your network yet" : "No posts yet"} body={view === "following" ? "Follow a few trainers and companies, or switch to Everyone." : "Be the first to post."} action={view === "following" ? <ButtonLink href="/feed?tab=all" variant="secondary" size="sm">See everyone</ButtonLink> : undefined} />
        )}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {user && suggestions.length ? (
          <Card className="p-5">
            <p className="font-display font-semibold">Worth following</p>
            <ul className="mt-3 space-y-3">
              {suggestions.map((s) => (
                <li key={s.id} className="flex items-center gap-2.5">
                  <Avatar name={s.name} src={s.avatarUrl} size={34} tone={s.role === "COMPANY" ? "violet" : "cyan"} />
                  <div className="min-w-0 flex-1">
                    <Link href={s.trainerProfile ? `/trainers/${s.trainerProfile.slug}` : s.memberships[0] ? `/companies/${s.memberships[0].company.slug}` : "#"} className="block truncate text-sm font-medium hover:text-cyan">{s.name}</Link>
                    <p className="truncate text-xs text-muted">{s.trainerProfile?.headline ?? s.memberships[0]?.company.name}</p>
                  </div>
                  <FollowButton userId={s.id} following={false} size="sm" />
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <Card className="p-5 text-sm text-muted">
          <p className="font-display font-semibold text-ink">Posting guidelines</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Session takeaways, course outlines, certifications, lab tips.</li>
            <li>Requirements belong in <Link href="/requirements" className="text-cyan hover:underline">Requirements</Link>, not the feed.</li>
            <li>No client-confidential material. Staff can remove posts.</li>
          </ul>
        </Card>
      </aside>
    </div>
  );
}
