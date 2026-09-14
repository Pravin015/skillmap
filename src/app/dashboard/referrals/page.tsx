import { Gift } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ensureReferralCode } from "@/lib/actions/referrals";
import { appUrl } from "@/lib/oauth";
import { CopyButton } from "@/components/copy-button";
import { Badge, Card, Empty, PageHeader, Stat } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Referrals" };

export default async function ReferralsPage() {
  const user = await requireUser("/dashboard/referrals");
  const code = await ensureReferralCode();
  const link = `${appUrl()}/signup?ref=${code}`;
  const [referred, rewards] = await Promise.all([
    db.user.findMany({ where: { referredById: user.id }, select: { id: true, name: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
    db.referralReward.findMany({ where: { referrerId: user.id }, orderBy: { qualifiedAt: "desc" } }),
  ]);
  const qualified = new Set(rewards.map((r) => r.referredId));
  const reward = user.role === "TRAINER" ? "30 days of Trainer Pro" : "30 days of Company Growth";
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Grow the network" title="Refer trainers and companies" body={`Share your link. When someone you refer qualifies, you get ${reward}, added to your current plan or started fresh.`} />
      <Card className="p-6" glow="cyan">
        <p className="flex items-center gap-2 font-display font-semibold"><Gift size={18} className="text-cyan" /> Your referral link</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">{link}</code>
          <CopyButton text={link} />
        </div>
        <p className="mt-3 text-xs text-muted">A trainer qualifies when their first certification is verified. A company qualifies when it posts its first requirement. Self-referrals and duplicate accounts are excluded.</p>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Signed up" value={referred.length} /><Stat label="Qualified" value={rewards.length} tone="lime" /><Stat label="Days earned" value={rewards.length * 30} tone="amber" />
      </div>
      {referred.length ? (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">{referred.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"><span className="font-medium">{r.name}</span><span className="text-muted">{r.role.toLowerCase()} · joined {fmtDate(r.createdAt)}</span><Badge tone={qualified.has(r.id) ? "lime" : "amber"} className="ml-auto">{qualified.has(r.id) ? "qualified · reward granted" : "signed up"}</Badge></div>
        ))}</div>
      ) : <Empty title="No referrals yet" body="Send the link to trainers you have co-delivered with, or L&D teams that hire freelancers." />}
    </div>
  );
}
