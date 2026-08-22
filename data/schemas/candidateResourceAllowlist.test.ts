import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANDIDATE_RESOURCE_KEYS,
  assertCandidateResourceSet,
  assertCanonicalSepeCandidateResource,
  classifyCandidateReference,
} from "./candidateResourceAllowlist";

const EXPECTED_RESOURCE_KEYS = [
  "centers",
  "derivedFpOccupationGraph",
  "ecylCourses",
  "educationCenterDirectory",
  "jobOffers",
  "mappingCoverage",
  "municipalities",
  "occupationAliases",
  "occupations",
  "officialOccupations",
  "openDataCatalog",
  "outcomeIndicators",
  "professionalCertificates",
  "professionalProfiles",
  "programs",
  "provincialContracts",
  "publicEmploymentCalls",
  "publishedRequirements",
  "sepeOccupationMarket",
  "trainingOccupationLinks",
  "trainingOfferings",
] as const;

describe("candidate resource allowlist", () => {
  it("loads the exact sorted 21-resource candidate set", async () => {
    const config = JSON.parse(
      await readFile("config/candidate-resource-allowlist.json", "utf8"),
    ) as { schemaVersion: string; resourceKeys: string[] };

    expect(config).toEqual({
      schemaVersion: "1.0.0",
      resourceKeys: [...EXPECTED_RESOURCE_KEYS],
    });
    expect(CANDIDATE_RESOURCE_KEYS).toEqual([...EXPECTED_RESOURCE_KEYS]);
  });

  it("requires the canonical SEPE resource in the candidate set", () => {
    expect(() =>
      assertCandidateResourceSet(
        CANDIDATE_RESOURCE_KEYS.filter((key) => key !== "sepeOccupationMarket"),
      ),
    ).toThrow(/missing.*sepeOccupationMarket/iu);
  });

  it("rejects duplicate and extra candidate resources", () => {
    expect(() =>
      assertCandidateResourceSet([
        ...CANDIDATE_RESOURCE_KEYS.slice(0, -1),
        "programs",
      ]),
    ).toThrow(/duplicate|missing/iu);
    expect(() =>
      assertCandidateResourceSet([...CANDIDATE_RESOURCE_KEYS, "unexpected"]),
    ).toThrow(/extra|unexpected|allowlist/iu);
  });

  it("allows reviewed mapping citations to sepe.es", () => {
    expect(
      classifyCandidateReference(
        "https://www.sepe.es/HomeSepe/que-es-el-sepe.html",
      ),
    ).toBe("complementary-classification-source");
  });

  it("keeps external certificate URLs publisher-owned", () => {
    expect(
      classifyCandidateReference(
        "https://sede.sepe.gob.es/especialidadesformativas/RD/ADGG0108.pdf",
      ),
    ).toBe("publisher-owned");
  });

  it("asserts the canonical 116-record SEPE resource", async () => {
    const manifest = JSON.parse(
      await readFile("public/data/v1/manifest.json", "utf8"),
    ) as {
      resourceSnapshots: {
        sepeOccupationMarket: { resourcePath: string };
      };
    };
    const resourcePath = join(
      ".",
      "public",
      manifest.resourceSnapshots.sepeOccupationMarket.resourcePath.slice(1),
    );
    const resource = JSON.parse(
      await readFile(resourcePath, "utf8"),
    ) as unknown;

    expect(assertCanonicalSepeCandidateResource(resource).records).toHaveLength(
      116,
    );
  });
});
