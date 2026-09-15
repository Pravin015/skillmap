import Link from "next/link";
import { Bell, Briefcase, Building2, LayoutDashboard, LayoutGrid, LogOut, Menu, MessageSquare, Newspaper, Search, Settings, ShieldCheck, Tag, Users } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/lib/actions/auth";
import { Avatar, ButtonLink } from "./ui";
import { LiveRefresh } from "./live-refresh";
import { PwaControls } from "./pwa-register";
import { AnnouncementBar } from "./announcement-bar";
import { MenuAutoClose } from "./menu-autoclose";
import { AppFrame, type Account } from "./app-frame";
import { stopImpersonation } from "@/lib/actions/impersonate";
import { switchContext } from "@/lib/actions/account";
import { memberRoleLabel, staffRoleLabel } from "@/lib/permissions";
import { roleLabel } from "@/lib/utils";
import { getLang, getT, LANGS } from "@/lib/i18n";
import { setLang } from "@/lib/actions/lang";
import { buildNav } from "@/lib/nav";

type T = Awaited<ReturnType<typeof getT>>;

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 font-display text-[19px] font-bold tracking-tight text-navy ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan font-display text-[13px] font-bold tracking-tight text-white">CG</span>
      Corp<span className="text-cyan">Gurus</span>
    </Link>
  );
}

type Me = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Shared chrome: marketing header + footer for visitors and marketing routes, sidebar app frame for signed-in members. */
export async function Shell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const staff = !!user && isStaff(user);
  const [unread, unreadConvos, openReports, queue] = user ? await Promise.all([
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    db.conversationParticipant.findMany({ where: { userId: user.id }, select: { lastReadAt: true, conversation: { select: { messages: { where: { senderId: { not: user.id } }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } } } } }).then((ps) => ps.filter((p) => p.conversation.messages[0] && (!p.lastReadAt || p.lastReadAt < p.conversation.messages[0].createdAt)).length),
    staff ? db.report.count({ where: { status: "OPEN" } }) : 0,
    staff ? db.certification.count({ where: { status: "PENDING" } }) : 0,
  ]) : [0, 0, 0, 0];
  const tone: Account["tone"] = user?.role === "TRAINER" ? "cyan" : user?.role === "COMPANY" ? "violet" : "amber";
  const [t, lang] = await Promise.all([getT(), getLang()]);
  const ann = Object.fromEntries((await db.setting.findMany({ where: { key: { in: ["announcement_text", "announcement_tone", "announcement_href", "announcement_until", "announcement_id"] } } })).map((s) => [s.key, s.value]));
  const announcementLive = !!ann.announcement_text && (!ann.announcement_until || new Date(ann.announcement_until) > new Date());
  const subtitle = user ? (user.membership ? `${memberRoleLabel(user.membership.role)} · ${user.membership.company.name}` : staff ? staffRoleLabel(user.role) : roleLabel[user.role]) : "";
  const account: Account | null = user ? { name: user.name, subtitle, avatarUrl: user.avatarUrl, tone } : null;
  const nav = user ? buildNav(user, { unread, unreadConvos, openReports, queue }) : [];

  const banners = (
    <>
      {user ? <LiveRefresh /> : null}
      {user?.impersonatedBy ? (
        <div className="border-b border-rose/40 bg-rose/10 text-rose">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm md:px-6"><span className="font-semibold">Support view:</span> you are seeing CorpGurus as {user.name} ({user.email}). Actions you take are recorded under their account.
            <form action={stopImpersonation} className="ml-auto"><button className="rounded-md border border-rose/40 bg-white px-2.5 py-1 font-display text-xs font-semibold hover:bg-rose/5">Exit support view</button></form></div>
        </div>
      ) : null}
      {announcementLive ? <AnnouncementBar id={ann.announcement_id ?? "1"} text={ann.announcement_text} tone={(ann.announcement_tone as "info" | "warning" | "success") || "info"} href={ann.announcement_href || undefined} /> : null}
    </>
  );
  const logoutForm = <form action={logout}><button type="submit"><LogOut size={15} /><span>Sign out</span></button></form>;
  const switcher = user ? <ContextSwitcher user={user} /> : null;

  return (
    <AppFrame signedIn={!!user} nav={nav} account={account} counts={{ unread, unreadConvos }} banners={banners} logout={logoutForm} contextSwitcher={switcher}
      marketingHeader={<MarketingHeader user={user} unread={unread} unreadConvos={unreadConvos} tone={tone} subtitle={subtitle} t={t} />}
      footer={<Footer signedIn={!!user} lang={lang} t={t} />}>
      {children}
    </AppFrame>
  );
}

/** Trainer view / company switcher for people with more than one hat. Rendered inside the sidebar and the account menu. */
function ContextSwitcher({ user }: { user: Me }) {
  if (!(user.memberships.length > 1 || (user.hasTrainerProfile && user.memberships.length))) return null;
  return (
    <div className="rounded-lg bg-surface-2 p-1.5">
      <p className="mono px-1.5 pb-1 text-[10px] uppercase tracking-wider text-muted">Switch to</p>
      {user.hasTrainerProfile ? <form action={switchContext}><button className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${!user.membership ? "bg-white font-semibold" : "hover:bg-white"}`}><Briefcase size={14} /> Trainer view</button></form> : null}
      {user.memberships.map((m) => <form key={m.id} action={switchContext}><input type="hidden" name="companyId" value={m.companyId} /><button className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${user.membership?.companyId === m.companyId ? "bg-white font-semibold" : "hover:bg-white"}`}><Building2 size={14} /> <span className="min-w-0 flex-1 truncate">{m.company.name}</span><span className="text-[10px] text-muted">{memberRoleLabel(m.role)}</span></button></form>)}
    </div>
  );
}

function MarketingHeader({ user, unread, unreadConvos, tone, subtitle, t }: { user: Me | null; unread: number; unreadConvos: number; tone: Account["tone"]; subtitle: string; t: T }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur">
      <MenuAutoClose />
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-0.5 text-[14px] font-medium text-muted md:flex">
          <NavLink href="/feed" icon={<Newspaper size={16} />}>{t("nav.feed")}</NavLink>
          <NavLink href="/trainers" icon={<Users size={16} />}>{t("nav.trainers")}</NavLink>
          <NavLink href="/requirements" icon={<Briefcase size={16} />}>{t("nav.requirements")}</NavLink>
          <NavLink href="/companies" icon={<Building2 size={16} />}>{t("nav.companies")}</NavLink>
          <NavLink href="/categories" icon={<LayoutGrid size={16} />}>{t("nav.categories")}</NavLink>
          <NavLink href="/pricing" icon={<Tag size={16} />}>{t("nav.pricing")}</NavLink>
        </nav>
        <form action="/search" className="ml-auto hidden lg:block">
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" /><input name="q" placeholder="Search" className="h-9 w-44 rounded-full border border-line bg-surface-2 pl-9 pr-3 text-sm placeholder:text-dim focus:border-cyan focus:bg-white focus:outline-none" /></div>
        </form>
        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <Link href="/search" className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink lg:hidden" aria-label="Search"><Search size={19} /></Link>
          {user ? (
            <>
              <Link href="/dashboard" className="hidden h-9 items-center gap-1.5 rounded-full bg-cyan px-4 font-display text-[13px] font-semibold text-white hover:bg-violet md:inline-flex"><LayoutDashboard size={15} /> {isStaff(user) ? "Admin console" : t("nav.dashboard")}</Link>
              <Link href="/dashboard/notifications" className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Notifications">
                <Bell size={19} />
                {unread > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 font-display text-[10px] font-bold text-white">{unread}</span> : null}
              </Link>
              <Link href="/messages" className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Messages"><MessageSquare size={19} />{unreadConvos > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan px-1 font-display text-[10px] font-bold text-white">{unreadConvos}</span> : null}</Link>
              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-surface-2">
                  <Avatar name={user.name} src={user.avatarUrl} size={32} tone={tone} />
                  <span className="hidden text-sm font-semibold md:block">{user.name.split(" ")[0]}</span>
                </summary>
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-lg shadow-navy/10">
                  <div className="px-3 py-2"><p className="truncate font-display text-sm font-semibold">{user.name}</p><p className="text-xs text-muted">{subtitle}</p></div>
                  <div className="hairline my-1" />
                  <ContextSwitcher user={user} />
                  <MenuLink href="/dashboard" icon={<LayoutDashboard size={15} />}>{isStaff(user) ? "Admin console" : t("nav.dashboard")}</MenuLink>
                  <MenuLink href="/messages" icon={<MessageSquare size={15} />}>{t("nav.messages")}</MenuLink>
                  <MenuLink href="/network" icon={<Users size={15} />}>{t("nav.network")}</MenuLink>
                  <MenuLink href="/settings" icon={<Settings size={15} />}>{t("nav.settings")}</MenuLink>
                  {isStaff(user) ? <MenuLink href="/admin/overview" icon={<ShieldCheck size={15} />}>Admin overview</MenuLink> : null}
                  <div className="hairline my-1" />
                  <form action={logout}><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-rose"><LogOut size={15} /> {t("nav.signout")}</button></form>
                </div>
              </details>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">{t("nav.signin")}</ButtonLink>
              <ButtonLink href="/signup" size="sm">{t("nav.join")}</ButtonLink>
            </>
          )}
          <details className="relative md:hidden">
            <summary className="flex cursor-pointer list-none items-center rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Menu"><Menu size={20} /></summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-white p-1.5 shadow-lg shadow-navy/10">
              {user ? <MenuLink href="/dashboard" icon={<LayoutDashboard size={15} />}>{isStaff(user) ? "Admin console" : t("nav.dashboard")}</MenuLink> : null}
              <MenuLink href="/feed" icon={<Newspaper size={15} />}>{t("nav.feed")}</MenuLink>
              <MenuLink href="/trainers" icon={<Users size={15} />}>{t("nav.trainers")}</MenuLink>
              <MenuLink href="/requirements" icon={<Briefcase size={15} />}>{t("nav.requirements")}</MenuLink>
              <MenuLink href="/companies" icon={<Building2 size={15} />}>{t("nav.companies")}</MenuLink>
              <MenuLink href="/categories" icon={<LayoutGrid size={15} />}>{t("nav.categories")}</MenuLink>
              <MenuLink href="/pricing" icon={<Tag size={15} />}>{t("nav.pricing")}</MenuLink>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function Footer({ signedIn, lang, t }: { signedIn: boolean; lang: string; t: T }) {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-display text-[19px] font-bold tracking-tight"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan font-display text-[13px] font-bold text-white">CG</span>Corp<span className="text-lilac">Gurus</span></Link>
            <p className="mt-4 max-w-xs text-sm text-white/60">{t("footer.tagline")}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <form action={setLang} className="flex items-center gap-1 rounded-full border border-white/15 p-0.5" aria-label={t("footer.language")}>
                {(Object.keys(LANGS) as (keyof typeof LANGS)[]).map((l) => <button key={l} name="lang" value={l} className={`rounded-full px-2.5 py-0.5 text-xs ${lang === l ? "bg-white text-navy" : "text-white/70 hover:text-white"}`} aria-pressed={lang === l}>{LANGS[l]}</button>)}
              </form>
              <PwaControls signedIn={signedIn} />
            </div>
          </div>
          <FooterCol title="Explore" links={[["/trainers", t("nav.trainers")], ["/requirements", t("nav.requirements")], ["/companies", t("nav.companies")], ["/categories", t("nav.categories")], ["/feed", t("nav.feed")]]} />
          <FooterCol title="For trainers" links={[["/signup", "Create a profile"], ["/pricing", "Trainer Pro"], ["/settings/teams", "Teams"], ["/settings/courses", "Course catalogue"], ["/dashboard/referrals", "Refer & earn"]]} />
          <FooterCol title="For companies" links={[["/signup?as=company", "Company account"], ["/requirements/new", "Post a requirement"], ["/dashboard/learning-paths", "Learning paths"], ["/settings/developers", "API & webhooks"], ["/pricing", t("nav.pricing")]]} />
          <FooterCol title="Company" links={[["/contact", "Contact"], ["/legal/terms", "Terms of service"], ["/legal/privacy", "Privacy policy"], ["/legal/refunds", "Refunds & cancellations"]]} />
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[13px] text-white/50">
          <p>© 2026 CorpGurus. All rights reserved. <Link href="/legal/terms" className="hover:text-white">Terms</Link> · <Link href="/legal/privacy" className="hover:text-white">Privacy</Link> · <Link href="/legal/refunds" className="hover:text-white">Refunds</Link></p>
          <p>Made in India · <a href="mailto:hello@corpgurus.com" className="hover:text-white">hello@corpgurus.com</a></p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-display text-sm font-semibold text-white">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm text-white/60">{links.map(([href, label]) => <li key={href + label}><Link href={href} className="hover:text-white">{label}</Link></li>)}</ul>
    </div>
  );
}
function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition hover:bg-surface-2 hover:text-ink">{icon}{children}</Link>;
}
function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/90 hover:bg-surface-2">{icon}{children}</Link>;
}
