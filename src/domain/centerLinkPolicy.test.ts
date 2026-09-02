import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CenterLinkPolicySchema,
  centerWebsiteCtaFor,
  CENTER_LINK_POLICY_PATH,
} from "./centerLinkPolicy";

const rawArtifact = readFileSync(
  join(process.cwd(), "public", "qa", "center-link-policy.json"),
  "utf8",
);

describe("center link policy artifact", () => {
  it("is a valid, dated presentation overlay bound to the frozen snapshot", () => {
    const policy = CenterLinkPolicySchema.parse(JSON.parse(rawArtifact));
    expect(policy.kind).toBe("salida-cyl-center-link-policy");
    expect(policy.snapshotId).toBe("20260830120000000-8c6c79fbd2a1");
    expect(policy.derivedFrom).toBe("analysis/centers-link-audit.json");
    expect(policy.auditedAt).toBe("2026-09-02T08:41:56.345Z");
    expect(Object.keys(policy.centers)).toHaveLength(201);
  });

  it("matches the audited SAFE_WEBSITE_CTA contract (201 of 228)", () => {
    const policy = CenterLinkPolicySchema.parse(JSON.parse(rawArtifact));
    const website = Object.values(policy.centers).filter(
      (entry) => entry.cta === "website",
    ).length;
    const sourcePublished = Object.values(policy.centers).filter(
      (entry) => entry.cta === "source_published",
    ).length;
    expect(website).toBe(193);
    expect(sourcePublished).toBe(8);
    expect(website + sourcePublished).toBe(201);
  });

  it("suppresses the three audited content-mismatch domains", () => {
    const policy = CenterLinkPolicySchema.parse(JSON.parse(rawArtifact));
    for (const hijacked of ["37009271", "47006545", "24000679"]) {
      expect(
        centerWebsiteCtaFor(policy, hijacked),
        `center ${hijacked} must have no CTA`,
      ).toBeNull();
    }
  });

  it("maps policy entries to their citizen-facing labels", () => {
    const policy = CenterLinkPolicySchema.parse(JSON.parse(rawArtifact));
    const entries = Object.entries(policy.centers);
    const websiteEntry = entries.find(([, e]) => e.cta === "website");
    const sourceEntry = entries.find(([, e]) => e.cta === "source_published");
    expect(websiteEntry).toBeDefined();
    expect(sourceEntry).toBeDefined();
    expect(centerWebsiteCtaFor(policy, websiteEntry![0])).toBe(
      "Web del centro",
    );
    expect(centerWebsiteCtaFor(policy, sourceEntry![0])).toBe(
      "Web publicada en la fuente",
    );
    expect(centerWebsiteCtaFor(policy, "99999999")).toBeNull();
  });

  it("fails safe with no CTA when the policy artifact is unavailable", () => {
    expect(centerWebsiteCtaFor(null, "47011115")).toBeNull();
  });

  it("keeps the artifact outside the canonical data tree", () => {
    expect(CENTER_LINK_POLICY_PATH.startsWith("/qa/")).toBe(true);
    expect(CENTER_LINK_POLICY_PATH.startsWith("/data/v1")).toBe(false);
  });
});
