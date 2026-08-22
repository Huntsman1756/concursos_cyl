import { describe, expect, it } from "vitest";

import {
  GENERATED_FOUNDATION_RESOURCE_KEYS,
  GENERATED_RESOURCE_CATALOG,
  GENERATED_RESOURCE_KEYS,
  immutableGeneratedResourcePath,
} from "./generatedResourceCatalog";
import { CANDIDATE_RESOURCE_KEYS } from "./candidateResourceAllowlist";

describe("generated resource catalogue", () => {
  it("registers SEPE occupation market as an additive immutable resource", () => {
    expect(GENERATED_RESOURCE_CATALOG.sepeOccupationMarket).toEqual({
      fileName: "sepe-occupation-market.json",
      sourceKind: "sepeOccupationMarket",
    });
    expect(GENERATED_RESOURCE_KEYS).toContain("sepeOccupationMarket");
    expect(GENERATED_FOUNDATION_RESOURCE_KEYS).not.toContain(
      "sepeOccupationMarket",
    );
    expect(
      immutableGeneratedResourcePath("sepeOccupationMarket", "build-1"),
    ).toBe("/data/v1/snapshots/build-1/sepe-occupation-market.json");
  });

  it("keeps the generated catalogue aligned with the candidate allowlist", () => {
    expect(GENERATED_RESOURCE_KEYS).toEqual([...CANDIDATE_RESOURCE_KEYS]);
  });
});
