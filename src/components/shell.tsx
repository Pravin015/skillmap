import Link from "next/link";
import { BarChart3, Bell, BellRing, Gift, Briefcase, Building2, CreditCard, LayoutDashboard, LayoutGrid, LogOut, Menu, MessageSquare, Newspaper, Receipt, Search, Settings, ShieldCheck, Tag, Users } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/lib/actions/auth";
import { Avatar, ButtonLink } from "./ui";
import { LiveRefresh } from "./live-refresh";
import { PwaControls } from "./pwa-register";
import { AnnouncementBar } from "./announcement-bar";
import { stopImpersonation } from "@/lib/actions/impersonate";
import { roleLabel } from "@/lib/utils";
import { getLang, getT, LANGS } from "@/lib/i18n";
import { setLang } from "@/lib/actions/lang";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 font-display text-[19px] font-bold tracking-tight text-navy ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy font-display text-[13px] font-bold tracking-tight text-white">CG</span>
      Corp<span className="text-cyan">Gurus</span>
    </Link>
  );
}

export async function Shell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unread = user ? await db.notification.count({ where: { userId: user.id, readAt: null } }) : 0;
  const unreadConvos = user ? (await db.conversationParticipant.findMany({ where: { userId: user.id }, select: { lastReadAt: true, conversation: { select: { messages: { where: { senderId: { not: user.id } }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } } } } })).filter((p) => p.conversation.messages[0] && (!p.lastReadAt || p.lastReadAt < p.conversation.messages[0].createdAt)).length : 0;
  const tone = user?.role === "TRAINER" ? "cyan" : user?.role === "COMPANY" ? "violet" : "amber";
  const [t, lang] = await Promise.all([getT(), getLang()]);
  const ann = Object.fromEntries((await db.setting.findMany({ where: { key: { in: ["announcement_text", "announcement_tone", "announcement_href", "announcement_until", "announcement_id"] } } })).map((s) => [s.key, s.value]));
  const announcementLive = !!ann.announcement_text && (!ann.announcement_until || new Date(ann.announcement_until) > new Date());

  return (
    <div className="flex min-h-screen flex-col">
      {user ? <LiveRefresh /> : null}
      {user?.impersonatedBy ? (
        <div className="border-b border-rose/40 bg-rose/10 text-rose">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm md:px-6"><span className="font-semibold">Support view:</span> you are seeing CorpGurus as {user.name} ({user.email}). Actions you take are recorded under their account.
            <form action={stopImpersonation} className="ml-auto"><button className="rounded-md border border-rose/40 bg-white px-2.5 py-1 font-display text-xs font-semibold hover:bg-rose/5">Exit support view</button></form></div>
        </div>
      ) : null}
      {announcementLive ? <AnnouncementBar id={ann.announcement_id ?? "1"} text={ann.announcement_text} tone={(ann.announcement_tone as "info" | "warning" | "success") || "info"} href={ann.announcement_href || undefined} /> : null}
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 md:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 text-[15px] font-medium text-muted md:flex">
            <NavLink href="/feed" icon={<Newspaper size={16} />}>{t("nav.feed")}</NavLink>
            <NavLink href="/trainers" icon={<Users size={16} />}>{t("nav.trainers")}</NavLink>
            <NavLink href="/requirements" icon={<Briefcase size={16} />}>{t("nav.requirements")}</NavLink>
            <NavLink href="/companies" icon={<Building2 size={16} />}>{t("nav.companies")}</NavLink>
            <NavLink href="/categories" icon={<LayoutGrid size={16} />}>{t("nav.categories")}</NavLink>
            <NavLink href="/pricing" icon={<Tag size={16} />}>{t("nav.pricing")}</NavLink>
          </nav>
          <form action="/search" className="ml-auto hidden lg:block">
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" /><input name="q" placeholder="Search" className="h-9 w-56 rounded-lg border border-line bg-surface-2 pl-9 pr-3 text-sm placeholder:text-dim focus:border-cyan focus:bg-white focus:outline-none" /></div>
          </form>
          <div className="flex items-center gap-1.5 lg:ml-0 ml-auto">
            <Link href="/search" className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink lg:hidden" aria-label="Search"><Search size={19} /></Link>
            {user ? (
              <>
                <Link href="/dashboard/notifications" className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Notifications">
                  <Bell size={19} />
                  {unread > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 font-display text-[10px] font-bold text-white">{unread}</span>
                  ) : null}
                </Link>
                <Link href="/messages" className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Messages"><MessageSquare size={19} />{unreadConvos > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan px-1 font-display text-[10px] font-bold text-white">{unreadConvos}</span> : null}</Link>
                <details className="group relative">
                  <summary className="flex cursor-pointer items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-surface-2">
                    <Avatar name={user.name} src={user.avatarUrl} size={32} tone={tone} />
                    <span className="hidden text-sm font-semibold md:block">{user.name.split(" ")[0]}</span>
                  </summary>
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-lg shadow-navy/10">
                    <div className="px-3 py-2">
                      <p className="truncate font-display text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-muted">{roleLabel[user.role]}{user.membership ? ` · ${user.membership.company.name}` : ""}</p>
                    </div>
                    <div className="hairline my-1" />
                    <MenuLink href="/dashboard" icon={<LayoutDashboard size={15} />}>Dashboard</MenuLink>
                    <MenuLink href="/feed" icon={<Newspaper size={15} />}>Feed</MenuLink>
                    {user.trainerProfile || user.membership ? <><MenuLink href="/dashboard/analytics" icon={<BarChart3 size={15} />}>Analytics</MenuLink><MenuLink href="/dashboard/invoices" icon={<Receipt size={15} />}>Invoices</MenuLink><MenuLink href="/dashboard/saved-searches" icon={<BellRing size={15} />}>Saved searches</MenuLink><MenuLink href="/dashboard/referrals" icon={<Gift size={15} />}>Refer & earn</MenuLink></> : null}
                    <MenuLink href="/network" icon={<Users size={15} />}>Network</MenuLink>
                    <MenuLink href="/messages" icon={<MessageSquare size={15} />}>Messages</MenuLink>
                    {user.trainerProfile ? <MenuLink href={`/trainers/${user.trainerProfile.slug}`} icon={<Briefcase size={15} />}>My public profile</MenuLink> : null}
                    {user.membership ? <MenuLink href={`/companies/${user.membership.company.slug}`} icon={<Building2 size={15} />}>Company page</MenuLink> : null}
                    <MenuLink href="/settings" icon={<Settings size={15} />}>Settings</MenuLink>
                    {user.role === "TRAINER" || user.membership ? <MenuLink href="/settings/billing" icon={<CreditCard size={15} />}>Plan & billing</MenuLink> : null}
                    {isStaff(user) ? <MenuLink href="/admin" icon={<ShieldCheck size={15} />}>Admin console</MenuLink> : null}
                    <div className="hairline my-1" />
                    <form action={logout}>
                      <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-rose">
                        <LogOut size={15} /> Sign out
                      </button>
                    </form>
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
              <summary className="flex cursor-pointer items-center rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Menu"><Menu size={20} /></summary>
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-white p-1.5 shadow-lg shadow-navy/10">
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-muted md:px-6">
          <div className="flex flex-wrap items-center gap-3"><p>© 2026 CorpGurus. {t("footer.tagline")}</p><PwaControls signedIn={!!user} /></div>
          <div className="flex flex-wrap items-center gap-5 font-medium">
            <Link href="/trainers" className="hover:text-ink">{t("nav.trainers")}</Link>
            <Link href="/requirements" className="hover:text-ink">{t("nav.requirements")}</Link>
            <Link href="/companies" className="hover:text-ink">{t("nav.companies")}</Link>
            <Link href="/pricing" className="hover:text-ink">{t("nav.pricing")}</Link>
            <form action={setLang} className="flex items-center gap-1 rounded-lg border border-line p-0.5" aria-label={t("footer.language")}>
              {(Object.keys(LANGS) as (keyof typeof LANGS)[]).map((l) => <button key={l} name="lang" value={l} className={`rounded-md px-2 py-0.5 text-xs ${lang === l ? "bg-navy text-white" : "text-muted hover:text-ink"}`} aria-pressed={lang === l}>{LANGS[l]}</button>)}
            </form>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition hover:bg-surface-2 hover:text-ink">
      {icon}{children}
    </Link>
  );
}
function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/90 hover:bg-surface-2">
      {icon}{children}
    </Link>
  );
}
