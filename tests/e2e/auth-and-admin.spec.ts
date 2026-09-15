import { expect, test } from "@playwright/test";
import { E2E, login } from "./helpers";

test("signed-out visitors are sent to the sign-in page", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("wrong password is rejected", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[name=email]", E2E.trainer);
  await page.fill("input[name=password]", "not-the-password");
  await page.click("button[type=submit]");
  await expect(page.getByText(/incorrect|invalid|wrong/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("trainer sees the sidebar and can sign out", async ({ page }) => {
  await login(page, E2E.trainer);
  const sidebar = page.locator("aside");
  await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Invoices" })).toBeVisible();
  await expect(sidebar.getByText("E2E Trainer")).toBeVisible();
  await sidebar.getByRole("link", { name: "Invoices" }).click();
  await expect(page).toHaveURL(/\/dashboard\/invoices/);
  await expect(page.locator("header h1")).toHaveText("Invoices");
  await page.locator("header").getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
});

test("company owner sees hiring and finance sections", async ({ page }) => {
  await login(page, E2E.owner);
  const sidebar = page.locator("aside");
  await expect(sidebar.getByText("Hiring")).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Purchase orders" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Post a requirement" })).toBeVisible();
});

test("admin can disable and re-enable a user", async ({ page }) => {
  await login(page, E2E.admin, E2E.adminPassword);
  await page.goto(`/admin/users?q=${encodeURIComponent(E2E.trainer)}`);
  const row = page.locator("tbody tr", { hasText: E2E.trainer });
  await row.getByRole("button", { name: "Disable" }).click();
  await expect(row.getByText("disabled")).toBeVisible();
  await row.getByRole("button", { name: "Enable" }).click();
  await expect(row.getByText("active")).toBeVisible();
});

test("disabled accounts cannot sign in", async ({ page }) => {
  await login(page, E2E.admin, E2E.adminPassword);
  await page.goto(`/admin/users?q=${encodeURIComponent(E2E.trainer)}`);
  const row = page.locator("tbody tr", { hasText: E2E.trainer });
  await row.getByRole("button", { name: "Disable" }).click();
  await expect(row.getByText("disabled")).toBeVisible();
  await page.context().clearCookies();
  await page.goto("/login");
  await page.fill("input[name=email]", E2E.trainer);
  await page.fill("input[name=password]", E2E.password);
  await page.click("button[type=submit]");
  await expect(page.getByText(/disabled/i).first()).toBeVisible();
  // restore
  await login(page, E2E.admin, E2E.adminPassword);
  await page.goto(`/admin/users?q=${encodeURIComponent(E2E.trainer)}`);
  await page.locator("tbody tr", { hasText: E2E.trainer }).getByRole("button", { name: "Enable" }).click();
  await expect(page.locator("tbody tr", { hasText: E2E.trainer }).getByText("active")).toBeVisible();
});

test("moderator is kept out of the platform page", async ({ page }) => {
  await login(page, "moderator@corpgurus.demo", E2E.adminPassword);
  await page.goto("/admin/platform");
  await expect(page).not.toHaveURL(/\/admin\/platform/);
});
