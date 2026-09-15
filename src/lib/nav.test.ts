import { describe, expect, it } from "vitest";
import { buildNav, isMarketingPath, titleFor } from "./nav";

const counts = { unread: 3, unreadConvos: 0, openReports: 2, queue: 5 };

describe("buildNav", () => {
  it("gives trainers work and profile sections", () => {
    const groups = buildNav({ role: "TRAINER", trainerProfile: { slug: "ananya-iyer" }, membership: null }, counts);
    expect(groups.map((g) => g.label)).toEqual(["Overview", "Work", "Profile", "Community", "Account"]);
    expect(groups[0].items.find((i) => i.label === "Notifications")?.badge).toBe(3);
    expect(groups[2].items[0].href).toBe("/trainers/ananya-iyer");
  });
  it("hides posting from viewers but shows it to hiring managers", () => {
    const viewer = buildNav({ role: "COMPANY", trainerProfile: null, membership: { role: "VIEWER", company: { slug: "acme" } } }, counts);
    const hm = buildNav({ role: "COMPANY", trainerProfile: null, membership: { role: "HIRING_MANAGER", company: { slug: "acme" } } }, counts);
    const labels = (g: ReturnType<typeof buildNav>) => g.flatMap((x) => x.items.map((i) => i.label));
    expect(labels(viewer)).not.toContain("Post a requirement");
    expect(labels(hm)).toContain("Post a requirement");
    expect(labels(viewer)).not.toContain("Plan & billing");
  });
  it("gives staff the admin console with queue and report badges", () => {
    const groups = buildNav({ role: "MODERATOR", trainerProfile: null, membership: null }, counts);
    expect(groups[0].label).toBe("Admin console");
    const items = groups[0].items.map((i) => i.label);
    expect(items).toEqual(["Overview", "Verification queue", "Requirements", "Reports"]);
    expect(groups[0].items.find((i) => i.label === "Reports")?.badge).toBe(2);
  });
});

describe("routing helpers", () => {
  it("keeps marketing chrome on public routes only", () => {
    expect(isMarketingPath("/")).toBe(true);
    expect(isMarketingPath("/legal/terms")).toBe(true);
    expect(isMarketingPath("/hire/aws/bengaluru")).toBe(true);
    expect(isMarketingPath("/dashboard")).toBe(false);
    expect(isMarketingPath("/trainers/ananya-iyer")).toBe(false);
    expect(isMarketingPath("/pricing-guide")).toBe(false);
  });
  it("picks the most specific title", () => {
    const groups = buildNav({ role: "TRAINER", trainerProfile: { slug: "x" }, membership: null }, counts);
    expect(titleFor(groups, "/dashboard/invoices/new")).toBe("Invoices");
    expect(titleFor(groups, "/dashboard")).toBe("Dashboard");
    expect(titleFor(groups, "/settings/availability")).toBe("Availability");
    expect(titleFor(groups, "/nowhere")).toBeNull();
  });
});
