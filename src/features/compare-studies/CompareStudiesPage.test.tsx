import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OutcomeIndicatorsResource } from "../../../data/schemas/outcomes";
const comparisonStyles = readFileSync(
  "src/features/compare-studies/compareStudies.css",
  "utf8",
);

const generatedDataClient = vi.hoisted(() => ({
  loadManifest: vi.fn(),
  loadOutcomeIndicators: vi.fn(),
}));

vi.mock("../../data/generatedDataClient", () => generatedDataClient);

import { CompareStudiesPage } from "./CompareStudiesPage";

const measureLabels = [
  "Media",
  "Límite inferior del segundo quintil",
  "Límite inferior del tercer quintil",
  "Límite inferior del cuarto quintil",
  "Límite inferior del quinto quintil",
] as const;

function groupKey(index: number): string {
  return `income-group-${index.toString(16).padStart(16, "0")}`;
}

function observationId(index: number): string {
  return `income-observation-${index.toString(16).padStart(16, "0")}`;
}

function incomeResource(): OutcomeIndicatorsResource {
  const records: OutcomeIndicatorsResource[number][] = [];
  let nextObservation = 1;
  const cohorts = [
    "2011-2012",
    "2012-2013",
    "2013-2014",
    "2014-2015",
    "2015-2016",
    "2016-2017",
    "2017-2018",
    "2018-2019",
    "2019-2020",
    "2020-2021",
    "2021-2022",
    "2022-2023",
  ] as const;
  const groups = [
    ...Array.from({ length: 34 }, (_, index) => ({
      key: groupKey(index + 1),
      level: "intermediate" as const,
      label: `Grupo medio ${index + 1}`,
      table: "famprof_2_08" as const,
    })),
    ...Array.from({ length: 62 }, (_, index) => ({
      key: groupKey(index + 35),
      level: "higher" as const,
      label:
        index === 0
          ? "Desarrollo de aplicaciones web"
          : `Grupo superior ${index + 1}`,
      table: "famprof_3_08" as const,
    })),
  ];

  for (const group of groups) {
    records.push({
      kind: "group",
      groupKey: group.key,
      trainingLevel: group.level,
      officialLabel: group.label,
      sourceTableId: group.table,
    });
  }

  for (const level of ["intermediate", "higher"] as const) {
    for (const cohort of cohorts) {
      const maxObservedPostGraduationYear =
        cohort === "2022-2023" ? 2 : cohort === "2021-2022" ? 3 : 4;
      const provisional = cohort === "2021-2022" || cohort === "2022-2023";
      records.push({
        kind: "cohort_window",
        trainingLevel: level,
        cohort,
        provisional,
        maxObservedPostGraduationYear,
      });
      for (let year = 1; year <= maxObservedPostGraduationYear; year += 1) {
        for (const [measureIndex, measure] of (
          [
            "mean",
            "quintile_20_lower_boundary",
            "quintile_40_lower_boundary",
            "quintile_60_lower_boundary",
            "quintile_80_lower_boundary",
          ] as const
        ).entries()) {
          records.push({
            kind: "observation",
            observationId: observationId(nextObservation++),
            sourceTableId: level === "intermediate" ? "ccaa_2_07" : "ccaa_3_07",
            scope: "castilla_leon_training_level",
            trainingLevel: level,
            groupKey: null,
            officialGroupLabel: null,
            cohort,
            postGraduationYear: year as 1 | 2 | 3 | 4,
            measure,
            valueEur: 12000 + measureIndex * 1000,
            availability: "published",
            provisional,
          });
        }
        for (const group of groups.filter((value) => value.level === level)) {
          for (const [measureIndex, measure] of (
            [
              "mean",
              "quintile_20_lower_boundary",
              "quintile_40_lower_boundary",
              "quintile_60_lower_boundary",
              "quintile_80_lower_boundary",
            ] as const
          ).entries()) {
            const missing = group.key === groupKey(1) && measure === "mean";
            records.push({
              kind: "observation",
              observationId: observationId(nextObservation++),
              sourceTableId: group.table,
              scope: "spain_cycle_group",
              trainingLevel: level,
              groupKey: group.key,
              officialGroupLabel: group.label,
              cohort,
              postGraduationYear: year as 1 | 2 | 3 | 4,
              measure,
              valueEur: missing ? null : 13000 + measureIndex * 1000,
              availability: missing
                ? "unavailable_or_unrepresentative"
                : "published",
              provisional,
            });
          }
        }
      }
    }
  }
  return records;
}

function installData(
  options: { stale?: boolean; outcome?: boolean; invalid?: boolean } = {},
) {
  const stale = options.stale ?? false;
  const manifest = {
    qualityStatus: stale ? "stale" : "passed",
    resourceSnapshots: {
      outcomeIndicators: { qualityStatus: stale ? "stale" : "passed" },
    },
  };
  generatedDataClient.loadManifest.mockResolvedValue(manifest);
  if (options.invalid) {
    generatedDataClient.loadOutcomeIndicators.mockRejectedValue(
      new Error("invalid fixture"),
    );
  } else {
    generatedDataClient.loadOutcomeIndicators.mockResolvedValue(
      options.outcome === false ? null : incomeResource(),
    );
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CompareStudiesPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("CompareStudiesPage", () => {
  it("selects one level first and presents up to three groups with shared evidence", async () => {
    installData();
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("Cargando la comparación oficial…")).toBeVisible();
    await user.click(await screen.findByRole("radio", { name: "Grado medio" }));
    await user.click(screen.getByRole("checkbox", { name: "Grupo medio 1" }));
    await user.click(screen.getByRole("checkbox", { name: "Grupo medio 2" }));
    await user.click(screen.getByRole("checkbox", { name: "Grupo medio 3" }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Ingresos observados" }),
    ).toBeVisible();
    expect(screen.getByText(/Cohorte 2022-2023 · provisional/u)).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Ingresos observados del ciclo o grupo en España",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("region", {
        name: "Ingresos observados del ciclo o grupo en España",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Referencia de titulados de grado medio en Castilla y León",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("region", {
        name: "Referencia de titulados de grado medio en Castilla y León",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Mostramos ambas referencias por separado porque no existe una estadística oficial de ingresos por ciclo formativo en Castilla y León.",
      ),
    ).toBeVisible();
    expect(screen.getAllByText(/Base de cotización anualizada/u)).toHaveLength(
      2,
    );
    for (const label of measureLabels) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText("Corte del 20 %").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cómo leer los cortes").length).toBe(1);
    expect(
      screen.getAllByText("No disponible o sin representatividad suficiente")
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        /salario esperado|ganarás|afiliación|empleo e ingresos/iu,
      ),
    ).not.toBeInTheDocument();
    expect(document.querySelector("svg, canvas")).toBeNull();
  });

  it("keeps unavailable, invalid, and stale evidence explicit", async () => {
    installData({ outcome: false });
    const { unmount } = renderPage();
    expect(
      await screen.findByText(
        "La comparación oficial no está disponible en esta versión de los datos.",
      ),
    ).toBeVisible();

    unmount();
    installData({ invalid: true });
    renderPage();
    expect(
      await screen.findByText(
        "No se ha podido comprobar la comparación oficial.",
      ),
    ).toBeVisible();

    cleanup();
    installData({ stale: true });
    renderPage();
    expect(await screen.findByRole("status")).toHaveTextContent(
      /última copia disponible/i,
    );
  });

  it("disables years outside the selected observation window", async () => {
    installData();
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("radio", { name: "Grado superior" }),
    );
    const yearFour = within(
      screen.getByRole("group", { name: "4. Año tras titularse" }),
    ).getByRole("radio", { name: "4" });
    expect(yearFour).toBeDisabled();
  });

  it("keeps one chosen cohort shared while allowing an observed four-year window", async () => {
    installData();
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("radio", { name: "Grado medio" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "3. Cohorte de titulación" }),
      "2020-2021",
    );
    const yearFour = within(
      screen.getByRole("group", { name: "4. Año tras titularse" }),
    ).getByRole("radio", { name: "4" });
    expect(yearFour).toBeEnabled();
  });

  it("preserves an explicitly selected unobserved year after changing cohort", async () => {
    installData();
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("radio", { name: "Grado medio" }));
    await user.click(screen.getByRole("checkbox", { name: "Grupo medio 1" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "3. Cohorte de titulación" }),
      "2020-2021",
    );
    await user.click(
      within(
        screen.getByRole("group", { name: "4. Año tras titularse" }),
      ).getByRole("radio", { name: "4" }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "3. Cohorte de titulación" }),
      "2022-2023",
    );

    const yearFour = within(
      screen.getByRole("group", { name: "4. Año tras titularse" }),
    ).getByRole("radio", { name: "4" });
    expect(yearFour).toBeChecked();
    expect(yearFour).toBeDisabled();
    expect(
      screen.getByText(
        "Año todavía no observado para la cohorte seleccionada.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "Evidencia seleccionada" }),
    ).not.toBeInTheDocument();
  });

  it("filters official groups without hiding a selected group or ignoring diacritics", async () => {
    installData();
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("radio", { name: "Grado medio" }));
    await user.click(screen.getByRole("checkbox", { name: "Grupo medio 1" }));
    await user.type(
      screen.getByRole("searchbox", {
        name: "Filtrar ciclos o grupos oficiales",
      }),
      "grúpo médío 2",
    );

    expect(
      screen.getByRole("checkbox", { name: "Grupo medio 1" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Grupo medio 2" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("checkbox", { name: "Grupo medio 3" }),
    ).not.toBeInTheDocument();

    await user.clear(
      screen.getByRole("searchbox", {
        name: "Filtrar ciclos o grupos oficiales",
      }),
    );
    await user.type(
      screen.getByRole("searchbox", {
        name: "Filtrar ciclos o grupos oficiales",
      }),
      "sin coincidencias",
    );
    expect(
      screen.getByText("No hay ciclos o grupos oficiales que coincidan."),
    ).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: "Grupo medio 1" }),
    ).toBeChecked();
  });

  it("matches every normalized search word without requiring a contiguous phrase", async () => {
    installData();
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("radio", { name: "Grado superior" }),
    );
    await user.type(
      screen.getByRole("searchbox", {
        name: "Filtrar ciclos o grupos oficiales",
      }),
      "desarrollo web",
    );

    expect(
      screen.getByRole("checkbox", {
        name: "Desarrollo de aplicaciones web",
      }),
    ).toBeVisible();
  });

  it("counts a selected matching group as visible instead of showing an empty state", async () => {
    installData();
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("radio", { name: "Grado superior" }),
    );
    await user.type(
      screen.getByRole("searchbox", {
        name: "Filtrar ciclos o grupos oficiales",
      }),
      "desarrollo web",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "Desarrollo de aplicaciones web",
      }),
    );

    expect(screen.getByText("1 resultado disponible.")).toBeVisible();
    expect(
      screen.queryByText("No hay ciclos o grupos oficiales que coincidan."),
    ).not.toBeInTheDocument();
  });

  it("stacks the visual comparison on mobile without removing table semantics", () => {
    expect(comparisonStyles).toMatch(/@media \(max-width: 47\.999rem\)/u);
    expect(comparisonStyles).toMatch(/\.income-level-options,/u);
    expect(comparisonStyles).toMatch(/\.income-bar__track/u);
    expect(comparisonStyles).toMatch(/\.income-evidence-card table/u);
    expect(comparisonStyles).toMatch(/\.income-evidence-grid/u);
  });
});
