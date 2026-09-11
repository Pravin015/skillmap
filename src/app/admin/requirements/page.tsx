import Link from "next/link";
import { db } from "@/lib/db";
import { moderateComment, moderateRequirement } from "@/lib/actions/admin";
import { deletePost } from "@/lib/actions/feed";
import { Badge, Button, PageHeader } from "@/components/ui";
import { reqTone } from "@/components/cards";
import { fmtDate, reqStatusLabel, timeAgo } from "@/lib/utils";

export const metadata = { title: "Requirements moderation" };

export default async function AdminRequirements() {
  const posts = await db.post.findMany({ where: { deletedAt: null }, include: { author: { select: { name: true } }, _count: { select: { likes: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 20 });
  const [reqs, comments] = await Promise.all([
    db.requirement.findMany({ include: { company: { select: { name: true, slug: true } }, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.comment.findMany({ where: { deletedAt: null }, include: { author: { select: { name: true } }, requirement: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <section>
        <PageHeader eyebrow="Moderation" title="Requirements" body="Take down posts that are off-platform recruiting, discriminatory, or not training work." />
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted"><th className="px-4 py-3">Requirement</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Activity</th><th className="px-4 py-3"></th></tr></thead>
            <tbody className="divide-y divide-line">{reqs.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2">
                <td className="px-4 py-3"><Link href={`/requirements/${r.id}`} className="font-medium hover:text-violet">{r.title}</Link><p className="text-xs text-muted">{r.company.name} · {fmtDate(r.startDate)} · posted {timeAgo(r.createdAt)}</p></td>
                <td className="px-4 py-3"><Badge tone={reqTone[r.status]}>{reqStatusLabel[r.status]}</Badge></td>
                <td className="px-4 py-3 text-muted">{r._count.applications} apps · {r._count.comments} comments</td>
                <td className="px-4 py-3 text-right">{r.status !== "CANCELLED" ? <form action={moderateRequirement}><input type="hidden" name="id" value={r.id} /><Button size="sm" variant="danger">Take down</Button></form> : null}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <aside className="space-y-8">
        <div>
        <h2 className="mb-3 text-lg font-bold">Recent feed posts</h2>
        <div className="space-y-2">{posts.map((p) => (
          <div key={p.id} className="rounded-xl border border-line bg-white p-3 text-sm">
            <p className="line-clamp-3 text-ink/90">{p.body || "(repost)"}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted"><span>{p.author.name}</span>·<span>{p._count.likes} likes · {p._count.comments} comments</span><Link href={`/feed/${p.id}`} className="hover:text-ink">open</Link><form action={deletePost} className="ml-auto"><input type="hidden" name="id" value={p.id} /><button className="text-rose hover:underline">Remove</button></form></div>
          </div>
        ))}</div>
        </div>
        <div>
        <h2 className="mb-3 text-lg font-bold">Recent comments</h2>
        <div className="space-y-2">{comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-line bg-white p-3 text-sm">
            <p className="text-ink/90">{c.body}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted"><span>{c.author.name}</span>·<Link href={`/requirements/${c.requirement.id}#comments`} className="truncate hover:text-ink">{c.requirement.title}</Link><form action={moderateComment} className="ml-auto"><input type="hidden" name="id" value={c.id} /><button className="text-rose hover:underline">Remove</button></form></div>
          </div>
        ))}</div>
        </div>
      </aside>
    </div>
  );
}
