import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import sscReview from "../../analysis/fp_official_alias_pass/SSC01M.json";
import { describe, expect, it } from "vitest";

import {
  validateProgramOfficialAliasReview,
  type AliasPassValidationContext,
} from "./validateFpOfficialAliasPass";

const BASELINE_SNAPSHOT_ID = "20260808215403108-add4c517860c";

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function sscValidationContext(): Promise<AliasPassValidationContext> {
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
    requirements,
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
      requirements as AliasPassValidationContext["publishedRequirements"],
  };
}

describe("SSC01M official alias audit", () => {
  it("keeps SSC01M aliases inside accepted disability/home-care boundaries", async () => {
    const context = await sscValidationContext();

    expect(() =>
      validateProgramOfficialAliasReview(sscReview, context),
    ).not.toThrow();
    expect(sscReview.programKey).toBe("SSC01M");
    expect(
      new Set(sscReview.reviews.map(({ occupationId }) => occupationId)),
    ).toEqual(new Set(["occupation:cno11:5629", "occupation:cno11:5710"]));
    expect(
      sscReview.reviews.map(
        ({ alias, occupationId, disposition, reasonCode }) => ({
          alias,
          occupationId,
          disposition,
          reasonCode,
        }),
      ),
    ).toEqual([
      {
        alias:
          "Trabajadores de los cuidados a las personas en servicios de salud no clasificados bajo otros epígrafes",
        occupationId: "occupation:cno11:5629",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Celadores de hospital",
        occupationId: "occupation:cno11:5629",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Ayudantes de dentista",
        occupationId: "occupation:cno11:5629",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Técnicos en prótesis dentales",
        occupationId: "occupation:cno11:5629",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Técnicos superiores en higiene bucodental",
        occupationId: "occupation:cno11:5629",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Ayudantes de farmacia",
        occupationId: "occupation:cno11:5629",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Trabajadores de los cuidados personales a domicilio",
        occupationId: "occupation:cno11:5710",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Cuidadores de personas mayores a domicilio",
        occupationId: "occupation:cno11:5710",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Cuidadores de enfermos a domicilio",
        occupationId: "occupation:cno11:5710",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Auxiliares de enfermería en el hogar (con labores de cuidador)",
        occupationId: "occupation:cno11:5710",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Auxiliares de ayuda a personas dependientes a domicilio",
        occupationId: "occupation:cno11:5710",
        disposition: "accepted",
        reasonCode: "literal_ine_classification",
      },
      {
        alias: "Auxiliares de enfermería en geriátricos",
        occupationId: "occupation:cno11:5710",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Cuidadores de niños en guarderías y centros educativos",
        occupationId: "occupation:cno11:5710",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Cuidadores de niños en domicilios",
        occupationId: "occupation:cno11:5710",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
      {
        alias: "Asistentes-personas de compañía",
        occupationId: "occupation:cno11:5710",
        disposition: "rejected",
        reasonCode: "semantic_broadening",
      },
    ]);
    expect(
      sscReview.reviews.find(({ alias }) => alias === "Ayudantes de dentista"),
    ).toMatchObject({
      occupationId: "occupation:cno11:5629",
      disposition: "rejected",
      reasonCode: "semantic_broadening",
    });
    expect(
      sscReview.reviews.find(
        ({ alias }) =>
          alias === "Auxiliares de ayuda a personas dependientes a domicilio",
      ),
    ).toMatchObject({
      disposition: "accepted",
      acceptedProgramOutputLabel: "Auxiliar de ayuda a domicilio.",
      acceptedProgramOutputRelevance: {
        relationship: "singular_plural_variant",
        outputTerm: "Auxiliar",
        aliasTerm: "Auxiliares",
      },
    });
  });
});
