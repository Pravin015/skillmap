import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const E2E = {
  password: "E2e-Password@123",
  owner: "e2e.owner@corpgurus.test",
  trainer: "e2e.trainer@corpgurus.test",
  admin: "pravin@corpgurus.demo",
  adminPassword: "Password@123",
  company: "E2E Testing Co",
};

/** Idempotent fixtures: a company with an owner, a trainer with GST details, and no leftover E2E requirements. */
export default async function globalSetup() {
  const db = new PrismaClient();
  try {
    const hash = await bcrypt.hash(E2E.password, 10);
    const done = new Date();
    const trainerUser = await db.user.upsert({ where: { email: E2E.trainer }, update: { passwordHash: hash, status: "ACTIVE", name: "E2E Trainer" }, create: { email: E2E.trainer, name: "E2E Trainer", passwordHash: hash, role: "TRAINER", onboardingCompletedAt: done } });
    await db.trainerProfile.upsert({ where: { userId: trainerUser.id }, update: {}, create: { userId: trainerUser.id, slug: "e2e-trainer", headline: "E2E automation trainer", bio: "Created by the Playwright suite.", cities: ["Bengaluru"], deliveryModes: ["VIRTUAL", "ONSITE"], languages: ["English"], yearsExperience: 7, dayRateMin: 20000, dayRateMax: 40000, verifiedAt: done, gstin: "29ABCDE1234F1Z5", stateCode: "29", legalName: "E2E Trainer", billingAddress: "1 Test Lane, Bengaluru 560001", pan: "ABCDE1234F", invoicePrefix: "E2E", skills: { connect: [{ slug: "aws" }, { slug: "kubernetes" }] } } });
    const ownerUser = await db.user.upsert({ where: { email: E2E.owner }, update: { passwordHash: hash, status: "ACTIVE", name: "E2E Owner" }, create: { email: E2E.owner, name: "E2E Owner", passwordHash: hash, role: "COMPANY", onboardingCompletedAt: done } });
    const company = await db.company.upsert({ where: { slug: "e2e-testing-co" }, update: {}, create: { slug: "e2e-testing-co", name: E2E.company, industry: "Software", size: "51–200", website: "https://e2e.corpgurus.test", cities: ["Mumbai"], domain: "corpgurus.test", domainVerifiedAt: done, gstin: "27AABCE1234F1Z5", stateCode: "27", gstLegalName: "E2E Testing Co Pvt Ltd", billingAddress: "2 Test Road, Mumbai 400001", description: "Fixture company for end-to-end tests." } });
    await db.companyMember.upsert({ where: { companyId_userId: { companyId: company.id, userId: ownerUser.id } }, update: { role: "OWNER" }, create: { companyId: company.id, userId: ownerUser.id, role: "OWNER" } });
    await db.user.update({ where: { id: ownerUser.id }, data: { activeCompanyId: company.id } });
    // Clean requirements from earlier runs so the free-plan limit and unique constraints never bite.
    await db.requirement.deleteMany({ where: { companyId: company.id } });
    await db.purchaseOrder.deleteMany({ where: { companyId: company.id } });
    await db.invoice.deleteMany({ where: { companyId: company.id } });
  } finally {
    await db.$disconnect();
  }
}
