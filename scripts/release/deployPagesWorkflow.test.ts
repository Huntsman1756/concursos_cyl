import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = resolve(".github/workflows/deploy-pages.yml");

describe("GitHub Pages deployment workflow", () => {
  it("requests first-run Pages enablement before uploading the artifact", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).toMatch(
      /uses: actions\/configure-pages@v5\s+with:\s+enablement: true/u,
    );
    expect(workflow.indexOf("actions/configure-pages@v5")).toBeLessThan(
      workflow.indexOf("actions/upload-pages-artifact@v3"),
    );
  });

  it("retains the permissions needed by the Pages deployment jobs", async () => {
    const workflow = await readFile(workflowPath, "utf8");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
  });
});
