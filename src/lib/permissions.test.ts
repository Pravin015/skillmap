import { describe, expect, it } from "vitest";
import { companyCan, memberCan, staffCan, isStaffRole } from "./permissions";

describe("company roles", () => {
  it("lets owners do everything and viewers only look", () => {
    expect(companyCan("OWNER", "billing")).toBe(true);
    expect(companyCan("VIEWER", "view")).toBe(true);
    expect(companyCan("VIEWER", "hire")).toBe(false);
  });
  it("keeps finance away from hiring and hiring managers away from money", () => {
    expect(companyCan("FINANCE", "pay_invoice")).toBe(true);
    expect(companyCan("FINANCE", "hire")).toBe(false);
    expect(companyCan("HIRING_MANAGER", "sign_work_order")).toBe(true);
    expect(companyCan("HIRING_MANAGER", "fund_escrow")).toBe(false);
  });
  it("resolves a member list", () => {
    const members = [{ userId: "u1", role: "OWNER" as const }, { userId: "u2", role: "VIEWER" as const }];
    expect(memberCan(members, "u1", "company_settings")).toBe(true);
    expect(memberCan(members, "u2", "company_settings")).toBe(false);
    expect(memberCan(members, "stranger", "view")).toBe(false);
  });
});

describe("staff roles", () => {
  it("scopes each staff role", () => {
    expect(staffCan("SUPER_ADMIN", "platform")).toBe(true);
    expect(staffCan("ADMIN", "platform")).toBe(false);
    expect(staffCan("MODERATOR", "users")).toBe(false);
    expect(staffCan("FINANCE", "finance")).toBe(true);
    expect(staffCan("SUPPORT", "support")).toBe(true);
    expect(staffCan("TRAINER", "verify")).toBe(false);
  });
  it("knows who is staff", () => {
    expect(isStaffRole("MODERATOR")).toBe(true);
    expect(isStaffRole("COMPANY")).toBe(false);
    expect(isStaffRole(null)).toBe(false);
  });
});
