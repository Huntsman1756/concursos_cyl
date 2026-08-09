import { describe, expect, it } from "vitest";

import {
  FpExpansionAggregateSchema,
  FpExpansionAttemptSchema,
  countTerminalExpansionAttempts,
  validateExpansionAggregate,
  validateExpansionAttempt,
  validateExpansionAttemptData,
} from "./validateFpCoverageExpansion";

const evidence = {
  sourceUrl: "https://todofp.es/ficha",
  sourceQuote: "Official output and classification evidence.",
  reviewedAt: "2026-08-09",
};

const classificationEvidence = {
  sourceUrl: "https://www.ine.es/clasificaciones/cno11",
  sourceQuote: "Official output and classification evidence.",
  reviewedAt: "2026-08-09",
};

const baseAttempt = {
  schemaVersion: "1.0.0",
  programKey: "ELE01M",
  baseQualificationIdentity: "qualification:ELE01M",
  state: "completed",
  transitions: [
    { from: "not_started", to: "in_progress", at: "2026-08-09T10:00:00Z" },
    { from: "in_progress", to: "completed", at: "2026-08-09T10:45:00Z" },
  ],
  startedAt: "2026-08-09T10:00:00Z",
  completedAt: "2026-08-09T10:45:00Z",
  phaseMinutes: { research: 20, implementation: 10, test: 10, review: 0 },
  reviewerTimeExcluded: true,
  programmeProfileEvidence: {
    todoFp: evidence,
    authoritativeOutputSource: evidence,
    reconciliationNote: "The official programme output was reconciled exactly.",
  },
  officialOutputReviews: [
    {
      order: 1,
      officialOutputLabel: "Electricista.",
      disposition: "accepted",
      candidateOccupationIds: ["occupation:cno11:7521"],
      acceptedOccupationIds: ["occupation:cno11:7521"],
      sourceQuote: "Electricista.",
      sourceUrl: evidence.sourceUrl,
      classificationEvidence: [
        { occupationId: "occupation:cno11:7521", ...classificationEvidence },
      ],
      reason: "Exact official occupation boundary.",
    },
  ],
  acceptedRelations: [
    {
      kind: "link",
      programKey: "ELE01M",
      occupationId: "occupation:cno11:7521",
      ...evidence,
      sourceQuote: "Electricista.",
    },
  ],
  rejectedRelations: [],
  baselineMatchIds: [],
  currentMatchIds: ["offer-1"],
  newlyReachedOfferIdsByProgram: { ELE01M: ["offer-1"] },
  newlyReachedOfferUnionIds: ["offer-1"],
  limitation: "No material limitation.",
  reviewedCommit: "0123456789abcdef0123456789abcdef01234567",
  reviewedCommitAt: "2026-08-09T10:50:00Z",
  snapshotId: "snapshot-test-1",
  snapshotHash:
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  publicParity: {
    publishedRelationKeys: ["ELE01M|occupation:cno11:7521"],
    rejectedRelationKeys: [],
  },
};

const candidate = {
  rank: 1,
  programKey: "ELE01M",
  baseQualificationIdentity: "qualification:ELE01M",
  programTitle: "Electricidad",
  familyCode: "ELE",
  family: "Electricidad",
  level: "intermediate",
  familySignalCount: 1,
  exactTitleSignalCount: 1,
  officialOutputLabels: ["Electricista."],
  sourceUrls: ["https://todofp.es/ficha", "https://boe.es/ficha"],
  classificationCandidates: ["occupation:cno11:7521"],
  collisionCount: 0,
  sourceReadiness: "exact_output_plus_cno",
  selectionReason: "test",
  scoreTuple: [1, 0, -1, -1, "ELE01M"],
};

function validRanking() {
  const candidates = Array.from({ length: 14 }, (_, index) => {
    const isPrimary = index === 0;
    const key = isPrimary ? "ELE01M" : `ZZ${String(index).padStart(2, "0")}M`;
    return {
      ...candidate,
      rank: index + 1,
      programKey: key,
      baseQualificationIdentity: `qualification:${key}`,
      programTitle: "Candidate",
      familyCode: "ZZ",
      family: "Family",
      level: "intermediate",
      familySignalCount: 1,
      exactTitleSignalCount: 1,
      officialOutputLabels: ["Output"],
      sourceUrls: ["https://todofp.es/ficha", "https://boe.es/ficha"],
      classificationCandidates: ["occupation:cno11:7521"],
      collisionCount: 0,
      sourceReadiness: "output_only",
      selectionReason: "test",
      scoreTuple: [1, 0, -1, -1, key],
    };
  });
  return {
    primaryCandidates: candidates.slice(0, 7),
    reserveCandidates: candidates.slice(7),
  };
}

function validInput(
  overrides: Record<string, unknown> = {},
  computedOverrides: Record<string, unknown> = {},
  candidateOverrides: Record<string, unknown> = {},
) {
  return {
    attempt: { ...baseAttempt, ...overrides },
    candidate: { ...candidate, ...candidateOverrides },
    computed: {
      baselineMatchIds: [],
      currentMatchIds: ["offer-1"],
      newlyReachedOfferIdsByProgram: { ELE01M: ["offer-1"] },
      newlyReachedOfferUnionIds: ["offer-1"],
      snapshotId: baseAttempt.snapshotId,
      snapshotHash: baseAttempt.snapshotHash,
      ...computedOverrides,
    },
    publicRelationSet: {
      manifestAddressed: true,
      relationKeys: ["ELE01M|occupation:cno11:7521"],
      resourcePaths: ["/data/v1/manifest.json"],
    },
    reviewedCommitAt: baseAttempt.reviewedCommitAt,
  };
}

describe("validateFpCoverageExpansion", () => {
  it("accepts a completed attempt with exact deterministic parity", () => {
    expect(validateExpansionAttemptData(validInput())).toMatchObject({
      programKey: "ELE01M",
      state: "completed",
    });
  });

  it("accepts a multi-word alias with exact output and classification evidence", () => {
    const alias = "electricista industrial";
    const relationKey = `ELE01M|occupation:cno11:7521|${alias}`;
    expect(
      validateExpansionAttemptData({
        ...validInput({
          acceptedRelations: [
            {
              ...baseAttempt.acceptedRelations[0],
              kind: "alias",
              alias,
              sourceQuote: "Electricista industrial.",
            },
          ],
          officialOutputReviews: [
            {
              ...baseAttempt.officialOutputReviews[0],
              officialOutputLabel: "Electricista industrial.",
              sourceQuote: "Electricista industrial.",
              classificationEvidence: [
                {
                  ...baseAttempt.officialOutputReviews[0]
                    .classificationEvidence[0],
                  sourceQuote: "Electricista industrial.",
                },
              ],
            },
          ],
          publicParity: {
            publishedRelationKeys: [relationKey],
            rejectedRelationKeys: [],
          },
        }),
        publicRelationSet: {
          manifestAddressed: true,
          relationKeys: [relationKey],
          resourcePaths: ["/data/v1/manifest.json"],
        },
        matchedAliasKeys: [relationKey],
        candidate: {
          ...candidate,
          officialOutputLabels: ["Electricista industrial."],
        },
      }),
    ).toMatchObject({
      acceptedRelations: [{ alias }],
      publicParity: { publishedRelationKeys: [relationKey] },
    });
  });

  it("allows exhaustive official outputs beyond the ranking seed labels", () => {
    const rejectedOccupationId = "occupation:cno11:7522";
    const rejectedKey = `ELE01M|${rejectedOccupationId}`;
    const extraOutput = {
      order: 2,
      officialOutputLabel: "Otra salida.",
      disposition: "rejected" as const,
      candidateOccupationIds: [rejectedOccupationId],
      sourceQuote: "Otra salida.",
      sourceUrl: "https://boe.es/ficha",
      reason: "The reviewed boundary does not support this relation.",
    };
    expect(
      validateExpansionAttemptData(
        validInput({
          officialOutputReviews: [
            ...baseAttempt.officialOutputReviews,
            extraOutput,
          ],
          rejectedRelations: [
            {
              kind: "link" as const,
              programKey: "ELE01M",
              occupationId: rejectedOccupationId,
              sourceUrl: extraOutput.sourceUrl,
              sourceQuote: extraOutput.sourceQuote,
              reviewedAt: "2026-08-09",
            },
          ],
          publicParity: {
            publishedRelationKeys: ["ELE01M|occupation:cno11:7521"],
            rejectedRelationKeys: [rejectedKey],
          },
        }),
      ),
    ).toMatchObject({
      officialOutputReviews: [
        { officialOutputLabel: "Electricista." },
        { officialOutputLabel: "Otra salida." },
      ],
    });
  });

  it("matches frozen output seeds across punctuation and official gender variants", () => {
    expect(
      validateExpansionAttemptData(
        validInput(
          {
            officialOutputReviews: [
              {
                ...baseAttempt.officialOutputReviews[0],
                officialOutputLabel: "Vendedor/a de productos alimentarios.",
                sourceQuote: "Vendedor/a de productos alimentarios.",
              },
            ],
            acceptedRelations: [
              {
                ...baseAttempt.acceptedRelations[0],
                sourceQuote: "Vendedor/a de productos alimentarios.",
              },
            ],
          },
          {},
          { officialOutputLabels: ["Vendedor de productos alimentarios"] },
        ),
      ),
    ).toMatchObject({
      officialOutputReviews: [
        { officialOutputLabel: "Vendedor/a de productos alimentarios." },
      ],
    });
    expect(
      validateExpansionAttemptData(
        validInput(
          {
            officialOutputReviews: [
              {
                ...baseAttempt.officialOutputReviews[0],
                officialOutputLabel: "Técnico/a de ejemplo.",
                sourceQuote: "Técnico/a de ejemplo.",
              },
            ],
            acceptedRelations: [
              {
                ...baseAttempt.acceptedRelations[0],
                sourceQuote: "Técnico/a de ejemplo.",
              },
            ],
          },
          {},
          { officialOutputLabels: ["Técnico de ejemplo"] },
        ),
      ),
    ).toMatchObject({
      officialOutputReviews: [{ officialOutputLabel: "Técnico/a de ejemplo." }],
    });
    expect(() =>
      validateExpansionAttemptData(
        validInput(
          {
            officialOutputReviews: [
              {
                ...baseAttempt.officialOutputReviews[0],
                officialOutputLabel: "Teórico/práctico de ejemplo.",
                sourceQuote: "Teórico/práctico de ejemplo.",
              },
            ],
            acceptedRelations: [
              {
                ...baseAttempt.acceptedRelations[0],
                sourceQuote: "Teórico/práctico de ejemplo.",
              },
            ],
          },
          {},
          { officialOutputLabels: ["Teórico de ejemplo"] },
        ),
      ),
    ).toThrow(/seed|output/i);
    expect(
      validateExpansionAttemptData(
        validInput(
          {
            officialOutputReviews: [
              {
                ...baseAttempt.officialOutputReviews[0],
                officialOutputLabel:
                  "Vendedora/vendedor de productos alimentarios.",
                sourceQuote: "Vendedora/vendedor de productos alimentarios.",
              },
            ],
            acceptedRelations: [
              {
                ...baseAttempt.acceptedRelations[0],
                sourceQuote: "Vendedora/vendedor de productos alimentarios.",
              },
            ],
          },
          {},
          { officialOutputLabels: ["Vendedor de productos alimentarios"] },
        ),
      ),
    ).toMatchObject({
      officialOutputReviews: [
        {
          officialOutputLabel: "Vendedora/vendedor de productos alimentarios.",
        },
      ],
    });
  });

  it("accepts classification evidence as relation provenance", () => {
    const classificationSourceUrl = classificationEvidence.sourceUrl;
    const classificationSourceQuote = classificationEvidence.sourceQuote;
    expect(
      validateExpansionAttemptData(
        validInput({
          acceptedRelations: [
            {
              ...baseAttempt.acceptedRelations[0],
              sourceUrl: classificationSourceUrl,
              sourceQuote: classificationSourceQuote,
            },
          ],
        }),
      ),
    ).toMatchObject({
      acceptedRelations: [
        {
          sourceUrl: classificationSourceUrl,
          sourceQuote: classificationSourceQuote,
        },
      ],
    });
  });

  it("uses the injected matcher for accepted multi-word aliases", async () => {
    const alias = "electricista industrial";
    const relationKey = `ELE01M|occupation:cno11:7521|${alias}`;
    const attempt = {
      ...baseAttempt,
      acceptedRelations: [
        {
          ...baseAttempt.acceptedRelations[0],
          kind: "alias",
          alias,
          sourceQuote: "Electricista industrial.",
        },
      ],
      officialOutputReviews: [
        {
          ...baseAttempt.officialOutputReviews[0],
          officialOutputLabel: "Electricista industrial.",
          sourceQuote: "Electricista industrial.",
          classificationEvidence: [
            {
              ...baseAttempt.officialOutputReviews[0].classificationEvidence[0],
              sourceQuote: "Electricista industrial.",
            },
          ],
        },
      ],
      publicParity: {
        publishedRelationKeys: [relationKey],
        rejectedRelationKeys: [],
      },
    };
    const ranking = validRanking();
    ranking.primaryCandidates[0] = {
      ...candidate,
      officialOutputLabels: ["Electricista industrial."],
    };
    const sharedDependencies = {
      loadRanking: async () => ranking,
      loadAttempt: async () => attempt,
      compute: async () => ({
        baselineMatchIds: [],
        currentMatchIds: ["offer-1"],
        newlyReachedOfferIdsByProgram: { ELE01M: ["offer-1"] },
        newlyReachedOfferUnionIds: ["offer-1"],
        snapshotId: baseAttempt.snapshotId,
        snapshotHash: baseAttempt.snapshotHash,
      }),
      publicRelationSet: async () => ({
        manifestAddressed: true as const,
        relationKeys: [relationKey],
        resourcePaths: ["/data/v1/manifest.json"],
      }),
      loadReviewedCommitAt: async () => baseAttempt.reviewedCommitAt,
    };
    await expect(
      validateExpansionAttempt("/tmp", "ELE01M", {
        ...sharedDependencies,
        matchAlias: async (_root, candidateRelation) =>
          candidateRelation.alias === alias,
      }),
    ).resolves.toMatchObject({ acceptedRelations: [{ alias }] });
    await expect(
      validateExpansionAttempt("/tmp", "ELE01M", {
        ...sharedDependencies,
        matchAlias: async () => false,
      }),
    ).rejects.toThrow(/matcher/i);
  });

  it("rejects a matchPolicy on a multi-word alias", () => {
    expect(() =>
      validateExpansionAttemptData(
        validInput({
          acceptedRelations: [
            {
              ...baseAttempt.acceptedRelations[0],
              kind: "alias",
              alias: "electricista industrial",
              sourceQuote: "Electricista industrial.",
              matchPolicy: "approved_single_token",
            },
          ],
        }),
      ),
    ).toThrow(/multi.word|strict|one.word policy/i);
  });

  it("applies alias policy to rejected relations as well", () => {
    expect(() =>
      validateExpansionAttemptData(
        validInput({
          rejectedRelations: [
            {
              kind: "alias",
              programKey: "ELE01M",
              occupationId: "occupation:cno11:7522",
              alias: "electricista",
              ...evidence,
              sourceQuote: "Electricista.",
            },
          ],
        }),
      ),
    ).toThrow(/one.word|policy/i);
  });

  it("requires the frozen candidate schema, exact output labels, and no passthrough fields", () => {
    expect(() =>
      validateExpansionAttemptData({
        ...validInput(),
        candidate: {
          rank: 1,
          programKey: "ELE01M",
          baseQualificationIdentity: "qualification:ELE01M",
        },
      }),
    ).toThrow(/required|invalid|output/i);
    expect(() =>
      validateExpansionAttemptData({
        ...validInput(),
        candidate: { ...candidate, unexpected: true },
      }),
    ).toThrow(/unrecognized|unknown|invalid/i);
    const withoutLabels: Record<string, unknown> = { ...candidate };
    delete withoutLabels.officialOutputLabels;
    expect(() =>
      validateExpansionAttemptData({
        ...validInput(),
        candidate: withoutLabels,
      }),
    ).toThrow(/required|invalid|output/i);
  });

  it("requires exact relation evidence pairs and a complete manifest-addressed set", () => {
    expect(() =>
      validateExpansionAttemptData({
        ...validInput(),
        attempt: {
          ...baseAttempt,
          acceptedRelations: [
            {
              ...baseAttempt.acceptedRelations[0],
              sourceQuote: "Nearby wording.",
            },
          ],
        },
      }),
    ).toThrow(/evidence|exact|output|classification/i);
    expect(() =>
      validateExpansionAttemptData({
        ...validInput(),
        publicRelationSet: {
          manifestAddressed: true,
          relationKeys: ["ELE01M|occupation:cno11:7521"],
          resourcePaths: [],
        },
      }),
    ).toThrow(/resource|empty|manifest/i);
  });

  it("rejects an occupation accepted in one output and rejected in another", () => {
    expect(() =>
      validateExpansionAttemptData({
        ...validInput(),
        attempt: {
          ...baseAttempt,
          officialOutputReviews: [
            ...baseAttempt.officialOutputReviews,
            {
              order: 2,
              officialOutputLabel: "Otra salida.",
              disposition: "rejected",
              candidateOccupationIds: ["occupation:cno11:7521"],
              sourceUrl: "https://boe.es/ficha",
              sourceQuote: "Otra salida.",
              reason: "Contradictory candidate.",
            },
          ],
        },
        candidate: {
          ...candidate,
          officialOutputLabels: ["Electricista.", "Otra salida."],
        },
      }),
    ).toThrow(/accepted|rejected|contradict/i);
  });

  it("accepts not-started and in-progress attempts without terminal fields", () => {
    expect(
      FpExpansionAttemptSchema.parse({
        schemaVersion: "1.0.0",
        programKey: "ELE01M",
        baseQualificationIdentity: "qualification:ELE01M",
        state: "not_started",
        transitions: [],
        startedAt: null,
        completedAt: null,
        phaseMinutes: { research: 0, implementation: 0, test: 0, review: 0 },
        reviewerTimeExcluded: true,
      }),
    ).toMatchObject({ state: "not_started" });
    expect(
      FpExpansionAttemptSchema.parse({
        schemaVersion: "1.0.0",
        programKey: "ELE01M",
        baseQualificationIdentity: "qualification:ELE01M",
        state: "in_progress",
        transitions: [baseAttempt.transitions[0]],
        startedAt: baseAttempt.startedAt,
        completedAt: null,
        phaseMinutes: { research: 5, implementation: 0, test: 0, review: 0 },
        reviewerTimeExcluded: true,
      }),
    ).toMatchObject({ state: "in_progress" });
  });

  it("requires terminal fields for terminal states", () => {
    expect(() =>
      FpExpansionAttemptSchema.parse({
        schemaVersion: "1.0.0",
        programKey: "ELE01M",
        baseQualificationIdentity: "qualification:ELE01M",
        state: "completed",
        transitions: baseAttempt.transitions,
        startedAt: baseAttempt.startedAt,
        completedAt: baseAttempt.completedAt,
        phaseMinutes: baseAttempt.phaseMinutes,
        reviewerTimeExcluded: true,
      }),
    ).toThrow(/terminal|official|reviewed/i);
  });

  it("requires completedAt for terminal schema records", () => {
    expect(() =>
      FpExpansionAttemptSchema.parse({
        ...baseAttempt,
        completedAt: null,
      }),
    ).toThrow(/completedAt|terminal/i);
  });

  it("enforces the only legal state path", () => {
    expect(() =>
      FpExpansionAttemptSchema.parse({
        ...baseAttempt,
        transitions: [
          { from: "not_started", to: "completed", at: "2026-08-09T10:00:00Z" },
        ],
      }),
    ).toThrow(/state transition/i);
  });

  it.each([
    [
      "missing official output",
      { officialOutputReviews: [] },
      /official output/i,
    ],
    [
      "fake quote or domain",
      {
        officialOutputReviews: [
          {
            ...baseAttempt.officialOutputReviews[0],
            sourceUrl: "https://example.invalid/fake",
            sourceQuote: "Invented evidence.",
          },
        ],
      },
      /authoritative|quote/i,
    ],
    [
      "contradictory IDs",
      {
        rejectedRelations: [
          {
            kind: "link",
            programKey: "ELE01M",
            occupationId: "occupation:cno11:7521",
            ...evidence,
          },
        ],
      },
      /contradict/i,
    ],
    [
      "broadened alias",
      {
        acceptedRelations: [
          {
            ...baseAttempt.acceptedRelations[0],
            kind: "alias",
            alias: "técnico",
          },
        ],
      },
      /broad|alias/i,
    ],
    [
      "one-word alias without policy",
      {
        acceptedRelations: [
          {
            ...baseAttempt.acceptedRelations[0],
            kind: "alias",
            alias: "electricista",
          },
        ],
      },
      /one.word|policy/i,
    ],
    ["stale snapshot or hash", { snapshotId: "stale" }, /snapshot|hash/i],
    [
      "missing snapshot provenance",
      { snapshotId: undefined, snapshotHash: undefined },
      /snapshot|hash/i,
    ],
    ["incomplete timing", { completedAt: null }, /completedAt|timing/i],
    ["altered match ID", { currentMatchIds: ["offer-fake"] }, /delta|match/i],
    [
      "overlong modeled work",
      {
        phaseMinutes: { research: 20, implementation: 20, test: 20, review: 1 },
      },
      /60|phase/i,
    ],
    [
      "misaligned transition timestamp",
      {
        transitions: [
          {
            from: "not_started",
            to: "in_progress",
            at: "2026-08-09T10:01:00Z",
          },
          baseAttempt.transitions[1],
        ],
      },
      /transition|startedAt|chronological/i,
    ],
    [
      "missing classification evidence",
      {
        officialOutputReviews: [
          {
            ...baseAttempt.officialOutputReviews[0],
            classificationEvidence: [],
          },
        ],
      },
      /classification/i,
    ],
    [
      "fake classification authority",
      {
        officialOutputReviews: [
          {
            ...baseAttempt.officialOutputReviews[0],
            classificationEvidence: [
              { occupationId: "occupation:cno11:7521", ...evidence },
            ],
          },
        ],
      },
      /authoritative|classification/i,
    ],
    [
      "mismatched classification occupation",
      {
        officialOutputReviews: [
          {
            ...baseAttempt.officialOutputReviews[0],
            classificationEvidence: [
              {
                occupationId: "occupation:cno11:7111",
                ...classificationEvidence,
              },
            ],
          },
        ],
      },
      /classification|occupation/i,
    ],
    [
      "wrong relation program",
      {
        acceptedRelations: [
          { ...baseAttempt.acceptedRelations[0], programKey: "EOC01M" },
        ],
      },
      /program/i,
    ],
    [
      "unrelated accepted occupation",
      {
        acceptedRelations: [
          {
            ...baseAttempt.acceptedRelations[0],
            occupationId: "occupation:cno11:7111",
          },
        ],
      },
      /accepted|occupation|classification/i,
    ],
    [
      "wrong bounded single token policy tuple",
      {
        acceptedRelations: [
          {
            ...baseAttempt.acceptedRelations[0],
            kind: "alias",
            alias: "encofradores",
            occupationId: "occupation:cno11:7521",
            sourceQuote: "Encofradores.",
            matchPolicy: "approved_single_token",
          },
        ],
      },
      /single.token|tuple|EOC01M/i,
    ],
    [
      "duplicate stored IDs",
      { currentMatchIds: ["offer-1", "offer-1"] },
      /sorted|unique|duplicate/i,
    ],
    [
      "unsorted stored IDs",
      { currentMatchIds: ["offer-2", "offer-1"] },
      /sorted|canonical|match/i,
    ],
  ] as const)("rejects %s", (_label, overrides, error) => {
    expect(() =>
      validateExpansionAttemptData(
        validInput(
          overrides,
          "snapshotId" in overrides ? { snapshotId: "fresh" } : {},
        ),
      ),
    ).toThrow(error);
  });

  it("rejects modality double counting and public leaks", () => {
    expect(() =>
      validateExpansionAttemptData({
        ...validInput({ baseQualificationIdentity: "qualification:ELE01MD" }),
        candidate: {
          ...candidate,
          baseQualificationIdentity: "qualification:ELE01M",
        },
      }),
    ).toThrow(/base|modality/i);
    expect(() =>
      validateExpansionAttemptData({
        ...validInput(),
        publicRelationSet: {
          manifestAddressed: true,
          relationKeys: [],
          resourcePaths: ["/data/v1/manifest.json"],
        },
      }),
    ).toThrow(/public|parity/i);
  });

  it("requires exact rejected public parity", () => {
    expect(() =>
      validateExpansionAttemptData(
        validInput({
          rejectedRelations: [
            {
              kind: "link",
              programKey: "ELE01M",
              occupationId: "occupation:cno11:7522",
              ...evidence,
            },
          ],
          publicParity: {
            publishedRelationKeys: ["ELE01M|occupation:cno11:7521"],
            rejectedRelationKeys: [],
          },
        }),
      ),
    ).toThrow(/rejected|parity/i);
  });

  it("requires the full injected public relation set to equal accepted relations", () => {
    expect(() =>
      validateExpansionAttemptData({
        ...validInput(),
        publicRelationSet: {
          manifestAddressed: true,
          relationKeys: [
            "ELE01M|occupation:cno11:7521",
            "ELE01M|occupation:cno11:7522",
          ],
          resourcePaths: ["/data/v1/manifest.json"],
        },
      }),
    ).toThrow(/public|parity/i);
    expect(() =>
      validateExpansionAttemptData({
        ...validInput(),
        publicRelationSet: {
          manifestAddressed: true,
          relationKeys: [],
          resourcePaths: ["/data/v1/manifest.json"],
        },
      }),
    ).toThrow(/public|parity/i);
  });

  it("unions injected reviewed bases with the mandatory defaults", () => {
    for (const baseQualificationIdentity of [
      "qualification:SAN21",
      "qualification:IFC03S",
      "qualification:HOT01M",
      "qualification:SSC01M",
      "qualification:EOC01M",
    ]) {
      expect(() =>
        validateExpansionAttemptData(
          validInput(
            { baseQualificationIdentity },
            {},
            { baseQualificationIdentity },
          ),
        ),
      ).toThrow(/reviewed|base/i);
    }
  });

  it("requires exact output-to-relation disposition correspondence", () => {
    expect(() =>
      validateExpansionAttemptData(validInput({ acceptedRelations: [] })),
    ).toThrow(/accepted|output|relation/i);
    expect(() =>
      validateExpansionAttemptData(
        validInput({
          rejectedRelations: [
            {
              kind: "link",
              programKey: "ELE01M",
              occupationId: "occupation:cno11:7522",
              ...evidence,
            },
          ],
        }),
      ),
    ).toThrow(/rejected|output|relation/i);
  });

  it("rejects unsorted recomputed delta maps instead of normalizing them", () => {
    expect(() =>
      validateExpansionAttemptData(
        validInput(
          {},
          {
            newlyReachedOfferIdsByProgram: { ELE01M: ["offer-2", "offer-1"] },
          },
        ),
      ),
    ).toThrow(/sorted|unique|delta/i);
    expect(() =>
      validateExpansionAttemptData(
        validInput(
          {
            newlyReachedOfferIdsByProgram: { ELE01M: ["offer-2", "offer-1"] },
            newlyReachedOfferUnionIds: ["offer-1", "offer-2"],
            currentMatchIds: ["offer-1", "offer-2"],
          },
          {
            newlyReachedOfferIdsByProgram: { ELE01M: ["offer-1", "offer-2"] },
            currentMatchIds: ["offer-1", "offer-2"],
            newlyReachedOfferUnionIds: ["offer-1", "offer-2"],
          },
        ),
      ),
    ).toThrow(/sorted|unique|delta/i);
  });

  it("requires the reviewed commit timestamp to match the injected git timestamp", () => {
    expect(() =>
      validateExpansionAttemptData({
        ...validInput(),
        reviewedCommitAt: "2026-08-09T10:51:00Z",
      }),
    ).toThrow(/commit|timestamp|provenance/i);
  });

  it.each(["not_started", "in_progress"] as const)(
    "validates %s attempts without invoking terminal dependencies",
    async (state) => {
      const attempt =
        state === "not_started"
          ? {
              ...baseAttempt,
              state,
              transitions: [],
              startedAt: null,
              completedAt: null,
              publicParity: undefined,
              newlyReachedOfferIdsByProgram: undefined,
              newlyReachedOfferUnionIds: undefined,
              phaseMinutes: {
                research: 0,
                implementation: 0,
                test: 0,
                review: 0,
              },
            }
          : {
              ...baseAttempt,
              state,
              transitions: [baseAttempt.transitions[0]],
              completedAt: null,
              publicParity: undefined,
              newlyReachedOfferIdsByProgram: undefined,
              newlyReachedOfferUnionIds: undefined,
              phaseMinutes: {
                research: 5,
                implementation: 0,
                test: 0,
                review: 0,
              },
            };
      const throwingDependency = () => {
        throw new Error("terminal dependency invoked");
      };

      await expect(
        validateExpansionAttempt("/tmp", "ELE01M", {
          loadRanking: async () => validRanking(),
          loadAttempt: async () => attempt,
          compute: throwingDependency,
          publicRelationSet: throwingDependency,
          loadApprovedSingleTokenAuditKeys: throwingDependency,
          loadReviewedCommitAt: throwingDependency,
        }),
      ).resolves.toMatchObject({ state });
    },
  );

  it("rejects a reviewed or stale candidate through the API", async () => {
    await expect(
      validateExpansionAttempt("/tmp", "ELE01M", {
        loadRanking: async () => ({
          primaryCandidates: [
            {
              ...candidate,
              baseQualificationIdentity: "qualification:IFC03SD",
              programKey: "ELE01M",
              programTitle: "Electricidad",
              familyCode: "ELE",
              family: "Electricidad",
              level: "intermediate",
              familySignalCount: 1,
              exactTitleSignalCount: 1,
              officialOutputLabels: ["Electricista."],
              sourceUrls: ["https://todofp.es/ficha", "https://boe.es/ficha"],
              classificationCandidates: ["occupation:cno11:7521"],
              collisionCount: 0,
              sourceReadiness: "output_only",
              selectionReason: "test",
              scoreTuple: [1, 0, -1, -1, "ELE01M"],
              rank: 1,
            },
            ...Array.from({ length: 6 }, (_, index) => ({
              ...candidate,
              rank: index + 2,
              programKey: `ZZ${String(index).padStart(2, "0")}M`,
              baseQualificationIdentity: `qualification:ZZ${String(index).padStart(2, "0")}M`,
              programTitle: "Candidate",
              familyCode: "ZZ",
              family: "Family",
              level: "intermediate",
              familySignalCount: 1,
              exactTitleSignalCount: 1,
              officialOutputLabels: ["Output"],
              sourceUrls: ["https://todofp.es/ficha", "https://boe.es/ficha"],
              classificationCandidates: ["occupation:cno11:7521"],
              collisionCount: 0,
              sourceReadiness: "output_only",
              selectionReason: "test",
              scoreTuple: [
                1,
                0,
                -1,
                -1,
                `ZZ${String(index).padStart(2, "0")}M`,
              ],
            })),
          ],
          reserveCandidates: Array.from({ length: 7 }, (_, index) => ({
            ...candidate,
            rank: index + 8,
            programKey: `RR${String(index).padStart(2, "0")}M`,
            baseQualificationIdentity: `qualification:RR${String(index).padStart(2, "0")}M`,
            programTitle: "Reserve",
            familyCode: "RR",
            family: "Reserve",
            level: "intermediate",
            familySignalCount: 1,
            exactTitleSignalCount: 1,
            officialOutputLabels: ["Output"],
            sourceUrls: ["https://todofp.es/ficha", "https://boe.es/ficha"],
            classificationCandidates: ["occupation:cno11:7521"],
            collisionCount: 0,
            sourceReadiness: "output_only",
            selectionReason: "test",
            scoreTuple: [1, 0, -1, -1, `RR${String(index).padStart(2, "0")}M`],
          })),
        }),
        loadAttempt: async () => ({
          ...baseAttempt,
          baseQualificationIdentity: "qualification:IFC03SD",
        }),
        compute: async () => ({
          baselineMatchIds: [],
          currentMatchIds: ["offer-1"],
          newlyReachedOfferIdsByProgram: { ELE01M: ["offer-1"] },
          newlyReachedOfferUnionIds: ["offer-1"],
        }),
        publicRelationSet: async () => ({
          manifestAddressed: true,
          relationKeys: ["ELE01M|occupation:cno11:7521"],
          resourcePaths: ["/data/v1/manifest.json"],
        }),
        loadReviewedCommitAt: async () => baseAttempt.reviewedCommitAt,
      }),
    ).rejects.toThrow(/reviewed|base/i);
  });

  it("uses the exact default reviewed bases and leaves COM01M eligible", () => {
    for (const baseQualificationIdentity of [
      "qualification:SAN21",
      "qualification:IFC03SD",
    ]) {
      expect(() =>
        validateExpansionAttemptData(
          validInput(
            { baseQualificationIdentity },
            {},
            { baseQualificationIdentity },
          ),
        ),
      ).toThrow(/reviewed|base/i);
    }

    const comAttempt = {
      ...baseAttempt,
      programKey: "COM01M",
      baseQualificationIdentity: "qualification:COM01M",
      acceptedRelations: [
        { ...baseAttempt.acceptedRelations[0], programKey: "COM01M" },
      ],
      publicParity: {
        publishedRelationKeys: ["COM01M|occupation:cno11:7521"],
        rejectedRelationKeys: [],
      },
      newlyReachedOfferIdsByProgram: { COM01M: ["offer-1"] },
    };
    expect(
      validateExpansionAttemptData({
        attempt: comAttempt,
        candidate: {
          ...candidate,
          programKey: "COM01M",
          baseQualificationIdentity: "qualification:COM01M",
        },
        computed: {
          baselineMatchIds: [],
          currentMatchIds: ["offer-1"],
          newlyReachedOfferIdsByProgram: { COM01M: ["offer-1"] },
          newlyReachedOfferUnionIds: ["offer-1"],
          snapshotId: baseAttempt.snapshotId,
          snapshotHash: baseAttempt.snapshotHash,
        },
        publicRelationSet: {
          manifestAddressed: true,
          relationKeys: ["COM01M|occupation:cno11:7521"],
          resourcePaths: ["/data/v1/manifest.json"],
        },
      }),
    ).toMatchObject({ programKey: "COM01M" });
  });

  it("counts terminal attempts without trusting declared counts", () => {
    expect(
      countTerminalExpansionAttempts([
        { ...baseAttempt, state: "completed" },
        {
          ...baseAttempt,
          programKey: "ELE02M",
          state: "deferred",
          transitions: [
            baseAttempt.transitions[0],
            { from: "in_progress", to: "deferred", at: "2026-08-09T10:45:00Z" },
          ],
        },
        {
          ...baseAttempt,
          programKey: "ELE03M",
          state: "discarded",
          transitions: [
            baseAttempt.transitions[0],
            {
              from: "in_progress",
              to: "discarded",
              at: "2026-08-09T10:45:00Z",
            },
          ],
          publicParity: { publishedRelationKeys: [], rejectedRelationKeys: [] },
          newlyReachedOfferIdsByProgram: {},
          newlyReachedOfferUnionIds: [],
          currentMatchIds: [],
        },
      ]),
    ).toEqual({ completed: 1, deferred: 1, discarded: 1, terminal: 3 });
  });

  it("requires terminal aggregate inputs and counts each state", () => {
    expect(() =>
      validateExpansionAggregate([
        {
          ...baseAttempt,
          state: "in_progress",
          completedAt: null,
          transitions: [baseAttempt.transitions[0]],
        },
      ]),
    ).toThrow(/terminal/i);
    expect(
      validateExpansionAggregate([
        baseAttempt,
        {
          ...baseAttempt,
          programKey: "ELE02M",
          baseQualificationIdentity: "qualification:ELE02M",
          transitions: [
            { ...baseAttempt.transitions[0] },
            {
              from: "in_progress",
              to: "deferred",
              at: baseAttempt.completedAt,
            },
          ],
          state: "deferred",
          publicParity: { publishedRelationKeys: [], rejectedRelationKeys: [] },
          newlyReachedOfferIdsByProgram: {},
          newlyReachedOfferUnionIds: [],
          currentMatchIds: [],
        },
        {
          ...baseAttempt,
          programKey: "ELE03M",
          baseQualificationIdentity: "qualification:ELE03M",
          transitions: [
            { ...baseAttempt.transitions[0] },
            {
              from: "in_progress",
              to: "discarded",
              at: baseAttempt.completedAt,
            },
          ],
          state: "discarded",
          publicParity: { publishedRelationKeys: [], rejectedRelationKeys: [] },
          newlyReachedOfferIdsByProgram: {},
          newlyReachedOfferUnionIds: [],
          currentMatchIds: [],
        },
      ]),
    ).toMatchObject({ completed: 1, deferred: 1, discarded: 1, terminal: 3 });
    expect(() =>
      validateExpansionAggregate([
        { ...baseAttempt, baseQualificationIdentity: "qualification:IFC03S" },
        {
          ...baseAttempt,
          programKey: "ELE02M",
          baseQualificationIdentity: "qualification:IFC03SD",
        },
      ]),
    ).toThrow(/modality|counted|base/i);
  });

  it("exports a strict aggregate schema for terminal unique canonical bases", () => {
    expect(
      FpExpansionAggregateSchema.parse({ attempts: [baseAttempt] }),
    ).toEqual({ attempts: [baseAttempt] });
    expect(() =>
      FpExpansionAggregateSchema.parse({
        attempts: [
          {
            ...baseAttempt,
            state: "in_progress",
            completedAt: null,
            transitions: [baseAttempt.transitions[0]],
          },
        ],
      }),
    ).toThrow(/terminal/i);
    expect(() =>
      FpExpansionAggregateSchema.parse({
        attempts: [
          { ...baseAttempt, baseQualificationIdentity: "qualification:IFC03S" },
          {
            ...baseAttempt,
            programKey: "ELE02M",
            baseQualificationIdentity: "qualification:IFC03SD",
          },
        ],
      }),
    ).toThrow(/modality|base|duplicate/i);
  });

  it("rejects completed attempts reviewed after the terminal transition", () => {
    expect(() =>
      FpExpansionAttemptSchema.parse({
        ...baseAttempt,
        reviewedCommitAt: "2026-08-09T10:40:00Z",
      }),
    ).toThrow(/reviewedCommitAt|terminal|completedAt/i);
  });
});
