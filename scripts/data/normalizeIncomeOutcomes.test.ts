import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { OutcomeIndicatorsResourceSchema } from "../../data/schemas/outcomes";
import { EDUCABASE_INCOME_TABLE_IDS } from "./educabaseIncomeSources";
import { loadEducabaseIncomeBundle } from "./loadEducabaseIncome";
import { normalizeIncomeOutcomes } from "./normalizeIncomeOutcomes";

async function loadVerifiedFixtureTables() {
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
  return bundle.tables;
}

describe("normalizeIncomeOutcomes", () => {
  it("publishes the exact approved groups, windows, and observed cells", async () => {
    const records = normalizeIncomeOutcomes(await loadVerifiedFixtureTables());
    expect(records.filter((row) => row.kind === "group")).toHaveLength(96);
    expect(records.filter((row) => row.kind === "cohort_window")).toHaveLength(
      24,
    );
    expect(records.filter((row) => row.kind === "observation")).toHaveLength(
      22_050,
    );
    expect(records).toHaveLength(22_170);
    expect(OutcomeIndicatorsResourceSchema.parse(records)).toEqual(records);
  });

  it("keeps scopes, windows, and unavailable cells separate", async () => {
    const records = normalizeIncomeOutcomes(await loadVerifiedFixtureTables());
    const groups = records.filter((row) => row.kind === "group");
    expect(
      groups.filter((row) => row.trainingLevel === "intermediate"),
    ).toHaveLength(34);
    expect(groups.filter((row) => row.trainingLevel === "higher")).toHaveLength(
      62,
    );

    const windows = records.filter((row) => row.kind === "cohort_window");
    expect(
      windows.filter(
        (row) =>
          row.cohort === "2021-2022" &&
          row.provisional &&
          row.maxObservedPostGraduationYear === 3,
      ),
    ).toHaveLength(2);
    expect(
      windows.filter(
        (row) =>
          row.cohort === "2022-2023" &&
          row.provisional &&
          row.maxObservedPostGraduationYear === 2,
      ),
    ).toHaveLength(2);

    const observations = records.filter((row) => row.kind === "observation");
    expect(
      observations.filter(
        (row) => row.scope === "castilla_leon_training_level",
      ),
    ).toHaveLength(450);
    expect(
      observations.filter(
        (row) => row.cohort === "2022-2023" && row.postGraduationYear > 2,
      ),
    ).toHaveLength(0);
    expect(
      observations.some(
        (row) =>
          row.availability === "unavailable_or_unrepresentative" &&
          row.valueEur === null,
      ),
    ).toBe(true);
  });

  it("sorts a shuffled verified-table input into byte-identical public records", async () => {
    const tables = await loadVerifiedFixtureTables();
    const first = normalizeIncomeOutcomes(tables);
    const second = normalizeIncomeOutcomes([...tables].reverse());
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});
