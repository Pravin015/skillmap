import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { Avatar, Badge, PageHeader } from "@/components/ui";

export const metadata = { title: "Companies" };

export default async function CompaniesPage() {
  const companies = await db.company.findMany({
    include: { _count: { select: { requirements: { where: { status: { in: ["OPEN", "SHORTLISTING"] } } }, members: true } } },
    orderBy: [{ domainVerifiedAt: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
  });
  return (
    <div>
      <PageHeader eyebrow="Directory" title="Companies and training partners" body="Direct employers running their own academies, and authorised training partners who staff batches with freelance instructors." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => (
          <Link key={c.id} href={`/companies/${c.slug}`} className="block rounded-2xl border border-line bg-surface/70 p-5 transition hover:-translate-y-0.5 hover:border-violet/50">
            <div className="flex items-start gap-3">
              <Avatar name={c.name} src={c.logoUrl} size={48} tone="violet" className="rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-display font-semibold"><span className="truncate">{c.name}</span>{c.domainVerifiedAt ? <BadgeCheck size={16} className="shrink-0 text-violet" /> : null}</p>
                <p className="text-sm text-muted">{c.industry || "—"} · {c.size || "—"}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone={c.type === "TRAINING_PARTNER" ? "violet" : "neutral"}>{c.type === "TRAINING_PARTNER" ? "Training partner" : "Direct employer"}</Badge>
              {c._count.requirements ? <Badge tone="cyan">{c._count.requirements} open</Badge> : null}
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-muted">{c.description}</p>
            <p className="mt-3 flex items-center gap-1 text-xs text-dim"><MapPin size={12} />{c.cities.join(", ") || "—"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
