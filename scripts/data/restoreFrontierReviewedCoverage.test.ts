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
        "COM01M|1432",
        "COM01M|3510",
        "COM01M|4424",
        "COM01M|5300",
        "COM01M|5420",
        "COM01M|5492",
        "COM01M|5500",
        "COM01M|9820",
        "IFC01B|7533",
        "IFC01B|8202",
        "IFC02S|2713",
        "IFC02SD|3820",
        "ELE01B|7510",
        "ELE02M|7533",
        "HOT01B|9310",
        "SSC01S|2252",
        "SSC01SD|2252",
        "IMA03M|8202",
        "IMA03S|3126",
        "IMP01B|5811",
        "IMP01B|5812",
        "IMP02M|5811",
        "IMP02M|5812",
        "IMP02MD|5811",
        "IMP02MD|5812",
        "TMV01B|7401",
        "TMV01S|3160",
        "TMV01S|3405",
        "TMV01S|4412",
        "TMV02M|7401",
      ]),
    );
    expect(restoredKeys).not.toContain("COM01M|3522");
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
