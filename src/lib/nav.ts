import type { Role } from "@prisma/client";
import { companyCan, staffCan, type CompanyAction } from "@/lib/permissions";

/**
 * Sidebar navigation for signed-in users, grouped the way the account works:
 * a trainer sees their work and profile, a company member sees hiring and finance,
 * staff see the admin console. Icons are lucide names resolved in the client frame.
 */
export type NavItem = { href: string; label: string; icon: string; badge?: number; exact?: boolean; accent?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

type NavUser = {
  role: Role;
  trainerProfile: { slug: string } | null;
  membership: { role: import("@prisma/client").MemberRole; company: { slug: string } } | null;
};

export function buildNav(user: NavUser, counts: { unread: number; unreadConvos: number; openReports?: number; queue?: number }): NavGroup[] {
  const groups: NavGroup[] = [];
  const staff = staffCan(user.role, "verify") || staffCan(user.role, "moderate") || staffCan(user.role, "users") || staffCan(user.role, "finance") || staffCan(user.role, "support") || staffCan(user.role, "platform");
  const can = (a: CompanyAction) => companyCan(user.membership?.role, a);

  if (staff) {
    groups.push({ label: "Admin console", items: [
      { href: "/admin/overview", label: "Overview", icon: "LayoutDashboard" },
      ...(staffCan(user.role, "verify") ? [{ href: "/admin", label: "Verification queue", icon: "BadgeCheck", exact: true, badge: counts.queue }] : []),
      ...(staffCan(user.role, "users") || staffCan(user.role, "support") ? [{ href: "/admin/users", label: "Users", icon: "Users" }] : []),
      ...(staffCan(user.role, "moderate") ? [{ href: "/admin/requirements", label: "Requirements", icon: "Briefcase" }, { href: "/admin/reports", label: "Reports", icon: "Flag", badge: counts.openReports }] : []),
      ...(staffCan(user.role, "finance") ? [{ href: "/admin/escrow", label: "Escrow", icon: "Landmark" }] : []),
      ...(staffCan(user.role, "platform") ? [{ href: "/admin/platform", label: "Platform", icon: "Settings2", accent: true }] : []),
    ] });
  } else {
    groups.push({ label: "Overview", items: [
      { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", exact: true },
      { href: "/dashboard/analytics", label: "Analytics", icon: "BarChart3" },
      { href: "/dashboard/notifications", label: "Notifications", icon: "Bell", badge: counts.unread },
      { href: "/messages", label: "Messages", icon: "MessageSquare", badge: counts.unreadConvos },
    ] });
  }

  if (user.trainerProfile) {
    groups.push({ label: "Work", items: [
      { href: "/requirements", label: "Find requirements", icon: "Search", exact: true },
      { href: "/dashboard/applications", label: "My applications", icon: "FileCheck2" },
      { href: "/dashboard/purchase-orders", label: "Purchase orders", icon: "FileText" },
      { href: "/dashboard/invoices", label: "Invoices", icon: "Receipt" },
      { href: "/dashboard/ledger", label: "Ledger", icon: "BookOpenCheck" },
      { href: "/dashboard/saved-searches", label: "Saved searches", icon: "BellRing" },
    ] });
    groups.push({ label: "Profile", items: [
      { href: `/trainers/${user.trainerProfile.slug}`, label: "My public profile", icon: "UserCircle" },
      { href: "/settings", label: "Profile & certifications", icon: "Settings", exact: true },
      { href: "/settings/availability", label: "Availability", icon: "CalendarDays" },
      { href: "/settings/courses", label: "Course catalogue", icon: "BookOpen" },
      { href: "/settings/gallery", label: "Gallery", icon: "Image" },
      { href: "/settings/teams", label: "Teams", icon: "UsersRound" },
      { href: "/settings/import", label: "Import from LinkedIn", icon: "Upload" },
    ] });
  }

  if (user.membership) {
    groups.push({ label: "Hiring", items: [
      ...(can("hire") ? [{ href: "/requirements/new", label: "Post a requirement", icon: "Plus", accent: true }] : []),
      { href: "/dashboard/requirements", label: "My requirements", icon: "Briefcase" },
      { href: "/trainers", label: "Find trainers", icon: "Search", exact: true },
      { href: "/dashboard/bench", label: "Bench", icon: "Bookmark" },
      { href: "/dashboard/learning-paths", label: "Learning paths", icon: "Route" },
      { href: "/dashboard/saved-searches", label: "Saved searches", icon: "BellRing" },
    ] });
    groups.push({ label: "Finance", items: [
      { href: "/dashboard/purchase-orders", label: "Purchase orders", icon: "FileText" },
      { href: "/dashboard/invoices", label: "Invoices", icon: "Receipt" },
      { href: "/dashboard/ledger", label: "Ledger", icon: "BookOpenCheck" },
      ...(can("billing") ? [{ href: "/settings/billing", label: "Plan & billing", icon: "CreditCard" }] : []),
    ] });
    groups.push({ label: "Company", items: [
      { href: `/companies/${user.membership.company.slug}`, label: "Company page", icon: "Building2" },
      { href: "/settings", label: "Settings & team", icon: "Settings", exact: true },
      ...(can("api_keys") ? [{ href: "/settings/developers", label: "API & webhooks", icon: "Webhook" }] : []),
    ] });
  }

  groups.push({ label: "Community", items: [
    { href: "/feed", label: "Feed", icon: "Newspaper" },
    { href: "/network", label: "Network", icon: "Users" },
    ...(user.trainerProfile ? [{ href: "/trainers", label: "Trainers", icon: "GraduationCap", exact: true }] : []),
    { href: "/companies", label: "Companies", icon: "Building2", exact: true },
    { href: "/categories", label: "Categories", icon: "LayoutGrid" },
    ...(!staff ? [{ href: "/dashboard/referrals", label: "Refer & earn", icon: "Gift" }] : []),
  ] });

  if (staff) {
    groups.push({ label: "Account", items: [
      { href: "/dashboard/notifications", label: "Notifications", icon: "Bell", badge: counts.unread },
      { href: "/messages", label: "Messages", icon: "MessageSquare", badge: counts.unreadConvos },
      { href: "/settings", label: "Settings", icon: "Settings", exact: true },
    ] });
  } else if (user.trainerProfile) {
    groups.push({ label: "Account", items: [{ href: "/settings/billing", label: "Plan & billing", icon: "CreditCard" }] });
  }
  return groups.filter((g) => g.items.length);
}

/** Routes that keep the marketing header and footer even when signed in. */
export const MARKETING_ROUTES = ["/", "/login", "/signup", "/forgot", "/reset", "/verify", "/pricing", "/contact", "/legal", "/hire", "/onboarding", "/certificates", "/offline"];
export const isMarketingPath = (path: string) => MARKETING_ROUTES.some((p) => (p === "/" ? path === "/" : path === p || path.startsWith(`${p}/`)));

/** Page title for the top bar, from the best-matching nav item. */
export function titleFor(groups: NavGroup[], path: string) {
  let best: NavItem | null = null;
  for (const g of groups) for (const i of g.items) {
    const hit = i.exact ? path === i.href : path === i.href || path.startsWith(`${i.href}/`);
    if (hit && (!best || i.href.length > best.href.length)) best = i;
  }
  return best?.label ?? null;
}
