import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import {
  loadFpCoveragePilotValidationContext,
  validateFpCoveragePilotResults,
  validateFpCoveragePilotResultsFile,
  type FpCoveragePilotValidationContext,
  type FpCoveragePilotResults,
} from "./validateFpCoveragePilot";
import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import { matchOffersForProgram } from "../../src/domain/offerMatching";

const SSC_APPROVED_OCCUPATION_IDS: readonly string[] = [
  "occupation:cno11:5629",
  "occupation:cno11:5710",
] as const;
const SSC_REJECTED_OCCUPATION_IDS: readonly string[] = [
  "occupation:cno11:2312",
  "occupation:cno11:4424",
  "occupation:cno11:5611",
  "occupation:cno11:5831",
  "occupation:cno11:5891",
] as const;
const SSC_OFFICIAL_OUTPUT_LABELS = [
  "Cuidador o cuidadora de personas en situación de dependencia en diferentes instituciones y/o domicilios.",
  "Cuidador o cuidadora en centros de atención psiquiátrica.",
  "Gerocultor o gerocultora.",
  "Gobernante y subgobernante de personas en situación de dependencia en instituciones.",
  "Auxiliar responsable de planta de residencias de mayores y personas con discapacidad.",
  "Auxiliar de ayuda a domicilio.",
  "Asistente de atención domiciliaria.",
  "Trabajador o trabajadora familiar.",
  "Auxiliar de educación especial.",
  "Asistente personal.",
  "Teleoperador/a de teleasistencia.",
] as const;
const EOC_OFFICIAL_OUTPUT_LABELS = [
  "Jefe de equipo de fábricas de albañilería.",
  "Jefe de equipo de albañiles de urbanización.",
  "Jefe de equipo de encofradores.",
  "Jefe de equipo de ferralla.",
  "Jefe de taller de ferralla.",
  "Jefe de equipo de albañiles de cubiertas.",
  "Jefe de equipo y/o encargado de alicatadores y soladores.",
  "Albañil.",
  "Colocador de ladrillo caravista.",
  "Colocador de bloque prefabricado.",
  "Albañil tabiquero.",
  "Albañil piedra construcción.",
  "Mampostero.",
  "Oficial de miras.",
  "Albañil de urbanización.",
  "Pavimentador con adoquines.",
  "Pavimentador con baldosas y losas.",
  "Pavimentador a base de hormigón.",
  "Pocero en redes de saneamiento.",
  "Encofrador.",
  "Encofrador de edificación.",
  "Encofrador de obra civil.",
  "Ferrallista.",
  "Albañil de cubiertas.",
  "Tejador.",
  "Montador de teja.",
  "Pizarrista.",
  "Colocador de pizarra.",
  "Montador de cubiertas de paneles y chapas.",
  "Aplicador de revestimientos continuos de fachadas.",
  "Alicatador– solador.",
  "Instalador de sistemas de impermeabilización en edificios y obra civil.",
  "Impermeabilizador de terrazas.",
] as const;

const notStartedAttempts: FpCoveragePilotResults["attempts"] = [
  {
    programKey: "SAN21",
    programTitle: "Cuidados Auxiliares de Enfermería",
    familyName: "Sanidad",
    plannedStratum: "easy",
    state: "not_started",
    stateTransitions: [],
    acceptedRelationships: [],
    rejectedRelationships: [],
  },
  {
    programKey: "HOT01M",
    programTitle: "Cocina y Gastronomía",
    familyName: "Hostelería y Turismo",
    plannedStratum: "easy",
    state: "not_started",
    stateTransitions: [],
    acceptedRelationships: [],
    rejectedRelationships: [],
  },
  {
    programKey: "SSC01M",
    programTitle: "Atención a Personas en Situación de Dependencia",
    familyName: "Servicios Socioculturales y a la Comunidad",
    plannedStratum: "medium",
    state: "not_started",
    stateTransitions: [],
    acceptedRelationships: [],
    rejectedRelationships: [],
  },
  {
    programKey: "EOC01M",
    programTitle: "Construcción",
    familyName: "Edificación y Obra Civil",
    plannedStratum: "medium",
    state: "not_started",
    stateTransitions: [],
    acceptedRelationships: [],
    rejectedRelationships: [],
  },
  {
    programKey: "COM01M",
    programTitle: "Actividades Comerciales",
    familyName: "Comercio y Marketing",
    plannedStratum: "ambiguous",
    state: "not_started",
    stateTransitions: [],
    acceptedRelationships: [],
    rejectedRelationships: [],
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function checkedInResults(): Promise<FpCoveragePilotResults> {
  return JSON.parse(
    await readFile(
      resolve(process.cwd(), "analysis", "fp_coverage_pilot_results.json"),
      "utf8",
    ),
  ) as FpCoveragePilotResults;
}

function results(): FpCoveragePilotResults {
  return {
    schemaVersion: "1.0.0",
    attempts: clone(notStartedAttempts),
  };
}

function completedResults() {
  const candidate = results();
  candidate.attempts[0] = {
    ...candidate.attempts[0],
    state: "completed",
    startedAt: "2026-08-04T09:00:00.000Z",
    completedAt: "2026-08-04T10:00:00.000Z",
    stateTransitions: [
      {
        from: "not_started",
        to: "in_progress",
        at: "2026-08-04T09:00:00.000Z",
      },
      {
        from: "in_progress",
        to: "completed",
        at: "2026-08-04T10:00:00.000Z",
      },
    ],
    phaseMinutes: {
      research: 30,
      implementation: 10,
      test: 10,
      review: 10,
    },
    acceptedRelationships: [
      {
        occupationId: "occupation:cno11:2713",
        relationshipType: "official_output",
        reasonCode: "official_programme_output",
        sourceUrl:
          "https://www.boe.es/buscar/doc.php?id=BOE-A-2010-9269&lang=es",
        sourceQuote: "Desarrollador de aplicaciones en entornos Web.",
        reviewedAt: "2026-08-04",
      },
    ],
    snapshotCoverage: {
      status: "unavailable",
      snapshotId: context.snapshotId,
      limitationCode: "accepted_relationships_not_in_snapshot",
    },
  };
  return candidate;
}

let context: FpCoveragePilotValidationContext;

beforeAll(async () => {
  context = await loadFpCoveragePilotValidationContext();
});

function validate(
  candidate: unknown,
  now = new Date("2026-08-09T00:00:00.000Z"),
) {
  return validateFpCoveragePilotResults(candidate, context, { now: () => now });
}

describe("validateFpCoveragePilotResults", () => {
  it("publishes the reviewed SAN21 CNO outputs in the manifest-addressed snapshot", () => {
    expect(
      context.links.filter(
        (link) =>
          link.trainingProgramKey === "SAN21" &&
          link.reviewStatus === "approved",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          occupationId: "occupation:cno11:5611",
          relationshipType: "official_output",
          sourceUrl:
            "https://todofp.es/dam/jcr%3Aaf5b68fd-e75c-493b-94ff-0565d3886473/san21cuidauxilenfermeria-pdf.pdf",
          sourceQuote: "Auxiliar de Enfermería/Clínica..",
          reviewedAt: "2026-08-08",
        }),
        expect.objectContaining({
          occupationId: "occupation:cno11:5612",
          relationshipType: "official_output",
          sourceUrl:
            "https://todofp.es/dam/jcr%3Aaf5b68fd-e75c-493b-94ff-0565d3886473/san21cuidauxilenfermeria-pdf.pdf",
          sourceQuote: "Auxiliar de Atención primaria.",
          reviewedAt: "2026-08-08",
        }),
      ]),
    );
  });

  it("publishes the reviewed HOT01M cook output in the manifest-addressed snapshot", () => {
    expect(
      context.links.filter(
        (link) =>
          link.trainingProgramKey === "HOT01M" &&
          link.reviewStatus === "approved",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          occupationId: "occupation:cno11:5110",
          relationshipType: "official_output",
          sourceUrl:
            "https://todofp.es/dam/jcr%3A63392ee9-4d38-449b-a196-d0efb714b364/n-tcocinagastronomiaes-pdf.pdf",
          sourceQuote:
            "Las ocupaciones y puestos de trabajo más relevantes son los siguientes: Cocinero.",
          reviewedAt: "2026-08-08",
        }),
      ]),
    );
  });

  it("publishes only the independently evidenced SSC01M relationships without aliases or offer matches", () => {
    const sscLinks = context.links.filter(
      (link) => link.trainingProgramKey === "SSC01M",
    );

    expect(sscLinks).toEqual([
      expect.objectContaining({
        occupationId: "occupation:cno11:5629",
        relationshipType: "reviewed_relationship",
        sourceUrl:
          "https://www.sepe.es/fr/SiteSepe/contenidos/COVID-19/documentos/documentacion-melilla/2021/201221-Resolucion-provisional--20-12-2021-firmada.pdf",
        sourceQuote:
          "Categoría: CUIDADORES DE PERSONAS CON DISCAPACIDAD (CNO 56291025) Titulación: FP grado medio en atención a personas en situación de dependencia",
        reviewedAt: "2026-08-08",
      }),
      expect.objectContaining({
        occupationId: "occupation:cno11:5710",
        relationshipType: "official_output",
        sourceUrl: "https://www.boe.es/eli/es/rd/2011/11/04/1593",
        sourceQuote: "Auxiliar de ayuda a domicilio.",
        reviewedAt: "2026-08-08",
      }),
    ]);
    expect(sscLinks.map((link) => link.occupationId).sort()).toEqual(
      [...SSC_APPROVED_OCCUPATION_IDS].sort(),
    );
    expect(
      context.aliases.filter((alias) =>
        SSC_APPROVED_OCCUPATION_IDS.includes(alias.occupationId),
      ),
    ).toEqual([]);
    expect(
      sscLinks.some((link) =>
        SSC_REJECTED_OCCUPATION_IDS.includes(link.occupationId),
      ),
    ).toBe(false);
    expect(
      matchOffersForProgram("SSC01M", {
        programs: context.programs,
        qualifications: REVIEWED_QUALIFICATIONS,
        programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
        occupations: context.occupations,
        aliases: context.aliases,
        links: context.links,
        offers: context.offers,
        publishedRequirements: context.publishedRequirements,
        humanOverrides: [],
      }),
    ).toEqual([]);
  });

  it("accepts real canonical evidence only when its audit fields are complete", () => {
    expect(() => validate(completedResults())).not.toThrow();
  });

  it("accepts the untouched five-attempt seed without invented timing or outcomes", () => {
    expect(validate(results())).toMatchObject({
      attempts: expect.arrayContaining([
        expect.objectContaining({ programKey: "SAN21", state: "not_started" }),
      ]),
    });
  });

  it("rejects a missing, extra, or duplicate pilot program key", () => {
    const missing = results();
    missing.attempts.pop();
    const extra = results();
    extra.attempts.push({ ...extra.attempts[0], programKey: "OTHER" });
    const duplicate = results();
    duplicate.attempts[4] = { ...duplicate.attempts[4], programKey: "SAN21" };

    for (const candidate of [missing, extra, duplicate]) {
      expect(() => validate(candidate)).toThrow(/exactly one attempt/i);
    }
  });

  it("rejects a pilot key whose fixed title, family, or stratum is changed", () => {
    const candidate = results();
    candidate.attempts[0] = {
      ...candidate.attempts[0],
      plannedStratum: "medium",
    };

    expect(() => validate(candidate)).toThrow(/metadata/i);
  });

  it("rejects state histories that skip the required in-progress transition", () => {
    const candidate = completedResults();
    candidate.attempts[0].stateTransitions = [
      {
        from: "not_started",
        to: "completed",
        at: "2026-08-08T10:00:00.000Z",
      },
    ];

    expect(() => validate(candidate)).toThrow(/transition/i);
  });

  it("rejects timestamps or phase effort on a not-started attempt", () => {
    const candidate = results();
    candidate.attempts[0] = {
      ...candidate.attempts[0],
      startedAt: "2026-08-08T09:00:00.000Z",
      phaseMinutes: { research: 1, implementation: 0, test: 0, review: 0 },
    };

    expect(() => validate(candidate)).toThrow(/not_started/i);
  });

  it("rejects negative phase minutes", () => {
    const candidate = completedResults();
    candidate.attempts[0].phaseMinutes!.research = -1;

    expect(() => validate(candidate)).toThrow(/non-negative/i);
  });

  it("requires completed attempts to carry accepted official evidence and snapshot provenance", () => {
    const missingEvidence = completedResults();
    missingEvidence.attempts[0].acceptedRelationships = [];
    const missingCoverage = completedResults();
    delete missingCoverage.attempts[0].snapshotCoverage;
    const nonOfficialSource = completedResults();
    nonOfficialSource.attempts[0].acceptedRelationships[0]!.sourceUrl =
      "https://example.com/not-official";

    for (const candidate of [
      missingEvidence,
      missingCoverage,
      nonOfficialSource,
    ]) {
      expect(() => validate(candidate)).toThrow(/completed|official|snapshot/i);
    }
  });

  it("requires coded reasons for rejected links and non-completion ambiguity", () => {
    const rejectedWithoutReason = completedResults() as unknown as {
      attempts: { rejectedRelationships: unknown[] }[];
    };
    rejectedWithoutReason.attempts[0].rejectedRelationships = [
      {
        occupationId: "occupation:cno11:5220",
        sourceUrl: "https://www.sepe.es/example",
        reviewedAt: "2026-08-08",
      },
    ];
    const deferredWithoutReason = results();
    deferredWithoutReason.attempts[0] = {
      ...deferredWithoutReason.attempts[0],
      state: "deferred",
      startedAt: "2026-08-08T09:00:00.000Z",
      completedAt: "2026-08-08T09:10:00.000Z",
      stateTransitions: [
        {
          from: "not_started",
          to: "in_progress",
          at: "2026-08-08T09:00:00.000Z",
        },
        {
          from: "in_progress",
          to: "deferred",
          at: "2026-08-08T09:10:00.000Z",
        },
      ],
      phaseMinutes: { research: 10, implementation: 0, test: 0, review: 0 },
    };

    for (const candidate of [rejectedWithoutReason, deferredWithoutReason]) {
      expect(() => validate(candidate)).toThrow(/reason/i);
    }
  });

  it("rejects unknown and contradictory occupation dispositions", () => {
    const unknownOccupation = completedResults();
    unknownOccupation.attempts[0].acceptedRelationships[0]!.occupationId =
      "occupation:cno11:9999";
    const repeatedDisposition = completedResults();
    repeatedDisposition.attempts[0].acceptedRelationships.push({
      ...repeatedDisposition.attempts[0].acceptedRelationships[0]!,
      relationshipType: "reviewed_relationship",
      reasonCode: "officially_reviewed_relationship",
    });
    const contradictoryDisposition = completedResults();
    contradictoryDisposition.attempts[0].rejectedRelationships.push({
      occupationId: "occupation:cno11:2713",
      reasonCode: "official_evidence_conflicts",
      sourceUrl:
        "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
      sourceQuote: "Analistas, programadores y diseñadores web y multimedia",
      reviewedAt: "2026-08-04",
    });

    for (const candidate of [
      unknownOccupation,
      repeatedDisposition,
      contradictoryDisposition,
    ]) {
      expect(() => validate(candidate)).toThrow(/occupation|disposition/i);
    }
  });

  it("rejects an accepted relationship whose type and reason code disagree", () => {
    const candidate = completedResults();
    candidate.attempts[0].acceptedRelationships[0]!.relationshipType =
      "reviewed_relationship";

    expect(() => validate(candidate)).toThrow(/relationship type|reason code/i);
  });

  it("rejects deceptive or placeholder-like official evidence", () => {
    const placeholderUrl = completedResults();
    placeholderUrl.attempts[0].acceptedRelationships[0]!.sourceUrl =
      "https://www.boe.es/example";
    const placeholderQuote = completedResults();
    (
      placeholderQuote.attempts[0]
        .acceptedRelationships[0] as unknown as Record<string, unknown>
    ).sourceQuote = "Example placeholder evidence.";

    for (const candidate of [placeholderUrl, placeholderQuote]) {
      expect(() => validate(candidate)).toThrow(/evidence|official|quote/i);
    }
  });

  it("rejects unknown snapshot claims, impossible elapsed effort, and future transitions", () => {
    const unknownSnapshot = completedResults();
    unknownSnapshot.attempts[0].snapshotCoverage!.snapshotId = "unknown";
    const unverifiableCount = completedResults();
    unverifiableCount.attempts[0].snapshotCoverage = {
      status: "verified",
      snapshotId: context.snapshotId,
      countingMethod: "accepted_relationship_union",
      newlyReachedOfferCount: 0,
    };
    const impossibleEffort = completedResults();
    impossibleEffort.attempts[0].phaseMinutes!.research = 61;
    const futureTransition = completedResults();
    futureTransition.attempts[0].stateTransitions[1]!.at =
      "2030-01-01T10:00:00.000Z";
    futureTransition.attempts[0].completedAt = "2030-01-01T10:00:00.000Z";

    for (const candidate of [
      unknownSnapshot,
      unverifiableCount,
      impossibleEffort,
      futureTransition,
    ]) {
      expect(() => validate(candidate)).toThrow(/snapshot|phase|future/i);
    }
  });

  it.each(["deferred", "discarded"] as const)(
    "requires a coded ambiguity reason for %s attempts",
    (state) => {
      const candidate = results();
      candidate.attempts[0] = {
        ...candidate.attempts[0],
        state,
        startedAt: "2026-08-04T09:00:00.000Z",
        completedAt: "2026-08-04T09:10:00.000Z",
        stateTransitions: [
          {
            from: "not_started",
            to: "in_progress",
            at: "2026-08-04T09:00:00.000Z",
          },
          {
            from: "in_progress",
            to: state,
            at: "2026-08-04T09:10:00.000Z",
          },
        ],
        phaseMinutes: { research: 10, implementation: 0, test: 0, review: 0 },
      };

      expect(() => validate(candidate)).toThrow(/reason/i);
    },
  );

  it("validates the checked-in seed as an executable contract", async () => {
    const seed = JSON.parse(
      await readFile(
        resolve(process.cwd(), "analysis", "fp_coverage_pilot_results.json"),
        "utf8",
      ),
    ) as unknown;

    expect(validate(seed).attempts).toHaveLength(5);
  });

  it("records all eleven SSC01M official outputs independently", async () => {
    const seed = JSON.parse(
      await readFile(
        resolve(process.cwd(), "analysis", "fp_coverage_pilot_results.json"),
        "utf8",
      ),
    ) as {
      attempts: {
        programKey: string;
        professionalOutputReviews?: { officialOutputLabel: string }[];
      }[];
    };
    const sscAttempt = seed.attempts.find(
      (attempt) => attempt.programKey === "SSC01M",
    );

    expect(sscAttempt?.professionalOutputReviews).toHaveLength(11);
    expect(
      sscAttempt?.professionalOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(SSC_OFFICIAL_OUTPUT_LABELS);
  });

  it("records all thirty-three EOC01M official outputs independently", async () => {
    const seed = JSON.parse(
      await readFile(
        resolve(process.cwd(), "analysis", "fp_coverage_pilot_results.json"),
        "utf8",
      ),
    ) as {
      attempts: {
        programKey: string;
        professionalOutputReviews?: { officialOutputLabel: string }[];
      }[];
    };
    const eocAttempt = seed.attempts.find(
      (attempt) => attempt.programKey === "EOC01M",
    );

    expect(eocAttempt?.professionalOutputReviews).toHaveLength(33);
    expect(
      eocAttempt?.professionalOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(EOC_OFFICIAL_OUTPUT_LABELS);
  });

  it("rejects an accepted EOC output without independent CNO boundary evidence", async () => {
    const candidate = await checkedInResults();
    const eocReview = candidate.attempts
      .find((attempt) => attempt.programKey === "EOC01M")!
      .professionalOutputReviews!.find(
        (review) => review.disposition === "accepted",
      )! as unknown as Record<string, unknown>;
    delete eocReview.classificationEvidence;

    expect(() => validate(candidate)).toThrow(/classification evidence/i);
  });

  it("rejects EOC top-level dispositions that contradict output-review acceptance", async () => {
    const candidate = await checkedInResults();
    const eocAttempt = candidate.attempts.find(
      (attempt) => attempt.programKey === "EOC01M",
    )!;
    const rejectedReview = eocAttempt.professionalOutputReviews!.find(
      (review) =>
        review.candidateOccupationIds.includes("occupation:cno11:3202"),
    )!;
    rejectedReview.disposition = "accepted";
    rejectedReview.acceptedOccupationIds = ["occupation:cno11:3202"];
    rejectedReview.reasonCode = "official_programme_output";
    rejectedReview.classificationEvidence =
      eocAttempt.professionalOutputReviews!.find(
        (review) => review.classificationEvidence !== undefined,
      )!.classificationEvidence;

    expect(() => validate(candidate)).toThrow(/rejected EOC01M relationship/i);
  });

  it("rejects synthetic EOC BOE output quotes", async () => {
    const candidate = await checkedInResults();
    const eocReview = candidate.attempts
      .find((attempt) => attempt.programKey === "EOC01M")!
      .professionalOutputReviews!.find(
        (review) => review.officialOutputLabel === "Albañil.",
      )!;
    eocReview.sourceQuote =
      "Las ocupaciones y puestos de trabajo más relevantes son los siguientes: Albañil.";

    expect(() => validate(candidate)).toThrow(/verbatim BOE output/i);
  });

  it("counts EOC01M marginal offers from the accepted relationship union below the family signal", () => {
    const matches = matchOffersForProgram("EOC01M", {
      programs: context.programs,
      qualifications: REVIEWED_QUALIFICATIONS,
      programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
      occupations: context.occupations,
      aliases: context.aliases,
      links: context.links,
      offers: context.offers,
      publishedRequirements: context.publishedRequirements,
      humanOverrides: [],
    });

    expect(matches).toHaveLength(0);
  });

  it("validates a completed prior attempt against its retained immutable snapshot", async () => {
    await expect(validateFpCoveragePilotResultsFile()).resolves.toMatchObject({
      attempts: expect.arrayContaining([
        expect.objectContaining({
          programKey: "SAN21",
          snapshotCoverage: expect.objectContaining({
            snapshotId: "20260808172031375-7c88ca187340",
          }),
        }),
      ]),
    });
  });
});
