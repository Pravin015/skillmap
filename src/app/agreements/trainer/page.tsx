import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTrainerAgreement, hasAcceptedAgreement } from "@/lib/agreements";
import { acceptTrainerAgreement } from "@/lib/actions/agreements";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Badge, Card, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Trainer Agreement" };

export default async function TrainerAgreementPage() {
  const user = await getCurrentUser();
  const { text, version } = await getTrainerAgreement();
  const me = user ? await db.user.findUnique({ where: { id: user.id }, select: { agreementVersion: true, agreementAcceptedAt: true } }) : null;
  const accepted = !!me && hasAcceptedAgreement(me, version);
  const isTrainer = !!user && (user.trainerProfile || user.hasTrainerProfile);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Agreements" title={`Trainer Agreement · v${version}`} body="The terms every trainer accepts once before applying to requirements. Signed work orders add engagement-specific terms on top." actions={isTrainer ? (accepted ? <Badge tone="lime">Accepted {me?.agreementAcceptedAt ? fmtDate(me.agreementAcceptedAt) : ""}</Badge> : <Badge tone="amber">Not yet accepted</Badge>) : null} />
      <Card className="p-8">
        <ol className="space-y-3 text-sm leading-relaxed">{text.split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => <li key={i} className="pl-1">{l.replace(/^\d+\.\s*/, "")}</li>)}</ol>
      </Card>
      {isTrainer && !accepted ? (
        <Card className="p-6" glow="cyan">
          <ActionForm action={acceptTrainerAgreement} className="space-y-3">
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="accept" value="1" className="mt-1 accent-cyan" required /> <span>I have read the Trainer Agreement v{version} and accept it on behalf of myself as an independent trainer.</span></label>
            <SubmitButton pendingText="Recording…">Accept agreement</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}
