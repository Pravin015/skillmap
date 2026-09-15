import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests run against a production build on :3211 (built and started here unless already running) and the local Postgres.
 * Dev mode with Turbopack re-renders pages while chunks recompile, which makes browser tests flaky; the built app is deterministic.
 * Fixtures (an E2E company, owner and trainer) are created once in global-setup and reused; each run cleans its own requirements.
 */
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: { baseURL: "http://localhost:3211", channel: "chrome", headless: true, trace: "retain-on-failure", screenshot: "only-on-failure", viewport: { width: 1360, height: 900 } },
  webServer: { command: "pnpm build && pnpm start -p 3211", url: "http://localhost:3211/api/health", reuseExistingServer: true, timeout: 600_000 },
});
