import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

const local =
  config({ path: ".env.local", quiet: true, processEnv: {} }).parsed ?? {};
const live = process.env.LIGHTLINE_E2E_DATABASE === "1";
if (live && !local.DATABASE_URL)
  throw new Error(
    "Live E2E requires the dedicated development DATABASE_URL in .env.local.",
  );

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname localhost --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      OPERATOR_ACCESS_SECRET: "e2e-only-operator-secret-not-for-deployment",
      LIGHTLINE_TOOL_API_KEY: "e2e-only-tool-secret-not-for-deployment",
      DATABASE_URL: live
        ? local.DATABASE_URL
        : "postgresql://fixture:fixture@database.invalid/lightline",
    },
  },
});
