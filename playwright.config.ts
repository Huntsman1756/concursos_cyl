import { defineConfig } from "@playwright/test";

import { resolveE2EProjects } from "./scripts/release/playwrightProjects";

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
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port}`,
    reuseExistingServer: false,
    url: `http://127.0.0.1:${port}`,
  },
});
