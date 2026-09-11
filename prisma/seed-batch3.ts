import { PrismaClient } from "@prisma/client";

/** Skill→category mapping, vendors, category blurbs, gallery photos, an invoice, identity/GST verification. Safe to re-run. */
export async function seedBatch3(db: PrismaClient) {
  const map: Record<string, [string, string | null]> = {
    "HPE VM Essentials": ["IT & Cloud", "HPE"], "HPE Aruba": ["Networking", "HPE"], "HPE GreenLake": ["IT & Cloud", "HPE"], "Morpheus": ["IT & Cloud", "HPE"], "Zerto": ["IT & Cloud", "HPE"],
    "Palo Alto PAN-OS": ["Cybersecurity", "Palo Alto Networks"], "AWS": ["IT & Cloud", "AWS"], "Azure": ["IT & Cloud", "Microsoft"], "GCP": ["IT & Cloud", "Google"], "Kubernetes": ["DevOps", "CNCF"], "Docker": ["DevOps", null], "Terraform": ["DevOps", "HashiCorp"],
    "Cisco CCNA": ["Networking", "Cisco"], "Fortinet": ["Cybersecurity", "Fortinet"], "CISSP": ["Cybersecurity", "ISC2"], "CRISC": ["Cybersecurity", "ISACA"], "ISO 27001": ["Compliance", null], "Python": ["Data & AI", null], "Power BI": ["Data & AI", "Microsoft"],
    "Machine Learning": ["Data & AI", null], "Generative AI": ["Data & AI", null], "Prompt Engineering": ["Data & AI", null], "Leadership Development": ["Leadership", null], "Executive Presence": ["Leadership", null], "Negotiation": ["Sales", null],
    "Consultative Selling": ["Sales", null], "POSH": ["Compliance", null], "GDPR": ["Compliance", null], "Agile & Scrum": ["Project Management", "Scrum Alliance"], "PMP": ["Project Management", "PMI"], "ITIL 4": ["Project Management", "Axelos"], "Communication Skills": ["Soft Skills", null], "Design Thinking": ["Soft Skills", null],
  };
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.name, c.id]));
  for (const [name, [cat, vendor]] of Object.entries(map)) {
    await db.skill.updateMany({ where: { name }, data: { categoryId: cats[cat] ?? null, vendor } });
  }
  const blurbs: Record<string, string> = {
    "IT & Cloud": "Virtualisation, private and public cloud, hybrid infrastructure and vendor-authorised tracks.", "Cybersecurity": "Firewalls, SOC operations, security certifications and compliance frameworks.",
    "Networking": "Campus and data-centre networking, wireless and vendor certification tracks.", "Data & AI": "Analytics, machine learning and practical generative AI for business teams.",
    "Leadership": "First-time manager programmes, executive coaching and leadership journeys.", "Sales": "Consultative selling, negotiation and enterprise sales enablement.",
    "Compliance": "POSH, data protection and information security awareness.", "Soft Skills": "Communication, collaboration and design thinking workshops.",
    "Project Management": "Agile, Scrum, PMP and ITIL certification preparation.", "DevOps": "Containers, orchestration, infrastructure as code and CI/CD.",
  };
  for (const [name, description] of Object.entries(blurbs)) await db.category.updateMany({ where: { name }, data: { description } });

  if (!(await db.galleryPhoto.count())) {
    const ananya = await db.trainerProfile.findFirst({ where: { user: { email: "ananya@corpgurus.demo" } } });
    const sana = await db.trainerProfile.findFirst({ where: { user: { email: "sana@corpgurus.demo" } } });
    const skillbridge = await db.company.findFirst({ where: { slug: "skillbridge-learning" } });
    const quantum = await db.company.findFirst({ where: { slug: "quantum-edge-training" } });
    const svg = (label: string, bg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='800' height='600' fill='${bg}'/><rect x='60' y='380' width='680' height='140' fill='rgba(255,255,255,0.15)'/><text x='400' y='320' font-family='Segoe UI,Arial' font-size='40' fill='#fff' text-anchor='middle'>${label}</text><text x='400' y='460' font-family='Segoe UI,Arial' font-size='22' fill='#fff' text-anchor='middle'>Demo photo placeholder</text></svg>`)}`;
    if (ananya) await db.galleryPhoto.createMany({ data: [
      { trainerId: ananya.id, url: svg("HPE VM Essentials · storage lab", "#0b2a5b"), caption: "Day 2 storage lab, HPE VM Essentials batch for a private bank in Mumbai", takenOn: new Date(Date.now() - 12 * 86400000), companyId: skillbridge?.id },
      { trainerId: ananya.id, url: svg("Migration day", "#0f4c9a"), caption: "Live VMware-to-HVM migration lab, the room went quiet in the good way", takenOn: new Date(Date.now() - 11 * 86400000), companyId: skillbridge?.id },
      { trainerId: ananya.id, url: svg("Zerto DR workshop", "#4b3f9e"), caption: "Zerto failover test with the DR team", takenOn: new Date(Date.now() - 40 * 86400000) },
    ] });
    if (sana) await db.galleryPhoto.createMany({ data: [
      { trainerId: sana.id, url: svg("AWS + Terraform bootcamp", "#1b7f45"), caption: "Capstone review on day 4 of the AWS + Terraform bootcamp", takenOn: new Date(Date.now() - 5 * 86400000), companyId: quantum?.id },
      { trainerId: sana.id, url: svg("EKS lab", "#a2650a"), caption: "EKS module, everyone's cluster up by lunch", takenOn: new Date(Date.now() - 6 * 86400000), companyId: quantum?.id },
    ] });
  }

  // Verification levels for the demo.
  await db.user.updateMany({ where: { email: { in: ["ananya@corpgurus.demo", "sana@corpgurus.demo", "rohit@corpgurus.demo"] } }, data: { identityVerifiedAt: new Date(Date.now() - 20 * 86400000) } });
  await db.company.updateMany({ where: { slug: { in: ["skillbridge-learning", "techsphere-solutions"] } }, data: { gstin: "27AABCS1234A1Z5", gstVerifiedAt: new Date(Date.now() - 15 * 86400000), billingAddress: "4th Floor, Trade Centre, Bandra Kurla Complex\nMumbai 400051" } });
  await db.company.updateMany({ where: { slug: "quantum-edge-training" }, data: { gstin: "36AAACQ4321B1Z9", billingAddress: "Plot 12, HITEC City\nHyderabad 500081" } });
  await db.trainerProfile.updateMany({ where: { user: { email: "sana@corpgurus.demo" } }, data: { gstin: "36ABCPS9876C1Z2", paymentDetails: "Sana Sheikh · HDFC Bank · A/c 50100123456789 · IFSC HDFC0001234\nUPI: sana@hdfcbank" } });

  // One invoice on the accepted work order (raised by Sana).
  if (!(await db.invoice.count())) {
    const wo = await db.workOrder.findFirst({ where: { status: "ACCEPTED" }, include: { trainer: { include: { user: true } }, company: true } });
    if (wo) {
      const gst = Math.round(wo.total * 0.18);
      await db.invoice.create({ data: { invoiceNumber: "SS-2026-014", workOrderId: wo.id, trainerId: wo.trainerId, companyId: wo.companyId, issuedById: wo.trainer.userId, description: `${wo.title} · ${wo.days} days × ₹${wo.dayRate.toLocaleString("en-IN")}`, amount: wo.total, gstRate: 18, gstAmount: gst, total: wo.total + gst, currency: wo.currency, trainerGstin: "36ABCPS9876C1Z2", companyGstin: wo.company.gstin, paymentDetails: "Sana Sheikh · HDFC Bank · A/c 50100123456789 · IFSC HDFC0001234\nUPI: sana@hdfcbank", dueDate: new Date(Date.now() + 25 * 86400000), issuedAt: new Date(Date.now() - 5 * 86400000) } });
    }
  }
  console.log("Batch 3 seeded: skill categories and vendors, category blurbs, gallery photos, verification levels, one invoice.");
}

if (require.main === module) {
  const db = new PrismaClient();
  seedBatch3(db).catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
}
