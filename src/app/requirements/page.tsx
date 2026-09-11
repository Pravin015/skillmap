import { Plus, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Button, ButtonLink, Empty, Input, PageHeader, Select } from "@/components/ui";
import { RequirementCard } from "@/components/cards";
import { DELIVERY_MODES, modeLabel } from "@/lib/utils";

export const metadata = { title: "Requirements" };
type SP = { q?: string; category?: string; mode?: string; status?: string; source?: string };

export default async function RequirementsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const status = sp.status ?? "open";
  const where: Prisma.RequirementWhereInput = {
    OR: [
      { visibility: "PUBLIC" },
      ...(user?.trainerProfile ? [{ invitedTrainers: { some: { id: user.trainerProfile.id } } }] : []),
      ...(user?.membership ? [{ companyId: user.membership.company.id }] : []),
    ],
    ...(status === "open" ? { status: { in: ["OPEN", "SHORTLISTING"] } } : status === "closed" ? { status: { in: ["AWARDED", "COMPLETED", "CANCELLED"] } } : {}),
    ...(sp.q ? { AND: [{ OR: [{ title: { contains: sp.q, mode: "insensitive" } }, { description: { contains: sp.q, mode: "insensitive" } }, { skills: { some: { name: { contains: sp.q, mode: "insensitive" } } } }] }] } : {}),
    ...(sp.category ? { category: { slug: sp.category } } : {}),
    ...(sp.mode ? { mode: sp.mode as "ONSITE" | "VIRTUAL" | "HYBRID" } : {}),
    ...(sp.source ? { company: { type: sp.source === "partner" ? "TRAINING_PARTNER" : "DIRECT" } } : {}),
  };
  const [reqs, categories] = await Promise.all([
    db.requirement.findMany({ where, include: { company: { select: { name: true, slug: true, type: true, logoUrl: true, domainVerifiedAt: true } }, skills: true, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Marketplace" title="Training requirements" body="Posted by companies and training partners. Ask questions in the open, then apply with your rate."
        actions={user?.membership ? <ButtonLink href="/requirements/new" variant="violet"><Plus size={16} /> Post a requirement</ButtonLink> : !user ? <ButtonLink href="/signup?as=company" variant="violet">Post a requirement</ButtonLink> : null} />
      <form className="mb-6 grid gap-3 rounded-2xl border border-line bg-surface/60 p-4 md:grid-cols-[1fr_170px_140px_140px_150px_auto]">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" /><Input name="q" defaultValue={sp.q} placeholder="Search title, skill or keyword" className="pl-9" /></div>
        <Select name="category" defaultValue={sp.category ?? ""}><option value="">Any domain</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}</Select>
        <Select name="mode" defaultValue={sp.mode ?? ""}><option value="">Any mode</option>{DELIVERY_MODES.map((m) => <option key={m} value={m}>{modeLabel[m]}</option>)}</Select>
        <Select name="source" defaultValue={sp.source ?? ""}><option value="">Any poster</option><option value="direct">Direct employers</option><option value="partner">Training partners</option></Select>
        <Select name="status" defaultValue={status}><option value="open">Open</option><option value="closed">Closed</option><option value="all">All</option></Select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      <p className="mono mb-4 text-[11px] uppercase tracking-wider text-dim">{reqs.length} requirement{reqs.length === 1 ? "" : "s"}</p>
      {reqs.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reqs.map((r) => <RequirementCard key={r.id} r={r} />)}</div> : <Empty title="No requirements match" body="Try clearing a filter, or check back tomorrow — new requirements are posted daily." />}
    </div>
  );
}
