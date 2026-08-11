import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import {
  loadFpCoveragePilotValidationContext,
  summarizeFpCoveragePilotResults,
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
const SAN_OFFICIAL_OUTPUT_LABELS = [
  "Auxiliar de Enfermería/Clínica..",
  "Auxiliar de Balnearios.",
  "Auxiliar de Atención primaria.",
  "Cuidados de enfermería a domicilio.",
  "Auxiliar Bucodental.",
  "Auxiliar Geriátrico.",
  "Auxiliar Pediátrico.",
  "Auxiliar de Esterilización.",
  "Auxiliar de Unidades Especiales.",
  "Auxiliar de Salud Mental.",
] as const;
const HOT_OFFICIAL_OUTPUT_LABELS = [
  "Cocinero.",
  "Jefe de partida.",
  "Empleado de economato de unidades de producción y servicio de alimentos y bebidas.",
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
const COM_REJECTED_OCCUPATION_IDS: readonly string[] = [
  "occupation:cno11:3510",
  "occupation:cno11:3522",
  "occupation:cno11:4121",
  "occupation:cno11:4424",
  "occupation:cno11:5220",
  "occupation:cno11:5420",
  "occupation:cno11:5500",
] as const;
const COM_REJECTED_RELATIONSHIPS = [
  {
    occupationId: "occupation:cno11:3510",
    reasonCode: "official_evidence_indirect",
    sourceUrl:
      "https://www.sepe.es/dctm/titulaciones%3A09019af4802655fa/RElTRVdFQg%3D%3D/ESTUDIO_FP_FI_23.pdf",
    sourceQuote: "3 - Agentes y representantes comerciales 28 1,92% 55,56%",
  },
  {
    occupationId: "occupation:cno11:3522",
    reasonCode: "official_evidence_conflicts",
    sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
    sourceQuote: "Técnicos en gestión de existencias y/o almacén",
  },
  {
    occupationId: "occupation:cno11:4121",
    reasonCode: "official_evidence_conflicts",
    sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
    sourceQuote: "Empleados administrativos de almacenamiento y recepción",
  },
  {
    occupationId: "occupation:cno11:4424",
    reasonCode: "official_evidence_conflicts",
    sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
    sourceQuote: "4424 Teleoperadores",
  },
  {
    occupationId: "occupation:cno11:5220",
    reasonCode: "official_evidence_indirect",
    sourceUrl:
      "https://www.sepe.es/dctm/titulaciones%3A09019af4802655fa/RElTRVdFQg%3D%3D/ESTUDIO_FP_FI_23.pdf",
    sourceQuote: "5 - Vendedores en tiendas y almacenes 177 12,11% -5,85%",
  },
  {
    occupationId: "occupation:cno11:5420",
    reasonCode: "official_evidence_indirect",
    sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
    sourceQuote: "5420 Operadores de telemarketing",
  },
  {
    occupationId: "occupation:cno11:5500",
    reasonCode: "official_evidence_indirect",
    sourceUrl:
      "https://www.sepe.es/dctm/titulaciones%3A09019af4802655fa/RElTRVdFQg%3D%3D/ESTUDIO_FP_FI_23.pdf",
    sourceQuote: "5 - Cajeros y taquilleros (excepto bancos) 31 2,12% 10,71%",
  },
] as const;
const COM_CLASSIFICATION_EVIDENCE_BY_OCCUPATION_ID = {
  "occupation:cno11:3510": "3510 Agentes y representantes comerciales",
  "occupation:cno11:3522": "3522 Agentes de compras",
  "occupation:cno11:4121":
    "4121 Empleados de control de abastecimientos e inventario",
  "occupation:cno11:4424": "4424 Teleoperadores",
  "occupation:cno11:5220": "5220 Vendedores en tiendas y almacenes",
  "occupation:cno11:5420": "5420 Operadores de telemarketing",
  "occupation:cno11:5500": "5500 Cajeros y taquilleros (excepto bancos)",
} as const;
const INE_CNO_URL =
  "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf";
const COM_OFFICIAL_OUTPUT_LABELS = [
  "Vendedor / vendedora.",
  "Representante comercial.",
  "Promotor / promotora.",
  "Televendedor / televendedora.",
  "Venta a Distancia.",
  "Teleoperador / teleoperadora (Call - Center).",
  "Información/atención al cliente.",
  "Cajera / cajero; reponedor / reponedora.",
  "Operador / operadora de contact-center.",
  "Administrador / administradora de contenidos on-line.",
  "Comerciante de tienda.",
  "Gerente de pequeño comercio.",
  "Técnica / técnico en gestión de stocks y almacén.",
  "Jefa / jefe de almacén.",
  "Responsable de recepción de mercancías.",
  "Responsable de expedición de mercancías.",
  "Técnica / técnico en logística de almacenes.",
  "Técnica / técnico de información/atención al cliente en empresas.",
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

function completedSan21Audit() {
  return SAN_OFFICIAL_OUTPUT_LABELS.map((officialOutputLabel) => ({
    officialOutputLabel,
    disposition: "accepted" as const,
    candidateOccupationIds: ["occupation:cno11:5611"],
    acceptedOccupationIds: ["occupation:cno11:5611"],
    reasonCode: "official_programme_output" as const,
    groupingExplanation:
      "This isolated validator fixture uses the approved hospital nursing-assistant CNO evidence.",
    sourceUrl:
      "https://todofp.es/dam/jcr%3Aaf5b68fd-e75c-493b-94ff-0565d3886473/san21cuidauxilenfermeria-pdf.pdf",
    sourceQuote: officialOutputLabel,
    classificationEvidence: [
      {
        occupationId: "occupation:cno11:5611",
        sourceUrl:
          "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
        sourceQuote: "5611 Auxiliares de enfermería hospitalaria",
        reviewedAt: "2026-08-08",
      },
    ],
    reviewedAt: "2026-08-08",
  }));
}

function completedResults() {
  const candidate = results();
  candidate.attempts[0] = {
    ...candidate.attempts[0],
    state: "completed",
    startedAt: "2026-08-08T15:00:00.000Z",
    completedAt: "2026-08-08T16:00:00.000Z",
    stateTransitions: [
      {
        from: "not_started",
        to: "in_progress",
        at: "2026-08-08T15:00:00.000Z",
      },
      {
        from: "in_progress",
        to: "completed",
        at: "2026-08-08T16:00:00.000Z",
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
        occupationId: "occupation:cno11:5611",
        relationshipType: "official_output",
        reasonCode: "official_programme_output",
        sourceUrl:
          "https://todofp.es/dam/jcr%3Aaf5b68fd-e75c-493b-94ff-0565d3886473/san21cuidauxilenfermeria-pdf.pdf",
        sourceQuote: "Auxiliar de Enfermería/Clínica..",
        reviewedAt: "2026-08-08",
      },
    ],
    programmeProfileEvidence: {
      todoFp: {
        sourceUrl:
          "https://todofp.es/dam/jcr%3Aaf5b68fd-e75c-493b-94ff-0565d3886473/san21cuidauxilenfermeria-pdf.pdf",
        sourceQuote: "TÉCNICO EN CUIDADOS AUXILIARES DE ENFERMERÍA",
        reviewedAt: "2026-08-08",
      },
      authoritativeOutputSource: {
        sourceUrl:
          "https://todofp.es/dam/jcr%3Aaf5b68fd-e75c-493b-94ff-0565d3886473/san21cuidauxilenfermeria-pdf.pdf",
        sourceQuote:
          "EMPLEOS QUE PUEDE DESEMPEÑAR LA PERSONA PORTADORA DE ESTE TÍTULO",
        reviewedAt: "2026-08-08",
      },
      reconciliationNote:
        "The fixture preserves the TodoFP programme and its complete ordered output audit.",
    },
    professionalOutputReviews: completedSan21Audit(),
    snapshotCoverage: {
      status: "verified",
      snapshotId: context.snapshotId,
      countingMethod: "accepted_relationship_union",
      newlyReachedOfferCount: 40,
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

function aggregationProvenance() {
  return {
    aggregatedAt: "2026-08-08T20:12:45.4737711Z",
    timingProvenance: [
      {
        programKey: "SAN21",
        reviewedCommit: "f13f8e8388a7808f3a8739e751ba7682ddba0e77",
        reviewedCommitAt: "2026-08-08T17:32:42.000Z",
        upperCompletionBoundAt: "2026-08-08T17:34:51.888Z",
      },
      {
        programKey: "HOT01M",
        reviewedCommit: "c3930e82f96953257f16e43418b362b24a1a8482",
        reviewedCommitAt: "2026-08-08T18:17:53.000Z",
        upperCompletionBoundAt: "2026-08-08T18:20:34.952Z",
      },
      {
        programKey: "SSC01M",
        reviewedCommit: "dc9758088b83c5d83df76c26a6d722254788f797",
        reviewedCommitAt: "2026-08-08T18:47:58.000Z",
        upperCompletionBoundAt: "2026-08-08T18:52:54.405Z",
      },
      {
        programKey: "EOC01M",
        reviewedCommit: "513bb5e14324e77c6042997d1adbeda0b77c58a1",
        reviewedCommitAt: "2026-08-08T19:19:33.000Z",
        upperCompletionBoundAt: "2026-08-08T19:23:34.822Z",
      },
      {
        programKey: "COM01M",
        reviewedCommit: "51af0ce7f623bbb07fdf66998624503d4da2a407",
        reviewedCommitAt: "2026-08-08T20:07:42.000Z",
        upperCompletionBoundAt: "2026-08-08T20:12:45.4737711Z",
      },
    ],
  };
}

describe("validateFpCoveragePilotResults", () => {
  it("requires verified reviewed-commit timing bounds and reports active work separately", async () => {
    const candidate = await checkedInResults();
    Object.assign(candidate, { aggregation: aggregationProvenance() });

    const results = validate(candidate);
    expect(summarizeFpCoveragePilotResults(results)).toMatchObject({
      terminalCounts: { completed: 4, deferred: 1, discarded: 0 },
      modeledActiveWorkMinutes: 68,
      marginalOffersReached: 43,
    });

    const malformed = clone(candidate);
    malformed.aggregation!.timingProvenance[0]!.reviewedCommitAt =
      "2026-08-08T17:32:41.000Z";
    expect(() => validate(malformed)).toThrow(/Git timestamp/i);

    const inflated = clone(candidate);
    inflated.aggregation!.aggregatedAt = "2026-08-08T20:13:45.4737711Z";
    inflated.aggregation!.timingProvenance[4]!.upperCompletionBoundAt =
      "2026-08-08T20:13:45.4737711Z";
    expect(() => validate(inflated)).toThrow(/aggregation start/i);

    const beforeCompletion = clone(candidate);
    beforeCompletion.attempts.find(
      (attempt) => attempt.programKey === "COM01M",
    )!.completedAt = "2026-08-08T20:07:43.000Z";
    expect(() => validate(beforeCompletion)).toThrow(/Terminal attempt/i);

    const synchronizedAfterReview = clone(candidate);
    const comAttempt = synchronizedAfterReview.attempts.find(
      (attempt) => attempt.programKey === "COM01M",
    )!;
    comAttempt.completedAt = "2026-08-08T20:07:43.000Z";
    comAttempt.stateTransitions[1]!.at = "2026-08-08T20:07:43.000Z";
    expect(() => validate(synchronizedAfterReview)).toThrow(
      /Reviewed commit timing bounds/i,
    );

    const nonLatestCommit = clone(candidate);
    nonLatestCommit.aggregation!.timingProvenance[0]!.reviewedCommit =
      "2b6557cbe8e7e050dab2e12c3efbc153d4d4f1ad";
    nonLatestCommit.aggregation!.timingProvenance[0]!.reviewedCommitAt =
      "2026-08-08T17:26:15.000Z";
    expect(() => validate(nonLatestCommit)).toThrow(/latest first-parent/i);
  });

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

  it("preserves the independently evidenced SSC01M pilot relationships with the current reviewed alias", () => {
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
    ).toEqual([
      expect.objectContaining({
        alias: "Auxiliares de ayuda a personas dependientes a domicilio",
        occupationId: "occupation:cno11:5710",
        reviewedAt: "2026-08-09",
      }),
    ]);
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
      expect(() => validate(candidate)).toThrow(
        /completed|official|snapshot|top-level accepted/i,
      );
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

  it("rejects a completion timestamp before a task-owned terminal transition", async () => {
    const candidate = await checkedInResults();
    const comAttempt = candidate.attempts.find(
      (attempt) => attempt.programKey === "COM01M",
    )!;
    comAttempt.stateTransitions[1]!.at = new Date(
      Date.parse(comAttempt.completedAt!) + 60_000,
    ).toISOString();

    expect(() => validate(candidate)).toThrow(
      /completedAt cannot predate a task-owned state transition/i,
    );
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

  it("defers COM01M without publishing an inferred CNO mapping", async () => {
    const seed = await checkedInResults();
    const comAttempt = seed.attempts.find(
      (attempt) => attempt.programKey === "COM01M",
    );
    const curatedLinks = JSON.parse(
      await readFile(
        resolve(
          process.cwd(),
          "data",
          "curated",
          "training-occupation-links.json",
        ),
        "utf8",
      ),
    ) as { trainingProgramKey: string; reviewStatus: string }[];
    const curatedAliases = JSON.parse(
      await readFile(
        resolve(process.cwd(), "data", "curated", "occupation-aliases.json"),
        "utf8",
      ),
    ) as { occupationId: string; reviewStatus: string }[];

    expect(comAttempt).toMatchObject({
      state: "deferred",
      acceptedRelationships: [],
      ambiguityReasonCodes: [
        "official_evidence_indirect",
        "multiple_official_interpretations",
      ],
    });
    expect(
      comAttempt?.rejectedRelationships.map(({ occupationId }) => occupationId),
    ).toEqual(COM_REJECTED_OCCUPATION_IDS);
    expect(
      comAttempt?.rejectedRelationships.map(
        ({ occupationId, reasonCode, sourceUrl, sourceQuote }) => ({
          occupationId,
          reasonCode,
          sourceUrl,
          sourceQuote,
        }),
      ),
    ).toEqual(COM_REJECTED_RELATIONSHIPS);
    expect(comAttempt?.snapshotCoverage).toBeUndefined();
    expect(comAttempt?.programmeProfileEvidence).toMatchObject({
      todoFp: {
        sourceUrl:
          "https://todofp.es/que-estudiar/familias-profesionales/comercio-marketing/actividades-comerciales.html",
      },
      authoritativeOutputSource: {
        sourceUrl: "https://www.boe.es/eli/es/rd/2011/11/18/1688",
      },
    });
    expect(
      comAttempt?.professionalOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(COM_OFFICIAL_OUTPUT_LABELS);
    const comReviews = comAttempt!.professionalOutputReviews!;
    expect(
      [
        ...new Set(
          comReviews.flatMap((review) => review.candidateOccupationIds),
        ),
      ].sort(),
    ).toEqual([...COM_REJECTED_OCCUPATION_IDS].sort());
    for (const review of comReviews) {
      expect(review.disposition).toBe("rejected");
      expect(review.reasonCode).toMatch(/^official_evidence_/u);
      expect(review.sourceQuote).toBe(review.officialOutputLabel);
      expect(review.classificationEvidence).toEqual(
        review.candidateOccupationIds.map((occupationId) => ({
          occupationId,
          sourceUrl: INE_CNO_URL,
          sourceQuote:
            COM_CLASSIFICATION_EVIDENCE_BY_OCCUPATION_ID[
              occupationId as keyof typeof COM_CLASSIFICATION_EVIDENCE_BY_OCCUPATION_ID
            ],
          reviewedAt: "2026-08-08",
        })),
      );
    }
    expect(
      curatedLinks.some(
        (link) =>
          link.trainingProgramKey === "COM01M" &&
          link.reviewStatus === "approved",
      ),
    ).toBe(false);
    expect(
      curatedAliases.some(
        (alias) =>
          COM_REJECTED_OCCUPATION_IDS.includes(alias.occupationId) &&
          alias.reviewStatus === "approved",
      ),
    ).toBe(false);

    const manifest = JSON.parse(
      await readFile(
        resolve(process.cwd(), "public", "data", "v1", "manifest.json"),
        "utf8",
      ),
    ) as {
      resourceSnapshots: {
        mappingCoverage: { resourcePath: string };
        trainingOccupationLinks: { resourcePath: string };
        occupationAliases: { resourcePath: string };
        occupations: { resourcePath: string };
      };
    };
    const readPublicResource = async (resourcePath: string) =>
      JSON.parse(
        await readFile(
          resolve(process.cwd(), "public", resourcePath.slice(1)),
          "utf8",
        ),
      ) as unknown[];
    const [publicLinks, publicAliases, publicCoverage] = await Promise.all([
      readPublicResource(
        manifest.resourceSnapshots.trainingOccupationLinks.resourcePath,
      ),
      readPublicResource(
        manifest.resourceSnapshots.occupationAliases.resourcePath,
      ),
      readPublicResource(
        manifest.resourceSnapshots.mappingCoverage.resourcePath,
      ),
    ]);
    expect(publicLinks).not.toContainEqual(
      expect.objectContaining({
        trainingProgramKey: "COM01M",
        reviewStatus: "approved",
      }),
    );
    expect(publicAliases).not.toContainEqual(
      expect.objectContaining({
        reviewStatus: "approved",
        occupationId: expect.stringMatching(
          /^occupation:cno11:(3510|3522|4121|4424|5220|5420|5500)$/u,
        ),
      }),
    );
    expect(publicCoverage).toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "COM01M",
        coverageStatus: "uncovered",
        approvedMappings: 0,
        draftMappings: 0,
        rejectedMappings: 0,
      }),
    );
    // Occupations are shared catalog records: a CNO rejected for COM01M may
    // still be legitimately published by another completed program.
  });

  it("requires COM01M's complete deferred output audit", async () => {
    const candidate = await checkedInResults();
    const comAttempt = candidate.attempts.find(
      (attempt) => attempt.programKey === "COM01M",
    )!;
    delete comAttempt.programmeProfileEvidence;
    delete comAttempt.professionalOutputReviews;

    expect(() => validate(candidate)).toThrow(/COM01M.*every official output/i);
  });

  it("requires exact INE classification evidence for every COM01M candidate", async () => {
    const candidate = await checkedInResults();
    const comAttempt = candidate.attempts.find(
      (attempt) => attempt.programKey === "COM01M",
    )!;
    delete comAttempt.professionalOutputReviews![0]!.classificationEvidence;

    expect(() => validate(candidate)).toThrow(
      /COM01M.*classification evidence/i,
    );
  });

  it("rejects a COM01M classification quote that is not the exact INE heading", async () => {
    const candidate = await checkedInResults();
    const comAttempt = candidate.attempts.find(
      (attempt) => attempt.programKey === "COM01M",
    )!;
    (
      comAttempt.professionalOutputReviews![0]!.classificationEvidence as {
        sourceQuote: string;
      }[]
    )[0]!.sourceQuote = "Vendedores en comercio";

    expect(() => validate(candidate)).toThrow(
      /exact INE four-digit CNO heading/i,
    );
  });

  it("requires the COM01M review-candidate union to match all seven rejections", async () => {
    const candidate = await checkedInResults();
    const cashierReview = candidate.attempts
      .find((attempt) => attempt.programKey === "COM01M")!
      .professionalOutputReviews!.find(
        (review) =>
          review.officialOutputLabel ===
          "Cajera / cajero; reponedor / reponedora.",
      )!;
    cashierReview.candidateOccupationIds = ["occupation:cno11:5220"];
    cashierReview.classificationEvidence = (
      cashierReview.classificationEvidence as {
        occupationId: string;
        sourceUrl: string;
        sourceQuote: string;
        reviewedAt: string;
      }[]
    ).filter((evidence) => evidence.occupationId === "occupation:cno11:5220");

    expect(() => validate(candidate)).toThrow(
      /exactly the seven rejected CNO candidates/i,
    );
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

  it("rejects an SSC01M professional-output quote that is not its exact canonical BOE label", async () => {
    const candidate = await checkedInResults();
    candidate.attempts.find(
      (attempt) => attempt.programKey === "SSC01M",
    )!.professionalOutputReviews![0]!.sourceQuote = "abc";

    expect(() => validate(candidate)).toThrow(
      /SSC01M professional-output reviews must preserve the exact canonical BOE quote/i,
    );
  });

  it.each([
    ["SAN21", SAN_OFFICIAL_OUTPUT_LABELS],
    ["HOT01M", HOT_OFFICIAL_OUTPUT_LABELS],
  ] as const)(
    "records each official TodoFP output for %s in exact source order",
    async (programKey, officialOutputLabels) => {
      const seed = JSON.parse(
        await readFile(
          resolve(process.cwd(), "analysis", "fp_coverage_pilot_results.json"),
          "utf8",
        ),
      ) as {
        attempts: {
          programKey: string;
          programmeProfileEvidence?: unknown;
          professionalOutputReviews?: {
            officialOutputLabel: string;
            sourceQuote: string;
          }[];
        }[];
      };
      const attempt = seed.attempts.find(
        (candidate) => candidate.programKey === programKey,
      );

      expect(attempt?.programmeProfileEvidence).toBeDefined();
      expect(
        attempt?.professionalOutputReviews?.map(
          (review) => review.officialOutputLabel,
        ),
      ).toEqual(officialOutputLabels);
      expect(
        attempt?.professionalOutputReviews?.map((review) => review.sourceQuote),
      ).toEqual(officialOutputLabels);
    },
  );

  it("rejects EOC public evidence that combines an accepted output with a rejected output", async () => {
    const candidate = await checkedInResults();
    const eocAttempt = candidate.attempts.find(
      (attempt) => attempt.programKey === "EOC01M",
    )!;
    eocAttempt.acceptedRelationships[0]!.sourceQuote =
      "– Encofrador.\n\n– Encofrador de edificación.";

    expect(() => validate(candidate)).toThrow(/accepted.*rejected.*output/i);
  });

  it("rejects a SAN21 audit that omits an official TodoFP output", async () => {
    const candidate = await checkedInResults();
    const sanAttempt = candidate.attempts.find(
      (attempt) => attempt.programKey === "SAN21",
    )!;
    sanAttempt.professionalOutputReviews!.pop();

    expect(() => validate(candidate)).toThrow(/every official TodoFP output/i);
  });

  it("rejects a HOT01M audit with TodoFP outputs reordered", async () => {
    const candidate = await checkedInResults();
    const hotAttempt = candidate.attempts.find(
      (attempt) => attempt.programKey === "HOT01M",
    )!;
    [
      hotAttempt.professionalOutputReviews![0],
      hotAttempt.professionalOutputReviews![1],
    ] = [
      hotAttempt.professionalOutputReviews![1]!,
      hotAttempt.professionalOutputReviews![0]!,
    ];

    expect(() => validate(candidate)).toThrow(/source order/i);
  });

  it("rejects a SAN21 accepted output without independent CNO classification evidence", async () => {
    const candidate = await checkedInResults();
    const review = candidate.attempts
      .find((attempt) => attempt.programKey === "SAN21")!
      .professionalOutputReviews!.find(
        (candidateReview) => candidateReview.disposition === "accepted",
      )! as unknown as Record<string, unknown>;
    delete review.classificationEvidence;

    expect(() => validate(candidate)).toThrow(/classification evidence/i);
  });

  it("rejects a SAN21 accepted review candidate that is not promoted to a top-level acceptance", async () => {
    const candidate = await checkedInResults();
    const sanAttempt = candidate.attempts.find(
      (attempt) => attempt.programKey === "SAN21",
    )!;
    sanAttempt.acceptedRelationships = sanAttempt.acceptedRelationships.filter(
      (relationship) => relationship.occupationId !== "occupation:cno11:5611",
    );

    expect(() => validate(candidate)).toThrow(
      /top-level accepted occupations must exactly equal accepted professional-output review candidates/i,
    );
  });

  it("rejects a SAN21 candidate accepted in a review but also listed as top-level rejected", async () => {
    const candidate = await checkedInResults();
    const sanAttempt = candidate.attempts.find(
      (attempt) => attempt.programKey === "SAN21",
    )!;
    sanAttempt.rejectedRelationships.push({
      ...sanAttempt.rejectedRelationships[0]!,
      occupationId: "occupation:cno11:5611",
    });

    expect(() => validate(candidate)).toThrow(
      /top-level rejected occupations must exactly equal rejected professional-output review candidates excluding accepted candidates/i,
    );
  });

  it("rejects a three-character pilot evidence quote", async () => {
    const candidate = await checkedInResults();
    candidate.attempts.find(
      (attempt) => attempt.programKey === "SAN21",
    )!.acceptedRelationships[0]!.sourceQuote = "abc";

    expect(() => validate(candidate)).toThrow(/at least 10 characters/i);
  });

  it("rejects a HOT01M output whose accepted candidates contradict its disposition", async () => {
    const candidate = await checkedInResults();
    const review = candidate.attempts
      .find((attempt) => attempt.programKey === "HOT01M")!
      .professionalOutputReviews!.find(
        (candidateReview) => candidateReview.disposition === "accepted",
      )!;
    review.candidateOccupationIds = [
      "occupation:cno11:5110",
      "occupation:cno11:3734",
    ];

    expect(() => validate(candidate)).toThrow(/every candidate.*accepted/i);
  });

  it("rejects a SAN21 output review with a synthetic rather than contiguous TodoFP quote", async () => {
    const candidate = await checkedInResults();
    const review = candidate.attempts.find(
      (attempt) => attempt.programKey === "SAN21",
    )!.professionalOutputReviews![0]!;
    review.sourceQuote =
      "EMPLEOS QUE PUEDE DESEMPEÑAR LA PERSONA PORTADORA DE ESTE TÍTULO: Auxiliar de Enfermería/Clínica..";

    expect(() => validate(candidate)).toThrow(
      /exact contiguous TodoFP output quote/i,
    );
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

  it("reports the bounded EOC01M one-word publication delta below the family signal", async () => {
    const publicationReview = JSON.parse(
      await readFile(
        resolve(
          process.cwd(),
          "analysis",
          "fp_one_word_publication_reviews.json",
        ),
        "utf8",
      ),
    ) as {
      publicationDecision: {
        encofradores: {
          status: "accepted" | "rejected";
          acceptedOfferIds: string[];
        };
      };
    };
    expect(publicationReview.publicationDecision.encofradores.status).toBe(
      "accepted",
    );
    const expectedOfferIds = [
      ...publicationReview.publicationDecision.encofradores.acceptedOfferIds,
      "1285670018399",
    ];
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

    expect(matches.map(({ offerId }) => offerId).toSorted()).toEqual(
      expectedOfferIds.toSorted(),
    );
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
