import { describe, expect, it } from "vitest";

import type {
  OutcomeCohortWindow,
  OutcomeGroup,
} from "../../../data/schemas/outcomes";
import type { IncomeOutcomeIndex } from "../../domain/outcomes";
import {
  parseCompareSearch,
  serializeCompareSelection,
  type CompareSelection,
} from "./compareSelection";

const intermediateGroup = (groupKey: string): OutcomeGroup => ({
  kind: "group",
  groupKey,
  trainingLevel: "intermediate",
  officialLabel: `Grupo ${groupKey}`,
  sourceTableId: "famprof_2_08",
});

const higherGroup = (groupKey: string): OutcomeGroup => ({
  kind: "group",
  groupKey,
  trainingLevel: "higher",
  officialLabel: `Grupo ${groupKey}`,
  sourceTableId: "famprof_3_08",
});

const windowFor = (
  trainingLevel: OutcomeCohortWindow["trainingLevel"],
  cohort = "2019-2020",
  maxObservedPostGraduationYear: 1 | 2 | 3 | 4 = 4,
): OutcomeCohortWindow => ({
  kind: "cohort_window",
  trainingLevel,
  cohort,
  provisional: false,
  maxObservedPostGraduationYear,
});

function indexFixture(): IncomeOutcomeIndex {
  const groups = [
    intermediateGroup("im-a"),
    intermediateGroup("im-b"),
    higherGroup("ifc-a"),
    higherGroup("ifc-b"),
  ];
  const windows = [
    windowFor("intermediate"),
    windowFor("higher"),
    windowFor("higher", "2022-2023", 2),
  ];
  return {
    groupsByKey: new Map(groups.map((group) => [group.groupKey, group])),
    windowsByLevelAndCohort: new Map(
      windows.map((window) => [
        `${window.trainingLevel}\0${window.cohort}`,
        window,
      ]),
    ),
    observationsByCoordinate: new Map(),
  };
}

const index = indexFixture();

describe("compare selection URL codec", () => {
  it("parses the empty and program intents without reflecting URL content", () => {
    expect(parseCompareSearch(new URLSearchParams(), index)).toEqual({
      kind: "empty",
    });
    expect(
      parseCompareSearch(new URLSearchParams("program=IFC03S"), index),
    ).toEqual({ kind: "program", programKey: "IFC03S" });
  });

  it("round-trips a canonical selection in stable visible order", () => {
    const selection: CompareSelection = {
      trainingLevel: "higher",
      groupKeys: ["ifc-b", "ifc-a"],
      cohort: "2019-2020",
      postGraduationYear: 4,
    };
    const params = serializeCompareSelection(selection);
    expect(params.toString()).toBe(
      "level=higher&group=ifc-b&group=ifc-a&cohort=2019-2020&year=4",
    );
    expect(parseCompareSearch(params, index)).toEqual({
      kind: "selection",
      selection,
    });
  });

  it("rejects repeated, partial, mixed, unknown, and inconsistent queries", () => {
    const invalidQueries = [
      "level=higher&level=intermediate&group=ifc-a&cohort=2019-2020&year=4",
      "level=higher&group=ifc-a&cohort=2019-2020&cohort=2022-2023&year=4",
      "level=higher&group=ifc-a&cohort=2019-2020&year=4&year=3",
      "level=higher&group=ifc-a&cohort=2019-2020",
      "level=higher&cohort=2019-2020&year=4",
      "level=higher&group=unknown&cohort=2019-2020&year=4",
      "level=higher&group=ifc-a&group=ifc-a&cohort=2019-2020&year=4",
      "level=intermediate&group=ifc-a&cohort=2019-2020&year=4",
      "level=higher&group=ifc-a&cohort=unknown&year=4",
      "level=higher&group=ifc-a&cohort=2022-2023&year=4",
      "level=higher&group=ifc-a&cohort=2019-2020&year=0",
      "level=higher&group=ifc-a&cohort=2019-2020&year=5",
      "level=higher&group=ifc-a&group=ifc-b&group=im-a&group=im-b&cohort=2019-2020&year=4",
      "level=higher&group=ifc-a&cohort=2019-2020&year=4&extra=value",
      "program=&level=higher&group=ifc-a&cohort=2019-2020&year=4",
      "program=IFC03S&program=IFC04S",
      "program=",
      "program=%20",
    ];

    for (const query of invalidQueries) {
      const result = parseCompareSearch(new URLSearchParams(query), index);
      expect(result.kind, query).toBe("invalid");
      if (result.kind === "invalid") {
        expect(result.message).not.toContain(query);
        expect(result.message).toMatch(/enlace.*comparación.*válido/iu);
      }
    }
  });

  it("does not serialize partial comparator state", () => {
    expect(
      serializeCompareSelection({
        trainingLevel: "higher",
        groupKeys: [],
        cohort: "2019-2020",
        postGraduationYear: 4,
      } as never).toString(),
    ).toBe("");
    expect(
      serializeCompareSelection({
        trainingLevel: "higher",
        groupKeys: ["ifc-a"],
        cohort: "",
        postGraduationYear: 4,
      } as never).toString(),
    ).toBe("");
  });
});
