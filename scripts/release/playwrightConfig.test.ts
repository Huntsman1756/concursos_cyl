import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import playwrightConfig from "../../playwright.config";
import { E2E_BROWSERS, resolveE2EProjects } from "./playwrightProjects";
import { parsePlaywrightRunnerArgs } from "./runPlaywright";

const packageJsonPath = resolve("package.json");

it("starts the Playwright web server without local helper dependencies", () => {
  expect(playwrightConfig.webServer).toMatchObject({
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173",
  });
});

it("keeps the default project selection limited to installed Chromium", () => {
  const projects = playwrightConfig.projects ?? [];

  expect(projects.map((project) => project.name)).toEqual([
    "chromium-desktop",
    "chromium-mobile",
  ]);
  expect(projects.map((project) => project.use?.browserName)).toEqual([
    "chromium",
    "chromium",
  ]);
});

it("exposes an explicit optional Firefox/WebKit matrix", () => {
  expect(E2E_BROWSERS).toEqual(["chromium", "firefox", "webkit"]);
  expect(
    resolveE2EProjects("chromium,firefox,webkit").map(
      (project) => project.name,
    ),
  ).toEqual([
    "chromium-desktop",
    "chromium-mobile",
    "firefox-desktop",
    "webkit-desktop",
  ]);
});

it("rejects an engine that is not part of the supported matrix", () => {
  expect(() => resolveE2EProjects("safari")).toThrow(
    /Unsupported PLAYWRIGHT_BROWSERS/iu,
  );
});

it("forwards extra Playwright flags while keeping browser selection explicit", () => {
  expect(
    parsePlaywrightRunnerArgs(["--install", "firefox", "--workers=2"]),
  ).toEqual({
    install: true,
    browsers: ["firefox"],
    playwrightArgs: ["--workers=2"],
  });
});

describe("QA package scripts", () => {
  it("keeps the workflow-facing E2E script Chromium-only", async () => {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };
    const e2eScript = packageJson.scripts?.["test:e2e"] ?? "";

    expect(e2eScript).toBe("tsx scripts/release/runPlaywright.ts chromium");
    expect(e2eScript).not.toMatch(/firefox|webkit/iu);
  });

  it("provides install-first commands for optional engines and the matrix", async () => {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };
    const scripts = packageJson.scripts ?? {};

    expect(scripts["test:e2e:chromium"]).toBe(
      "tsx scripts/release/runPlaywright.ts chromium",
    );
    expect(scripts["test:e2e:firefox"]).toBe(
      "tsx scripts/release/runPlaywright.ts --install firefox",
    );
    expect(scripts["test:e2e:webkit"]).toBe(
      "tsx scripts/release/runPlaywright.ts --install webkit",
    );
    expect(scripts["test:e2e:matrix"]).toBe(
      "tsx scripts/release/runPlaywright.ts --install chromium firefox webkit",
    );
  });

  it("runs the deterministic asset budget as part of production build", async () => {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };
    const scripts = packageJson.scripts ?? {};

    expect(scripts.build).toContain("npm run qa:assets:check");
    expect(scripts["qa:assets:check"]).toBe(
      "tsx scripts/release/assetBudget.ts",
    );
    expect(scripts["qa:distribution:check"]).toBe(
      "tsx scripts/release/distributionCheck.ts",
    );
    expect(scripts.build).toContain("npm run qa:distribution:check");
  });

  it("forwards release test flags directly to Vitest", async () => {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["test:release"]).toBe("vitest run");
  });
});
