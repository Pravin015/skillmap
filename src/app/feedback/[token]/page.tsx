import { db } from "@/lib/db";
import { submitFeedback } from "@/lib/actions/feedback";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Logo } from "@/components/shell";
import { Card, Field, Textarea } from "@/components/ui";
import { dateRange } from "@/lib/utils";

export const metadata = { title: "Session feedback" };

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await db.feedbackLink.findUnique({ where: { token }, include: { requirement: { select: { title: true, startDate: true, endDate: true, company: { select: { name: true } } } }, trainer: { include: { user: { select: { name: true } } } }, _count: { select: { responses: true } } } });
  const closed = !link || link.expiresAt < new Date() || link._count.responses >= link.maxResponses;

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="mb-6 flex justify-center"><Logo /></div>
      {!link || closed ? (
        <Card className="p-8 text-center">
          <h1 className="text-xl font-bold">{!link ? "This feedback link is not valid" : "This feedback form has closed"}</h1>
          <p className="mt-2 text-sm text-muted">{!link ? "Check the link you were sent, or ask your training coordinator for a new one." : "Thank you to everyone who responded."}</p>
        </Card>
      ) : (
        <Card className="p-6 md:p-8">
          <p className="mono text-[12px] uppercase tracking-[0.08em] text-cyan">Session feedback · anonymous</p>
          <h1 className="mt-1 text-2xl font-bold">How was the training?</h1>
          <p className="mt-2 text-sm text-muted">{link.requirement.title} · {dateRange(link.requirement.startDate, link.requirement.endDate)}<br />Delivered by <span className="font-medium text-ink">{link.trainer.user.name}</span> for {link.requirement.company.name}</p>
          <ActionForm action={submitFeedback} className="mt-6 space-y-5">
            <input type="hidden" name="token" value={token} />
            <Field label="Overall rating">
              <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="flex-1 cursor-pointer">
                  <input type="radio" name="score" value={n} required defaultChecked={n === 5} className="peer sr-only" />
                  <span className="block rounded-lg border border-line bg-surface-2 py-3 text-center font-display text-lg font-bold text-muted transition peer-checked:border-cyan peer-checked:bg-cyan peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-cyan/40">{n}</span>
                </label>
              ))}</div>
              <div className="mt-1 flex justify-between text-[11px] text-dim"><span>Poor</span><span>Excellent</span></div>
            </Field>
            <Field label="Would you recommend this trainer to a colleague?">
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer"><input type="radio" name="wouldRecommend" value="yes" defaultChecked className="peer sr-only" /><span className="block rounded-lg border border-line bg-surface-2 py-2.5 text-center text-sm font-semibold text-muted peer-checked:border-lime peer-checked:bg-lime peer-checked:text-white">Yes</span></label>
                <label className="flex-1 cursor-pointer"><input type="radio" name="wouldRecommend" value="no" className="peer sr-only" /><span className="block rounded-lg border border-line bg-surface-2 py-2.5 text-center text-sm font-semibold text-muted peer-checked:border-rose peer-checked:bg-rose peer-checked:text-white">No</span></label>
              </div>
            </Field>
            <Field label="What worked, and what would you change?" hint="Optional. Shared anonymously with the trainer."><Textarea name="comment" className="min-h-24" maxLength={1000} /></Field>
            <SubmitButton className="w-full" size="lg" pendingText="Sending…">Send feedback</SubmitButton>
            <p className="text-center text-xs text-dim">No account needed. We do not collect your name or email.</p>
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
