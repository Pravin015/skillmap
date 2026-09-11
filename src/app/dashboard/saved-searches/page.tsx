import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteSearch, toggleSearchAlerts } from "@/lib/actions/saved-searches";
import { describeSearch, searchHref } from "@/lib/saved-searches";
import { Badge, Button, ButtonLink, Empty, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Saved searches" };

export default async function SavedSearchesPage() {
  const user = await requireUser("/dashboard/saved-searches");
  const searches = await db.savedSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Alerts" title="Saved searches" body="Each saved search notifies you when a new trainer or requirement matches it. Trainer alerts are sent at most once a day per search." actions={<><ButtonLink href="/requirements" variant="secondary" size="sm">Requirements</ButtonLink><ButtonLink href="/trainers" variant="secondary" size="sm">Trainers</ButtonLink></>} />
      {searches.length ? (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">{searches.map((s) => {
          const p = s.params as Record<string, string | undefined>;
          return (
            <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2"><Link href={searchHref(s.kind, p)} className="font-semibold hover:text-cyan">{s.name}</Link><Badge tone={s.kind === "TRAINERS" ? "cyan" : "violet"}>{s.kind.toLowerCase()}</Badge></p>
                <p className="text-xs text-muted">{describeSearch(s.kind, p)} · saved {fmtDate(s.createdAt)}{s.lastNotifiedAt ? ` · last match ${fmtDate(s.lastNotifiedAt)}` : ""}</p>
              </div>
              <form action={toggleSearchAlerts}><input type="hidden" name="id" value={s.id} /><Button variant={s.alerts ? "outline" : "secondary"} size="sm">{s.alerts ? <><Bell size={14} /> Alerts on</> : <><BellOff size={14} /> Alerts off</>}</Button></form>
              <form action={deleteSearch}><input type="hidden" name="id" value={s.id} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Delete</Button></form>
            </div>
          );
        })}</div>
      ) : <Empty title="No saved searches" body="Filter the trainer or requirement directory, then use “Save search” to get alerts for new matches." />}
    </div>
  );
}
