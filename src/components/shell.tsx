import Link from "next/link";
import { BarChart3, Bell, BellRing, Gift, Briefcase, Building2, CreditCard, LayoutDashboard, LayoutGrid, LogOut, Menu, MessageSquare, Newspaper, Receipt, Search, Settings, ShieldCheck, Tag, Users } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/lib/actions/auth";
import { Avatar, ButtonLink } from "./ui";
import { LiveRefresh } from "./live-refresh";
import { PwaControls } from "./pwa-register";
import { roleLabel } from "@/lib/utils";

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

  return (
    <div className="flex min-h-screen flex-col">
      {user ? <LiveRefresh /> : null}
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 md:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 text-[15px] font-medium text-muted md:flex">
            <NavLink href="/feed" icon={<Newspaper size={16} />}>Feed</NavLink>
            <NavLink href="/trainers" icon={<Users size={16} />}>Trainers</NavLink>
            <NavLink href="/requirements" icon={<Briefcase size={16} />}>Requirements</NavLink>
            <NavLink href="/companies" icon={<Building2 size={16} />}>Companies</NavLink>
            <NavLink href="/categories" icon={<LayoutGrid size={16} />}>Categories</NavLink>
            <NavLink href="/pricing" icon={<Tag size={16} />}>Pricing</NavLink>
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
                <ButtonLink href="/login" variant="ghost" size="sm">Sign in</ButtonLink>
                <ButtonLink href="/signup" size="sm">Join CorpGurus</ButtonLink>
              </>
            )}
            <details className="relative md:hidden">
              <summary className="flex cursor-pointer items-center rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Menu"><Menu size={20} /></summary>
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-white p-1.5 shadow-lg shadow-navy/10">
                <MenuLink href="/feed" icon={<Newspaper size={15} />}>Feed</MenuLink>
                <MenuLink href="/trainers" icon={<Users size={15} />}>Trainers</MenuLink>
                <MenuLink href="/requirements" icon={<Briefcase size={15} />}>Requirements</MenuLink>
                <MenuLink href="/companies" icon={<Building2 size={15} />}>Companies</MenuLink>
                <MenuLink href="/categories" icon={<LayoutGrid size={15} />}>Categories</MenuLink>
                <MenuLink href="/pricing" icon={<Tag size={15} />}>Pricing</MenuLink>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-muted md:px-6">
          <div className="flex flex-wrap items-center gap-3"><p>© 2026 CorpGurus. The professional network for freelance corporate trainers.</p><PwaControls signedIn={!!user} /></div>
          <div className="flex gap-5 font-medium">
            <Link href="/trainers" className="hover:text-ink">Trainers</Link>
            <Link href="/requirements" className="hover:text-ink">Requirements</Link>
            <Link href="/companies" className="hover:text-ink">Companies</Link>
            <Link href="/pricing" className="hover:text-ink">Pricing</Link>
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
