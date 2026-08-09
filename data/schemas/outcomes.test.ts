import { describe, expect, it } from "vitest";

import {
  OutcomeCohortWindowSchema,
  OutcomeGroupSchema,
  OutcomeIndicatorRecordSchema,
  OutcomeObservationSchema,
} from "./outcomes";

const group = {
  kind: "group",
  groupKey: "income-group-0123456789abcdef",
  trainingLevel: "higher",
  officialLabel: "Administración y gestión",
  sourceTableId: "famprof_3_08",
} as const;

const cohortWindow = {
  kind: "cohort_window",
  trainingLevel: "higher",
  cohort: "2021-2022",
  provisional: true,
  maxObservedPostGraduationYear: 3,
} as const;

const nationalObservation = {
  kind: "observation",
  observationId: "income-observation-0123456789abcdef",
  sourceTableId: "famprof_3_08",
  scope: "spain_cycle_group",
  trainingLevel: "higher",
  groupKey: group.groupKey,
  officialGroupLabel: group.officialLabel,
  cohort: cohortWindow.cohort,
  postGraduationYear: 3,
  measure: "mean",
  valueEur: 23120,
  availability: "published",
  provisional: true,
} as const;

describe("outcome indicator schemas", () => {
  it("accepts the three exact record kinds without unknown fields", () => {
    expect(OutcomeGroupSchema.parse(group)).toEqual(group);
    expect(OutcomeCohortWindowSchema.parse(cohortWindow)).toEqual(cohortWindow);
    expect(OutcomeObservationSchema.parse(nationalObservation)).toEqual(
      nationalObservation,
    );
    expect(
      OutcomeIndicatorRecordSchema.parse({
        ...nationalObservation,
        valueEur: null,
        availability: "unavailable_or_unrepresentative",
      }),
    ).toMatchObject({ kind: "observation", valueEur: null });
  });

  it("rejects unknown and forbidden statistical semantics", () => {
    for (const candidate of [
      { ...group, extra: "not allowed" },
      { ...nationalObservation, measure: "percent" },
      { ...nationalObservation, measure: "affiliation_rate" },
      { ...nationalObservation, measure: "salary" },
      { ...nationalObservation, scope: "professional_family" },
      { ...nationalObservation, province: "Valladolid" },
      { ...nationalObservation, workplaceRegion: "Castilla y León" },
      { ...nationalObservation, level: "basic" },
    ]) {
      expect(() => OutcomeIndicatorRecordSchema.parse(candidate)).toThrow();
    }
  });

  it("keeps availability, source scope, group identity, and provisional state coherent", () => {
    const cases = [
      { ...nationalObservation, valueEur: null },
      {
        ...nationalObservation,
        availability: "unavailable_or_unrepresentative",
      },
      {
        ...nationalObservation,
        sourceTableId: "ccaa_3_07",
      },
      {
        ...nationalObservation,
        scope: "castilla_leon_training_level",
      },
      {
        ...nationalObservation,
        cohort: "2021-2022",
        provisional: false,
      },
      {
        ...cohortWindow,
        provisional: false,
      },
      {
        ...nationalObservation,
        sourceTableId: "famprof_2_08",
      },
      {
        ...nationalObservation,
        groupKey: null,
      },
    ];
    for (const candidate of cases) {
      expect(() => OutcomeIndicatorRecordSchema.parse(candidate)).toThrow();
    }
  });

  it("accepts only the twelve approved consecutive cohort labels", () => {
    for (const cohort of ["2012-2015", "2020-2022", "2023-2024"]) {
      expect(() =>
        OutcomeCohortWindowSchema.parse({
          ...cohortWindow,
          cohort,
          provisional: false,
          maxObservedPostGraduationYear: 4,
        }),
      ).toThrow();
      expect(() =>
        OutcomeObservationSchema.parse({
          ...nationalObservation,
          cohort,
          provisional: false,
          postGraduationYear: 1,
        }),
      ).toThrow();
    }
  });

  it("accepts only a region-level reference without a cycle group", () => {
    const regional = {
      ...nationalObservation,
      sourceTableId: "ccaa_3_07",
      scope: "castilla_leon_training_level",
      groupKey: null,
      officialGroupLabel: null,
    };
    expect(OutcomeObservationSchema.parse(regional)).toEqual(regional);
  });
});
