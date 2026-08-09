import { OutcomeIndicatorsResourceSchema } from "../../data/schemas/outcomes";
import { loadEducabaseIncomeBundle } from "./loadEducabaseIncome";
import { normalizeIncomeOutcomes } from "./normalizeIncomeOutcomes";

/** Verifies the complete official income bundle without printing statistical cells. */
export async function verifyEducabaseIncome(): Promise<void> {
  const bundle = await loadEducabaseIncomeBundle();
  const records = OutcomeIndicatorsResourceSchema.parse(
    normalizeIncomeOutcomes(bundle.tables),
  );
  const counts = {
    groups: records.filter((record) => record.kind === "group").length,
    cohortWindows: records.filter((record) => record.kind === "cohort_window")
      .length,
    observations: records.filter((record) => record.kind === "observation")
      .length,
  };
  console.info(
    JSON.stringify({
      tableIds: bundle.tables.map((table) => table.table.tableId),
      artifacts: bundle.artifacts.map((artifact) => ({
        tableId: artifact.tableId,
        format: artifact.format,
        sha256: artifact.sha256,
      })),
      counts,
    }),
  );
}

if (process.argv[1]?.endsWith("verifyEducabaseIncome.ts")) {
  await verifyEducabaseIncome();
}
