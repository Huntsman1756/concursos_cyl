import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import hotReview from "../../analysis/fp_official_alias_pass/HOT01M.json";
import {
  validateProgramOfficialAliasReview,
  type AliasPassValidationContext,
} from "./validateFpOfficialAliasPass";

const BASELINE_SNAPSHOT_ID = "20260808215403108-add4c517860c";

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function hotValidationContext(): Promise<AliasPassValidationContext> {
  const rootDirectory = process.cwd();
  const snapshotDirectory = resolve(
    rootDirectory,
    "public",
    "data",
    "v1",
    "snapshots",
    BASELINE_SNAPSHOT_ID,
  );
  const [
    pilotResults,
    programs,
    occupations,
    aliases,
    links,
    offers,
    publishedRequirements,
  ] = await Promise.all([
    readJson(
      resolve(rootDirectory, "analysis", "fp_coverage_pilot_results.json"),
    ),
    readJson(resolve(snapshotDirectory, "programs.json")),
    readJson(resolve(snapshotDirectory, "occupations.json")),
    readJson(resolve(snapshotDirectory, "occupation-aliases.json")),
    readJson(resolve(snapshotDirectory, "training-occupation-links.json")),
    readJson(resolve(snapshotDirectory, "job-offers.json")),
    readJson(resolve(snapshotDirectory, "published-requirements.json")),
  ]);

  return {
    baselineSnapshotId: BASELINE_SNAPSHOT_ID,
    reviews: [],
    pilotResults: pilotResults as AliasPassValidationContext["pilotResults"],
    programs: programs as AliasPassValidationContext["programs"],
    occupations: occupations as AliasPassValidationContext["occupations"],
    aliases: aliases as AliasPassValidationContext["aliases"],
    links: links as AliasPassValidationContext["links"],
    offers: offers as AliasPassValidationContext["offers"],
    publishedRequirements:
      publishedRequirements as AliasPassValidationContext["publishedRequirements"],
  };
}

describe("HOT01M official alias audit", () => {
  it("records every literal CNO 5110 label/example with a bounded HOT01M decision", async () => {
    const context = await hotValidationContext();

    expect(() =>
      validateProgramOfficialAliasReview(hotReview, context),
    ).not.toThrow();
    expect(hotReview.programKey).toBe("HOT01M");
    expect(
      new Set(hotReview.reviews.map(({ occupationId }) => occupationId)),
    ).toEqual(new Set(["occupation:cno11:5110"]));
    expect(
      hotReview.reviews.map(({ alias, disposition, reasonCode }) => ({
        alias,
        disposition,
        reasonCode,
      })),
    ).toEqual([
      {
        alias: "Cocineros asalariados",
        disposition: "accepted",
        reasonCode: "literal_ine_classification",
      },
      {
        alias: "Cocineros (no propietarios)",
        disposition: "accepted",
        reasonCode: "literal_ine_classification",
      },
      {
        alias: "Cocineros de comedor de empresa",
        disposition: "accepted",
        reasonCode: "literal_ine_classification",
      },
      {
        alias: "Cocineros en restaurantes",
        disposition: "accepted",
        reasonCode: "literal_ine_classification",
      },
      {
        alias: "Preparadores de catering",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Reposteros-pasteleros",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Pizzeros, restaurantes",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Jefes de cocina",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Chefs",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Cocineros propietarios",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Cocineros de comida rápida",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Pizzeros, comida rápida",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Preparadores de hamburguesas",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
    ]);
    expect(
      hotReview.reviews.filter(({ disposition }) => disposition === "accepted"),
    ).toHaveLength(4);
    expect(
      hotReview.reviews.filter(({ disposition }) => disposition === "rejected"),
    ).toHaveLength(9);
    expect(
      hotReview.reviews
        .filter(({ sourceQuote }) => /(?:^|\s|,)\d{4}$/u.test(sourceQuote))
        .filter(({ sourceQuote }) => !/5110$/u.test(sourceQuote))
        .map(({ alias, reasonCode }) => ({ alias, reasonCode })),
    ).toEqual([
      { alias: "Jefes de cocina", reasonCode: "semantic_broadening" },
      { alias: "Chefs", reasonCode: "semantic_broadening" },
      {
        alias: "Cocineros propietarios",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Cocineros de comida rápida",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Pizzeros, comida rápida",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Preparadores de hamburguesas",
        reasonCode: "semantic_broadening",
      },
    ]);
  });
});
