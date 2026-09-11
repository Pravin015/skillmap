import Link from "next/link";
import { db } from "@/lib/db";
import { resolveReport } from "@/lib/actions/reports";
import { deletePost } from "@/lib/actions/feed";
import { moderateComment, moderateRequirement } from "@/lib/actions/admin";
import { Badge, Button, Card, Empty, Input, PageHeader } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status === "closed" ? { in: ["RESOLVED", "DISMISSED"] as ("RESOLVED" | "DISMISSED")[] } : "OPEN";
  const reports = await db.report.findMany({ where: { status: typeof filter === "string" ? filter : filter }, include: { reporter: { select: { name: true } }, resolvedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 100 });

  // Resolve a short description and link for each target.
  const posts = await db.post.findMany({ where: { id: { in: reports.filter((r) => r.targetType === "POST").map((r) => r.targetId) } }, select: { id: true, body: true, deletedAt: true, author: { select: { name: true } } } });
  const reqs = await db.requirement.findMany({ where: { id: { in: reports.filter((r) => r.targetType === "REQUIREMENT").map((r) => r.targetId) } }, select: { id: true, title: true, status: true, company: { select: { name: true } } } });
  const comments = await db.comment.findMany({ where: { id: { in: reports.filter((r) => r.targetType === "COMMENT").map((r) => r.targetId) } }, select: { id: true, body: true, deletedAt: true, requirementId: true, author: { select: { name: true } } } });
  const postComments = await db.postComment.findMany({ where: { id: { in: reports.filter((r) => r.targetType === "POST_COMMENT").map((r) => r.targetId) } }, select: { id: true, body: true, deletedAt: true, postId: true, author: { select: { name: true } } } });
  const users = await db.user.findMany({ where: { id: { in: reports.filter((r) => r.targetType === "USER").map((r) => r.targetId) } }, select: { id: true, name: true, status: true, trainerProfile: { select: { slug: true } }, membership: { select: { company: { select: { slug: true } } } } } });

  const describe = (r: (typeof reports)[number]): { text: string; href?: string; gone?: boolean; action?: React.ReactNode } => {
    switch (r.targetType) {
      case "POST": { const p = posts.find((x) => x.id === r.targetId); return p ? { text: `Post by ${p.author.name}: “${p.body.slice(0, 120)}”`, href: `/feed/${p.id}`, gone: !!p.deletedAt, action: !p.deletedAt ? <form action={deletePost}><input type="hidden" name="id" value={p.id} /><Button size="sm" variant="danger">Remove post</Button></form> : null } : { text: "Post no longer exists", gone: true }; }
      case "REQUIREMENT": { const q = reqs.find((x) => x.id === r.targetId); return q ? { text: `Requirement by ${q.company.name}: ${q.title}`, href: `/requirements/${q.id}`, gone: q.status === "CANCELLED", action: q.status !== "CANCELLED" ? <form action={moderateRequirement}><input type="hidden" name="id" value={q.id} /><Button size="sm" variant="danger">Take down</Button></form> : null } : { text: "Requirement no longer exists", gone: true }; }
      case "COMMENT": { const c = comments.find((x) => x.id === r.targetId); return c ? { text: `Comment by ${c.author.name}: “${c.body.slice(0, 120)}”`, href: `/requirements/${c.requirementId}#comments`, gone: !!c.deletedAt, action: !c.deletedAt ? <form action={moderateComment}><input type="hidden" name="id" value={c.id} /><Button size="sm" variant="danger">Remove comment</Button></form> : null } : { text: "Comment no longer exists", gone: true }; }
      case "POST_COMMENT": { const c = postComments.find((x) => x.id === r.targetId); return c ? { text: `Feed comment by ${c.author.name}: “${c.body.slice(0, 120)}”`, href: `/feed/${c.postId}`, gone: !!c.deletedAt } : { text: "Comment no longer exists", gone: true }; }
      case "USER": { const u = users.find((x) => x.id === r.targetId); return u ? { text: `Member: ${u.name}`, href: u.trainerProfile ? `/trainers/${u.trainerProfile.slug}` : u.membership ? `/companies/${u.membership.company.slug}` : "/admin/users", gone: u.status === "SUSPENDED", action: <Link href={`/admin/users?q=${encodeURIComponent(u.name)}`} className="text-xs text-cyan hover:underline">Manage in Users</Link> } : { text: "Member no longer exists", gone: true }; }
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Trust & safety" title="Reports" body="Content and members flagged by the community. Resolve after acting, or dismiss if there is no violation. Reporters are told either way."
        actions={<div className="flex rounded-lg border border-line bg-white p-0.5 text-sm"><Link href="/admin/reports" className={`rounded-md px-3 py-1.5 font-medium ${status !== "closed" ? "bg-navy text-white" : "text-muted"}`}>Open</Link><Link href="/admin/reports?status=closed" className={`rounded-md px-3 py-1.5 font-medium ${status === "closed" ? "bg-navy text-white" : "text-muted"}`}>Closed</Link></div>} />
      {reports.length ? (
        <div className="space-y-3">{reports.map((r) => {
          const d = describe(r);
          return (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2"><Badge tone="rose">{r.reason}</Badge><Badge>{r.targetType.toLowerCase().replace("_", " ")}</Badge>{d.gone ? <Badge tone="neutral">already removed</Badge> : null}<span className="text-xs text-dim">by {r.reporter.name} · {timeAgo(r.createdAt)}</span></p>
                  <p className="mt-2 text-sm">{d.href ? <Link href={d.href} className="hover:text-cyan">{d.text}</Link> : d.text}</p>
                  {r.detail ? <p className="mt-1 text-sm text-muted">“{r.detail}”</p> : null}
                  {r.status !== "OPEN" ? <p className="mt-2 text-xs text-muted">{r.status.toLowerCase()} by {r.resolvedBy?.name} {r.resolvedAt ? timeAgo(r.resolvedAt) : ""}{r.resolution ? ` · ${r.resolution}` : ""}</p> : null}
                </div>
                {r.status === "OPEN" ? <div className="flex shrink-0 flex-col items-end gap-2">{d.action}</div> : null}
              </div>
              {r.status === "OPEN" ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <form action={resolveReport} className="flex flex-1 flex-wrap gap-2"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="outcome" value="RESOLVED" /><Input name="resolution" placeholder="Note to reporter (optional)" className="h-8 max-w-sm py-1 text-xs" /><Button size="sm">Mark resolved</Button></form>
                  <form action={resolveReport}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="outcome" value="DISMISSED" /><Button size="sm" variant="ghost">Dismiss</Button></form>
                </div>
              ) : null}
            </Card>
          );
        })}</div>
      ) : <Empty title={status === "closed" ? "No closed reports" : "No open reports"} body={status === "closed" ? undefined : "Nothing flagged right now."} />}
    </div>
  );
}
