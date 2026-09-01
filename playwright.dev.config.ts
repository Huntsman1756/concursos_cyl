import { defineConfig } from "@playwright/test";

import { resolveE2EProjects } from "./scripts/release/playwrightProjects";

// Local validation harness: runs the e2e suite against the Vite dev server,
// skipping the production build gates (blocked by pre-existing analysis errors).
// Not part of the delivery. Do not commit.
const port = 4173;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: resolveE2EProjects(),
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    reuseExistingServer: true,
    url: `http://127.0.0.1:${port}`,
    timeout: 120_000,
  },
});