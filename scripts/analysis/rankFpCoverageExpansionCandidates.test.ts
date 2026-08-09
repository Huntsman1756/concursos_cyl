import { describe, expect, it } from "vitest";

import {
  rankFpCoverageExpansionCandidates,
  renderFpCoverageExpansionCandidates,
  serializeFpCoverageExpansionCandidates,
  type CandidateEvidence,
} from "./rankFpCoverageExpansionCandidates";

import prettier from "prettier";

const program = (
  overrides: Partial<CandidateEvidence> = {},
): CandidateEvidence => ({
  programKey: "ELE01M",
  baseQualificationIdentity: "qualification:ELE01M",
  programTitle: "Instalaciones Eléctricas y Automáticas",
  familyCode: "ELE",
  family: "Electricidad y Electrónica",
  level: "intermediate",
  familySignalCount: 14,
  exactTitleSignalCount: 3,
  officialOutputLabels: ["Instalador eléctrico"],
  sourceUrls: [
    "https://todofp.es/ele01m",
    "https://www.boe.es/eli/es/rd/177/2008",
  ],
  classificationCandidates: ["occupation:cno11:7510"],
  collisionCount: 0,
  sourceReadiness: "output_only",
  selectionReason:
    "Notebook family signal and a distinct electrical programme.",
  ...overrides,
});

const input = (candidates: CandidateEvidence[]) => ({
  candidates,
  knownProgramKeys: new Set(candidates.map(({ programKey }) => programKey)),
  reviewedBaseQualificationIdentities: new Set([
    "qualification:IFC03S",
    "qualification:SAN21",
    "qualification:HOT01M",
    "qualification:SSC01M",
    "qualification:EOC01M",
  ]),
});

const fourteen = (
  overrides: (index: number) => Partial<CandidateEvidence> = () => ({}),
) =>
  Array.from({ length: 14 }, (_, index) =>
    program({
      programKey: `ELE${String(index + 1).padStart(2, "0")}M`,
      baseQualificationIdentity: `qualification:ELE${index + 1}`,
      ...(index === 1
        ? { familyCode: "IMA", family: "Instalación y Mantenimiento" }
        : {}),
      ...overrides(index),
    }),
  );

describe("rankFpCoverageExpansionCandidates", () => {
  it("ranks seven primaries and at least seven reserves with the specified tuple", () => {
    const candidates = fourteen((index) => ({
      familySignalCount: index === 0 ? 18 : 10,
      exactTitleSignalCount: index === 0 ? 4 : 1,
    }));

    const result = rankFpCoverageExpansionCandidates(input(candidates));

    expect(result.primaryCandidates).toHaveLength(7);
    expect(result.reserveCandidates).toHaveLength(7);
    expect(result.primaryCandidates[0]?.programKey).toBe("ELE01M");
    expect(
      result.primaryCandidates.every(
        (candidate, index) => candidate.rank === index + 1,
      ),
    ).toBe(true);
  });

  it("uses readiness, collisions, descending signals, then strict code-point key order", () => {
    const candidates = fourteen((index) => ({
      sourceReadiness: index === 0 ? "exact_program_to_cno" : "output_only",
      collisionCount: index === 1 ? 1 : 0,
      familySignalCount: index === 2 ? 99 : 10,
      exactTitleSignalCount: index === 3 ? 99 : 1,
    }));

    const result = rankFpCoverageExpansionCandidates(input(candidates));

    expect(
      result.primaryCandidates.map(({ programKey }) => programKey).slice(0, 4),
    ).toEqual(["ELE01M", "ELE04M", "ELE03M", "ELE05M"]);
  });

  it("rejects duplicate modality bases, stale reviewed bases, unknown keys, hand-entered scores, and too few candidates", () => {
    expect(() =>
      rankFpCoverageExpansionCandidates(
        input(
          fourteen((index) =>
            index === 0
              ? { baseQualificationIdentity: "qualification:IFC03S" }
              : {},
          ),
        ),
      ),
    ).toThrow(/reviewed|duplicate|baseline/i);

    expect(() =>
      rankFpCoverageExpansionCandidates(
        input(
          fourteen((index) =>
            index === 0
              ? ({
                  scoreTuple: [0, 0, -4, -18, "ELE01M"],
                } as Partial<CandidateEvidence>)
              : {},
          ),
        ),
      ),
    ).toThrow(/unknown|score/i);

    expect(() => rankFpCoverageExpansionCandidates(input([program()]))).toThrow(
      /14|candidates/i,
    );
  });

  it("rejects the distance modality when its reviewed base qualification is IFC03S", () => {
    const candidates = fourteen((index) =>
      index === 0
        ? {
            programKey: "IFC03SD",
            baseQualificationIdentity: "qualification:IFC03SD",
          }
        : {},
    );

    expect(() => rankFpCoverageExpansionCandidates(input(candidates))).toThrow(
      /reviewed|stale|IFC03S/i,
    );
  });

  it("states that primary and reserve order is research priority and output-only candidates cannot complete or publish", () => {
    const result = rankFpCoverageExpansionCandidates(input(fourteen()));
    const report = renderFpCoverageExpansionCandidates(result);

    expect(report).toContain(
      "Primary and reserve positions indicate research priority order only; they do not indicate completion or publication readiness.",
    );
    expect(report).toContain(
      "Every output_only candidate is non-completable and non-publishable until classification evidence exists.",
    );
  });

  it("serializes the JSON report with Prettier-compliant bytes", async () => {
    const serialized = await serializeFpCoverageExpansionCandidates(
      rankFpCoverageExpansionCandidates(input(fourteen())),
    );

    await expect(
      prettier.check(serialized, {
        filepath: "fp_coverage_expansion_candidates.json",
      }),
    ).resolves.toBe(true);
  });

  it("rejects COM01M without new classification evidence and enforces family gates", () => {
    const candidates = fourteen();
    candidates[0] = program({
      programKey: "COM01M",
      baseQualificationIdentity: "qualification:COM01M",
      familyCode: "COM",
      family: "Comercio y Marketing",
      sourceReadiness: "output_only",
    });

    expect(() => rankFpCoverageExpansionCandidates(input(candidates))).toThrow(
      /COM01M|evidence/i,
    );

    const withoutInstallation = fourteen().map((candidate) => ({
      ...candidate,
      family: "Electricidad y Electrónica",
    }));
    expect(() =>
      rankFpCoverageExpansionCandidates(input(withoutInstallation)),
    ).toThrow(/Installation|Instalaci|representation/i);
  });
});
