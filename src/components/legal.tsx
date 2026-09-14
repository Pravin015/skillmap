import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Shared layout for terms, privacy and refund pages: sticky table of contents, effective date, cross-links. */
export function LegalPage({ title, effective, intro, sections, current }: { title: string; effective: string; intro: ReactNode; sections: LegalSection[]; current: "terms" | "privacy" | "refunds" }) {
  const links: [string, string, string][] = [["terms", "/legal/terms", "Terms of service"], ["privacy", "/legal/privacy", "Privacy policy"], ["refunds", "/legal/refunds", "Refunds & cancellations"]];
  return (
    <div className="mx-auto max-w-5xl">
      <p className="mono text-[12px] uppercase tracking-[0.12em] text-cyan">Legal</p>
      <h1 className="mt-2 text-[34px] font-bold leading-tight md:text-[44px]">{title}</h1>
      <p className="mt-2 text-sm text-muted">Effective {effective} · CorpGurus, India</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="rounded-2xl border border-line bg-white p-4 text-sm">
            <p className="mono mb-2 text-[11px] uppercase tracking-wider text-muted">Documents</p>
            <ul className="space-y-1">{links.map(([k, href, label]) => <li key={k}><Link href={href} className={`block rounded-lg px-2 py-1 ${current === k ? "bg-cyan/8 font-semibold text-cyan" : "text-muted hover:text-ink"}`}>{label}</Link></li>)}</ul>
            <p className="mono mb-2 mt-4 text-[11px] uppercase tracking-wider text-muted">On this page</p>
            <ol className="space-y-1">{sections.map((s, i) => <li key={s.id}><a href={`#${s.id}`} className="block rounded-lg px-2 py-1 text-muted hover:text-ink">{i + 1}. {s.title}</a></li>)}</ol>
          </nav>
        </aside>
        <article className="rounded-[28px] border border-line bg-white p-6 md:p-10">
          <div className="text-[15px] leading-relaxed text-ink/90">{intro}</div>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="mt-8 scroll-mt-24 border-t border-line pt-6">
              <h2 className="text-xl font-bold">{i + 1}. {s.title}</h2>
              <div className="prose-legal mt-3 space-y-3 text-[15px] leading-relaxed text-ink/90 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">{s.body}</div>
            </section>
          ))}
          <p className="mt-10 border-t border-line pt-6 text-sm text-muted">Questions about this document: <a href="mailto:hello@corpgurus.com" className="text-cyan hover:underline">hello@corpgurus.com</a> or the <Link href="/contact" className="text-cyan hover:underline">contact page</Link>.</p>
        </article>
      </div>
    </div>
  );
}
