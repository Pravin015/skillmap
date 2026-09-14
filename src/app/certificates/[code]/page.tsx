import { BadgeCheck, ShieldX } from "lucide-react";
import { db } from "@/lib/db";
import { Logo } from "@/components/shell";
import { PrintButton } from "@/components/print-button";
import { appUrl } from "@/lib/oauth";
import { dateRange, fmtDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return { title: `Certificate ${code}` };
}

/** Public, verifiable, printable completion certificate. */
export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = await db.issuedCertificate.findUnique({ where: { code: code.toUpperCase() }, include: { requirement: { include: { company: { select: { name: true, logoUrl: true, domainVerifiedAt: true } }, category: { select: { name: true } }, skills: { select: { name: true } } } }, trainer: { include: { user: { select: { name: true } } } } } });
  if (!c) {
    return <div className="mx-auto max-w-lg py-16 text-center"><span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose/10 text-rose"><ShieldX size={26} /></span><h1 className="mt-4 text-2xl font-bold">Certificate not found</h1><p className="mt-2 text-muted">No certificate with ID <span className="mono">{code.toUpperCase()}</span> exists on CorpGurus. Check the ID on the document.</p></div>;
  }
  const r = c.requirement;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        {c.revokedAt ? <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose/40 bg-rose/10 px-3 py-1.5 text-sm font-semibold text-rose"><ShieldX size={15} /> Revoked {fmtDate(c.revokedAt)}</span> : <span className="inline-flex items-center gap-1.5 rounded-lg border border-lime/40 bg-lime/10 px-3 py-1.5 text-sm font-semibold text-lime"><BadgeCheck size={15} /> Verified by CorpGurus</span>}
        <span className="ml-auto" /><PrintButton />
      </div>
      <article className={`relative overflow-hidden rounded-2xl border-4 border-double bg-white p-10 text-center md:p-14 ${c.revokedAt ? "border-rose/40" : "border-navy"}`}>
        {c.revokedAt ? <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl font-bold uppercase tracking-widest text-rose/15">Revoked</span> : null}
        <div className="flex items-center justify-between">
          <Logo />
          {r.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.company.logoUrl} alt={r.company.name} className="h-12 max-w-40 object-contain" />
          ) : <span className="font-display text-lg font-bold text-navy">{r.company.name}</span>}
        </div>
        <p className="mono mt-10 text-[12px] uppercase tracking-[0.2em] text-muted">Certificate of completion</p>
        <p className="mt-6 text-lg text-muted">This certifies that</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-navy">{c.participantName}</h1>
        <p className="mt-6 text-lg text-muted">has completed</p>
        <h2 className="mt-2 text-2xl font-bold">{r.title}</h2>
        <p className="mt-2 text-muted">{r.category.name}{r.skills.length ? ` · ${r.skills.map((s) => s.name).join(", ")}` : ""}</p>
        <p className="mt-1 text-muted">{dateRange(r.startDate, r.endDate)} · {r.days} day{r.days > 1 ? "s" : ""} · delivered {r.mode.toLowerCase()}{r.city ? ` in ${r.city}` : ""}</p>
        <div className="mt-12 grid gap-8 text-left md:grid-cols-2">
          <div className="border-t-2 border-navy pt-3"><p className="font-display text-lg font-bold">{c.trainer.user.name}</p><p className="text-sm text-muted">Trainer · {c.trainer.headline}</p></div>
          <div className="border-t-2 border-navy pt-3"><p className="font-display text-lg font-bold">{r.company.name}</p><p className="text-sm text-muted">Organised by{r.company.domainVerifiedAt ? " · verified company" : ""}</p></div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
          <span>Certificate ID <span className="mono font-semibold text-ink">{c.code}</span> · issued {fmtDate(c.issuedAt)}</span>
          <span>Verify at {appUrl().replace(/^https?:\/\//, "")}/certificates/{c.code}</span>
        </div>
      </article>
    </div>
  );
}
