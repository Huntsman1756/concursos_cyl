import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = resolve(".github/workflows/deploy-pages.yml");

describe("GitHub Pages deployment workflow", () => {
  it("requests first-run Pages enablement before deployment", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).toMatch(
      /uses: actions\/configure-pages@983d7736d9b0ae728b81ab479565c72886d7745b # v5\.0\.0\s+with:\s+enablement: true/u,
    );
  });

  it("pins every action to an exact reviewed commit", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).toContain(
      "actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1",
    );
    expect(workflow).toContain(
      "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0",
    );
    expect(workflow).toContain(
      "actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa # v3.0.1",
    );
    expect(workflow).toContain(
      "actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e # v4.0.5",
    );
    expect(workflow).not.toMatch(/uses: actions\/[\w-]+@v\d/u);
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
    const deployJob = workflow.slice(workflow.indexOf("  deploy:"));
    expect(deployJob).toMatch(/permissions:\s+pages: write\s+id-token: write/u);
    expect(deployJob).not.toContain("contents: read");
  });

  it("verifies Caddy headers against the running release container", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).toContain("docker build -t salida-cyl:ci .");
    expect(workflow).toContain("CADDY_SMOKE_BASE_URL=http://127.0.0.1:18080");
    expect(workflow).toContain("npm run release:caddy:verify");
  });
});
