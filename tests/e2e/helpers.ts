import { expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

export { E2E };

export async function login(page: Page, email: string, password = E2E.password) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", password);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 30_000 });
}

export const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

/** Ids handed from one serial test to the next survive worker restarts by living in a small state file. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
const STATE = "test-results/.e2e-state.json";
export function remember(patch: Record<string, string>) {
  mkdirSync("test-results", { recursive: true });
  const cur = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
  writeFileSync(STATE, JSON.stringify({ ...cur, ...patch }));
}
export function recall(key: string): string {
  const cur = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
  if (!cur[key]) throw new Error(`e2e state missing "${key}" — an earlier step in the serial chain did not complete`);
  return cur[key];
}
