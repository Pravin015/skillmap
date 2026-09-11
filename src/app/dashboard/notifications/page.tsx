import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { markAllRead } from "@/lib/actions/network";
import { Button, Empty, PageHeader } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/dashboard/notifications");
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Activity" title="Notifications" body={unread ? `${unread} unread` : "You're all caught up."} actions={unread ? <form action={markAllRead}><Button variant="secondary" size="sm">Mark all read</Button></form> : null} />
      {items.length ? (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {items.map((n) => (
            <Link key={n.id} href={n.href ?? "/dashboard"} className={`block px-5 py-3.5 hover:bg-surface-2 ${n.readAt ? "" : "bg-cyan/[0.04]"}`}>
              <p className="flex items-center gap-2 text-sm font-medium">{!n.readAt ? <span className="h-1.5 w-1.5 rounded-full bg-cyan" /> : null}{n.title}<span className="mono ml-auto text-[11px] uppercase tracking-wider text-dim">{n.type}</span></p>
              <p className="mt-0.5 text-sm text-muted">{n.body}</p>
              <p className="mt-1 text-xs text-dim">{timeAgo(n.createdAt)}</p>
            </Link>
          ))}
        </div>
      ) : <Empty title="No notifications yet" />}
    </div>
  );
}
