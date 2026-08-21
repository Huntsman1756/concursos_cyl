import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packageJsonPath = resolve("package.json");
const workflowPath = resolve(".github/workflows/deploy-pages.yml");

describe("GitHub Pages deployment workflow", () => {
  it("deploys the production branch instead of the retired feature branch", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    const eventBlock = workflow.slice(0, workflow.indexOf("concurrency:"));

    expect(eventBlock.match(/- main/gu)).toHaveLength(2);
    expect(eventBlock).not.toContain("feature/salida-cyl-development");
  });

  it("requests first-run Pages enablement before deployment", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).toMatch(
      /uses: actions\/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6\.0\.0\s+with:\s+enablement: true/u,
    );
  });

  it("pins every action to an exact reviewed commit", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).toContain(
      "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
    );
    expect(workflow).toContain(
      "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0",
    );
    expect(workflow).toContain(
      "actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0",
    );
    expect(workflow).toContain(
      "actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0",
    );
    expect(workflow).toContain(
      "actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0",
    );
    expect(workflow).toContain(
      "actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0",
    );
    expect(workflow).not.toMatch(/uses: actions\/[\w-]+@v\d/u);
  });

  it("checks out complete history and gives the shared runner a unit-test margin", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).toMatch(
      /actions\/checkout@[a-f0-9]{40} # v7\.0\.1\s+with:\s+fetch-depth: 0/u,
    );
    expect(workflow).toContain("npm run test:release -- --testTimeout=60000");
    expect(workflow).toContain(
      "npx --no-install playwright install --with-deps chromium",
    );
    expect(workflow).not.toMatch(/^\s+- run: npm test$/mu);
    const verifyJob = workflow.slice(
      workflow.indexOf("  verify-and-build:"),
      workflow.indexOf("  deploy:"),
    );
    expect(verifyJob).toContain("timeout-minutes: 45");
  });

  it("installs the pinned notebook runtime before the full unit suite", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).toMatch(
      /actions\/setup-python@[a-f0-9]{40} # v7\.0\.0\s+with:\s+python-version: "3\.12"/u,
    );
    expect(workflow).toContain(
      'python -m pip install --disable-pip-version-check --no-input "jupyter==1.1.1" "pandas==3.0.2"',
    );
  });

  it("grants each job only its required permissions", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).not.toMatch(/^permissions:/mu);
    const verifyJob = workflow.slice(
      workflow.indexOf("  verify-and-build:"),
      workflow.indexOf("  deploy:"),
    );
    expect(verifyJob).toMatch(/permissions:\s+contents: read/u);
    expect(verifyJob).not.toMatch(/pages: write|id-token: write/u);
    const deployJob = workflow.slice(
      workflow.indexOf("  deploy:"),
      workflow.indexOf("  verify-live:"),
    );
    expect(deployJob).toMatch(/permissions:\s+pages: write\s+id-token: write/u);
    expect(deployJob).not.toContain("contents: read");
  });

  it("publishes Pages for pushes and manual dispatches, but not pull requests", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    const deployJob = workflow.slice(workflow.indexOf("  deploy:"));

    expect(workflow).toContain("workflow_dispatch:");
    expect(deployJob).toContain("if: github.event_name != 'pull_request'");
  });

  it("verifies Caddy headers against the running release container", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).toContain("docker build -t salida-cyl:ci .");
    expect(workflow).toContain("CADDY_SMOKE_BASE_URL=http://127.0.0.1:18080");
    expect(workflow).toContain("npm run release:caddy:verify");
  });

  it("defines the contest:submission:check package script", async () => {
    const pkg = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(pkg) as { scripts?: Record<string, string> };
    expect(parsed.scripts).toBeDefined();
    expect(parsed.scripts?.["contest:submission:check"]).toBe(
      "tsx scripts/release/renderContestSubmission.ts",
    );
  });

  it("runs submission and format gates between npm ci and build steps", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    const verifyJob = workflow.slice(
      workflow.indexOf("  verify-and-build:"),
      workflow.indexOf("  deploy:"),
    );
    const npmCiIdx = verifyJob.indexOf("npm ci");
    expect(npmCiIdx).toBeGreaterThanOrEqual(0);
    const gateIdx = verifyJob.indexOf("npm run contest:submission:check");
    expect(gateIdx).toBeGreaterThan(npmCiIdx);
    const formatIdx = verifyJob.indexOf("npm run format:check");
    expect(formatIdx).toBeGreaterThan(gateIdx);
    const buildIdx = verifyJob.indexOf("npm run build");
    expect(buildIdx).toBeGreaterThan(formatIdx);
  });

  it("publishes the exact deployed commit before preparing the Pages artifact", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    const buildIdx = workflow.indexOf("npm run build");
    const versionIdx = workflow.indexOf(
      'npx --no-install tsx scripts/release/writeVersionMetadata.ts dist "${{ github.sha }}"',
    );
    const prepareIdx = workflow.indexOf("npm run pages:prepare");

    expect(versionIdx).toBeGreaterThan(buildIdx);
    expect(prepareIdx).toBeGreaterThan(versionIdx);
  });

  it("relies on build for runtime-data staging without a duplicate workflow step", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    const buildIdx = workflow.indexOf("npm run build");
    const runtimeDataIdx = workflow.indexOf("npm run release:runtime-data");

    expect(buildIdx).toBeGreaterThanOrEqual(0);
    expect(runtimeDataIdx).toBe(-1);
  });

  it("exposes the deployed Pages URL and verifies it in a read-only live job", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    const deployJob = workflow.slice(
      workflow.indexOf("  deploy:"),
      workflow.indexOf("  verify-live:"),
    );
    const verifyLive = workflow.slice(workflow.indexOf("  verify-live:"));

    expect(deployJob).toContain(
      "page_url: ${{ steps.deployment.outputs.page_url }}",
    );
    expect(verifyLive).toContain("needs: deploy");
    expect(verifyLive).toContain("if: github.event_name != 'pull_request'");
    expect(verifyLive).toMatch(/permissions:\s+contents: read/u);
    expect(verifyLive).not.toMatch(/pages: write|id-token: write/u);
    expect(verifyLive).toContain(
      "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
    );
    expect(verifyLive).toContain("ref: ${{ github.sha }}");
    expect(verifyLive).toContain(
      "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0",
    );
    expect(verifyLive).toContain("npm ci");
    expect(verifyLive).toContain(
      'npm run release:pages:verify -- "${{ needs.deploy.outputs.page_url }}" "${{ github.sha }}"',
    );
    expect(verifyLive).not.toContain("npm run build");
  });

  it("defines the live Pages verifier package script", async () => {
    const pkg = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(pkg) as { scripts?: Record<string, string> };
    expect(parsed.scripts?.["release:pages:verify"]).toBe(
      "tsx scripts/release/verifyPagesDeployment.ts",
    );
  });
});
