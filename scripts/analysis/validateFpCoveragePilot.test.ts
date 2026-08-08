import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  validateFpCoveragePilotResults,
  type FpCoveragePilotResults,
} from "./validateFpCoveragePilot";

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
    startedAt: "2026-08-08T09:00:00.000Z",
    completedAt: "2026-08-08T10:00:00.000Z",
    stateTransitions: [
      {
        from: "not_started",
        to: "in_progress",
        at: "2026-08-08T09:00:00.000Z",
      },
      {
        from: "in_progress",
        to: "completed",
        at: "2026-08-08T10:00:00.000Z",
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
        sourceUrl: "https://www.todofp.es/example",
        reviewedAt: "2026-08-08",
      },
    ],
    snapshotCoverage: {
      snapshotId: "20260805075250485-c36a68fc066e",
      countingMethod: "accepted_relationship_union",
      newlyReachedOfferCount: 2,
    },
  };
  return candidate;
}

describe("validateFpCoveragePilotResults", () => {
  it("accepts the untouched five-attempt seed without invented timing or outcomes", () => {
    expect(validateFpCoveragePilotResults(results())).toMatchObject({
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
      expect(() => validateFpCoveragePilotResults(candidate)).toThrow(
        /exactly one attempt/i,
      );
    }
  });

  it("rejects a pilot key whose fixed title, family, or stratum is changed", () => {
    const candidate = results();
    candidate.attempts[0] = {
      ...candidate.attempts[0],
      plannedStratum: "medium",
    };

    expect(() => validateFpCoveragePilotResults(candidate)).toThrow(
      /metadata/i,
    );
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

    expect(() => validateFpCoveragePilotResults(candidate)).toThrow(
      /transition/i,
    );
  });

  it("rejects timestamps or phase effort on a not-started attempt", () => {
    const candidate = results();
    candidate.attempts[0] = {
      ...candidate.attempts[0],
      startedAt: "2026-08-08T09:00:00.000Z",
      phaseMinutes: { research: 1, implementation: 0, test: 0, review: 0 },
    };

    expect(() => validateFpCoveragePilotResults(candidate)).toThrow(
      /not_started/i,
    );
  });

  it("rejects negative phase minutes", () => {
    const candidate = completedResults();
    candidate.attempts[0].phaseMinutes!.research = -1;

    expect(() => validateFpCoveragePilotResults(candidate)).toThrow(
      /non-negative/i,
    );
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
      expect(() => validateFpCoveragePilotResults(candidate)).toThrow(
        /completed|official|snapshot/i,
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
      expect(() => validateFpCoveragePilotResults(candidate)).toThrow(
        /reason/i,
      );
    }
  });

  it("validates the checked-in seed as an executable contract", async () => {
    const seed = JSON.parse(
      await readFile(
        resolve(process.cwd(), "analysis", "fp_coverage_pilot_results.json"),
        "utf8",
      ),
    ) as unknown;

    expect(validateFpCoveragePilotResults(seed).attempts).toHaveLength(5);
  });
});
