import { describe, expect, it } from "vitest";

import type { TrainingOccupationLink } from "../../data/schemas/curatedMappings";
import {
  ACCEPTED_RELATION_KEYS,
  TASK_5_WAVE_RELATIONSHIPS,
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

const SECOND_PRIORITY_WAVE_KEYS = [
  "AGA01S|5993",
  "QUI01E|3141",
  "SAN01S|3317",
  "SAN01SD|3317",
  "SAN02S|3316",
  "SAN02S|2640",
  "SEA01M|5931",
  "SEA01MD|5931",
  "SEA01M|5932",
  "SEA01MD|5932",
  "SEA01M|5993",
  "SEA01MD|5993",
  "TMV03M|7403",
] as const;

const TASK_4_WAVE_KEYS = [
  "MAM02M|7812",
  "SSC06S|5894",
  "AGA03M|6120",
  "INA03M|8160",
  "TMV05M|7404",
  "ARG01M|7621",
  "SSC04S|3714",
  "ELE05S|3125",
  "ELE05S|7532",
  "ENA02S|3131",
  "ENA04S|3132",
  "TCP02B|7835",
  "QUI01M|8131",
] as const;

const CONTEST_EVIDENCE_REMEDIATION_KEYS = [
  "FME02B|7314",
  "EOC02SD|3129",
  "IMP01S|2640",
  "AGA01B|4121",
  "COM01M|5300",
  "HOT02S|3510",
] as const;

const TASK_5_WAVE_KEYS = [
  "IMS01S|2484",
  "IMS01S|2713",
  "AGA02S|6120",
  "COM01E|2651",
  "ELE01E|2729",
  "EOC01B|7121",
  "EOC01B|7191",
  "EOC01B|7211",
  "EOC01B|7231",
  "EOC01B|7240",
  "EOC01B|9602",
  "EOC02M|7231",
  "EOC02M|7240",
  "FME01E|2482",
  "IMA02S|7250",
  "IMS04S|3831",
] as const;

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
        "AFD02S|3723",
        "AFD02SD|3723",
        "AGA01M|6110",
        "AGA01M|6120",
        "AGA01M|6204",
        "AGA01M|6205",
        "AGA01M|6300",
        "AGA01M|8321",
        "AGA02M|6110",
        "AGA02M|6120",
        "AGA02M|6204",
        "AGA02M|6205",
        "AGA02M|6300",
        "AGA02M|8321",
        "AGA03B|9511",
        "AGA03B|9512",
        "AGA03B|9530",
        "AGA03B|9543",
        "COM01M|1432",
        "COM01M|3510",
        "COM01M|4424",
        "COM01M|5420",
        "COM01M|5492",
        "COM01M|5500",
        "COM01M|9820",
        "COM01B|4121",
        "COM01B|4123",
        "COM01B|5220",
        "COM01B|5492",
        "COM01B|5500",
        "COM01B|8333",
        "COM01B|9820",
        "COM04S|3522",
        "COM04S|3523",
        "COM04S|4123",
        "COM04SD|3522",
        "COM04SD|3523",
        "COM04SD|4123",
        "IFC01B|7533",
        "IFC01B|8202",
        "IFC02S|2713",
        "IFC02SD|3820",
        "ELE01B|7510",
        "ELE02M|7533",
        "ELE03S|7531",
        "ELE04S|3123",
        "ELE04S|3124",
        "ELE04S|3129",
        "ELE04S|3139",
        "ELE04S|3209",
        "ELE04S|7521",
        "FME01B|7221",
        "FME01B|9700",
        "FME02M|7132",
        "FME02M|7312",
        "FME02M|7313",
        "FME02M|7314",
        "FME01M|7322",
        "FME01M|7323",
        "FME01M|7324",
        "HOT01B|9310",
        "HOT04S|5110",
        "INA01S|7709",
        "SSC01S|2252",
        "SSC01SD|2252",
        "COM02E|1221",
        "COM02E|2651",
        "ELE02B|7510",
        "ELE02B|7533",
        "ELE02B|9700",
        "IMA01M|7221",
        "IMA01M|7222",
        "IMA01M|7250",
        "IMA01M|7294",
        "IMS01E|2921",
        "IMS01E|2923",
        "INA02M|3510",
        "INA02M|7705",
        "INA02M|7707",
        "INA02M|8193",
        "IMA02M|7250",
        "IMA03M|8202",
        "IMA03S|3126",
        "MAM01M|7812",
        "MAM01M|8209",
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
    expect(restoredKeys).toEqual(
      expect.arrayContaining([...SECOND_PRIORITY_WAVE_KEYS]),
    );
    expect(restoredKeys).not.toContain("COM01M|3522");
  });

  it("fails closed when the reviewed source does not contain every accepted key", () => {
    const current: TrainingOccupationLink[] = [];
    expect(() => mergeFrontierReviewedCoverage(current, [])).toThrow(
      /Expected one approved reviewed relationship/u,
    );
  });

  it("does not invent second priority wave relations when the reviewed source omits them", () => {
    const waveKeys = new Set<string>(SECOND_PRIORITY_WAVE_KEYS);
    const reviewed = ACCEPTED_RELATION_KEYS.filter(
      (key) => !waveKeys.has(key),
    ).map((key) => {
      const [trainingProgramKey, classificationCode] = key.split("|");
      return {
        ...base,
        trainingProgramKey,
        occupationId: `occupation:cno11:${classificationCode}`,
      } satisfies TrainingOccupationLink;
    });

    expect(() => mergeFrontierReviewedCoverage([], reviewed)).toThrow(
      /AGA01S\|5993/u,
    );
  });

  it("restores exactly the Task 4 wave from a complete reviewed source", () => {
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

    expect(restoredKeys).toEqual(expect.arrayContaining([...TASK_4_WAVE_KEYS]));
    expect(
      TASK_4_WAVE_KEYS.filter((key) => !restoredKeys.includes(key)),
    ).toEqual([]);
    expect(restoredKeys).toHaveLength(ACCEPTED_RELATION_KEYS.length);
  });

  it("fails closed when a Task 4 relationship is absent from the reviewed source", () => {
    const reviewed = ACCEPTED_RELATION_KEYS.filter(
      (key) => key !== TASK_4_WAVE_KEYS[0],
    ).map((key) => {
      const [trainingProgramKey, classificationCode] = key.split("|");
      return {
        ...base,
        trainingProgramKey,
        occupationId: `occupation:cno11:${classificationCode}`,
      } satisfies TrainingOccupationLink;
    });

    expect(() => mergeFrontierReviewedCoverage([], reviewed)).toThrow(
      /MAM02M\|7812/u,
    );
  });

  it("does not restore the known unsafe contest-evidence relationships", () => {
    expect(ACCEPTED_RELATION_KEYS).not.toEqual(
      expect.arrayContaining([...CONTEST_EVIDENCE_REMEDIATION_KEYS]),
    );
  });

  it("restores exactly the Task 5 wave and excludes its rejected alternatives", () => {
    expect(ACCEPTED_RELATION_KEYS).toEqual(
      expect.arrayContaining([...TASK_5_WAVE_KEYS]),
    );
    expect(TASK_5_WAVE_RELATIONSHIPS).toHaveLength(TASK_5_WAVE_KEYS.length);
    expect(
      TASK_5_WAVE_RELATIONSHIPS.map(
        ({ trainingProgramKey, occupationId }) =>
          `${trainingProgramKey}|${occupationId.replace("occupation:cno11:", "")}`,
      ).sort(),
    ).toEqual([...TASK_5_WAVE_KEYS].sort());
    expect(
      TASK_5_WAVE_RELATIONSHIPS.every(
        ({ relationshipType, reviewStatus }) =>
          relationshipType === "reviewed_relationship" &&
          reviewStatus === "approved",
      ),
    ).toBe(true);
    expect(
      TASK_5_WAVE_RELATIONSHIPS.find(
        ({ trainingProgramKey, occupationId }) =>
          `${trainingProgramKey}|${occupationId.replace("occupation:cno11:", "")}` ===
          "EOC01B|7240",
      ),
    ).toMatchObject({
      sourceQuote: "Ayudante de solador / soladora.",
      functionalBoundary: {
        roleLevel: "assistant",
        fullOccupationQualification: false,
      },
    });
    expect(
      TASK_5_WAVE_RELATIONSHIPS.find(
        ({ trainingProgramKey, occupationId }) =>
          `${trainingProgramKey}|${occupationId.replace("occupation:cno11:", "")}` ===
          "FME01E|2482",
      ),
    ).toMatchObject({
      sourceQuote: "Experto en diseño de producto para impresión 3D.",
    });
    expect(ACCEPTED_RELATION_KEYS).not.toEqual(
      expect.arrayContaining([
        "EOC01B|7212",
        "EOC02M|3202",
        "EOC02M|7211",
        "EOC02M|7212",
      ]),
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
