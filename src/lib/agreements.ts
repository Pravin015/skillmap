import "server-only";
import { db } from "@/lib/db";

/** Platform trainer agreement, editable by super admins under Platform. Bumping the version asks every trainer to accept again before their next application. */
export const DEFAULT_TRAINER_AGREEMENT = `1. Independent contractor. You deliver training as an independent professional, not as an employee of CorpGurus or of any company you work with through the platform.
2. Accuracy. Your profile, certifications and experience are true and current. CorpGurus may verify them and remove badges that cannot be substantiated.
3. Engagements. A work order signed by both sides is the contract for each engagement. Purchase orders and invoices raised through CorpGurus reference that work order.
4. Conduct. You deliver on the agreed dates, keep client material confidential, and treat participants with respect. Companies may rate you after each engagement.
5. Payment. You invoice the company directly (or through escrow when used). GST and income tax are your responsibility; TDS may be deducted by the company as required by law.
6. Non-circumvention. For 12 months after an introduction made through CorpGurus, engagements with that company are booked through the platform.
7. Data. Participant lists, attendance and feedback collected through CorpGurus are shared only with the company that commissioned the training.
8. Termination. Either side can close the account at any time; obligations under signed work orders survive.`;

export async function getTrainerAgreement() {
  const rows = await db.setting.findMany({ where: { key: { in: ["trainer_agreement_text", "trainer_agreement_version"] } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { text: map.trainer_agreement_text?.trim() || DEFAULT_TRAINER_AGREEMENT, version: Math.max(1, Number(map.trainer_agreement_version) || 1) };
}

export const hasAcceptedAgreement = (user: { agreementVersion: number | null }, version: number) => (user.agreementVersion ?? 0) >= version;
