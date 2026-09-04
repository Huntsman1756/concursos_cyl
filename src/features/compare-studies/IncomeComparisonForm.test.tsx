import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OutcomeGroup } from "../../../data/schemas/outcomes";
import { IncomeComparisonForm } from "./IncomeComparisonForm";

const group = (overrides: Partial<OutcomeGroup> = {}): OutcomeGroup => ({
  kind: "group",
  groupKey: "higher:radioterapia",
  trainingLevel: "higher",
  officialLabel: "Radioterampia y dosimetría",
  sourceTableId: "famprof_3_08",
  ...overrides,
});

function renderForm(groups: readonly OutcomeGroup[]) {
  return render(
    <IncomeComparisonForm
      trainingLevel="higher"
      groups={groups}
      selectedGroupKeys={[]}
      cohort="2019-20"
      cohortWindow={null}
      cohortWindows={[]}
      postGraduationYear={1}
      onTrainingLevelChange={vi.fn()}
      onGroupKeysChange={vi.fn()}
      onCohortChange={vi.fn()}
      onPostGraduationYearChange={vi.fn()}
    />,
  );
}

afterEach(cleanup);

describe("IncomeComparisonForm group filter", () => {
  it("finds groups by the display-corrected spelling, not the source typo", async () => {
    const user = userEvent.setup();
    renderForm([
      group(),
      group({
        groupKey: "higher:laboratorio",
        officialLabel: "Laboratorio clinico y biomédico",
      }),
    ]);

    const filter = screen.getByLabelText("Filtrar ciclos o grupos oficiales");
    await user.type(filter, "radioterapia");

    expect(screen.getByText("Radioterapia y dosimetría")).toBeVisible();
    expect(screen.getByText(/1 resultado disponible/u)).toBeVisible();
  });

  it("keeps matching the raw source spelling too", async () => {
    const user = userEvent.setup();
    renderForm([group()]);

    const filter = screen.getByLabelText("Filtrar ciclos o grupos oficiales");
    await user.type(filter, "dosimetria");

    expect(screen.getByText("Radioterapia y dosimetría")).toBeVisible();
  });
});
