import { PrismaClient, type DeliveryMode } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedFeed } from "./seed-feed";
import { seedFeatures } from "./seed-features";
import { seedRecs } from "./seed-recs";
import { seedBatch3 } from "./seed-batch3";

const db = new PrismaClient();
const PASSWORD = "Password@123";
const day = (n: number) => new Date(Date.now() + n * 86400000);

const CATEGORIES = ["IT & Cloud", "Cybersecurity", "Networking", "Data & AI", "Leadership", "Sales", "Compliance", "Soft Skills", "Project Management", "DevOps"];
const SKILLS = [
  "HPE VM Essentials", "HPE Aruba", "HPE GreenLake", "Morpheus", "Zerto", "Palo Alto PAN-OS", "AWS", "Azure", "GCP", "Kubernetes", "Docker", "Terraform",
  "Cisco CCNA", "Fortinet", "CISSP", "CRISC", "ISO 27001", "Python", "Power BI", "Machine Learning", "Generative AI", "Prompt Engineering",
  "Leadership Development", "Executive Presence", "Negotiation", "Consultative Selling", "POSH", "GDPR", "Agile & Scrum", "PMP", "ITIL 4", "Communication Skills", "Design Thinking",
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  await db.category.createMany({ data: CATEGORIES.map((name) => ({ name, slug: slug(name) })), skipDuplicates: true });
  await db.skill.createMany({ data: SKILLS.map((name) => ({ name, slug: slug(name) })), skipDuplicates: true });
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.name, c.id]));
  const sk = (names: string[]) => ({ connect: names.map((n) => ({ slug: slug(n) })) });

  await db.user.create({ data: { name: "Pravin Kumar", email: "pravin@corpgurus.demo", passwordHash: hash, role: "SUPER_ADMIN" } });
  const admin = await db.user.create({ data: { name: "Neha Desai", email: "admin@corpgurus.demo", passwordHash: hash, role: "ADMIN" } });

  type T = { name: string; email: string; headline: string; bio: string; cities: string[]; modes: DeliveryMode[]; langs: string[]; yrs: number; min: number; max: number; skills: string[]; verified?: boolean; certs: { name: string; issuer: string; status?: "VERIFIED" | "PENDING" | "REJECTED"; id?: string }[] };
  const trainers: T[] = [
    { name: "Ananya Iyer", email: "ananya@corpgurus.demo", headline: "HPE VM Essentials & Morpheus instructor · 12 yrs infra", bio: "Former HPE solutions architect. I run hands-on labs for HPE VM Essentials, GreenLake and Zerto for enterprise ops teams. Every session ships with a lab guide the team keeps.", cities: ["Bengaluru", "Chennai"], modes: ["ONSITE", "VIRTUAL", "HYBRID"], langs: ["English", "Tamil", "Hindi"], yrs: 12, min: 25000, max: 40000, skills: ["HPE VM Essentials", "Morpheus", "Zerto", "HPE GreenLake", "Kubernetes"], verified: true, certs: [{ name: "HPE ASE – Hybrid Cloud", issuer: "HPE", status: "VERIFIED", id: "HPE-ASE-77120" }, { name: "Zerto Certified Professional", issuer: "Zerto", status: "VERIFIED" }, { name: "CKA", issuer: "CNCF", status: "PENDING" }] },
    { name: "Rohit Menon", email: "rohit@corpgurus.demo", headline: "Palo Alto PAN-OS & Fortinet security trainer", bio: "PCNSE-certified. 200+ batches on PAN-OS, App-ID, User-ID and Content-ID delivered for MSSPs and enterprise SOCs.", cities: ["Pune", "Mumbai"], modes: ["ONSITE", "VIRTUAL"], langs: ["English", "Hindi", "Marathi"], yrs: 9, min: 30000, max: 45000, skills: ["Palo Alto PAN-OS", "Fortinet", "CISSP", "ISO 27001"], verified: true, certs: [{ name: "PCNSE", issuer: "Palo Alto Networks", status: "VERIFIED" }, { name: "NSE 7", issuer: "Fortinet", status: "VERIFIED" }] },
    { name: "Sana Sheikh", email: "sana@corpgurus.demo", headline: "AWS & Terraform trainer · ex-Amazon SA", bio: "I teach cloud the way teams actually deploy it: IaC first, cost-aware, with real accounts. AWS Authorized Instructor.", cities: ["Hyderabad"], modes: ["VIRTUAL", "HYBRID"], langs: ["English", "Hindi", "Telugu"], yrs: 8, min: 28000, max: 42000, skills: ["AWS", "Terraform", "Docker", "Kubernetes", "DevOps" as string].filter((s) => SKILLS.includes(s)), verified: true, certs: [{ name: "AWS Solutions Architect – Professional", issuer: "AWS", status: "VERIFIED" }, { name: "HashiCorp Terraform Associate", issuer: "HashiCorp", status: "VERIFIED" }] },
    { name: "Vikram Nair", email: "vikram@corpgurus.demo", headline: "Leadership & executive presence coach · 18 yrs", bio: "Ex-CHRO. I run leadership journeys for first-time managers through to VP level. ICF PCC coach.", cities: ["Mumbai", "Delhi NCR"], modes: ["ONSITE", "HYBRID"], langs: ["English", "Hindi", "Malayalam"], yrs: 18, min: 45000, max: 75000, skills: ["Leadership Development", "Executive Presence", "Negotiation", "Communication Skills"], verified: true, certs: [{ name: "ICF PCC", issuer: "International Coaching Federation", status: "VERIFIED" }] },
    { name: "Priya Raghavan", email: "priya@corpgurus.demo", headline: "Generative AI & prompt engineering for business teams", bio: "Data scientist turned educator. I make GenAI practical for sales, ops and finance teams with hands-on workflows, not slideware.", cities: ["Bengaluru"], modes: ["VIRTUAL", "ONSITE"], langs: ["English", "Kannada", "Tamil"], yrs: 6, min: 22000, max: 35000, skills: ["Generative AI", "Prompt Engineering", "Machine Learning", "Python", "Power BI"], certs: [{ name: "Google Professional ML Engineer", issuer: "Google Cloud", status: "PENDING" }] },
    { name: "Arjun Bhatt", email: "arjun@corpgurus.demo", headline: "Cisco CCNA / Aruba networking instructor", bio: "CCNP and Aruba ACMP. Network fundamentals to campus design, with packet-level labs.", cities: ["Ahmedabad", "Pune"], modes: ["ONSITE"], langs: ["English", "Hindi", "Gujarati"], yrs: 11, min: 20000, max: 30000, skills: ["Cisco CCNA", "HPE Aruba"], verified: true, certs: [{ name: "CCNP Enterprise", issuer: "Cisco", status: "VERIFIED" }, { name: "Aruba ACMP", issuer: "HPE Aruba", status: "REJECTED" }] },
    { name: "Deepa Krishnan", email: "deepa@corpgurus.demo", headline: "POSH, GDPR & compliance trainer · certified external member", bio: "Lawyer and certified POSH trainer. Annual compliance programmes for 40+ organisations.", cities: ["Chennai", "Bengaluru"], modes: ["ONSITE", "VIRTUAL"], langs: ["English", "Tamil"], yrs: 10, min: 18000, max: 28000, skills: ["POSH", "GDPR", "ISO 27001"], certs: [] },
    { name: "Karan Malhotra", email: "karan@corpgurus.demo", headline: "Agile, Scrum & PMP trainer · PMI ATP", bio: "PMP, PMI-ACP, CSM. I have coached 3,000+ PMs through certification and, more importantly, through real delivery.", cities: ["Delhi NCR", "Chandigarh"], modes: ["VIRTUAL", "HYBRID", "ONSITE"], langs: ["English", "Hindi"], yrs: 14, min: 24000, max: 38000, skills: ["Agile & Scrum", "PMP", "ITIL 4", "Design Thinking"], verified: true, certs: [{ name: "PMP", issuer: "PMI", status: "VERIFIED" }, { name: "PMI-ACP", issuer: "PMI", status: "VERIFIED" }] },
    { name: "Meenakshi Rao", email: "meenakshi@corpgurus.demo", headline: "Consultative selling & negotiation for B2B teams", bio: "20 years in enterprise sales leadership. I train SDR to VP on discovery, MEDDICC and negotiation.", cities: ["Mumbai"], modes: ["ONSITE", "HYBRID"], langs: ["English", "Hindi", "Kannada"], yrs: 20, min: 40000, max: 60000, skills: ["Consultative Selling", "Negotiation", "Communication Skills"], certs: [] },
  ];

  const tp: Record<string, { userId: string; profileId: string }> = {};
  for (const t of trainers) {
    const u = await db.user.create({ data: { name: t.name, email: t.email, passwordHash: hash, role: "TRAINER" } });
    const p = await db.trainerProfile.create({
      data: {
        userId: u.id, slug: slug(t.name), headline: t.headline, bio: t.bio, cities: t.cities, deliveryModes: t.modes, languages: t.langs, yearsExperience: t.yrs,
        dayRateMin: t.min, dayRateMax: t.max, verifiedAt: t.verified ? day(-30) : null, skills: sk(t.skills),
        certifications: { create: t.certs.map((c) => ({ name: c.name, issuer: c.issuer, credentialId: c.id, status: c.status ?? "PENDING", reviewedById: c.status && c.status !== "PENDING" ? admin.id : null, issuedOn: day(-400) })) },
      },
    });
    tp[t.email] = { userId: u.id, profileId: p.id };
  }

  type C = { name: string; industry: string; size: string; type: "DIRECT" | "TRAINING_PARTNER"; cities: string[]; domain: string; desc: string; owner: { name: string; email: string }; recruiter?: { name: string; email: string } };
  const companies: C[] = [
    { name: "TechSphere Solutions", industry: "IT Services", size: "1000+", type: "DIRECT", cities: ["Bengaluru", "Pune"], domain: "techsphere.demo", desc: "Mid-size IT services firm running a 2,000-engineer academy. We hire freelance trainers for vendor-authorised and internal upskilling programmes.", owner: { name: "Rahul Verma", email: "rahul@techsphere.demo" }, recruiter: { name: "Kavya Singh", email: "kavya@techsphere.demo" } },
    { name: "SkillBridge Learning", industry: "Training & Education", size: "51–200", type: "TRAINING_PARTNER", cities: ["Delhi NCR", "Mumbai", "Bengaluru"], domain: "skillbridge.demo", desc: "Authorised training partner for HPE, Palo Alto and AWS. We deliver 300+ batches a year and staff most of them with freelance instructors from our bench.", owner: { name: "Meera Joshi", email: "meera@skillbridge.demo" }, recruiter: { name: "Sandeep Kulkarni", email: "sandeep@skillbridge.demo" } },
    { name: "Nova Fintech", industry: "Financial Services", size: "201–1000", type: "DIRECT", cities: ["Mumbai"], domain: "novafintech.demo", desc: "Payments company scaling fast. We run leadership and compliance programmes every quarter.", owner: { name: "Ishaan Kapoor", email: "ishaan@novafintech.demo" } },
    { name: "Quantum Edge Training", industry: "Training & Education", size: "11–50", type: "TRAINING_PARTNER", cities: ["Hyderabad", "Chennai"], domain: "quantumedge.demo", desc: "Boutique partner focused on cloud, DevOps and security bootcamps for enterprise clients in South India.", owner: { name: "Lakshmi Venkat", email: "lakshmi@quantumedge.demo" } },
  ];
  const co: Record<string, { id: string; ownerId: string; recruiterId?: string }> = {};
  for (const c of companies) {
    const company = await db.company.create({ data: { name: c.name, slug: slug(c.name), industry: c.industry, size: c.size, type: c.type, cities: c.cities, domain: c.domain, domainVerifiedAt: c.type === "TRAINING_PARTNER" || c.name === "TechSphere Solutions" ? day(-20) : null, description: c.desc, website: `https://${c.domain}` } });
    const owner = await db.user.create({ data: { name: c.owner.name, email: c.owner.email, passwordHash: hash, role: "COMPANY", memberships: { create: { companyId: company.id, role: "OWNER" } } } });
    let recruiterId: string | undefined;
    if (c.recruiter) {
      const r = await db.user.create({ data: { name: c.recruiter.name, email: c.recruiter.email, passwordHash: hash, role: "COMPANY", memberships: { create: { companyId: company.id, role: "HIRING_MANAGER" } } } });
      recruiterId = r.id;
    }
    co[c.name] = { id: company.id, ownerId: owner.id, recruiterId };
  }

  const reqs = [
    { c: "SkillBridge Learning", by: "recruiter", title: "HPE VM Essentials 9.0 · 3-day instructor-led for bank ops team", cat: "IT & Cloud", skills: ["HPE VM Essentials", "Morpheus"], mode: "ONSITE" as DeliveryMode, city: "Mumbai", start: 18, days: 3, participants: 14, min: 30000, max: 40000, desc: "Vendor-authorised HPE VM Essentials course for a private bank's infrastructure team. Official courseware and lab environment provided by us. Trainer must be HPE ASE/ATP-authorised for the track. Participants are L2/L3 admins moving off VMware; expect a lot of migration questions." },
    { c: "TechSphere Solutions", by: "recruiter", title: "PAN-OS firewall essentials — 5-day bootcamp, two batches", cat: "Cybersecurity", skills: ["Palo Alto PAN-OS"], mode: "HYBRID" as DeliveryMode, city: "Pune", start: 25, days: 10, participants: 24, min: 28000, max: 35000, desc: "Two back-to-back batches of 12 for our SOC L1/L2 engineers. Day 1–2 onsite in Pune, days 3–5 virtual. We have our own lab VMs; trainer brings the curriculum aligned to EDU-210. PCNSE preferred." },
    { c: "Nova Fintech", by: "owner", title: "First-time manager programme · 4 half-day sessions", cat: "Leadership", skills: ["Leadership Development", "Communication Skills"], mode: "ONSITE" as DeliveryMode, city: "Mumbai", start: 12, days: 2, participants: 18, min: 50000, max: 70000, desc: "Cohort of 18 newly promoted team leads. Four half-day sessions across two weeks in our BKC office. Looking for a coach-style facilitator with fintech or startup experience, not a lecture format." },
    { c: "Quantum Edge Training", by: "owner", title: "AWS + Terraform 4-day bootcamp for enterprise DevOps team", cat: "IT & Cloud", skills: ["AWS", "Terraform", "Kubernetes"], mode: "VIRTUAL" as DeliveryMode, city: null, start: 9, days: 4, participants: 20, min: 25000, max: 32000, desc: "Virtual delivery for a Chennai-based client. Sandbox AWS accounts provided. Emphasis on IaC and EKS. Recording allowed for internal use." },
    { c: "TechSphere Solutions", by: "owner", title: "Generative AI for business analysts — 2-day workshop", cat: "Data & AI", skills: ["Generative AI", "Prompt Engineering"], mode: "ONSITE" as DeliveryMode, city: "Bengaluru", start: 30, days: 2, participants: 30, min: 22000, max: 30000, desc: "Hands-on workshop for 30 BAs. Bring your own workflows: requirements drafting, test-case generation, meeting synthesis. Enterprise Copilot licences available." },
    { c: "SkillBridge Learning", by: "owner", title: "Zerto disaster recovery on HPE VM Essentials · 2 days", cat: "IT & Cloud", skills: ["Zerto", "HPE VM Essentials"], mode: "VIRTUAL" as DeliveryMode, city: null, start: 40, days: 2, participants: 10, min: 30000, max: 38000, desc: "Advanced follow-on for a client that completed VME fundamentals. Cover VPG design, journal sizing, failover testing on HVM. Lab built by us; trainer validates it a week before." },
    { c: "Nova Fintech", by: "owner", title: "Annual POSH awareness · 6 virtual sessions", cat: "Compliance", skills: ["POSH"], mode: "VIRTUAL" as DeliveryMode, city: null, start: 15, days: 3, participants: 400, min: 12000, max: 18000, desc: "Six 90-minute sessions for all staff, plus one deep-dive for the internal committee. Trainer must be a certified external member." },
    { c: "Quantum Edge Training", by: "owner", title: "Cisco CCNA fast-track · 5 days onsite Hyderabad", cat: "Networking", skills: ["Cisco CCNA"], mode: "ONSITE" as DeliveryMode, city: "Hyderabad", start: 6, days: 5, participants: 16, min: 18000, max: 24000, desc: "Fresh graduate batch for a client's NOC. Packet Tracer plus physical rack for two days." },
    { c: "SkillBridge Learning", by: "recruiter", title: "Aruba campus switching · 3 days, invite-only", cat: "Networking", skills: ["HPE Aruba"], mode: "ONSITE" as DeliveryMode, city: "Delhi NCR", start: 21, days: 3, participants: 12, min: 24000, max: 30000, desc: "Repeat client; we are inviting trainers who have delivered Aruba for us before.", visibility: "INVITE_ONLY" as const, invites: ["arjun@corpgurus.demo", "ananya@corpgurus.demo"] },
  ];
  const reqIds: string[] = [];
  for (const r of reqs) {
    const c = co[r.c];
    const created = await db.requirement.create({
      data: {
        companyId: c.id, postedById: r.by === "recruiter" && c.recruiterId ? c.recruiterId : c.ownerId, title: r.title, description: r.desc, categoryId: cats[r.cat], skills: sk(r.skills), mode: r.mode, city: r.city,
        startDate: day(r.start), endDate: day(r.start + r.days - 1), days: r.days, participants: r.participants, budgetMin: r.min, budgetMax: r.max, visibility: r.visibility ?? "PUBLIC",
        invitedTrainers: r.invites ? { connect: r.invites.map((e) => ({ id: tp[e].profileId })) } : undefined,
        createdAt: day(-Math.floor(Math.random() * 6) - 1),
      },
    });
    reqIds.push(created.id);
  }

  const app = (i: number, email: string, note: string, rate: number, status: "APPLIED" | "SHORTLISTED" | "AWARDED" | "DECLINED" = "APPLIED") =>
    db.application.create({ data: { requirementId: reqIds[i], trainerId: tp[email].profileId, coverNote: note, proposedRate: rate, status } });
  await app(0, "ananya@corpgurus.demo", "I have delivered VME 9.0 fundamentals for two banks this year, both migrating off VMware. Happy to use your lab; I also bring a migration-day checklist the team keeps.", 38000, "SHORTLISTED");
  await app(1, "rohit@corpgurus.demo", "PCNSE, 200+ PAN-OS batches. Can run both batches back to back and adapt EDU-210 to your SOC runbooks on day 5.", 34000, "SHORTLISTED");
  await app(1, "arjun@corpgurus.demo", "Strong on networking fundamentals; I have co-delivered PAN-OS twice and can cover the essentials track.", 26000, "DECLINED");
  await app(2, "vikram@corpgurus.demo", "This is exactly the cohort I work best with. I would run it as four coaching labs with a peer-feedback loop between sessions.", 65000);
  await app(3, "sana@corpgurus.demo", "AWS Authorized Instructor; I run this exact IaC-first bootcamp. EKS module included.", 30000, "AWARDED");
  await app(4, "priya@corpgurus.demo", "I run this workshop with BA-specific prompts and a shared prompt library the team keeps afterwards.", 28000);
  await app(5, "ananya@corpgurus.demo", "Zerto ZCP and hands-on with Zerto on HVM, including journal sizing and VPG design.", 36000);
  await app(6, "deepa@corpgurus.demo", "Certified external member; I have run all-staff POSH programmes for three fintechs.", 16000);
  await app(7, "arjun@corpgurus.demo", "CCNP; I can bring a two-switch, two-router rack for the physical days.", 22000);
  await db.requirement.update({ where: { id: reqIds[3] }, data: { status: "AWARDED" } });
  await db.requirement.update({ where: { id: reqIds[1] }, data: { status: "SHORTLISTING" } });
  await db.application.update({ where: { requirementId_trainerId: { requirementId: reqIds[1], trainerId: tp["arjun@corpgurus.demo"].profileId } }, data: { declineReason: "Going with a PCNSE-certified trainer for this one. Would love to have you on the CCNA track." } });

  const cmt = (i: number, authorId: string, body: string, parentId?: string) => db.comment.create({ data: { requirementId: reqIds[i], authorId, body, parentId } });
  const q1 = await cmt(0, tp["ananya@corpgurus.demo"].userId, "Is the lab on HPE-provided infrastructure or the client's own cluster? Changes how I plan the storage module.");
  await cmt(0, co["SkillBridge Learning"].recruiterId!, "HPE's hosted lab. Client cluster is production, so no hands-on there.", q1.id);
  await cmt(0, tp["priya@corpgurus.demo"].userId, "Following. Would the bank accept a co-trainer for the Morpheus automation day?");
  const q2 = await cmt(1, tp["rohit@corpgurus.demo"].userId, "Are the SOC engineers already on PAN-OS 11, or is this a greenfield deployment?");
  await cmt(1, co["TechSphere Solutions"].recruiterId!, "Greenfield. They are replacing a Fortinet estate, so migration comparisons are welcome.", q2.id);
  await cmt(2, tp["vikram@corpgurus.demo"].userId, "Would you be open to a 30-minute pre-programme call with each participant's manager? It roughly doubles retention in my experience.");

  const conn = (a: string, b: string, status: "ACCEPTED" | "PENDING" = "ACCEPTED") => db.connection.create({ data: { requesterId: a, addresseeId: b, status, respondedAt: status === "ACCEPTED" ? day(-3) : null } });
  await conn(tp["ananya@corpgurus.demo"].userId, co["SkillBridge Learning"].recruiterId!);
  await conn(tp["ananya@corpgurus.demo"].userId, tp["rohit@corpgurus.demo"].userId);
  await conn(tp["rohit@corpgurus.demo"].userId, co["TechSphere Solutions"].recruiterId!);
  await conn(co["Nova Fintech"].ownerId, tp["vikram@corpgurus.demo"].userId);
  await conn(tp["karan@corpgurus.demo"].userId, tp["ananya@corpgurus.demo"].userId, "PENDING");
  await conn(co["Quantum Edge Training"].ownerId, tp["ananya@corpgurus.demo"].userId, "PENDING");
  await conn(tp["sana@corpgurus.demo"].userId, tp["ananya@corpgurus.demo"].userId);

  const convo = await db.conversation.create({ data: { requirementId: reqIds[0], participants: { create: [{ userId: tp["ananya@corpgurus.demo"].userId }, { userId: co["SkillBridge Learning"].recruiterId! }] } } });
  const msg = (senderId: string, body: string, ago: number) => db.message.create({ data: { conversationId: convo.id, senderId, body, createdAt: day(-ago) } });
  await msg(co["SkillBridge Learning"].recruiterId!, "Hi Ananya, we have shortlisted you for the Mumbai VME batch. Can you confirm you are free on those dates?", 2);
  await msg(tp["ananya@corpgurus.demo"].userId, "Yes, all three days are free. I would like access to the HPE lab a day early to validate the storage module.", 1.8);
  await msg(co["SkillBridge Learning"].recruiterId!, "Done, I will get lab credentials issued for the Monday before. Sending the courseware pack now.", 1);

  await db.savedTrainer.createMany({ data: [
    { companyId: co["SkillBridge Learning"].id, trainerId: tp["ananya@corpgurus.demo"].profileId },
    { companyId: co["SkillBridge Learning"].id, trainerId: tp["rohit@corpgurus.demo"].profileId },
    { companyId: co["TechSphere Solutions"].id, trainerId: tp["priya@corpgurus.demo"].profileId },
  ] });

  await db.notification.createMany({ data: [
    { userId: tp["ananya@corpgurus.demo"].userId, type: "application", title: "You were shortlisted", body: "SkillBridge Learning shortlisted you for HPE VM Essentials 9.0 · Mumbai.", href: "/dashboard/applications" },
    { userId: tp["ananya@corpgurus.demo"].userId, type: "connection", title: "New connection request", body: "Karan Malhotra wants to connect.", href: "/network" },
    { userId: tp["ananya@corpgurus.demo"].userId, type: "message", title: "New message", body: "Sandeep Kulkarni: Done, I will get lab credentials issued…", href: "/messages" },
    { userId: co["SkillBridge Learning"].recruiterId!, type: "application", title: "New application", body: "Ananya Iyer applied to Zerto disaster recovery on HPE VM Essentials.", href: `/dashboard/requirements/${reqIds[5]}/applicants` },
    { userId: admin.id, type: "verification", title: "3 certifications awaiting review", body: "Ananya Iyer, Priya Raghavan and others submitted certificates.", href: "/admin" },
  ] });

  await db.rating.createMany({ data: [
    { requirementId: reqIds[3], fromUserId: co["Quantum Edge Training"].ownerId, toUserId: tp["sana@corpgurus.demo"].userId, score: 5, review: "Sandbox-first approach landed perfectly. Client asked for her by name for the next batch." },
  ] });

  await db.setting.createMany({ data: [
    { key: "free_applications_per_month", value: "5" },
    { key: "free_open_requirements", value: "2" },
    { key: "platform_name", value: "CorpGurus" },
    { key: "support_email", value: "support@corpgurus.com" },
  ] });

  console.log("Seeded: 2 staff, 8 trainers, 4 companies, 9 requirements, applications, comments, connections, messages.");
  await seedFeed(db);
  await seedFeatures(db);
  await seedRecs(db);
  await seedBatch3(db);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
