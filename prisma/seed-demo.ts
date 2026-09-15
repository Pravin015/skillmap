import { PrismaClient, type DeliveryMode, type ReqStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Realistic demo dataset on top of the base seed: 50 trainers, 15 companies, a year of requirements with
 * applications, work orders, purchase orders, invoices, ratings and a lively feed.
 * Run: pnpm db:seed:demo · idempotent (skips when demo trainers already exist). All passwords: Password@123.
 */

const db = new PrismaClient();
const PASSWORD = "Password@123";
const DAY = 86400000;
const day = (n: number) => new Date(Date.now() + n * DAY);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Deterministic pseudo-random so the dataset is the same on every machine.
let seed = 20260915;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const some = <T,>(xs: T[], n: number) => [...xs].sort(() => rnd() - 0.5).slice(0, n);
const avatar = (name: string) => `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=ede9fe,ddd6fe,c4b5fd`;
const logo = (name: string) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4c1d95,6d28d9,2e1065&fontWeight=700`;

const FIRST = ["Aarav", "Aditi", "Akash", "Amrita", "Anil", "Anjali", "Arun", "Bhavna", "Chirag", "Divya", "Farhan", "Gaurav", "Harini", "Ishita", "Jatin", "Kavita", "Kiran", "Lakshmi", "Manish", "Meghna", "Mohit", "Nandini", "Neeraj", "Nikhil", "Pooja", "Prakash", "Rajesh", "Rekha", "Rhea", "Rohan", "Sachin", "Sanjay", "Shalini", "Shreya", "Siddharth", "Smita", "Sunil", "Swati", "Tanvi", "Uday", "Varun", "Vidya", "Vinay", "Yash", "Zoya", "Abhishek", "Ritu", "Naveen", "Preeti", "Suresh"];
const LAST = ["Sharma", "Reddy", "Iyer", "Patel", "Nair", "Mehta", "Kulkarni", "Banerjee", "Choudhury", "Das", "Gupta", "Joshi", "Kapoor", "Menon", "Mishra", "Pillai", "Rao", "Saxena", "Singh", "Verma", "Bose", "Desai", "Ghosh", "Jain", "Khan", "Malhotra", "Naidu", "Pandey", "Shetty", "Thakur"];
const CITIES: Record<string, string> = { Bengaluru: "29", Hyderabad: "36", Chennai: "33", Pune: "27", Mumbai: "27", "Delhi NCR": "07", Gurugram: "06", Noida: "09", Kolkata: "19", Ahmedabad: "24", Kochi: "32", Jaipur: "08", Chandigarh: "04", Coimbatore: "33", Indore: "23" };
const LANGS = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Marathi", "Bengali", "Malayalam", "Gujarati"];

/** Skill groups by domain, matching the base seed's skill names. */
const DOMAINS: { category: string; skills: string[]; titles: string[]; certs: [string, string][] }[] = [
  { category: "IT & Cloud", skills: ["AWS", "Azure", "GCP", "HPE GreenLake", "HPE VM Essentials", "Morpheus", "Zerto"], titles: ["AWS Solutions Architect bootcamp", "Azure administrator fast-track", "GCP fundamentals for developers", "HPE VM Essentials 9.0 administration", "Zerto disaster recovery workshop", "GreenLake private cloud operations"], certs: [["AWS Solutions Architect – Professional", "AWS"], ["Azure Solutions Architect Expert", "Microsoft"], ["HPE ASE – Hybrid Cloud", "HPE"], ["Google Professional Cloud Architect", "Google Cloud"]] },
  { category: "DevOps", skills: ["Kubernetes", "Docker", "Terraform", "Agile & Scrum"], titles: ["Kubernetes operations bootcamp", "Docker and container security", "Terraform for platform teams", "CI/CD pipelines with GitLab", "SRE practices workshop"], certs: [["CKA", "CNCF"], ["HashiCorp Terraform Associate", "HashiCorp"], ["Docker Certified Associate", "Docker"]] },
  { category: "Cybersecurity", skills: ["Palo Alto PAN-OS", "Fortinet", "CISSP", "CRISC", "ISO 27001"], titles: ["Palo Alto firewall essentials (EDU-210)", "Fortinet NSE 4 preparation", "CISSP exam bootcamp", "ISO 27001 lead implementer", "SOC analyst fundamentals", "Secure coding for developers"], certs: [["PCNSE", "Palo Alto Networks"], ["NSE 7", "Fortinet"], ["CISSP", "ISC2"], ["CEH", "EC-Council"]] },
  { category: "Networking", skills: ["Cisco CCNA", "HPE Aruba"], titles: ["CCNA 200-301 bootcamp", "Aruba campus switching and wireless", "Network automation with Python", "SD-WAN fundamentals"], certs: [["CCNP Enterprise", "Cisco"], ["Aruba ACMP", "HPE Aruba"]] },
  { category: "Data & AI", skills: ["Python", "Power BI", "Machine Learning", "Generative AI", "Prompt Engineering"], titles: ["Generative AI for business teams", "Python for data analysis", "Power BI dashboards for managers", "Machine learning foundations", "Prompt engineering workshop", "LLM application development"], certs: [["Google Professional ML Engineer", "Google Cloud"], ["Microsoft Power BI Data Analyst", "Microsoft"], ["TensorFlow Developer", "Google"]] },
  { category: "Leadership", skills: ["Leadership Development", "Executive Presence", "Negotiation", "Communication Skills", "Design Thinking"], titles: ["First-time manager programme", "Executive presence for senior leaders", "Negotiation skills for account managers", "Design thinking sprint", "Coaching conversations for managers", "Leading hybrid teams"], certs: [["ICF PCC", "International Coaching Federation"], ["Hogan Assessment Certification", "Hogan"], ["Everything DiSC Facilitator", "Wiley"]] },
  { category: "Sales", skills: ["Consultative Selling", "Negotiation", "Communication Skills"], titles: ["Consultative selling for SaaS", "Enterprise account planning", "Sales negotiation masterclass", "Storytelling for pre-sales"], certs: [["Miller Heiman Strategic Selling", "Korn Ferry"], ["SPIN Selling Facilitator", "Huthwaite"]] },
  { category: "Compliance", skills: ["POSH", "GDPR", "ISO 27001"], titles: ["POSH awareness for all staff", "GDPR and DPDP for product teams", "Anti-bribery and code of conduct", "Information security awareness"], certs: [["Certified POSH Trainer", "SHEROES"], ["CIPP/E", "IAPP"]] },
  { category: "Project Management", skills: ["PMP", "ITIL 4", "Agile & Scrum"], titles: ["PMP exam preparation", "ITIL 4 Foundation", "Scrum Master certification prep", "Agile for non-IT teams", "Risk management for PMs"], certs: [["PMP", "PMI"], ["ITIL 4 Managing Professional", "PeopleCert"], ["PSM II", "Scrum.org"]] },
];
const HEADLINES = ["{skill} trainer · {yrs} yrs industry", "{skill} & {skill2} instructor for enterprise teams", "Corporate trainer · {skill} · ex-{org}", "{skill} specialist · {n}+ batches delivered", "Hands-on {skill} and {skill2} · certified instructor"];
const ORGS = ["Infosys", "TCS", "Wipro", "HCL", "Accenture", "IBM", "Capgemini", "Cognizant", "Tech Mahindra", "Amazon", "Microsoft", "Cisco", "HPE", "Deloitte", "KPMG", "Flipkart", "Zoho", "Freshworks"];
const BIOS = [
  "{yrs} years in {org} before going independent. I teach {skill} the way teams use it in production: labs first, slides second, and a checklist the participants keep.",
  "Former {org} engineer turned full-time educator. {n}+ corporate batches on {skill} and {skill2} across BFSI, IT services and manufacturing clients.",
  "I design and deliver {skill} programmes for enterprise L&D teams, from two-day bootcamps to twelve-week learning journeys with assessments.",
  "Certified instructor with a background at {org}. Every {skill} session comes with a lab environment, pre/post assessments and a participant feedback report.",
];
const COMPANIES: { name: string; industry: string; size: string; type: "DIRECT" | "TRAINING_PARTNER"; city: string; domain: string }[] = [
  { name: "Meridian Bank Learning", industry: "Banking", size: "1000+", type: "DIRECT", city: "Mumbai", domain: "meridianbank.example" },
  { name: "Orbital Systems", industry: "IT Services", size: "201–1000", type: "DIRECT", city: "Bengaluru", domain: "orbitalsystems.example" },
  { name: "Kestrel Learning Partners", industry: "Training", size: "51–200", type: "TRAINING_PARTNER", city: "Pune", domain: "kestrellearning.example" },
  { name: "Helio Pharma", industry: "Pharmaceuticals", size: "1000+", type: "DIRECT", city: "Hyderabad", domain: "heliopharma.example" },
  { name: "Northwind Logistics", industry: "Logistics", size: "201–1000", type: "DIRECT", city: "Delhi NCR", domain: "northwindlog.example" },
  { name: "Brightpath Academy", industry: "Training", size: "11–50", type: "TRAINING_PARTNER", city: "Chennai", domain: "brightpath.example" },
  { name: "Cobalt Fintech", industry: "Fintech", size: "51–200", type: "DIRECT", city: "Bengaluru", domain: "cobaltfin.example" },
  { name: "Sapphire Retail Group", industry: "Retail", size: "1000+", type: "DIRECT", city: "Gurugram", domain: "sapphireretail.example" },
  { name: "Lumen Edtech Services", industry: "Training", size: "51–200", type: "TRAINING_PARTNER", city: "Noida", domain: "lumenedtech.example" },
  { name: "Atlas Manufacturing", industry: "Manufacturing", size: "1000+", type: "DIRECT", city: "Ahmedabad", domain: "atlasmfg.example" },
  { name: "Vega Insurance", industry: "Insurance", size: "201–1000", type: "DIRECT", city: "Kolkata", domain: "vegainsure.example" },
  { name: "Quill Software Labs", industry: "Software", size: "51–200", type: "DIRECT", city: "Kochi", domain: "quilllabs.example" },
  { name: "Summit Skills Institute", industry: "Training", size: "11–50", type: "TRAINING_PARTNER", city: "Jaipur", domain: "summitskills.example" },
  { name: "Harbor Telecom", industry: "Telecom", size: "1000+", type: "DIRECT", city: "Chennai", domain: "harbortel.example" },
  { name: "Evergreen Hospitality", industry: "Hospitality", size: "201–1000", type: "DIRECT", city: "Indore", domain: "evergreenhosp.example" },
];
const POSTS = [
  "Wrapped a {days}-day {title} batch for a {industry} client this week. Best moment: the ops team rebuilt the lab from scratch on day {days} without my notes.",
  "Question for fellow trainers: how do you handle a batch where half the room is far ahead of the other half? I have started running a parallel stretch track.",
  "New course outline published: {title}. Built for teams who need results in a week, not a semester. Happy to share the lab guide with other instructors.",
  "Client feedback that made my week: \"first training where nobody opened their laptop for email.\" That is the bar.",
  "Reminder for anyone invoicing this month: quote the PO number on every invoice and attach attendance. Saves two weeks of back-and-forth with accounts.",
  "We are staffing {n} batches of {title} this quarter across {city} and virtual. Certified trainers, please check our open requirements.",
  "Just completed a pilot of {title} with our {industry} team. Attendance 96%, post-assessment up 31 points. Rolling it out to three more units.",
  "Looking for a trainer who can run {title} in {city} next month, onsite, 20 participants. Posting the requirement today.",
];
const REVIEWS = ["Excellent delivery, kept the room engaged for all {days} days and adapted examples to our stack.", "Very practical. The lab guide alone was worth the fee; the team still refers to it.", "Strong on fundamentals and patient with beginners. Would book again.", "Well prepared, punctual, and the feedback scores were the highest we have had this year.", "Good session overall. Could have spent more time on the advanced module, but the basics were rock solid."];

const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

async function main() {
  if (await db.user.count({ where: { email: { endsWith: "@demo.corpgurus.in" } } })) { console.log("Demo dataset already present, skipping."); return; }
  const hash = await bcrypt.hash(PASSWORD, 10);
  const categories = Object.fromEntries((await db.category.findMany()).map((c) => [c.name, c.id]));
  const skillRows = await db.skill.findMany();
  const skillBySlug = new Set(skillRows.map((s) => s.slug));
  const usedNames = new Set<string>();

  /* ---------- trainers ---------- */
  const trainers: { userId: string; profileId: string; name: string; skills: string[]; domain: (typeof DOMAINS)[number]; rate: number; city: string }[] = [];
  for (let i = 0; i < 50; i++) {
    let name = `${pick(FIRST)} ${pick(LAST)}`;
    while (usedNames.has(name)) name = `${pick(FIRST)} ${pick(LAST)}`;
    usedNames.add(name);
    const domain = DOMAINS[i % DOMAINS.length];
    const skills = some(domain.skills, Math.min(domain.skills.length, int(2, 4))).filter((s) => skillBySlug.has(slug(s)));
    const yrs = int(4, 22);
    const rate = Math.round((12000 + yrs * 1500 + int(0, 8000)) / 500) * 500;
    const city = pick(Object.keys(CITIES));
    const verified = rnd() < 0.6;
    const email = `${slug(name).replace(/-/g, ".")}@demo.corpgurus.in`;
    const org = pick(ORGS);
    const v = { skill: skills[0] ?? domain.skills[0], skill2: skills[1] ?? domain.skills[1] ?? domain.skills[0], yrs, org, n: int(40, 300) };
    const user = await db.user.create({ data: { name, email, passwordHash: hash, role: "TRAINER", avatarUrl: avatar(name), phone: `+91 ${int(70000, 99999)} ${int(10000, 99999)}`, timezone: "Asia/Kolkata", onboardingCompletedAt: day(-int(30, 400)), createdAt: day(-int(30, 400)), identityVerifiedAt: verified && rnd() < 0.7 ? day(-int(10, 300)) : null } });
    const profile = await db.trainerProfile.create({ data: {
      userId: user.id, slug: slug(name), headline: fill(pick(HEADLINES), v), bio: fill(pick(BIOS), v), cities: some([city, ...Object.keys(CITIES)], int(1, 2)).filter((c, j, a) => a.indexOf(c) === j),
      deliveryModes: some(["ONSITE", "VIRTUAL", "HYBRID"] as DeliveryMode[], int(1, 3)), languages: ["English", ...some(LANGS.slice(1), int(1, 2))], yearsExperience: yrs, dayRateMin: rate, dayRateMax: rate + int(2, 8) * 2500,
      verifiedAt: verified ? day(-int(5, 300)) : null, gstin: rnd() < 0.45 ? `${CITIES[city]}${pick(["AAB", "ABC", "BCD", "PQR"])}P${String.fromCharCode(65 + int(0, 25))}${int(1000, 9999)}${String.fromCharCode(65 + int(0, 25))}1Z${int(1, 9)}` : null,
      stateCode: CITIES[city], legalName: name, billingAddress: `${int(1, 400)}, ${pick(["MG Road", "Residency Road", "Hinjewadi Phase 1", "Sector 62", "Salt Lake", "Banjara Hills", "OMR"])}, ${city}`, pan: `${pick(["ABC", "BDE", "CGH", "DKL"])}P${String.fromCharCode(65 + int(0, 25))}${int(1000, 9999)}${String.fromCharCode(65 + int(0, 25))}`,
      skills: { connect: skills.map((s) => ({ slug: slug(s) })) },
      certifications: { create: some(domain.certs, int(1, Math.min(3, domain.certs.length))).map(([n, issuer]) => ({ name: n, issuer, status: verified ? "VERIFIED" as const : pick(["PENDING", "VERIFIED"] as const), credentialId: `${issuer.slice(0, 3).toUpperCase()}-${int(10000, 99999)}`, issuedOn: day(-int(200, 2000)), expiresOn: rnd() < 0.5 ? day(int(100, 900)) : null })) },
      experiences: { create: [{ title: `Senior ${domain.category} trainer`, organisation: "Independent", startDate: day(-yrs * 120), current: true, description: `Corporate batches on ${skills.join(", ")}.` }, { title: pick(["Solutions architect", "Senior engineer", "L&D manager", "Technical lead", "Consultant"]), organisation: org, startDate: day(-yrs * 365), endDate: day(-yrs * 120), description: "Delivered internal enablement programmes before moving into full-time training." }] },
      courses: { create: some(domain.titles, int(1, 2)).map((t) => ({ title: t, summary: `Instructor-led ${t.toLowerCase()} with hands-on labs, assessments and a take-home guide.`, outline: "Day 1: foundations and setup\nDay 2: core practices with labs\nDay 3: advanced topics, assessment and wrap-up", level: pick(["FOUNDATION", "INTERMEDIATE", "ADVANCED"] as const), durationDays: int(1, 4), maxParticipants: pick([12, 16, 20, 25]), indicativeRate: rate, categoryId: categories[domain.category] ?? null })) },
      availability: { create: Array.from({ length: int(1, 3) }, () => { const s = int(-20, 90); return { startDate: day(s), endDate: day(s + int(1, 4)), kind: pick(["BOOKED", "TENTATIVE", "UNAVAILABLE"] as const), note: pick(["Client batch", "Travel", "Personal", "Tentative hold"]) }; }) },
    } });
    trainers.push({ userId: user.id, profileId: profile.id, name, skills, domain, rate, city });
  }

  /* ---------- companies ---------- */
  const companies: { id: string; name: string; ownerId: string; managerId: string | null; memberIds: string[]; city: string; industry: string; stateCode: string; type: string }[] = [];
  for (const c of COMPANIES) {
    const ownerName = `${pick(FIRST)} ${pick(LAST)}`;
    const owner = await db.user.create({ data: { name: ownerName, email: `${slug(ownerName).replace(/-/g, ".")}@${c.domain.replace(".example", "")}.demo.corpgurus.in`, passwordHash: hash, role: "COMPANY", avatarUrl: avatar(ownerName), onboardingCompletedAt: day(-int(60, 400)), createdAt: day(-int(60, 400)) } });
    const stateCode = CITIES[c.city];
    const company = await db.company.create({ data: {
      slug: slug(c.name), name: c.name, logoUrl: logo(c.name), industry: c.industry, size: c.size, type: c.type, website: `https://${c.domain}`, cities: [c.city], domain: c.domain, domainVerifiedAt: rnd() < 0.7 ? day(-int(10, 300)) : null,
      gstin: `${stateCode}AA${pick(["BCD", "CDE", "DEF"])}${int(1000, 9999)}${String.fromCharCode(65 + int(0, 25))}1Z${int(1, 9)}`, gstVerifiedAt: rnd() < 0.5 ? day(-int(5, 200)) : null, gstLegalName: `${c.name} Private Limited`, stateCode, billingAddress: `${int(1, 99)}, ${pick(["Business Park", "Tech Park", "Trade Centre", "Corporate Tower"])}, ${c.city}`, billingEmail: `accounts@${c.domain}`,
      description: c.type === "TRAINING_PARTNER" ? `${c.name} delivers certified technical and behavioural programmes for enterprise clients across India and staffs freelance trainers for each batch.` : `${c.name} runs quarterly upskilling programmes for its ${c.industry.toLowerCase()} teams and hires specialist trainers per batch.`,
      hiringCategories: some(DOMAINS.map((d) => slug(d.category)), int(2, 4)), hiringCities: [c.city], batchesPerQuarter: pick(["1-3", "4-10", "10+"]), budgetBand: pick(["15k-25k", "25k-40k", "40k+"]),
      poPrefix: c.name.split(" ")[0].toUpperCase(), createdAt: day(-int(60, 400)),
      members: { create: [{ userId: owner.id, role: "OWNER" }] },
    } });
    await db.user.update({ where: { id: owner.id }, data: { activeCompanyId: company.id } });
    let managerId: string | null = null;
    if (rnd() < 0.7) {
      const mName = `${pick(FIRST)} ${pick(LAST)}`;
      const m = await db.user.create({ data: { name: mName, email: `${slug(mName).replace(/-/g, ".")}@${c.domain.replace(".example", "")}.demo.corpgurus.in`, passwordHash: hash, role: "COMPANY", avatarUrl: avatar(mName), onboardingCompletedAt: day(-int(30, 300)), activeCompanyId: company.id } });
      await db.companyMember.create({ data: { companyId: company.id, userId: m.id, role: pick(["HIRING_MANAGER", "FINANCE", "ADMIN"] as const) } });
      managerId = m.id;
    }
    companies.push({ id: company.id, name: c.name, ownerId: owner.id, managerId, memberIds: [owner.id, ...(managerId ? [managerId] : [])], city: c.city, industry: c.industry, stateCode, type: c.type });
  }

  /* ---------- requirements, applications, work orders, POs, invoices, ratings ---------- */
  const poSeq: Record<string, number> = {};
  const invSeq: Record<string, number> = {};
  let woCount = 0, invCount = 0, poCount = 0;
  for (let i = 0; i < 70; i++) {
    const c = pick(companies);
    const domain = pick(DOMAINS);
    const title = pick(domain.titles);
    const startOffset = int(-330, 90);
    const days = int(1, 5);
    const startDate = day(startOffset), endDate = day(startOffset + days - 1);
    const mode = pick(["ONSITE", "VIRTUAL", "HYBRID"] as DeliveryMode[]);
    const participants = pick([8, 12, 15, 16, 20, 25, 30]);
    const budgetMax = Math.round(int(18000, 55000) / 500) * 500;
    const past = startOffset + days < -3;
    const status: ReqStatus = past ? (rnd() < 0.85 ? "COMPLETED" : "CANCELLED") : startOffset < 20 ? "AWARDED" : pick(["OPEN", "OPEN", "SHORTLISTING", "AWARDED"] as ReqStatus[]);
    const reqSkills = some(domain.skills, int(1, 3)).filter((s) => skillBySlug.has(slug(s)));
    const req = await db.requirement.create({ data: {
      companyId: c.id, postedById: c.ownerId, title: `${title} · ${days}-day ${mode === "VIRTUAL" ? "virtual" : mode.toLowerCase()} for ${c.industry.toLowerCase()} team`, description: `${c.name} needs an experienced trainer for a ${days}-day ${title.toLowerCase()} for ${participants} participants. Hands-on labs, a pre-assessment and post-training report are expected. ${mode === "VIRTUAL" ? "Delivered over Teams/Zoom with a lab environment." : `Onsite at our ${c.city} office; travel reimbursed.`}`,
      categoryId: categories[domain.category], mode, city: mode === "VIRTUAL" ? null : c.city, startDate, endDate, days, participants, budgetMin: budgetMax - 8000, budgetMax, currency: "INR", language: "English", visibility: rnd() < 0.15 ? "INVITE_ONLY" : "PUBLIC", status,
      createdAt: day(startOffset - int(15, 45)), skills: { connect: reqSkills.map((s) => ({ slug: slug(s) })) },
    } });
    if (status === "CANCELLED") continue;
    const candidates = trainers.filter((t) => t.domain === domain);
    const applicants = some(candidates, Math.min(candidates.length, int(2, 5)));
    if (!applicants.length) continue;
    const winner = ["AWARDED", "COMPLETED"].includes(status) ? applicants[0] : null;
    for (const [j, t] of applicants.entries()) {
      const appStatus = winner && j === 0 ? "AWARDED" : status === "OPEN" ? "APPLIED" : pick(["APPLIED", "SHORTLISTED", "DECLINED"] as const);
      await db.application.create({ data: { requirementId: req.id, trainerId: t.profileId, coverNote: `I have delivered ${int(5, 60)} batches of ${title.toLowerCase()} for ${pick(["banks", "IT services firms", "manufacturers", "startups", "government bodies"])}. I bring my own lab and a ${days}-day plan with assessments.`, proposedRate: Math.round((t.rate + int(-2000, 6000)) / 500) * 500, status: appStatus, declineReason: appStatus === "DECLINED" ? "Went with a trainer closer to the venue this time." : null, createdAt: day(startOffset - int(10, 30)), statusChangedAt: day(startOffset - int(3, 10)) } });
    }
    if (!winner) continue;
    const dayRate = Math.min(budgetMax, Math.round((winner.rate + int(0, 5000)) / 500) * 500);
    const total = days * dayRate;
    const wo = await db.workOrder.create({ data: { requirementId: req.id, trainerId: winner.profileId, companyId: c.id, createdById: c.ownerId, status: "ACCEPTED", title: req.title, startDate, endDate, days, dayRate, currency: "INR", total, participants, mode, venue: mode === "VIRTUAL" ? "Microsoft Teams · lab links shared a day before" : `${c.name}, ${c.city} office · 9:30–17:30`, deliverables: "Instructor-led delivery\nLab guide and exercises\nPre/post assessment and feedback report", provided: "Courseware licences\nParticipant laptops and lab access\nAttendance sheet", paymentTerms: "Invoice on completion, payable within 30 days by bank transfer. GST extra.", cancellationTerms: "Free reschedule up to 7 days before start. 50% payable if cancelled within 7 days.", sentAt: day(startOffset - 12), acceptedAt: day(startOffset - 10), companySignedName: (await db.user.findUnique({ where: { id: c.ownerId }, select: { name: true } }))!.name, companySignedAt: day(startOffset - 12), trainerSignedName: winner.name, trainerSignedAt: day(startOffset - 10), signatureHash: Math.random().toString(16).slice(2, 34), createdAt: day(startOffset - 12) } });
    woCount++;
    await db.availabilityBlock.create({ data: { trainerId: winner.profileId, startDate, endDate, kind: "BOOKED", note: c.name, requirementId: req.id } });
    const tp = await db.trainerProfile.findUnique({ where: { id: winner.profileId }, select: { gstin: true, stateCode: true, legalName: true, billingAddress: true, pan: true } });
    const gstRate = tp?.gstin ? 18 : 0;
    const sameState = tp?.stateCode === c.stateCode;
    const gst = Math.round((total * gstRate) / 100);
    const taxType = gstRate ? (sameState ? "CGST_SGST" : "IGST") : "NONE";
    let po: { id: string; poNumber: string; poDate: Date } | null = null;
    if (rnd() < 0.55) {
      poSeq[c.id] = (poSeq[c.id] ?? 0) + 1;
      const poNumber = `${c.name.split(" ")[0].toUpperCase()}/26-27/${String(poSeq[c.id]).padStart(4, "0")}`;
      const created = await db.purchaseOrder.create({ data: { workOrderId: wo.id, companyId: c.id, trainerId: winner.profileId, issuedById: c.ownerId, poNumber, status: status === "COMPLETED" ? "CLOSED" : "ACCEPTED", title: req.title, poDate: day(startOffset - 9), validUntil: day(startOffset + 60), currency: "INR", subtotal: total, gstRate, gstAmount: gst, total: total + gst, taxType, placeOfSupply: mode === "VIRTUAL" ? "Virtual instructor-led training (VILT)" : c.city, supplyMode: mode, periodText: `${startDate.toDateString()} – ${endDate.toDateString()}`, participants, buyerName: `${c.name} Private Limited`, buyerAddress: `${c.city}`, buyerStateCode: c.stateCode, vendorName: tp?.legalName ?? winner.name, vendorAddress: tp?.billingAddress, vendorGstin: tp?.gstin, vendorPan: tp?.pan, paymentTerms: "Payment within 30 days of a correct invoice, after successful completion.", deliverables: "Instructor-led delivery\nLab guide\nAssessment report", terms: "Invoice after completion quoting this PO.\nGST extra; TDS as per the Income Tax Act.", issuedAt: day(startOffset - 9), acceptedAt: day(startOffset - 8), acceptedByName: winner.name, closedAt: status === "COMPLETED" ? day(startOffset + days + 30) : null, createdAt: day(startOffset - 9), lines: { create: [{ description: `Training delivery charges · ${title} · ${days} day(s) · ${participants} participants`, qty: days, unit: "day", rate: dayRate, amount: total, position: 0 }] } } });
      po = { id: created.id, poNumber, poDate: created.poDate };
      poCount++;
    }
    if (status === "COMPLETED") {
      invSeq[winner.profileId] = (invSeq[winner.profileId] ?? 0) + 1;
      const paid = rnd() < 0.8;
      const issuedAt = day(startOffset + days + 1);
      const dueDate = day(startOffset + days + 31);
      await db.invoice.create({ data: { invoiceNumber: `${winner.name.split(" ").map((w) => w[0]).join("").toUpperCase()}/26-27/${String(invSeq[winner.profileId]).padStart(3, "0")}`, workOrderId: wo.id, purchaseOrderId: po?.id ?? null, poNumber: po?.poNumber ?? null, poDate: po?.poDate ?? null, trainerId: winner.profileId, companyId: c.id, issuedById: winner.userId, description: `Training delivery · ${title}`, amount: total, gstRate, gstAmount: gst, total: total + gst, currency: "INR", taxType, cgstAmount: taxType === "CGST_SGST" ? Math.round(gst / 2) : 0, sgstAmount: taxType === "CGST_SGST" ? gst - Math.round(gst / 2) : 0, igstAmount: taxType === "IGST" ? gst : 0, trainerGstin: tp?.gstin, companyGstin: null, supplierName: tp?.legalName ?? winner.name, supplierAddress: tp?.billingAddress, supplierPan: tp?.pan, supplierStateCode: tp?.stateCode, customerName: `${c.name} Private Limited`, customerStateCode: c.stateCode, periodText: `${startDate.toDateString()} – ${endDate.toDateString()}`, participants, trainerName: winner.name, signatoryName: winner.name, paymentDetails: `Account name: ${winner.name}\nAccount number: ${int(10000000000, 99999999999)}\nIFSC code: HDFC000${int(1000, 9999)}`, notes: "Invoice raised for the days actually delivered as per the work order.\nAttendance and feedback records submitted.", status: paid ? "PAID" : "SENT", issuedAt, dueDate, paidAt: paid ? day(startOffset + days + int(5, 28)) : null, paidReference: paid ? `UTR${int(100000000, 999999999)}` : null, createdAt: issuedAt, lines: { create: [{ description: `Training delivery charges · ${title} · ${days} day(s) · ${participants} participants`, qty: days, unit: "day", rate: dayRate, amount: total, position: 0 }] } } });
      invCount++;
      await db.rating.create({ data: { requirementId: req.id, fromUserId: c.ownerId, toUserId: winner.userId, score: pick([4, 5, 5, 5, 3]), review: fill(pick(REVIEWS), { days }) } });
      await db.rating.create({ data: { requirementId: req.id, fromUserId: winner.userId, toUserId: c.ownerId, score: pick([4, 5, 5]), review: pick(["Clear brief, lab ready on time, paid within terms.", "Well organised batch; participants were prepared.", "Smooth engagement from PO to payment."]) } });
    }
  }

  /* ---------- feed, follows, connections, bench ---------- */
  const allTrainerUsers = trainers.map((t) => t.userId);
  for (let i = 0; i < 45; i++) {
    const fromCompany = rnd() < 0.3;
    const c = pick(companies);
    const t = pick(trainers);
    const domain = fromCompany ? pick(DOMAINS) : t.domain;
    const body = fill(pick(POSTS), { days: int(1, 4), title: pick(domain.titles), industry: c.industry.toLowerCase(), n: int(3, 12), city: c.city });
    const post = await db.post.create({ data: { authorId: fromCompany ? c.ownerId : t.userId, companyId: fromCompany ? c.id : null, body, createdAt: day(-int(0, 90)) } });
    for (const uid of some(allTrainerUsers, int(0, 12))) await db.postLike.create({ data: { postId: post.id, userId: uid } }).catch(() => null);
    if (rnd() < 0.5) await db.postComment.create({ data: { postId: post.id, authorId: pick(allTrainerUsers), body: pick(["Great insight, thanks for sharing.", "Would love the lab guide if you are open to it.", "Same experience here with banking clients.", "Bookmarking this for my next batch."]), createdAt: day(-int(0, 30)) } });
  }
  for (const t of trainers) {
    for (const c of some(companies, int(0, 3))) await db.follow.create({ data: { followerId: t.userId, companyId: c.id } }).catch(() => null);
    for (const other of some(trainers.filter((x) => x !== t), int(1, 4))) await db.connection.create({ data: { requesterId: t.userId, addresseeId: other.userId, status: "ACCEPTED", respondedAt: day(-int(1, 200)) } }).catch(() => null);
  }
  for (const c of companies) for (const t of some(trainers, int(2, 6))) await db.savedTrainer.create({ data: { companyId: c.id, trainerId: t.profileId } }).catch(() => null);

  console.log(`Demo dataset: 50 trainers, ${companies.length} companies, 70 requirements, ${woCount} work orders, ${poCount} purchase orders, ${invCount} invoices, 45 posts.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
