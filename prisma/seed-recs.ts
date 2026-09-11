import { PrismaClient } from "@prisma/client";

/** Demo recommendations and one sent work order. Safe to re-run: skips if recommendations exist. */
export async function seedRecs(db: PrismaClient) {
  if (await db.recommendation.count()) { console.log("Recommendations already seeded, skipping."); return; }
  const u = async (email: string) => { const x = await db.user.findUnique({ where: { email }, include: { membership: true, trainerProfile: true } }); if (!x) throw new Error(`seed-recs: missing ${email}`); return x; };
  const ananya = await u("ananya@corpgurus.demo");
  const sana = await u("sana@corpgurus.demo");
  const rohit = await u("rohit@corpgurus.demo");
  const lakshmi = await u("lakshmi@quantumedge.demo");
  const sandeep = await u("sandeep@skillbridge.demo");
  const kavya = await u("kavya@techsphere.demo");

  const awarded = await db.application.findFirst({ where: { trainerId: sana.trainerProfile!.id, status: "AWARDED" }, include: { requirement: true } });
  await db.recommendation.createMany({ data: [
    { trainerId: sana.trainerProfile!.id, authorId: lakshmi.id, companyId: lakshmi.membership!.companyId, requirementId: awarded?.requirementId, relationship: "Hired for a training engagement", body: "Sana ran our AWS and Terraform bootcamp for a 20-person DevOps team and the client asked for her by name for the next batch. She built the labs in real sandbox accounts, adapted day 3 on the fly when the group struggled with EKS, and sent a cost-control cheat sheet afterwards that the team still uses." },
    { trainerId: ananya.trainerProfile!.id, authorId: sandeep.id, companyId: sandeep.membership!.companyId, relationship: "Hired for a training engagement", body: "We have staffed three HPE VM Essentials batches with Ananya. Vendor-authorised, always validates the lab a day early, and her day-2 checklist is the reason clients rebook. Zero escalations across all three deliveries." },
    { trainerId: ananya.trainerProfile!.id, authorId: rohit.id, relationship: "Worked together as trainers", body: "Co-delivered a hybrid infrastructure track with Ananya for an MSSP. She handles migration questions from senior admins with a calm that keeps the room on schedule, and she shares material generously with other instructors." },
    { trainerId: rohit.trainerProfile!.id, authorId: kavya.id, companyId: kavya.membership!.companyId, relationship: "Hired for a training engagement", body: "Rohit delivered PAN-OS essentials for two SOC batches back to back. He mapped the EDU-210 material to our runbooks on day 5, which is exactly what our L1 engineers needed. Would book again without hesitation." },
  ] });

  if (awarded) {
    const wo = await db.workOrder.create({ data: {
      requirementId: awarded.requirementId, trainerId: sana.trainerProfile!.id, companyId: awarded.requirement.companyId, createdById: lakshmi.id, status: "SENT", sentAt: new Date(Date.now() - 3600000 * 20),
      title: awarded.requirement.title, startDate: awarded.requirement.startDate, endDate: awarded.requirement.endDate, days: awarded.requirement.days, dayRate: awarded.proposedRate ?? 30000, currency: "INR", total: awarded.requirement.days * (awarded.proposedRate ?? 30000), participants: awarded.requirement.participants, mode: awarded.requirement.mode,
      venue: "Virtual on the client's Teams tenant. Sessions 09:30–17:30 IST with a 45-minute lunch break. Recording permitted for internal use only.",
      deliverables: "4-day instructor-led delivery\nTerraform starter repo and lab guide for every participant\nCapstone review on day 4\nOne 60-minute follow-up Q&A within two weeks",
      provided: "20 AWS sandbox accounts with budget alarms\nParticipant list and pre-course survey results\nFeedback link on day 4",
      paymentTerms: "Invoice on completion, payable within 30 days by bank transfer. GST extra.", cancellationTerms: "Free reschedule up to 7 days before the start date. 50% of the total payable if cancelled within 7 days.", notes: "",
    } });
    await db.workOrderEvent.createMany({ data: [
      { workOrderId: wo.id, actorId: lakshmi.id, type: "created", version: 1, createdAt: new Date(Date.now() - 3600000 * 22) },
      { workOrderId: wo.id, actorId: lakshmi.id, type: "sent", version: 1, createdAt: new Date(Date.now() - 3600000 * 20) },
    ] });
    await db.notification.create({ data: { userId: sana.id, type: "workorder", title: "Work order received", body: `Quantum Edge Training: ${awarded.requirement.title} · review and accept`, href: `/requirements/${awarded.requirementId}/work-order` } });
  }
  console.log("Seeded 4 recommendations and 1 work order awaiting the trainer.");
}

if (require.main === module) {
  const db = new PrismaClient();
  seedRecs(db).catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
}
