import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import eocReview from "../../analysis/fp_official_alias_pass/EOC01M.json";
import hotReviewAudit from "../../analysis/fp_official_alias_pass/HOT01M.json";
import sscReview from "../../analysis/fp_official_alias_pass/SSC01M.json";
import curatedAliases from "../../data/curated/occupation-aliases.json";
import {
  ProgramOfficialAliasReviewSchema,
  TARGET_OCCUPATIONS_BY_PROGRAM,
  type ProgramOfficialAliasReview,
} from "../../data/schemas/fpOfficialAliasPass";
import {
  coalesceAcceptedAliasSupports,
  canonicalAliasIdentity,
  assertFpOfficialAliasPassResultsArtifact,
  computeFpOfficialAliasPass,
  validatePinnedBaselineResourceFile,
  parseAliasPassCliArguments,
  serializeFpOfficialAliasPassResults,
  validateProgramOfficialAliasReview,
  writeFpOfficialAliasPassResults,
  type AliasPassValidationContext,
} from "./validateFpOfficialAliasPass";
import {
  approvedSingleTokenAuditIdentities,
  validateFpOneWordPublicationReview,
} from "./validateFpOneWordPublicationReview";

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
      acceptedProgramOutputRelevance: {
        relationship: "singular_plural_variant",
        outputTerm: "Cocinero",
        aliasTerm: "Cocineros",
      },
      reviewedAt: "2026-08-09",
    },
  ],
} as const;

const rejectedReview = (
  programKey: "SSC01M" | "EOC01M",
  occupationId: string,
) => {
  const acceptedOutput =
    programKey === "SSC01M"
      ? {
          label:
            "Cuidador o cuidadora de personas en situación de dependencia en diferentes instituciones y/o domicilios.",
          sourceUrl: "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          sourceQuote:
            "Cuidador o cuidadora de personas en situación de dependencia en diferentes instituciones y/o domicilios.",
        }
      : {
          label: "Pavimentador a base de hormigón.",
          sourceUrl: "https://www.boe.es/eli/es/rd/2011/11/04/1575",
          sourceQuote: "– Pavimentador a base de hormigón.",
        };
  return {
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
        acceptedProgramOutputLabel: acceptedOutput.label,
        acceptedProgramOutputSourceUrl: acceptedOutput.sourceUrl,
        acceptedProgramOutputSourceQuote: acceptedOutput.sourceQuote,
        reviewedAt: "2026-08-09",
        reviewNote:
          "La clasificaci\u00f3n oficial revisada no contiene una frase literal que pueda publicarse como alias.",
      },
    ],
  } as const;
};

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

  it("accepts a valid BOE literal_boe_program_output review through the source guard", async () => {
    const context = await fixtureContext();
    const boeAcceptedReview = {
      schemaVersion: "1.0.0" as const,
      programKey: "SSC01M",
      baselineSnapshotId: BASELINE_SNAPSHOT_ID,
      reviews: [
        {
          alias: "Auxiliar de ayuda a domicilio",
          occupationId: "occupation:cno11:5710",
          disposition: "accepted",
          reasonCode: "literal_boe_program_output" as const,
          sourceUrl: "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          sourceQuote: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputLabel: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputSourceUrl:
            "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          acceptedProgramOutputSourceQuote: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputRelevance: {
            relationship: "exact_term" as const,
            outputTerm: "Auxiliar",
            aliasTerm: "Auxiliar",
          },
          reviewedAt: "2026-08-12",
        },
      ],
    };

    expect(() =>
      validateProgramOfficialAliasReview(boeAcceptedReview, context),
    ).not.toThrow();
  });

  it("rejects a rejected BOE review at the source guard", async () => {
    const context = await fixtureContext();
    const boeRejectedReview = {
      schemaVersion: "1.0.0" as const,
      programKey: "SSC01M",
      baselineSnapshotId: BASELINE_SNAPSHOT_ID,
      reviews: [
        {
          alias: "Ayudante de farmacia",
          occupationId: "occupation:cno11:5629",
          disposition: "rejected",
          reasonCode: "semantic_broadening" as const,
          sourceUrl: "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          sourceQuote: "Ayudante de farmacia.",
          acceptedProgramOutputLabel:
            "Cuidador o cuidadora de personas en situación de dependencia en diferentes instituciones y/o domicilios.",
          acceptedProgramOutputSourceUrl:
            "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          acceptedProgramOutputSourceQuote:
            "Cuidador o cuidadora de personas en situación de dependencia en diferentes instituciones y/o domicilios.",
          reviewedAt: "2026-08-09",
          reviewNote:
            "La asistencia farmacéutica no pertenece al cuidado de dependencia aceptado.",
        },
      ],
    };

    expect(() =>
      validateProgramOfficialAliasReview(boeRejectedReview, context),
    ).toThrow(/INE or SEPE/i);
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

    const acceptedSscOutput = (
      context.pilotResults as {
        attempts: {
          programKey: string;
          professionalOutputReviews?: {
            disposition: string;
            candidateOccupationIds: string[];
            acceptedOccupationIds?: string[];
            officialOutputLabel: string;
            sourceUrl: string;
            sourceQuote: string;
          }[];
        }[];
      }
    ).attempts
      .find((attempt) => attempt.programKey === "SSC01M")!
      .professionalOutputReviews!.find(
        (output) =>
          output.disposition === "accepted" &&
          output.candidateOccupationIds.includes("occupation:cno11:5629") &&
          output.acceptedOccupationIds?.includes("occupation:cno11:5629"),
      )!;
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
          acceptedProgramOutputLabel: acceptedSscOutput.officialOutputLabel,
          acceptedProgramOutputSourceUrl: acceptedSscOutput.sourceUrl,
          acceptedProgramOutputSourceQuote: acceptedSscOutput.sourceQuote,
          acceptedProgramOutputRelevance: {
            relationship: "singular_plural_variant",
            outputTerm: "Cuidador",
            aliasTerm: "Ayudantes",
          },
          reviewedAt: "2026-08-09",
        },
      ],
    };

    expect(() =>
      validateProgramOfficialAliasReview(dentalCandidate, context),
    ).toThrow(/program-output boundary|semantic broadening/i);
    expect({
      label: dentalCandidate.reviews[0].acceptedProgramOutputLabel,
      sourceUrl: dentalCandidate.reviews[0].acceptedProgramOutputSourceUrl,
      sourceQuote: dentalCandidate.reviews[0].acceptedProgramOutputSourceQuote,
    }).toEqual({
      label: acceptedSscOutput.officialOutputLabel,
      sourceUrl: acceptedSscOutput.sourceUrl,
      sourceQuote: acceptedSscOutput.sourceQuote,
    });
  });

  it("requires official rejected-record sources and reason-consistent literal evidence", async () => {
    const context = await fixtureContext();
    const rejected = rejectedReview("SSC01M", "occupation:cno11:5629");
    const review = rejected.reviews[0];

    expect(() =>
      validateProgramOfficialAliasReview(
        {
          ...rejected,
          reviews: [{ ...review, sourceUrl: "https://example.com/cno" }],
        },
        context,
      ),
    ).toThrow(/INE or SEPE/i);
    expect(() =>
      validateProgramOfficialAliasReview(
        {
          ...rejected,
          reviews: [
            {
              ...review,
              alias: "Encofradores",
              reasonCode: "matcher_policy_one_word",
              sourceQuote: "7111 Encofrador",
              reviewNote:
                "La frase literal es de una sola palabra y la pol\u00edtica del matcher permanece estrictamente multivocabulario.",
            },
          ],
        },
        context,
      ),
    ).toThrow(/literal/i);
    expect(() =>
      validateProgramOfficialAliasReview(
        {
          ...rejected,
          reviews: [
            {
              ...review,
              alias: "Alias presente",
              sourceQuote: "La clasificaci\u00f3n contiene Alias presente.",
            },
          ],
        },
        context,
      ),
    ).toThrow(/absent/i);
  });

  it.each([
    ["acceptedProgramOutputLabel", "Salida profesional alterada."],
    ["acceptedProgramOutputSourceUrl", "https://www.boe.es/alterada"],
    ["acceptedProgramOutputSourceQuote", "Salida profesional alterada."],
  ] as const)(
    "rejects a rejected-row tamper in %s before disposition semantics",
    async (field, alteredValue) => {
      const context = await fixtureContext();
      const audit = cloned(sscReview) as ProgramOfficialAliasReview;
      const rejected = audit.reviews.find(
        (review) => review.disposition === "rejected",
      );
      expect(rejected).toBeDefined();
      Object.assign(rejected!, { [field]: alteredValue });

      expect(() => validateProgramOfficialAliasReview(audit, context)).toThrow(
        /program-output boundary/i,
      );
    },
  );

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

  it("rejects a rejected audit alias that collides with a baseline alias", async () => {
    const context = await fixtureContext();
    const baselineAlias = context.aliases[0]!;
    const baselineCollision = ProgramOfficialAliasReviewSchema.parse({
      ...rejectedReview("SSC01M", "occupation:cno11:5629"),
      reviews: [
        {
          ...rejectedReview("SSC01M", "occupation:cno11:5629").reviews[0],
          alias: baselineAlias.alias,
        },
      ],
    });

    expect(() =>
      computeFpOfficialAliasPass({
        ...context,
        reviews: [context.reviews[0]!, baselineCollision, context.reviews[2]!],
      }),
    ).toThrow(/duplicate normalized alias review/i);
  });

  it("rejects a one-byte change to a pinned baseline resource before matching", async () => {
    const directory = await mkdtemp(join(tmpdir(), "fp-baseline-tamper-"));
    const tamperedPath = resolve(directory, "programs.json");
    const source = await readFile(
      resolve(
        ROOT_DIRECTORY,
        "public",
        "data",
        "v1",
        "snapshots",
        BASELINE_SNAPSHOT_ID,
        "programs.json",
      ),
      "utf8",
    );

    try {
      await writeFile(tamperedPath, `${source} `, "utf8");
      await expect(
        validatePinnedBaselineResourceFile("programs", tamperedPath),
      ).rejects.toThrow(/SHA-256/i);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("coalesces matching two-program CNO support but rejects conflicting literal evidence", () => {
    const accepted =
      ProgramOfficialAliasReviewSchema.parse(hotReview).reviews[0]!;
    if (accepted.disposition !== "accepted") {
      throw new Error("Test fixture must be accepted.");
    }
    const matchingSupport = {
      ...accepted,
      acceptedProgramOutputRelevance: {
        ...accepted.acceptedProgramOutputRelevance,
      },
    };

    expect(
      coalesceAcceptedAliasSupports([
        { programKey: "HOT01M", review: accepted },
        { programKey: "SSC01M", review: matchingSupport },
      ]),
    ).toEqual([accepted]);
    expect(() =>
      coalesceAcceptedAliasSupports([
        { programKey: "HOT01M", review: accepted },
        {
          programKey: "SSC01M",
          review: {
            ...matchingSupport,
            sourceQuote: "5110 Cocineros de prueba",
          },
        },
      ]),
    ).toThrow(/conflicting literal evidence/i);
  });

  it("rejects unsupported CLI arguments and writes deterministic result bytes", async () => {
    const context = await fixtureContext();
    const results = computeFpOfficialAliasPass(context);
    const directory = await mkdtemp(join(tmpdir(), "fp-alias-pass-"));
    const outputPath = resolve(directory, "results.json");

    try {
      expect(() => parseAliasPassCliArguments(["--unexpected"])).toThrow(
        /Usage/i,
      );
      expect(parseAliasPassCliArguments([])).toEqual({ writeResults: false });
      expect(parseAliasPassCliArguments(["--write-results"])).toEqual({
        writeResults: true,
      });
      await writeFpOfficialAliasPassResults(outputPath, results);
      const first = await readFile(outputPath, "utf8");
      await writeFpOfficialAliasPassResults(outputPath, results);

      expect(await readFile(outputPath, "utf8")).toBe(first);
      expect(first).toBe(serializeFpOfficialAliasPassResults(results));
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects schema-valid stale checked-in results before reporting success", async () => {
    const context = await fixtureContext();
    const expected = computeFpOfficialAliasPass(context);
    const stale = {
      ...expected,
      acceptedAliasCount: expected.acceptedAliasCount + 1,
    };
    const staleIds = structuredClone(expected);
    staleIds.programs[0]!.afterOfferCount = 1;
    staleIds.programs[0]!.newlyReachedOfferIds = ["offer:stale"];
    staleIds.newlyReachedOfferUnionCount = 1;
    staleIds.newlyReachedOfferUnionIds = ["offer:stale"];

    expect(() =>
      assertFpOfficialAliasPassResultsArtifact(
        serializeFpOfficialAliasPassResults(stale),
        expected,
      ),
    ).toThrow(/stale|recomputed/i);
    expect(() =>
      assertFpOfficialAliasPassResultsArtifact(
        serializeFpOfficialAliasPassResults(staleIds),
        expected,
      ),
    ).toThrow(/stale|recomputed/i);
    expect(() =>
      assertFpOfficialAliasPassResultsArtifact("", expected),
    ).toThrow(/missing|invalid/i);
    expect(() =>
      assertFpOfficialAliasPassResultsArtifact(
        serializeFpOfficialAliasPassResults(expected),
        expected,
      ),
    ).not.toThrow();
  });

  it("keeps published target aliases in exact parity with both audited sources", () => {
    const targetOccupationIds = new Set<string>(
      Object.values(TARGET_OCCUPATIONS_BY_PROGRAM).flat(),
    );
    const acceptedOfficialAliases = [hotReviewAudit, sscReview, eocReview]
      .flatMap(({ reviews }) => reviews)
      .filter(
        (
          review,
        ): review is (typeof hotReviewAudit.reviews)[number] & {
          disposition: "accepted";
        } => review.disposition === "accepted",
      )
      .map(({ alias, occupationId }) => ({ alias, occupationId }))
      .toSorted((left, right) =>
        canonicalAliasIdentity(left).localeCompare(
          canonicalAliasIdentity(right),
        ),
      );
    const oneWordAcceptedAliases = [
      ...approvedSingleTokenAuditIdentities(
        validateFpOneWordPublicationReview(ROOT_DIRECTORY),
      ),
    ]
      .map((identity) => {
        const [alias, occupationId] = identity.split("\u0000");
        if (alias === undefined || occupationId === undefined) {
          throw new Error("Malformed approved single-token audit identity.");
        }
        return { alias, occupationId };
      })
      .filter(({ occupationId }) => targetOccupationIds.has(occupationId));
    const accepted = [
      ...acceptedOfficialAliases,
      ...oneWordAcceptedAliases,
    ].toSorted((left, right) =>
      canonicalAliasIdentity(left).localeCompare(canonicalAliasIdentity(right)),
    );
    const published = curatedAliases
      .filter(({ occupationId }) => targetOccupationIds.has(occupationId))
      .map(({ alias, occupationId }) => ({ alias, occupationId }))
      .toSorted((left, right) =>
        canonicalAliasIdentity(left).localeCompare(
          canonicalAliasIdentity(right),
        ),
      );

    expect(published).toEqual(accepted);
    expect(accepted).not.toContainEqual({
      alias: "Ayudantes de dentista",
      occupationId: "occupation:cno11:5629",
    });
  });

  it("rejects literal_boe_program_output when sourceUrl host is INE", async () => {
    const context = await fixtureContext();
    const boeAcceptedReview = {
      schemaVersion: "1.0.0" as const,
      programKey: "SSC01M",
      baselineSnapshotId: BASELINE_SNAPSHOT_ID,
      reviews: [
        {
          alias: "Auxiliar de ayuda a domicilio",
          occupationId: "occupation:cno11:5710",
          disposition: "accepted",
          reasonCode: "literal_boe_program_output" as const,
          sourceUrl:
            "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
          sourceQuote: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputLabel: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputSourceUrl:
            "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          acceptedProgramOutputSourceQuote: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputRelevance: {
            relationship: "exact_term" as const,
            outputTerm: "Auxiliar",
            aliasTerm: "Auxiliar",
          },
          reviewedAt: "2026-08-12",
        },
      ],
    };

    expect(() =>
      validateProgramOfficialAliasReview(boeAcceptedReview, context),
    ).toThrow(/source host boe\.es/);
  });

  it("rejects literal_boe_program_output when alias does not match the complete normalized output", async () => {
    const context = await fixtureContext();
    const boeAcceptedReview = {
      schemaVersion: "1.0.0" as const,
      programKey: "SSC01M",
      baselineSnapshotId: BASELINE_SNAPSHOT_ID,
      reviews: [
        {
          alias: "Auxiliar domiciliario",
          occupationId: "occupation:cno11:5710",
          disposition: "accepted",
          reasonCode: "literal_boe_program_output" as const,
          sourceUrl: "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          sourceQuote: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputLabel: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputSourceUrl:
            "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          acceptedProgramOutputSourceQuote: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputRelevance: {
            relationship: "exact_term" as const,
            outputTerm: "Auxiliar",
            aliasTerm: "Auxiliar",
          },
          reviewedAt: "2026-08-12",
        },
      ],
    };

    expect(() =>
      validateProgramOfficialAliasReview(boeAcceptedReview, context),
    ).toThrow(/normalized alias to match the complete normalized output/);
  });

  it("rejects literal_boe_program_output when sourceQuote alone is altered", async () => {
    const context = await fixtureContext();
    const boeAcceptedReview = {
      schemaVersion: "1.0.0" as const,
      programKey: "SSC01M",
      baselineSnapshotId: BASELINE_SNAPSHOT_ID,
      reviews: [
        {
          alias: "Auxiliar de ayuda a domicilio",
          occupationId: "occupation:cno11:5710",
          disposition: "accepted",
          reasonCode: "literal_boe_program_output" as const,
          sourceUrl: "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          sourceQuote: "Auxiliar de ayuda alterada.",
          acceptedProgramOutputLabel: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputSourceUrl:
            "https://www.boe.es/eli/es/rd/2011/11/04/1593",
          acceptedProgramOutputSourceQuote: "Auxiliar de ayuda a domicilio.",
          acceptedProgramOutputRelevance: {
            relationship: "exact_term" as const,
            outputTerm: "Auxiliar",
            aliasTerm: "Auxiliar",
          },
          reviewedAt: "2026-08-12",
        },
      ],
    };

    expect(() =>
      validateProgramOfficialAliasReview(boeAcceptedReview, context),
    ).toThrow(/acceptedProgramOutputSourceQuote to match sourceQuote/);
  });
});
