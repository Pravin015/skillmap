import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { removeConnection, requestConnection, respondConnection, startConversation } from "@/lib/actions/network";
import { Alert, Avatar, Badge, Button, Empty, PageHeader } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Network" };

export default async function NetworkPage({ searchParams }: { searchParams: Promise<{ blocked?: string }> }) {
  const { blocked } = await searchParams;
  const user = await requireUser("/network");
  const sel = { id: true, name: true, avatarUrl: true, role: true, trainerProfile: { select: { slug: true, headline: true } }, membership: { select: { role: true, company: { select: { name: true, slug: true } } } } } as const;
  const [incoming, outgoing, accepted, suggestions] = await Promise.all([
    db.connection.findMany({ where: { addresseeId: user.id, status: "PENDING" }, include: { requester: { select: sel } }, orderBy: { createdAt: "desc" } }),
    db.connection.findMany({ where: { requesterId: user.id, status: "PENDING" }, include: { addressee: { select: sel } }, orderBy: { createdAt: "desc" } }),
    db.connection.findMany({ where: { status: "ACCEPTED", OR: [{ requesterId: user.id }, { addresseeId: user.id }] }, include: { requester: { select: sel }, addressee: { select: sel } }, orderBy: { respondedAt: "desc" } }),
    db.user.findMany({
      where: { id: { not: user.id }, status: "ACTIVE", role: { in: ["TRAINER", "COMPANY"] }, sentConnections: { none: { addresseeId: user.id } }, gotConnections: { none: { requesterId: user.id } } },
      select: sel, take: 6, orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Network" title="Connections" body="Connect with trainers and companies. Messaging unlocks once a request is accepted." />
      {blocked ? <div className="mb-6"><Alert tone="amber">You can message someone once you are connected, or once there is an application between you and their company.</Alert></div> : null}

      {incoming.length ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Requests for you <span className="mono text-xs text-cyan">{incoming.length}</span></h2>
          <div className="grid gap-3 md:grid-cols-2">{incoming.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-cyan/30 bg-cyan/[0.04] p-4">
              <Person u={c.requester} />
              <div className="flex shrink-0 gap-1.5">
                <form action={respondConnection}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="accept" value="1" /><Button size="sm">Accept</Button></form>
                <form action={respondConnection}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="accept" value="0" /><Button size="sm" variant="ghost">Ignore</Button></form>
              </div>
            </div>
          ))}</div>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Your connections <span className="mono text-xs text-muted">{accepted.length}</span></h2>
        {accepted.length ? (
          <div className="grid gap-3 md:grid-cols-2">{accepted.map((c) => {
            const other = c.requesterId === user.id ? c.addressee : c.requester;
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-4">
                <Person u={other} sub={`Connected ${timeAgo(c.respondedAt ?? c.createdAt)}`} />
                <div className="flex shrink-0 gap-1.5">
                  <form action={startConversation}><input type="hidden" name="userId" value={other.id} /><Button size="sm" variant="secondary">Message</Button></form>
                  <form action={removeConnection}><input type="hidden" name="id" value={c.id} /><Button size="sm" variant="ghost" className="text-dim hover:text-rose">Remove</Button></form>
                </div>
              </div>
            );
          })}</div>
        ) : <Empty title="No connections yet" body="Send a request from any trainer or company profile." />}
      </section>

      {outgoing.length ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Sent <span className="mono text-xs text-muted">{outgoing.length}</span></h2>
          <div className="grid gap-3 md:grid-cols-2">{outgoing.map((c) => <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-4"><Person u={c.addressee} /><Badge tone="amber">pending</Badge></div>)}</div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-bold">People you may know</h2>
        <div className="grid gap-3 md:grid-cols-2">{suggestions.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-4">
            <Person u={u} />
            <form action={requestConnection}><input type="hidden" name="userId" value={u.id} /><Button size="sm" variant="secondary">Connect</Button></form>
          </div>
        ))}</div>
      </section>
    </div>
  );
}

function Person({ u, sub }: { u: { id: string; name: string; avatarUrl: string | null; role: string; trainerProfile: { slug: string; headline: string } | null; membership: { role: string; company: { name: string; slug: string } } | null }; sub?: string }) {
  const href = u.trainerProfile ? `/trainers/${u.trainerProfile.slug}` : u.membership ? `/companies/${u.membership.company.slug}` : "#";
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar name={u.name} src={u.avatarUrl} size={40} tone={u.role === "COMPANY" ? "violet" : "cyan"} />
      <div className="min-w-0">
        <Link href={href} className="block truncate font-medium hover:text-cyan">{u.name}</Link>
        <p className="truncate text-xs text-muted">{sub ?? (u.trainerProfile ? u.trainerProfile.headline : u.membership ? `${u.membership.role.toLowerCase()} · ${u.membership.company.name}` : "")}</p>
      </div>
    </div>
  );
}
