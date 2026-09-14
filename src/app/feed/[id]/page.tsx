import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { postInclude } from "@/lib/feed";
import { addPostComment, deletePostComment } from "@/lib/actions/feed";
import { PostCard } from "@/components/post-card";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Avatar, ButtonLink, Textarea } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const post = await db.post.findFirst({ where: { id, deletedAt: null }, include: postInclude });
  if (!post) notFound();
  const rootId = post.repostOfId ?? post.id;
  const [comments, like] = await Promise.all([
    db.postComment.findMany({ where: { postId: rootId, deletedAt: null }, include: { author: { select: { id: true, name: true, avatarUrl: true, role: true, trainerProfile: { select: { slug: true } }, memberships: { select: { company: { select: { slug: true, name: true } } } } } } }, orderBy: { createdAt: "asc" } }),
    user ? db.postLike.findUnique({ where: { postId_userId: { postId: rootId, userId: user.id } } }) : null,
  ]);
  const staff = isStaff(user);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/feed" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Back to feed</Link>
      <PostCard post={post} viewerId={user?.id} liked={!!like} isStaff={staff} />
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-base font-semibold">Comments <span className="text-sm font-normal text-muted">{comments.length}</span></h2>
        <div className="mt-4 space-y-4">
          {comments.map((c) => {
            const href = c.author.trainerProfile ? `/trainers/${c.author.trainerProfile.slug}` : c.author.memberships[0] ? `/companies/${c.author.memberships[0].company.slug}` : "#";
            return (
              <div key={c.id} className="flex items-start gap-3">
                <Avatar name={c.author.name} src={c.author.avatarUrl} size={32} tone={c.author.role === "COMPANY" ? "violet" : c.author.role === "TRAINER" ? "cyan" : "amber"} />
                <div className="min-w-0 flex-1 rounded-xl bg-surface-2 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-x-2 text-sm"><Link href={href} className="font-semibold hover:text-cyan">{c.author.name}</Link><span className="text-xs text-dim">{timeAgo(c.createdAt)}</span>
                    {user && (c.authorId === user.id || staff) ? <form action={deletePostComment} className="ml-auto"><input type="hidden" name="id" value={c.id} /><button className="text-xs text-dim hover:text-rose">Delete</button></form> : null}</div>
                  <p className="mt-0.5 whitespace-pre-line text-[15px] text-ink/95">{c.body}</p>
                </div>
              </div>
            );
          })}
          {!comments.length ? <p className="text-sm text-muted">No comments yet.</p> : null}
        </div>
        {user ? (
          <ActionForm action={addPostComment} className="mt-5" resetOnSuccess>
            <div className="flex items-start gap-3">
              <Avatar name={user.name} src={user.avatarUrl} size={32} tone={user.role === "COMPANY" ? "violet" : user.role === "TRAINER" ? "cyan" : "amber"} />
              <div className="flex-1 space-y-2">
                <input type="hidden" name="postId" value={rootId} />
                <Textarea name="body" required placeholder="Add a comment…" className="min-h-16" />
                <SubmitButton size="sm" variant="secondary" pendingText="Posting…">Comment</SubmitButton>
              </div>
            </div>
          </ActionForm>
        ) : <div className="mt-5"><ButtonLink href={`/login?next=/feed/${id}`} variant="secondary" size="sm">Sign in to comment</ButtonLink></div>}
      </section>
    </div>
  );
}
