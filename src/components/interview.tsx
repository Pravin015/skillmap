import Link from "next/link";
import { CalendarClock, CalendarPlus } from "lucide-react";
import type { Interview, InterviewSlot } from "@prisma/client";
import { cancelInterview, proposeInterview, respondInterview } from "@/lib/actions/interviews";
import { ActionForm, SubmitButton } from "./form-bits";
import { Badge, Button, Field, Input, Select, Textarea } from "./ui";

export type InterviewRow = Interview & { slots: InterviewSlot[] };
export const fmtSlot = (d: Date) => new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(d) + " IST";
const modeLabel = { VIDEO: "Video call", PHONE: "Phone call", ONSITE: "In person" } as const;
const tone = { PROPOSED: "amber", CONFIRMED: "lime", DECLINED: "rose", CANCELLED: "neutral" } as const;

/** Company side: propose slots, or see status. Shown on the applicants page. */
export function InterviewPanel({ applicationId, interview, trainerName }: { applicationId: string; interview: InterviewRow | null; trainerName: string }) {
  const confirmed = interview?.status === "CONFIRMED" ? interview.slots.find((s) => s.id === interview.confirmedSlotId) : null;
  return (
    <details className="rounded-xl border border-line bg-surface-2/60" open={interview?.status === "PROPOSED" || interview?.status === "CONFIRMED" ? true : undefined}>
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5 text-sm font-semibold"><CalendarClock size={15} className="text-violet" /> Interview{interview ? <Badge tone={tone[interview.status]}>{interview.status.toLowerCase()}</Badge> : <span className="text-xs font-normal text-muted">not scheduled</span>}
        {confirmed ? <span className="ml-auto text-xs font-normal text-muted">{fmtSlot(confirmed.startsAt)} · {interview!.durationMin} min · {modeLabel[interview!.mode]}</span> : null}</summary>
      <div className="border-t border-line px-4 py-3">
        {interview?.status === "PROPOSED" ? <p className="mb-3 text-sm text-muted">Waiting for {trainerName} to pick one of: {interview.slots.map((s) => fmtSlot(s.startsAt)).join(" / ")}</p> : null}
        {interview?.status === "DECLINED" ? <p className="mb-3 text-sm text-rose">{trainerName} can&apos;t make those times{interview.responseNote ? `: “${interview.responseNote}”` : "."} Propose new ones below.</p> : null}
        {interview?.status === "CONFIRMED" && confirmed ? (
          <div className="flex flex-wrap items-center gap-3 text-sm"><span>{interview.location || "No link or address added"}</span><a href={`/api/interviews/${interview.id}/ics`} className="inline-flex items-center gap-1 text-cyan hover:underline"><CalendarPlus size={14} /> Add to calendar</a><form action={cancelInterview} className="ml-auto"><input type="hidden" name="id" value={interview.id} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Cancel</Button></form></div>
        ) : (
          <ActionForm action={proposeInterview} className="grid gap-3 md:grid-cols-3">
            <input type="hidden" name="applicationId" value={applicationId} />
            <Field label="Option 1"><Input name="slot1" type="datetime-local" required /></Field>
            <Field label="Option 2"><Input name="slot2" type="datetime-local" /></Field>
            <Field label="Option 3"><Input name="slot3" type="datetime-local" /></Field>
            <Field label="Format"><Select name="mode" defaultValue={interview?.mode ?? "VIDEO"}><option value="VIDEO">Video call</option><option value="PHONE">Phone call</option><option value="ONSITE">In person</option></Select></Field>
            <Field label="Duration"><Select name="durationMin" defaultValue={String(interview?.durationMin ?? 30)}><option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></Select></Field>
            <Field label="Link or address"><Input name="location" defaultValue={interview?.location} placeholder="Teams link, phone number or office" /></Field>
            <Field label="Note to trainer" className="md:col-span-3"><Textarea name="note" defaultValue={interview?.note} className="min-h-14" placeholder="What you'd like to cover" /></Field>
            <div className="md:col-span-3"><SubmitButton variant="violet" size="sm" pendingText="Sending…">{interview ? "Propose new slots" : "Propose slots"}</SubmitButton></div>
          </ActionForm>
        )}
        {interview?.status === "PROPOSED" ? <form action={cancelInterview} className="mt-2"><input type="hidden" name="id" value={interview.id} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Withdraw proposal</Button></form> : null}
      </div>
    </details>
  );
}

/** Trainer side: pick a slot or decline. Shown on the requirement page and applications list. */
export function InterviewResponse({ interview, companyName }: { interview: InterviewRow; companyName: string }) {
  const confirmed = interview.status === "CONFIRMED" ? interview.slots.find((s) => s.id === interview.confirmedSlotId) : null;
  if (interview.status === "CONFIRMED" && confirmed) {
    return (
      <div className="rounded-xl border border-lime/40 bg-lime/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold"><CalendarClock size={15} className="text-lime" /> Interview confirmed</p>
        <p className="mt-1">{fmtSlot(confirmed.startsAt)} · {interview.durationMin} min · {modeLabel[interview.mode]}{interview.location ? ` · ${interview.location}` : ""}</p>
        <div className="mt-2 flex flex-wrap gap-3"><a href={`/api/interviews/${interview.id}/ics`} className="inline-flex items-center gap-1 text-cyan hover:underline"><CalendarPlus size={14} /> Add to calendar</a><form action={cancelInterview}><input type="hidden" name="id" value={interview.id} /><button className="text-xs text-dim hover:text-rose">Cancel</button></form></div>
      </div>
    );
  }
  if (interview.status !== "PROPOSED") return null;
  return (
    <div className="rounded-xl border border-amber/40 bg-amber/5 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold"><CalendarClock size={15} className="text-amber" /> {companyName} proposed an interview</p>
      <p className="mt-1 text-muted">{interview.durationMin} min · {modeLabel[interview.mode]}{interview.location ? ` · ${interview.location}` : ""}{interview.note ? ` · “${interview.note}”` : ""}</p>
      <ActionForm action={respondInterview} className="mt-3 space-y-2">
        <input type="hidden" name="id" value={interview.id} />
        <div className="grid gap-2">{interview.slots.map((s, i) => <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 py-2"><input type="radio" name="slotId" value={s.id} defaultChecked={i === 0} className="accent-cyan" />{fmtSlot(s.startsAt)}</label>)}</div>
        <Input name="note" placeholder="Optional note" />
        <div className="flex flex-wrap gap-2"><SubmitButton size="sm" pendingText="Confirming…">Confirm this slot</SubmitButton><button type="submit" name="decline" value="1" className="inline-flex h-8 items-center rounded-lg border border-line-2 bg-white px-3 text-[13px] font-semibold hover:bg-surface-2">None work for me</button></div>
      </ActionForm>
    </div>
  );
}

export function InterviewSummaryLink({ href, title, when, who }: { href: string; title: string; when: Date; who: string }) {
  return <Link href={href} className="block rounded-lg border border-line px-3 py-2 hover:border-cyan"><span className="block font-medium">{title}</span><span className="text-xs text-muted">{who} · {fmtSlot(when)}</span></Link>;
}
