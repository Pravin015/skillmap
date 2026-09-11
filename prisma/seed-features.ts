import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const day = (n: number) => new Date(Date.now() + n * 86400000);

/** Demo courses, availability, learner feedback and a report. Safe to re-run: skips if courses exist. */
export async function seedFeatures(db: PrismaClient) {
  if (await db.course.count()) { console.log("Feature data already seeded, skipping."); return; }
  const trainer = async (email: string) => {
    const p = await db.trainerProfile.findFirst({ where: { user: { email } }, include: { user: true } });
    if (!p) throw new Error(`seed-features: missing trainer ${email}`);
    return p;
  };
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.name, c.id]));
  const sk = (names: string[]) => ({ connect: names.map((n) => ({ slug: n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })) });

  const ananya = await trainer("ananya@corpgurus.demo");
  const rohit = await trainer("rohit@corpgurus.demo");
  const sana = await trainer("sana@corpgurus.demo");
  const vikram = await trainer("vikram@corpgurus.demo");
  const priya = await trainer("priya@corpgurus.demo");
  const karan = await trainer("karan@corpgurus.demo");

  await db.course.createMany({ data: [
    { trainerId: ananya.id, title: "HPE VM Essentials 9.0 Fundamentals", summary: "Install, configure and operate HVM clusters, then migrate workloads off VMware. For L2/L3 infrastructure admins.", outline: "Day 1 · Architecture, installation, cluster networking\nDay 2 · Storage, HA, backup integration, Morpheus basics\nDay 3 · VMware-to-HVM migration lab and day-2 operations checklist", level: "INTERMEDIATE", durationDays: 3, modes: ["ONSITE", "VIRTUAL", "HYBRID"], maxParticipants: 16, indicativeRate: 35000, categoryId: cats["IT & Cloud"] },
    { trainerId: ananya.id, title: "Zerto Disaster Recovery on HPE VM Essentials", summary: "VPG design, journal sizing, failover testing and runbooks for teams already running HVM.", outline: "Day 1 · Zerto architecture, VRA deployment, VPG design\nDay 2 · Failover test, live failover, journal sizing lab", level: "ADVANCED", durationDays: 2, modes: ["VIRTUAL", "ONSITE"], maxParticipants: 12, indicativeRate: 38000, categoryId: cats["IT & Cloud"] },
    { trainerId: rohit.id, title: "PAN-OS Firewall Essentials (EDU-210 aligned)", summary: "Configure, manage and troubleshoot Palo Alto firewalls. App-ID, User-ID, Content-ID, GlobalProtect basics.", outline: "Day 1 · Platform, interfaces, zones, policies\nDay 2 · App-ID, User-ID\nDay 3 · Content-ID, decryption\nDay 4 · GlobalProtect, site-to-site VPN\nDay 5 · Troubleshooting, migration from Fortinet", level: "INTERMEDIATE", durationDays: 5, modes: ["ONSITE", "HYBRID", "VIRTUAL"], maxParticipants: 12, indicativeRate: 34000, categoryId: cats["Cybersecurity"] },
    { trainerId: sana.id, title: "AWS + Terraform Bootcamp for DevOps Teams", summary: "Infrastructure as code from day one: VPC, EKS, IAM and CI pipelines built in real sandbox accounts.", outline: "Day 1 · AWS core services, IAM, VPC in Terraform\nDay 2 · Modules, state, workspaces\nDay 3 · EKS and containers\nDay 4 · CI/CD, cost controls, capstone", level: "INTERMEDIATE", durationDays: 4, modes: ["VIRTUAL", "HYBRID"], maxParticipants: 20, indicativeRate: 30000, categoryId: cats["IT & Cloud"] },
    { trainerId: vikram.id, title: "First-Time Manager Programme", summary: "Four coaching-style half days for newly promoted team leads: delegation, feedback, 1:1s and difficult conversations.", outline: "Session 1 · From doer to leader\nSession 2 · Feedback and 1:1s\nSession 3 · Delegation and prioritisation\nSession 4 · Difficult conversations and peer coaching", level: "FOUNDATION", durationDays: 2, modes: ["ONSITE", "HYBRID"], maxParticipants: 18, indicativeRate: 65000, categoryId: cats["Leadership"] },
    { trainerId: priya.id, title: "Generative AI for Business Analysts", summary: "Hands-on workflows for requirements drafting, test-case generation and meeting synthesis, with a shared prompt library the team keeps.", level: "FOUNDATION", durationDays: 2, modes: ["ONSITE", "VIRTUAL"], maxParticipants: 30, indicativeRate: 28000, categoryId: cats["Data & AI"] },
    { trainerId: karan.id, title: "PMP Exam Preparation (35 contact hours)", summary: "PMI-authorised 35-hour course mapped to the current ECO, with mock exams and an application review.", level: "INTERMEDIATE", durationDays: 5, modes: ["VIRTUAL", "HYBRID", "ONSITE"], maxParticipants: 25, indicativeRate: 32000, categoryId: cats["Project Management"] },
  ] });
  const courses = await db.course.findMany({ where: { trainerId: { in: [ananya.id, rohit.id, sana.id, vikram.id, priya.id, karan.id] } } });
  const link = async (title: string, skills: string[]) => { const c = courses.find((x) => x.title === title)!; await db.course.update({ where: { id: c.id }, data: { skills: sk(skills) } }); };
  await link("HPE VM Essentials 9.0 Fundamentals", ["HPE VM Essentials", "Morpheus"]);
  await link("Zerto Disaster Recovery on HPE VM Essentials", ["Zerto", "HPE VM Essentials"]);
  await link("PAN-OS Firewall Essentials (EDU-210 aligned)", ["Palo Alto PAN-OS"]);
  await link("AWS + Terraform Bootcamp for DevOps Teams", ["AWS", "Terraform", "Kubernetes"]);
  await link("First-Time Manager Programme", ["Leadership Development", "Communication Skills"]);
  await link("Generative AI for Business Analysts", ["Generative AI", "Prompt Engineering"]);
  await link("PMP Exam Preparation (35 contact hours)", ["PMP"]);

  // Availability: the awarded AWS bootcamp blocks Sana; Ananya has a tentative hold and leave.
  const awardedAws = await db.application.findFirst({ where: { status: "AWARDED", trainerId: sana.id }, include: { requirement: true } });
  if (awardedAws) await db.availabilityBlock.create({ data: { trainerId: sana.id, startDate: awardedAws.requirement.startDate, endDate: awardedAws.requirement.endDate, kind: "BOOKED", requirementId: awardedAws.requirementId, note: awardedAws.requirement.title } });
  await db.availabilityBlock.createMany({ data: [
    { trainerId: ananya.id, startDate: day(18), endDate: day(20), kind: "TENTATIVE", note: "SkillBridge Mumbai batch (shortlisted)" },
    { trainerId: ananya.id, startDate: day(33), endDate: day(37), kind: "UNAVAILABLE", note: "Family travel" },
    { trainerId: rohit.id, startDate: day(4), endDate: day(8), kind: "BOOKED", note: "MSSP onboarding, Pune" },
    { trainerId: vikram.id, startDate: day(10), endDate: day(11), kind: "BOOKED", note: "Leadership offsite" },
    { trainerId: karan.id, startDate: day(2), endDate: day(6), kind: "BOOKED", note: "PMP batch, virtual" },
  ] });

  // Learner feedback on Sana's awarded engagement.
  if (awardedAws) {
    const owner = await db.companyMember.findFirst({ where: { companyId: awardedAws.requirement.companyId, role: "OWNER" } });
    const fl = await db.feedbackLink.create({ data: { token: randomBytes(18).toString("base64url"), requirementId: awardedAws.requirementId, trainerId: sana.id, createdById: owner!.userId, expiresAt: day(40) } });
    const rs = [[5, true, "Best cloud course I have attended. The IaC-first approach finally made Terraform click."], [5, true, "Sandbox accounts made all the difference."], [4, true, "Great pace, day 3 on EKS was dense."], [5, true, null], [4, true, "Would have liked more on cost controls."], [5, true, "Sana answered every question with a live demo."], [3, false, "Too fast for someone new to AWS."], [5, true, null], [4, true, null], [5, true, "Recommend to any DevOps team."]] as const;
    await db.feedbackResponse.createMany({ data: rs.map(([score, wouldRecommend, comment], i) => ({ linkId: fl.id, score, wouldRecommend, comment, fingerprint: `seed-${i}` })) });
  }

  // Profile analytics history for Ananya.
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - i);
    await db.trainerStatDaily.upsert({ where: { trainerId_date: { trainerId: ananya.id, date: d } }, create: { trainerId: ananya.id, date: d, profileViews: 2 + Math.floor(Math.random() * 7), searchAppearances: 8 + Math.floor(Math.random() * 15) }, update: {} });
  }

  // One open report for the admin queue.
  const reporter = await db.user.findUnique({ where: { email: "rohit@corpgurus.demo" } });
  const post = await db.post.findFirst({ where: { body: { startsWith: "TechSphere Academy is hiring" } } });
  if (reporter && post) await db.report.create({ data: { reporterId: reporter.id, targetType: "POST", targetId: post.id, reason: "Off-platform recruiting", detail: "Reads like a job ad in the feed rather than a requirement." } });

  console.log("Feature data seeded: 7 courses, availability blocks, 10 learner responses, 30 days of analytics, 1 report.");
}

if (require.main === module) {
  const db = new PrismaClient();
  seedFeatures(db).catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
}
