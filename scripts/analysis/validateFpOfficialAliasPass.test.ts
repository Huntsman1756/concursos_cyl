import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ProgramOfficialAliasReviewSchema,
  type ProgramOfficialAliasReview,
} from "../../data/schemas/fpOfficialAliasPass";
import {
  computeFpOfficialAliasPass,
  validateProgramOfficialAliasReview,
  type AliasPassValidationContext,
} from "./validateFpOfficialAliasPass";

const BASELINE_SNAPSHOT_ID = "20260808215403108-add4c517860c";
const ROOT_DIRECTORY = resolve(process.cwd());

const hotReview = {
  schemaVersion: "1.0.0",
  programKey: "HOT01M",
  baselineSnapshotId: BASELINE_SNAPSHOT_ID,
  reviews: [
    {
      alias: "Cocineros asalariados",
      occupationId: "occupation:cno11:5110",
      disposition: "accepted",
      reasonCode: "literal_ine_classification",
      sourceUrl:
        "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
      sourceQuote: "5110 Cocineros asalariados",
      acceptedProgramOutputLabel: "Cocinero.",
      acceptedProgramOutputSourceUrl:
        "https://todofp.es/dam/jcr%3A63392ee9-4d38-449b-a196-d0efb714b364/n-tcocinagastronomiaes-pdf.pdf",
      acceptedProgramOutputSourceQuote: "Cocinero.",
      reviewedAt: "2026-08-09",
    },
  ],
} as const;

const rejectedReview = (
  programKey: "SSC01M" | "EOC01M",
  occupationId: string,
) =>
  ({
    schemaVersion: "1.0.0",
    programKey,
    baselineSnapshotId: BASELINE_SNAPSHOT_ID,
    reviews: [
      {
        alias: `Evidencia ${programKey} no publicable`,
        occupationId,
        disposition: "rejected",
        reasonCode: "official_evidence_absent",
        sourceUrl:
          "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
        sourceQuote: "Clasificaci\u00f3n revisada sin el alias candidato.",
        acceptedProgramOutputLabel: "Salida profesional revisada.",
        acceptedProgramOutputSourceUrl: "https://www.todofp.es/",
        acceptedProgramOutputSourceQuote: "Salida profesional revisada.",
        reviewedAt: "2026-08-09",
        reviewNote:
          "La clasificaci\u00f3n oficial revisada no contiene una frase literal que pueda publicarse como alias.",
      },
    ],
  }) as const;

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function fixtureContext(): Promise<AliasPassValidationContext> {
  const snapshotDirectory = resolve(
    ROOT_DIRECTORY,
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
      resolve(ROOT_DIRECTORY, "analysis", "fp_coverage_pilot_results.json"),
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
    reviews: [
      ProgramOfficialAliasReviewSchema.parse(hotReview),
      ProgramOfficialAliasReviewSchema.parse(
        rejectedReview("SSC01M", "occupation:cno11:5629"),
      ),
      ProgramOfficialAliasReviewSchema.parse(
        rejectedReview("EOC01M", "occupation:cno11:7111"),
      ),
    ],
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

function cloned<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("FP official alias pass validation", () => {
  it("accepts a literal INE alias with an exact approved output boundary", async () => {
    const context = await fixtureContext();

    expect(() =>
      ProgramOfficialAliasReviewSchema.parse(hotReview),
    ).not.toThrow();
    expect(validateProgramOfficialAliasReview(hotReview, context)).toEqual(
      ProgramOfficialAliasReviewSchema.parse(hotReview),
    );
  });

  it("rejects unknown scope, non-authoritative sources, nonliteral text, and source/reason mismatch", async () => {
    const context = await fixtureContext();
    const review = hotReview.reviews[0];

    expect(() =>
      validateProgramOfficialAliasReview(
        { ...hotReview, programKey: "SAN21" },
        context,
      ),
    ).toThrow(/program/i);
    expect(() =>
      validateProgramOfficialAliasReview(
        {
          ...hotReview,
          reviews: [{ ...review, occupationId: "occupation:cno11:5611" }],
        },
        context,
      ),
    ).toThrow(/occupation/i);
    expect(() =>
      validateProgramOfficialAliasReview(
        {
          ...hotReview,
          reviews: [{ ...review, sourceUrl: "https://example.com/cno" }],
        },
        context,
      ),
    ).toThrow(/INE or SEPE/i);
    expect(() =>
      validateProgramOfficialAliasReview(
        {
          ...hotReview,
          reviews: [{ ...review, sourceQuote: "5110 Cocineros contratados" }],
        },
        context,
      ),
    ).toThrow(/literal/i);
    expect(() =>
      validateProgramOfficialAliasReview(
        {
          ...hotReview,
          reviews: [
            {
              ...review,
              sourceUrl: "https://www.sepe.es/clasificacion.pdf",
            },
          ],
        },
        context,
      ),
    ).toThrow(/reason code/i);
  });

  it("rejects an accepted alias whose output evidence is altered or semantically broadens SSC01M", async () => {
    const context = await fixtureContext();
    const changedPilot = cloned(context.pilotResults) as {
      attempts: {
        programKey: string;
        professionalOutputReviews?: { sourceQuote: string }[];
      }[];
    };
    changedPilot.attempts.find(
      (attempt) => attempt.programKey === "HOT01M",
    )!.professionalOutputReviews![0]!.sourceQuote = "Cocinero alterado.";

    expect(() =>
      validateProgramOfficialAliasReview(hotReview, {
        ...context,
        pilotResults:
          changedPilot as AliasPassValidationContext["pilotResults"],
      }),
    ).toThrow(/program-output boundary/i);

    const dentalCandidate = {
      schemaVersion: "1.0.0",
      programKey: "SSC01M",
      baselineSnapshotId: BASELINE_SNAPSHOT_ID,
      reviews: [
        {
          alias: "Ayudantes de dentista",
          occupationId: "occupation:cno11:5629",
          disposition: "accepted",
          reasonCode: "literal_ine_classification",
          sourceUrl:
            "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
          sourceQuote: "5629 Ayudantes de dentista",
          acceptedProgramOutputLabel:
            "Cuidador o cuidadora de personas en situaci\u00f3n de dependencia en diferentes instituciones y/o domicilios.",
          acceptedProgramOutputSourceUrl:
            "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          acceptedProgramOutputSourceQuote:
            "Cuidador o cuidadora de personas en situaci\u00f3n de dependencia en diferentes instituciones y/o domicilios.",
          reviewedAt: "2026-08-09",
        },
      ],
    };

    expect(() =>
      validateProgramOfficialAliasReview(dentalCandidate, context),
    ).toThrow(/program-output boundary|semantic broadening/i);
  });

  it("rejects globally unsafe aliases and gives input-order-independent zero-delta results", async () => {
    const context = await fixtureContext();
    const hotLink = context.links.find(
      (link) =>
        link.trainingProgramKey === "HOT01M" &&
        link.occupationId === "occupation:cno11:5110",
    )!;
    const sharedCnoLeakageContext: AliasPassValidationContext = {
      ...context,
      links: [...context.links, { ...hotLink, trainingProgramKey: "IFC03S" }],
    };
    const reversedContext: AliasPassValidationContext = {
      ...context,
      reviews: [...context.reviews].reverse() as ProgramOfficialAliasReview[],
      programs: [...context.programs].reverse(),
      occupations: [...context.occupations].reverse(),
      aliases: [...context.aliases].reverse(),
      links: [...context.links].reverse(),
      offers: [...context.offers].reverse(),
      publishedRequirements: [...context.publishedRequirements].reverse(),
    };

    expect(() => computeFpOfficialAliasPass(sharedCnoLeakageContext)).toThrow(
      /cross-program leakage|every approved program link/i,
    );
    expect(computeFpOfficialAliasPass(context)).toMatchObject({
      programs: [
        { programKey: "HOT01M", beforeOfferCount: 0, afterOfferCount: 0 },
        { programKey: "SSC01M", beforeOfferCount: 0, afterOfferCount: 0 },
        { programKey: "EOC01M", beforeOfferCount: 0, afterOfferCount: 0 },
      ],
      nonTargetProgramDeltas: [],
    });
    expect(JSON.stringify(computeFpOfficialAliasPass(reversedContext))).toBe(
      JSON.stringify(computeFpOfficialAliasPass(context)),
    );
  });

  it("rejects a normalized alias collision even when the duplicate is audit-only", async () => {
    const context = await fixtureContext();
    const duplicateRejectedReview = ProgramOfficialAliasReviewSchema.parse({
      ...rejectedReview("EOC01M", "occupation:cno11:7111"),
      reviews: [
        {
          ...rejectedReview("EOC01M", "occupation:cno11:7111").reviews[0],
          alias: "  EVIDENCIA SSC01M, no publicable ",
        },
      ],
    });

    expect(() =>
      computeFpOfficialAliasPass({
        ...context,
        reviews: [
          context.reviews[0]!,
          context.reviews[1]!,
          duplicateRejectedReview,
        ],
      }),
    ).toThrow(/duplicate normalized alias review/i);
  });
});
