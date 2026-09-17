import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests against a real mail stack.
 *
 * They exist for the defects that neither the Go tests nor the jsdom suite can
 * see: a component reading a field the backend no longer sends, a request the
 * browser refuses, a page that logs an error and renders nothing. Only running
 * the application in a browser, against real servers, shows those.
 *
 * The servers are NOT started here. `scripts/e2e.sh` builds alps, starts sora,
 * PostgreSQL-backed and seeded, plus the test stack around it, and then runs
 * Playwright with their addresses in the environment. Keeping that out of the
 * runner keeps a failure unambiguous: the harness either came up or it did not.
 */
export default defineConfig({
  testDir: "./e2e",
  // Only the browser specs; `test/` is the jsdom suite.
  testMatch: /.*\.spec\.ts$/,
  // Serial: the specs share one account, and mail delivered by one shows up in
  // the next one's list.
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  outputDir: process.env.E2E_RESULTS ?? "test-results",
  use: {
    baseURL: process.env.ALPS_URL ?? "http://127.0.0.1:8900",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // A pre-provisioned browser (CI images, containers) may not be the exact
    // revision this Playwright version would download.
    ...(process.env.PW_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
      : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
