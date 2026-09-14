import type { MemberRole, Role } from "@prisma/client";

/**
 * Permission matrices for company teams and platform staff.
 * Pure functions: safe to import from server actions, pages and client components.
 */

/* ---------- Company roles ---------- */

export type CompanyAction =
  | "view"            // see requirements, applicants, work orders, invoices, bench
  | "hire"            // post requirements, shortlist, interview, award, feedback links, certificates
  | "sign_work_order" // issue, revise, cancel and sign work orders
  | "fund_escrow"     // fund and release escrow deposits
  | "pay_invoice"     // mark invoices paid
  | "manage_team"     // invite, remove and change roles of members
  | "company_settings"// edit the company page, GSTIN, billing address, learning paths
  | "api_keys"        // API keys and webhooks
  | "billing";        // subscribe, cancel, change plan

const ALL: CompanyAction[] = ["view", "hire", "sign_work_order", "fund_escrow", "pay_invoice", "manage_team", "company_settings", "api_keys", "billing"];

export const COMPANY_ROLE_ACTIONS: Record<MemberRole, CompanyAction[]> = {
  OWNER: ALL,
  ADMIN: ALL.filter((a) => a !== "billing"),
  HIRING_MANAGER: ["view", "hire", "sign_work_order"],
  FINANCE: ["view", "fund_escrow", "pay_invoice"],
  VIEWER: ["view"],
};

export const COMPANY_ROLES: { value: MemberRole; label: string; blurb: string }[] = [
  { value: "OWNER", label: "Owner", blurb: "Everything, including billing and transferring ownership." },
  { value: "ADMIN", label: "Admin", blurb: "Everything except plan and billing changes." },
  { value: "HIRING_MANAGER", label: "Hiring manager", blurb: "Post requirements, shortlist, interview, award and sign work orders." },
  { value: "FINANCE", label: "Finance", blurb: "Fund and release escrow, pay invoices, see spend. Cannot post or award." },
  { value: "VIEWER", label: "Viewer", blurb: "Read-only access to requirements, applicants and documents." },
];

export const COMPANY_ACTION_LABELS: Record<CompanyAction, string> = {
  view: "View requirements, applicants and documents", hire: "Post, shortlist, interview and award", sign_work_order: "Issue and sign work orders",
  fund_escrow: "Fund and release escrow", pay_invoice: "Mark invoices paid", manage_team: "Manage team members", company_settings: "Edit company page and settings", api_keys: "API keys and webhooks", billing: "Plan and billing",
};

export const memberRoleLabel = (r: MemberRole) => COMPANY_ROLES.find((x) => x.value === r)?.label ?? r;

export const companyCan = (role: MemberRole | null | undefined, action: CompanyAction) => !!role && COMPANY_ROLE_ACTIONS[role].includes(action);

/** For records loaded with `company.members: { select: { userId, role } }`. */
export const memberCan = (members: { userId: string; role: MemberRole }[], userId: string, action: CompanyAction) => {
  const m = members.find((x) => x.userId === userId);
  return !!m && companyCan(m.role, action);
};

/* ---------- Platform staff ---------- */

export type StaffPermission =
  | "verify"    // certification, identity, GST and domain queues
  | "moderate"  // reports, take-downs, comments
  | "users"     // suspend / restore accounts
  | "finance"   // escrow payouts, refunds, subscriptions
  | "support"   // support view (impersonation)
  | "platform"; // settings, taxonomy, staff, announcements, jobs

export const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "FINANCE", "SUPPORT"];

export const STAFF_ROLE_PERMS: Record<string, StaffPermission[]> = {
  SUPER_ADMIN: ["verify", "moderate", "users", "finance", "support", "platform"],
  ADMIN: ["verify", "moderate", "users", "finance"],
  MODERATOR: ["verify", "moderate"],
  FINANCE: ["finance"],
  SUPPORT: ["support", "verify"],
};

export const STAFF_ROLE_META: { value: Role; label: string; blurb: string }[] = [
  { value: "SUPER_ADMIN", label: "Super admin", blurb: "Everything, including platform settings and staff." },
  { value: "ADMIN", label: "Administrator", blurb: "Verification, moderation, users and finance." },
  { value: "MODERATOR", label: "Moderator", blurb: "Verification queues and content reports." },
  { value: "FINANCE", label: "Finance", blurb: "Escrow payouts, refunds and subscriptions." },
  { value: "SUPPORT", label: "Support", blurb: "Read-only support view of member accounts, plus verification queues." },
];

export const isStaffRole = (r: Role | null | undefined) => !!r && STAFF_ROLES.includes(r);
export const staffCan = (role: Role | null | undefined, perm: StaffPermission) => !!role && (STAFF_ROLE_PERMS[role] ?? []).includes(perm);
export const staffRoleLabel = (r: Role) => STAFF_ROLE_META.find((x) => x.value === r)?.label ?? r;
