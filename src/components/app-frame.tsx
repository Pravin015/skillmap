"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import * as Icons from "lucide-react";
import { Avatar } from "@/components/ui";
import { isMarketingPath, titleFor, type NavGroup } from "@/lib/nav";

type IconName = keyof typeof Icons;
function Icon({ name, size = 17, className }: { name: string; size?: number; className?: string }) {
  const C = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name as IconName] ?? Icons.Circle;
  return <C size={size} className={className} />;
}

const readCollapsed = () => { try { return localStorage.getItem("cg_sidebar") === "collapsed"; } catch { return false; } };
const subscribeSidebar = (cb: () => void) => { window.addEventListener("cg-sidebar", cb); window.addEventListener("storage", cb); return () => { window.removeEventListener("cg-sidebar", cb); window.removeEventListener("storage", cb); }; };

export type Account = { name: string; subtitle: string; avatarUrl: string | null; tone: "cyan" | "violet" | "amber" };

/**
 * Chooses between the marketing chrome (header + footer) and the signed-in app chrome
 * (collapsible sidebar + top bar) based on the current route. Server-action forms
 * (sign out, context switch) come in as slots so they keep working inside this client tree.
 */
export function AppFrame({ signedIn, nav, account, counts, marketingHeader, footer, banners, contextSwitcher, logout, children }: {
  signedIn: boolean; nav: NavGroup[]; account: Account | null; counts: { unread: number; unreadConvos: number };
  marketingHeader: ReactNode; footer: ReactNode; banners: ReactNode; contextSwitcher?: ReactNode; logout: ReactNode; children: ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const app = signedIn && !!account && !isMarketingPath(pathname);
  if (!app) {
    return (
      <div className="flex min-h-screen flex-col">
        {banners}
        {marketingHeader}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>
        {footer}
      </div>
    );
  }
  return <AppChrome nav={nav} account={account!} counts={counts} banners={banners} contextSwitcher={contextSwitcher} logout={logout} pathname={pathname}>{children}</AppChrome>;
}

function AppChrome({ nav, account, counts, banners, contextSwitcher, logout, pathname, children }: { nav: NavGroup[]; account: Account; counts: { unread: number; unreadConvos: number }; banners: ReactNode; contextSwitcher?: ReactNode; logout: ReactNode; pathname: string; children: ReactNode }) {
  const collapsed = useSyncExternalStore(subscribeSidebar, readCollapsed, () => false);
  // Open state is keyed to the path it was opened on, so a navigation closes it without an effect.
  const [mobileOpenAt, setMobileOpenAt] = useState<string | null>(null);
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const mobileOpen = mobileOpenAt === pathname;
  const menuOpen = menuOpenAt === pathname;
  const setMobileOpen = (v: boolean) => setMobileOpenAt(v ? pathname : null);
  const setMenuOpen = (v: boolean | ((o: boolean) => boolean)) => setMenuOpenAt((typeof v === "function" ? v(menuOpen) : v) ? pathname : null);
  const [q, setQ] = useState("");
  const toggleCollapsed = () => { try { localStorage.setItem("cg_sidebar", collapsed ? "open" : "collapsed"); } catch { /* ignore */ } window.dispatchEvent(new Event("cg-sidebar")); };
  const title = titleFor(nav, pathname) ?? "CorpGurus";
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return nav;
    return nav.map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(needle) || g.label.toLowerCase().includes(needle)) })).filter((g) => g.items.length);
  }, [nav, q]);
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const wide = !collapsed;

  const sidebar = (
    <aside className={`flex h-full flex-col border-r border-line bg-white ${wide ? "w-[264px]" : "w-[76px]"} transition-[width] duration-200`}>
      <div className={`flex h-16 items-center border-b border-line ${wide ? "justify-between px-4" : "justify-center px-2"}`}>
        <Link href="/dashboard" className="flex items-center gap-2.5 font-display text-[19px] font-bold tracking-tight text-navy" aria-label="CorpGurus home">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan font-display text-[13px] font-bold text-white">CG</span>
          {wide ? <span>Corp<span className="text-cyan">Gurus</span></span> : null}
        </Link>
        {wide ? <button type="button" onClick={toggleCollapsed} className="hidden rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink lg:block" aria-label="Collapse sidebar"><Icons.ChevronLeft size={18} /></button> : null}
        <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 lg:hidden" aria-label="Close menu"><Icons.X size={18} /></button>
      </div>
      {!wide ? <button type="button" onClick={toggleCollapsed} className="mx-auto mt-2 hidden rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink lg:block" aria-label="Expand sidebar"><Icons.ChevronRight size={18} /></button> : null}
      {wide ? (
        <div className="px-3 pt-3">
          <label className="relative block"><Icons.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search menu…" className="h-9 w-full rounded-lg border border-line bg-surface-2 pl-8 pr-3 text-sm placeholder:text-dim focus:border-cyan focus:bg-white focus:outline-none" /></label>
        </div>
      ) : null}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3">
        {filtered.map((g) => (
          <div key={g.label} className="mb-4">
            {wide ? <p className="mono mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">{g.label}</p> : <div className="mx-2 mb-2 border-t border-line" />}
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const active = isActive(i.href, i.exact);
                return (
                  <li key={i.href + i.label}>
                    <Link href={i.href} title={wide ? undefined : i.label} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition ${wide ? "" : "justify-center"} ${active ? "bg-cyan text-white shadow-sm shadow-cyan/30" : i.accent ? "text-cyan hover:bg-cyan/10" : "text-ink/80 hover:bg-surface-2 hover:text-ink"}`}>
                      <Icon name={i.icon} className={active ? "text-white" : i.accent ? "text-cyan" : "text-muted"} />
                      {wide ? <span className="min-w-0 flex-1 truncate">{i.label}</span> : null}
                      {i.badge ? <span className={`${wide ? "" : "absolute ml-6 -mt-5"} flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-display text-[10px] font-bold ${active ? "bg-white text-cyan" : "bg-rose text-white"}`}>{i.badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {!filtered.length ? <p className="px-2 text-sm text-muted">Nothing matches “{q}”.</p> : null}
      </nav>
      <div className={`border-t border-line p-3 ${wide ? "" : "flex flex-col items-center"}`}>
        {wide && contextSwitcher ? <div className="mb-2">{contextSwitcher}</div> : null}
        <div className={`flex items-center gap-2.5 ${wide ? "" : "justify-center"}`}>
          <Avatar name={account.name} src={account.avatarUrl} size={34} tone={account.tone} />
          {wide ? <div className="min-w-0 flex-1"><p className="truncate font-display text-sm font-semibold">{account.name}</p><p className="truncate text-[11px] text-muted">{account.subtitle}</p></div> : null}
          {wide ? <div className="shrink-0 [&_button]:rounded-lg [&_button]:p-2 [&_button]:text-muted hover:[&_button]:bg-rose/10 hover:[&_button]:text-rose [&_span]:sr-only">{logout}</div> : null}
        </div>
        {!wide ? <div className="mt-2 [&_button]:rounded-lg [&_button]:p-2 [&_button]:text-muted hover:[&_button]:bg-rose/10 hover:[&_button]:text-rose [&_span]:sr-only">{logout}</div> : null}
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">{sidebar}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="h-full shadow-2xl">{sidebar}</div>
          <button type="button" className="flex-1 bg-navy/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        {banners}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line/70 bg-white/90 px-4 backdrop-blur md:px-6">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden" aria-label="Open menu"><Icons.Menu size={20} /></button>
          <h1 className="min-w-0 truncate font-display text-lg font-bold">{title}</h1>
          <form action="/search" className="ml-auto hidden md:block">
            <div className="relative"><Icons.Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" /><input name="q" placeholder="Search trainers, requirements, companies" className="h-9 w-64 rounded-full border border-line bg-surface-2 pl-9 pr-3 text-sm placeholder:text-dim focus:border-cyan focus:bg-white focus:outline-none xl:w-80" /></div>
          </form>
          <Link href="/search" className="ml-auto rounded-lg p-2 text-muted hover:bg-surface-2 md:hidden" aria-label="Search"><Icons.Search size={19} /></Link>
          <Link href="/dashboard/notifications" className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Notifications"><Icons.Bell size={19} />{counts.unread ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 font-display text-[10px] font-bold text-white">{counts.unread}</span> : null}</Link>
          <Link href="/messages" className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Messages"><Icons.MessageSquare size={19} />{counts.unreadConvos ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan px-1 font-display text-[10px] font-bold text-white">{counts.unreadConvos}</span> : null}</Link>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-surface-2" aria-haspopup="menu" aria-expanded={menuOpen}>
              <div className="hidden text-right sm:block"><p className="font-display text-sm font-semibold leading-tight">{account.name}</p><p className="text-[11px] leading-tight text-muted">{account.subtitle}</p></div>
              <Avatar name={account.name} src={account.avatarUrl} size={34} tone={account.tone} />
            </button>
            {menuOpen ? (
              <>
                <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-line bg-white p-1.5 shadow-lg shadow-navy/10">
                  <div className="px-3 py-2"><p className="truncate font-display text-sm font-semibold">{account.name}</p><p className="text-xs text-muted">{account.subtitle}</p></div>
                  {contextSwitcher ? <div className="mb-1">{contextSwitcher}</div> : null}
                  <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2"><Icons.LayoutDashboard size={15} /> Dashboard</Link>
                  <Link href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2"><Icons.Settings size={15} /> Settings</Link>
                  <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2"><Icons.Globe size={15} /> Public site</Link>
                  <div className="hairline my-1" />
                  <div className="[&_button]:flex [&_button]:w-full [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-lg [&_button]:px-3 [&_button]:py-2 [&_button]:text-left [&_button]:text-sm [&_button]:text-muted hover:[&_button]:bg-surface-2 hover:[&_button]:text-rose">{logout}</div>
                </div>
              </>
            ) : null}
          </div>
          <div className="hidden sm:block [&_button]:inline-flex [&_button]:h-9 [&_button]:items-center [&_button]:gap-1.5 [&_button]:rounded-full [&_button]:border [&_button]:border-line-2 [&_button]:bg-white [&_button]:px-3.5 [&_button]:font-display [&_button]:text-[13px] [&_button]:font-semibold hover:[&_button]:bg-rose/5 hover:[&_button]:text-rose">{logout}</div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        <footer className="border-t border-line px-6 py-4 text-center text-xs text-dim">© 2026 CorpGurus · <Link href="/legal/terms" className="hover:text-ink">Terms</Link> · <Link href="/legal/privacy" className="hover:text-ink">Privacy</Link> · <Link href="/contact" className="hover:text-ink">Support</Link></footer>
      </div>
    </div>
  );
}
