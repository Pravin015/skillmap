import { CalendarCheck, Link2 } from "lucide-react";
import { db } from "@/lib/db";
import { calendarConfigured, calendarProviderName } from "@/lib/calendar";
import { disconnectCalendar, syncCalendarNow, updateCalendarPrefs } from "@/lib/actions/integrations";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Badge, Button, Card } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

/** Google / Outlook connection cards for the availability settings page (trainers) or account settings (companies). */
export async function CalendarConnections({ userId, trainer, status }: { userId: string; trainer: boolean; status?: string }) {
  const conns = await db.calendarConnection.findMany({ where: { userId } });
  const providers = ["GOOGLE", "MICROSOFT"] as const;
  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold"><CalendarCheck size={18} className="text-cyan" /> Calendar sync</h2>
      <p className="mt-1 text-sm text-muted">{trainer ? "Busy days from your calendar become unavailable dates here, and confirmed interviews and accepted work orders are added to your calendar." : "Confirmed interviews and accepted work orders are added to your calendar, and Google Meet or Teams links are created from it."}</p>
      {status === "connected" ? <p className="mt-3 rounded-lg border border-lime/30 bg-lime/5 px-3 py-2 text-sm text-lime">Calendar connected.</p> : status === "error" ? <p className="mt-3 rounded-lg border border-rose/30 bg-rose/5 px-3 py-2 text-sm text-rose">The provider refused the connection. Check the app credentials and try again.</p> : status === "unconfigured" ? <p className="mt-3 rounded-lg border border-amber/30 bg-amber/5 px-3 py-2 text-sm text-amber">That calendar provider is not configured on this CorpGurus instance yet.</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {providers.map((p) => {
          const c = conns.find((x) => x.provider === p);
          const ok = calendarConfigured(p);
          return (
            <div key={p} className="rounded-xl border border-line p-4">
              <div className="flex items-center gap-2"><p className="font-display font-semibold">{calendarProviderName(p)}</p>{c ? <Badge tone="lime">connected</Badge> : ok ? <Badge tone="neutral">not connected</Badge> : <Badge tone="amber">needs keys</Badge>}</div>
              {c ? (
                <>
                  <p className="mt-1 text-xs text-muted">{c.email ?? "Connected"}{c.lastSyncAt ? ` · synced ${timeAgo(c.lastSyncAt)}` : ""}</p>
                  <form action={updateCalendarPrefs} className="mt-3 space-y-1.5 text-sm">
                    <input type="hidden" name="provider" value={p} />
                    <label className="flex items-center gap-2"><input type="checkbox" name="pushEvents" value="1" defaultChecked={c.pushEvents} className="accent-cyan" /> Add interviews and work orders to this calendar</label>
                    {trainer ? <label className="flex items-center gap-2"><input type="checkbox" name="pullBusy" value="1" defaultChecked={c.pullBusy} className="accent-cyan" /> Mark busy days (4h+) as unavailable</label> : null}
                    <div className="flex gap-2 pt-1"><Button size="sm" variant="secondary">Save</Button></div>
                  </form>
                  <form action={disconnectCalendar} className="mt-2"><input type="hidden" name="provider" value={p} /><Button size="sm" variant="ghost" className="text-rose">Disconnect</Button></form>
                </>
              ) : ok ? (
                <a href={`/api/calendar/${p.toLowerCase()}/start`} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-cyan px-4 font-display text-sm font-semibold text-white hover:bg-violet"><Link2 size={14} /> Connect</a>
              ) : (
                <p className="mt-2 text-xs text-muted">Add {p === "GOOGLE" ? "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (with the Calendar API enabled)" : "MS_CLIENT_ID / MS_CLIENT_SECRET"} to .env to enable.</p>
              )}
            </div>
          );
        })}
      </div>
      {trainer && conns.length ? <ActionForm action={syncCalendarNow} className="mt-4"><SubmitButton size="sm" variant="secondary" pendingText="Syncing…">Sync busy days now</SubmitButton></ActionForm> : null}
    </Card>
  );
}
