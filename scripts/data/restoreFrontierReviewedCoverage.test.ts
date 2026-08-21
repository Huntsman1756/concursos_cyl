import { describe, expect, it } from "vitest";

import type { TrainingOccupationLink } from "../../data/schemas/curatedMappings";
import {
  ACCEPTED_RELATION_KEYS,
  mergeFrontierReviewedCoverage,
} from "./restoreFrontierReviewedCoverage";

const base = {
  relationshipType: "official_output",
  reviewStatus: "approved",
  sourceUrl: "https://www.todofp.es/example",
  sourceQuote: "Una salida profesional oficial suficientemente extensa.",
  reviewedAt: "2026-08-14",
  mappingVersion: "1.0.0",
} as const;

describe("mergeFrontierReviewedCoverage", () => {
  it("restores the selected priority relations from a complete reviewed source", () => {
    const reviewed = ACCEPTED_RELATION_KEYS.map((key) => {
      const [trainingProgramKey, classificationCode] = key.split("|");
      return {
        ...base,
        trainingProgramKey,
        occupationId: `occupation:cno11:${classificationCode}`,
      } satisfies TrainingOccupationLink;
    });

    const result = mergeFrontierReviewedCoverage([], reviewed);
    const restoredKeys = result.map(
      ({ trainingProgramKey, occupationId }) =>
        `${trainingProgramKey}|${occupationId.replace("occupation:cno11:", "")}`,
    );

    expect(restoredKeys).toEqual(
      [...ACCEPTED_RELATION_KEYS].sort((left, right) =>
        left.localeCompare(right, "en"),
      ),
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          trainingProgramKey: "IFC01SD",
          occupationId: "occupation:cno11:3813",
          sourceQuote: "Técnica / técnico de redes.",
        }),
        expect.objectContaining({
          trainingProgramKey: "SSC03S",
          occupationId: "occupation:cno11:3713",
          sourceQuote: "Técnica / técnico de integración social.",
        }),
        expect.objectContaining({
          trainingProgramKey: "AFD01SD",
          occupationId: "occupation:cno11:5992",
          sourceUrl: "https://www.boe.es/eli/es/rd/2017/06/23/653",
          sourceQuote: "Socorrista en instalaciones acuáticas.",
        }),
      ]),
    );
    expect(restoredKeys).toEqual(
      expect.arrayContaining([
        "ADG01B|4411",
        "ADG01M|4113",
        "ADG01MD|4113",
        "ADG02S|4111",
        "ADG02SD|4223",
        "IFC02S|2713",
        "IFC02SD|3820",
        "ELE01B|7510",
        "ELE02M|7533",
        "HOT01B|9310",
        "SSC01S|2252",
        "SSC01SD|2252",
        "IMA03M|8202",
        "TMV01B|7401",
        "TMV02M|7401",
      ]),
    );
  });

  it("fails closed when the reviewed source does not contain every accepted key", () => {
    const current: TrainingOccupationLink[] = [];
    expect(() => mergeFrontierReviewedCoverage(current, [])).toThrow(
      /Expected one approved reviewed relationship/u,
    );
  });

  it("rejects a current non-approved relationship instead of overwriting it", () => {
    const current = [
      {
        ...base,
        trainingProgramKey: "ADG01S",
        occupationId: "occupation:cno11:4223",
        reviewStatus: "draft",
        reviewNote: "Pendiente de una revisión oficial adicional.",
      },
    ];
    const reviewed = ACCEPTED_RELATION_KEYS.map((key) => {
      const [trainingProgramKey, classificationCode] = key.split("|");
      return {
        ...base,
        trainingProgramKey,
        occupationId: `occupation:cno11:${classificationCode}`,
      } satisfies TrainingOccupationLink;
    });
    expect(() => mergeFrontierReviewedCoverage(current, reviewed)).toThrow(
      /is not approved/u,
    );
  });
});
