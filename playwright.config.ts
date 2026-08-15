import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Playwright runs in Node, outside Next.js, so load local E2E variables before
// evaluating safety gates and selecting the target test project.
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: false,
        timeout: 180_000,
      },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: /mobile-authenticated\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testMatch: /mobile-authenticated\.spec\.ts/,
      use: { ...devices["iPhone 13"] },
    },
  ],
});
