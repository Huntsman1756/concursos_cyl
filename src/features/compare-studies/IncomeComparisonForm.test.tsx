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

describe("IncomeComparisonForm progressive disclosure", () => {
  const manyGroups = Array.from({ length: 20 }, (_, index) =>
    group({
      groupKey: `higher:grupo-${index + 1}`,
      officialLabel: `Grupo de prueba ${index + 1}`,
    }),
  );

  it("does not render a nested scroll area for the option list", () => {
    renderForm(manyGroups);

    const list = screen.getByRole("group", {
      name: "Ciclos y grupos oficiales disponibles",
    });
    // The old nested scroller was focusable and announced as scrollable.
    expect(list).not.toHaveAttribute("tabIndex");
    expect(list.getAttribute("aria-label")).not.toMatch(/desplazamiento/u);
  });

  it("shows a reasonable subset first and discloses the rest with Mostrar más", async () => {
    const user = userEvent.setup();
    renderForm(manyGroups);

    expect(screen.getAllByRole("checkbox")).toHaveLength(8);
    expect(
      screen.getByRole("button", { name: "Mostrar más (12)" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Mostrar más (12)" }));

    expect(screen.getAllByRole("checkbox")).toHaveLength(16);
    expect(screen.getByRole("button", { name: "Ver menos" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Ver menos" }));

    expect(screen.getAllByRole("checkbox")).toHaveLength(8);
  });

  it("keeps a selected group visible even when it falls outside the current page", async () => {
    render(
      <IncomeComparisonForm
        trainingLevel="higher"
        groups={manyGroups}
        selectedGroupKeys={["higher:grupo-20"]}
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

    expect(
      screen.getByRole("checkbox", { name: "Grupo de prueba 20" }),
    ).toBeChecked();
  });

  it("narrows results immediately when filtering", async () => {
    const user = userEvent.setup();
    renderForm(manyGroups);

    const filter = screen.getByLabelText("Filtrar ciclos o grupos oficiales");
    await user.type(filter, "prueba 19");

    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(screen.getByText(/1 resultado disponible/u)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Mostrar más/u }),
    ).not.toBeInTheDocument();
  });
});
