import Link from "next/link";
import { Quote } from "lucide-react";
import type { Recommendation } from "@prisma/client";
import { deleteRecommendation, requestRecommendation, toggleRecommendation, writeRecommendation } from "@/lib/actions/recommendations";
import { ActionForm, SubmitButton } from "./form-bits";
import { Avatar, Button, Card, Field, Input, Select, Textarea } from "./ui";
import { fmtDate } from "@/lib/utils";

export type RecRow = Recommendation & { author: { id: string; name: string; avatarUrl: string | null; role: string; memberships: { company: { name: string; slug: string } }[] } };

export function RecommendationsSection({ recs, trainerId, trainerName, viewerId, isSelf, canWrite, existing, askable, openForm }: {
  recs: RecRow[]; trainerId: string; trainerName: string; viewerId?: string; isSelf: boolean; canWrite: boolean; existing: RecRow | null;
  askable: { id: string; name: string; company: string | null }[]; openForm?: boolean;
}) {
  const shown = isSelf ? recs : recs.filter((r) => r.visible);
  const first = trainerName.split(" ")[0];
  return (
    <section id="recommendations">
      <h2 className="mb-3 text-lg font-bold">Recommendations <span className="text-sm font-normal text-muted">{recs.filter((r) => r.visible).length}</span></h2>
      {shown.length ? (
        <div className="space-y-3">{shown.map((r) => (
          <Card key={r.id} className={`p-5 ${r.visible ? "" : "opacity-60"}`}>
            <Quote size={18} className="text-cyan/60" />
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink/95">{r.body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
              <Avatar name={r.author.name} src={r.author.avatarUrl} size={32} tone={r.author.role === "COMPANY" ? "violet" : "cyan"} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{r.author.name}{r.author.memberships[0] ? <>, <Link href={`/companies/${r.author.memberships[0].company.slug}`} className="font-normal text-muted hover:text-ink">{r.author.memberships[0].company.name}</Link></> : null}</p>
                <p className="text-xs text-muted">{r.relationship} · {fmtDate(r.createdAt)}</p>
              </div>
              {isSelf ? <form action={toggleRecommendation}><input type="hidden" name="id" value={r.id} /><Button variant="ghost" size="sm">{r.visible ? "Hide" : "Show"}</Button></form> : null}
              {viewerId === r.authorId ? <form action={deleteRecommendation}><input type="hidden" name="id" value={r.id} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Delete</Button></form> : null}
            </div>
          </Card>
        ))}</div>
      ) : <p className="text-sm text-muted">{isSelf ? "No recommendations yet. Ask a company you have worked with." : `No recommendations yet for ${first}.`}</p>}

      {canWrite ? (
        <details className="mt-4 rounded-2xl border border-line bg-white" open={openForm || undefined}>
          <summary className="cursor-pointer px-5 py-3 font-display text-sm font-semibold text-cyan">{existing ? "Edit your recommendation" : `Recommend ${first}`}</summary>
          <ActionForm action={writeRecommendation} className="space-y-3 border-t border-line px-5 py-4">
            <input type="hidden" name="trainerId" value={trainerId} />
            <Field label="How do you know them?"><Select name="relationship" defaultValue={existing?.relationship ?? "Hired for a training engagement"}><option>Hired for a training engagement</option><option>Worked together as trainers</option><option>Attended their training</option><option>Managed them at a training partner</option><option>Other professional relationship</option></Select></Field>
            <Field label="Recommendation" hint="What they delivered, how participants responded, whether you would book them again."><Textarea name="body" required minLength={40} defaultValue={existing?.body} className="min-h-28" /></Field>
            <SubmitButton variant="secondary" pendingText="Publishing…">{existing ? "Update" : "Publish recommendation"}</SubmitButton>
          </ActionForm>
        </details>
      ) : null}

      {isSelf && askable.length ? (
        <details className="mt-4 rounded-2xl border border-line bg-white">
          <summary className="cursor-pointer px-5 py-3 font-display text-sm font-semibold text-cyan">Ask for a recommendation</summary>
          <ActionForm action={requestRecommendation} className="space-y-3 border-t border-line px-5 py-4" resetOnSuccess>
            <Field label="Who"><Select name="userId">{askable.map((a) => <option key={a.id} value={a.id}>{a.name}{a.company ? ` · ${a.company}` : ""}</option>)}</Select></Field>
            <Field label="Message" hint="Optional"><Input name="message" placeholder="Would you write a few lines about the VME batch we ran in Mumbai?" /></Field>
            <SubmitButton variant="secondary" pendingText="Sending…">Send request</SubmitButton>
          </ActionForm>
        </details>
      ) : null}
    </section>
  );
}
