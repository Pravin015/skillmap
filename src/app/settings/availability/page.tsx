import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addBlock, deleteBlock } from "@/lib/actions/availability";
import { AvailabilityStrip, BlockList } from "@/components/availability";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Button, ButtonLink, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { CalendarConnections } from "@/components/calendar-connections";

export const metadata = { title: "Availability" };

const weekAgo = () => new Date(Date.now() - 7 * 86400000);

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ cal?: string }> }) {
  const { cal } = await searchParams;
  const user = await requireUser("/settings/availability");
  if (!user.trainerProfile) redirect("/settings");
  const blocks = await db.availabilityBlock.findMany({ where: { trainerId: user.trainerProfile.id, endDate: { gte: weekAgo() } }, include: { requirement: { select: { title: true } } }, orderBy: { startDate: "asc" } });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Trainer" title="Availability" body="Companies see this on your profile before they invite you, and you are warned when applying to a requirement that clashes. Awarded engagements are blocked automatically." actions={<ButtonLink href="/settings" variant="ghost" size="sm">← Settings</ButtonLink>} />
      <Card className="p-6">
        <h2 className="mb-3 text-lg font-bold">Next 12 weeks</h2>
        <AvailabilityStrip blocks={blocks} />
      </Card>
      <CalendarConnections userId={user.id} trainer status={cal} />
      <Card className="p-6">
        <h2 className="text-lg font-bold">Block dates</h2>
        <ActionForm action={addBlock} className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_160px_1fr_auto] md:items-end" resetOnSuccess>
          <Field label="From"><Input name="startDate" type="date" required /></Field>
          <Field label="To" hint="Leave empty for one day"><Input name="endDate" type="date" /></Field>
          <Field label="Type"><Select name="kind" defaultValue="BOOKED"><option value="BOOKED">Booked</option><option value="TENTATIVE">Tentative</option><option value="UNAVAILABLE">Unavailable</option></Select></Field>
          <Field label="Note" hint="Private to you"><Input name="note" placeholder="Client X batch" /></Field>
          <SubmitButton variant="secondary" pendingText="Saving…">Add</SubmitButton>
        </ActionForm>
      </Card>
      <Card className="p-6">
        <h2 className="mb-3 text-lg font-bold">Upcoming blocks</h2>
        <BlockList blocks={blocks} action={(b) => (b.requirementId ? <span className="text-xs text-dim">from award</span> : <form action={deleteBlock}><input type="hidden" name="id" value={b.id} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Remove</Button></form>)} />
      </Card>
    </div>
  );
}
