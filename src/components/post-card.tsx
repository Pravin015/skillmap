import Link from "next/link";
import { BadgeCheck, FileText, Heart, MessageCircle, Repeat2, Trash2 } from "lucide-react";
import { deletePost, toggleLike } from "@/lib/actions/feed";
import type { PostRow } from "@/lib/feed";
import { Avatar, Badge } from "./ui";
import { RepostButton } from "./post-actions";
import { ReportButton } from "./report-button";
import { cn, timeAgo } from "@/lib/utils";

type Author = PostRow["author"];

function authorHref(a: Author) {
  return a.trainerProfile ? `/trainers/${a.trainerProfile.slug}` : a.membership ? `/companies/${a.membership.company.slug}` : "#";
}
function authorSub(a: Author) {
  return a.trainerProfile ? a.trainerProfile.headline : a.membership ? a.membership.company.name : a.role === "SUPER_ADMIN" || a.role === "ADMIN" ? "CorpGurus team" : "";
}
const tone = (a: Author) => (a.role === "COMPANY" ? "violet" : a.role === "TRAINER" ? "cyan" : "amber") as "violet" | "cyan" | "amber";

export function AuthorLine({ a, when, size = 40 }: { a: Author; when: Date; size?: number }) {
  const verified = a.trainerProfile?.verifiedAt || a.membership?.company.domainVerifiedAt;
  return (
    <div className="flex items-start gap-3">
      <Link href={authorHref(a)}><Avatar name={a.name} src={a.avatarUrl} size={size} tone={tone(a)} /></Link>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-1.5 text-[15px] leading-tight">
          <Link href={authorHref(a)} className="font-display font-semibold hover:text-cyan">{a.name}</Link>
          {verified ? <BadgeCheck size={14} className={a.role === "COMPANY" ? "text-violet" : "text-cyan"} /> : null}
          {a.membership ? <Badge tone="violet">company</Badge> : null}
          <span className="text-xs text-dim">· {timeAgo(when)}</span>
        </p>
        <p className="truncate text-[13px] text-muted">{authorSub(a)}</p>
      </div>
    </div>
  );
}

/** Renders body text with bare URLs and @mentions left plain but line breaks preserved. */
function Body({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <p className={cn("whitespace-pre-line text-[15px] leading-relaxed text-ink/95", className)}>
      {parts.map((p, i) => (/^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer" className="text-cyan hover:underline break-all">{p}</a> : p))}
    </p>
  );
}

function Attachments({ imageUrl, docUrl, docName }: { imageUrl: string | null; docUrl: string | null; docName: string | null }) {
  return (
    <>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={imageUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-line bg-surface-2"><img src={imageUrl} alt="" className="max-h-[480px] w-full object-cover" /></a>
      ) : null}
      {docUrl ? (
        <a href={docUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm hover:border-cyan">
          <FileText size={18} className="shrink-0 text-cyan" /><span className="truncate font-medium">{docName ?? "Attachment"}</span><span className="ml-auto shrink-0 text-xs text-muted">Open</span>
        </a>
      ) : null}
    </>
  );
}

export function PostCard({ post, viewerId, liked, isStaff, compact }: { post: PostRow; viewerId?: string; liked: boolean; isStaff?: boolean; compact?: boolean }) {
  const root = post.repostOf ?? post;
  const counts = post.repostOf ? post.repostOf._count : post._count;
  const canDelete = !!viewerId && (post.authorId === viewerId || !!isStaff);
  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      {post.repostOf ? (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-muted"><Repeat2 size={14} /><Link href={authorHref(post.author)} className="font-medium hover:text-ink">{post.author.name}</Link> reposted{post.body ? " with a note" : ""} · {timeAgo(post.createdAt)}</p>
      ) : null}
      {post.repostOf && post.body ? <Body text={post.body} className="mb-3" /> : null}
      <div className={cn(post.repostOf && "rounded-xl border border-line bg-surface-2/60 p-4")}>
        <AuthorLine a={root.author} when={root.createdAt} />
        <div className="mt-3">
          <Body text={root.body} className={compact ? "line-clamp-6" : undefined} />
          <Attachments imageUrl={root.imageUrl} docUrl={root.docUrl} docName={root.docName} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t border-line pt-3 text-sm">
        {viewerId ? (
          <form action={toggleLike}><input type="hidden" name="postId" value={root.id} /><button className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition hover:bg-surface-2", liked ? "text-rose" : "text-muted hover:text-ink")}><Heart size={16} className={liked ? "fill-rose" : ""} />{counts.likes}</button></form>
        ) : <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-muted"><Heart size={16} />{counts.likes}</span>}
        <Link href={`/feed/${root.id}`} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-muted transition hover:bg-surface-2 hover:text-ink"><MessageCircle size={16} />{counts.comments}</Link>
        {viewerId ? <RepostButton postId={root.id} count={counts.reposts} /> : <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-muted"><Repeat2 size={16} />{counts.reposts}</span>}
        {viewerId && post.authorId !== viewerId ? <ReportButton targetType="POST" targetId={root.id} className="ml-auto" /> : null}
        {canDelete ? (
          <form action={deletePost} className={post.authorId === viewerId ? "ml-auto" : ""}><input type="hidden" name="id" value={post.id} /><button className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-dim transition hover:bg-surface-2 hover:text-rose" title={post.authorId === viewerId ? "Delete post" : "Remove (moderation)"}><Trash2 size={14} />{post.authorId === viewerId ? "Delete" : "Remove"}</button></form>
        ) : null}
      </div>
    </article>
  );
}
