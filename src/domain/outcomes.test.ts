import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import type {
  OutcomeGroup,
  OutcomeIndicatorRecord,
  OutcomeIndicatorsResource,
  OutcomeObservation,
} from "../../data/schemas/outcomes";
import { EDUCABASE_INCOME_TABLE_IDS } from "../../scripts/data/educabaseIncomeSources";
import { loadEducabaseIncomeBundle } from "../../scripts/data/loadEducabaseIncome";
import { normalizeIncomeOutcomes } from "../../scripts/data/normalizeIncomeOutcomes";
import {
  getIncomeComparison,
  indexIncomeOutcomes,
  type IncomeOutcomeIndex,
} from "./outcomes";

async function fixtureResource(): Promise<OutcomeIndicatorsResource> {
  const directory = join(process.cwd(), "tests/fixtures/educabase-income");
  const request = async (url: string): Promise<Response> => {
    const tableId = EDUCABASE_INCOME_TABLE_IDS.find((id) => url.includes(id));
    if (!tableId) throw new Error(`Unexpected fixture URL ${url}`);
    const extension = url.includes("/csv_") ? "csv" : "px";
    const response = new Response(
      await readFile(join(directory, `${tableId}.${extension}`)),
      {
        headers: {
          "content-type":
            extension === "csv"
              ? "text/plain;charset=ISO-8859-15"
              : "application/pc-axis;charset=ISO-8859-15",
        },
      },
    );
    Object.defineProperty(response, "url", { value: url });
    return response;
  };
  const bundle = await loadEducabaseIncomeBundle({
    fetchedAt: "2026-08-09T00:00:00.000Z",
    request,
    sleep: async () => undefined,
  });
  return normalizeIncomeOutcomes(bundle.tables);
}

function isGroup(record: OutcomeIndicatorRecord): record is OutcomeGroup {
  return record.kind === "group";
}

function isObservation(
  record: OutcomeIndicatorRecord,
): record is OutcomeObservation {
  return record.kind === "observation";
}

describe("income comparison domain", () => {
  let resource: OutcomeIndicatorsResource;
  let index: IncomeOutcomeIndex;
  let intermediateGroup: string;
  let higherGroup: string;

  beforeAll(async () => {
    resource = await fixtureResource();
    index = indexIncomeOutcomes(resource);
    intermediateGroup = resource.find(
      (row): row is OutcomeGroup =>
        isGroup(row) && row.trainingLevel === "intermediate",
    )?.groupKey as string;
    higherGroup = resource.find(
      (row): row is OutcomeGroup =>
        isGroup(row) && row.trainingLevel === "higher",
    )?.groupKey as string;
  });

  it("returns separate national and regional evidence for one shared coordinate", () => {
    const comparison = getIncomeComparison(index, {
      trainingLevel: "higher",
      groupKeys: [higherGroup],
      cohort: "2020-2021",
      postGraduationYear: 4,
    });
    expect(Object.keys(comparison)).toEqual([
      "selection",
      "groups",
      "cohortWindow",
      "national",
      "regional",
    ]);
    expect(comparison.national).toHaveLength(5);
    expect(comparison.regional).toHaveLength(5);
    expect(
      comparison.national.every((row) => row.scope === "spain_cycle_group"),
    ).toBe(true);
    expect(
      comparison.regional.every(
        (row) => row.scope === "castilla_leon_training_level",
      ),
    ).toBe(true);
    expect(
      [...comparison.national, ...comparison.regional].every(
        (row) => row.cohort === "2020-2021" && row.postGraduationYear === 4,
      ),
    ).toBe(true);
  });

  it("rejects impossible selections instead of changing their meaning", () => {
    const otherHigherGroup = resource.find(
      (row): row is OutcomeGroup =>
        isGroup(row) &&
        row.trainingLevel === "higher" &&
        row.groupKey !== higherGroup,
    )?.groupKey as string;
    const cases = [
      {
        trainingLevel: "higher" as const,
        groupKeys: [higherGroup, intermediateGroup] as const,
        cohort: "2020-2021",
        postGraduationYear: 4 as const,
      },
      {
        trainingLevel: "higher" as const,
        groupKeys: [higherGroup, higherGroup] as const,
        cohort: "2020-2021",
        postGraduationYear: 4 as const,
      },
      {
        trainingLevel: "higher" as const,
        groupKeys: [
          higherGroup,
          otherHigherGroup,
          "income-group-ffffffffffffffff",
          higherGroup,
        ] as const,
        cohort: "2020-2021",
        postGraduationYear: 4 as const,
      },
      {
        trainingLevel: "higher" as const,
        groupKeys: ["income-group-ffffffffffffffff"] as const,
        cohort: "2020-2021",
        postGraduationYear: 4 as const,
      },
      {
        trainingLevel: "higher" as const,
        groupKeys: [higherGroup] as const,
        cohort: "2000-2001",
        postGraduationYear: 4 as const,
      },
      {
        trainingLevel: "higher" as const,
        groupKeys: [higherGroup] as const,
        cohort: "2022-2023",
        postGraduationYear: 4 as const,
      },
    ];
    for (const selection of cases) {
      expect(() => getIncomeComparison(index, selection)).toThrow();
    }
  });

  it("passes an official unavailable value through without interpolation", () => {
    const unavailable = resource.find(
      (row): row is OutcomeObservation =>
        isObservation(row) &&
        row.scope === "spain_cycle_group" &&
        row.availability === "unavailable_or_unrepresentative",
    );
    if (!unavailable || !unavailable.groupKey) {
      throw new Error("Fixture must contain an unavailable national value");
    }
    const comparison = getIncomeComparison(index, {
      trainingLevel: unavailable.trainingLevel,
      groupKeys: [unavailable.groupKey],
      cohort: unavailable.cohort,
      postGraduationYear: unavailable.postGraduationYear,
    });
    expect(comparison.national).toContainEqual(
      expect.objectContaining({
        observationId: unavailable.observationId,
        valueEur: null,
        availability: "unavailable_or_unrepresentative",
      }),
    );
  });

  it("rejects a resource that lacks the exact regional reference", () => {
    const withoutRegional = resource.filter(
      (row) =>
        !isObservation(row) || row.scope !== "castilla_leon_training_level",
    );
    expect(() => indexIncomeOutcomes(withoutRegional)).toThrow(/regional/i);
  });

  it("indexes a valid resource independently of record ordering", () => {
    expect(() => indexIncomeOutcomes([...resource].reverse())).not.toThrow();
  });
});
