import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OutcomeIndicatorsResource } from "../../../data/schemas/outcomes";
import { indexIncomeOutcomes } from "../../domain/outcomes";
const comparisonStyles = readFileSync(
  "src/features/compare-studies/compareStudies.css",
  "utf8",
);

const generatedDataClient = vi.hoisted(() => ({
  loadManifest: vi.fn(),
  loadFoundationResourceSubset: vi.fn(),
  loadOutcomeIndicators: vi.fn(),
  isGeneratedDataAbortError: vi.fn(
    (error: unknown) => error instanceof Error && error.name === "AbortError",
  ),
}));

vi.mock("../../data/generatedDataClient", () => generatedDataClient);

import {
  CompareStudiesPage,
  resolveProgramSelection,
} from "./CompareStudiesPage";

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
  options: {
    stale?: boolean;
    outcome?: boolean;
    invalid?: boolean;
    programs?: readonly {
      programKey: string;
      programTitle: string;
      level: "basic" | "intermediate" | "higher" | "specialization";
      familyCode: string;
      familyName: string;
    }[];
  } = {},
) {
  const stale = options.stale ?? false;
  const manifest = {
    qualityStatus: stale ? "stale" : "passed",
    resourceSnapshots: {
      outcomeIndicators: {
        qualityStatus: stale ? "stale" : "passed",
        sourceUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/",
        sourceUpdatedAt: "2026-07-31T00:00:00.000Z",
        snapshotFetchedAt: "2026-08-04T10:00:00.000Z",
      },
    },
  };
  generatedDataClient.loadManifest.mockResolvedValue(manifest);
  generatedDataClient.loadFoundationResourceSubset.mockResolvedValue({
    contract: "current",
    programs: options.programs ?? [],
  });
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

function LocationProbe() {
  const location = useLocation();
  return (
    <span aria-hidden="true" data-testid="location-search">
      {location.search}
    </span>
  );
}

function BackProbe() {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => navigate(-1)}>
        Atrás de prueba
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Adelante de prueba
      </button>
    </>
  );
}

function renderPage(
  initialEntries: string[] = ["/comparar"],
  withBackProbe = false,
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <CompareStudiesPage />
      <LocationProbe />
      {withBackProbe ? <BackProbe /> : null}
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("CompareStudiesPage", () => {
  it("passes an abort signal and aborts the comparison request on unmount", async () => {
    let resolveManifest!: (manifest: unknown) => void;
    generatedDataClient.loadManifest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveManifest = resolve;
        }),
    );
    const { unmount } = renderPage();
    await waitFor(() =>
      expect(generatedDataClient.loadManifest).toHaveBeenCalled(),
    );
    const options = generatedDataClient.loadManifest.mock.calls[0]?.[0] as {
      signal?: AbortSignal;
    };
    expect(options.signal).toBeInstanceOf(AbortSignal);
    unmount();
    expect(options.signal).toHaveProperty("aborted", true);
    resolveManifest({});
  });

  it("selects one level first and presents up to three groups with shared evidence", async () => {
    installData();
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByText("Cargando los datos de comparación…"),
    ).toBeVisible();
    await user.click(await screen.findByRole("radio", { name: "Grado medio" }));
    await user.click(screen.getByRole("checkbox", { name: "Grupo medio 1" }));
    await user.click(screen.getByRole("checkbox", { name: "Grupo medio 2" }));
    await user.click(screen.getByRole("checkbox", { name: "Grupo medio 3" }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Ingresos observados" }),
    ).toBeVisible();
    expect(
      screen.getByRole("list", { name: "Pasos de la comparación" }),
    ).toHaveTextContent("1Nivel2Ciclos3Cohorte4Año");
    expect(
      screen.getByText("No es una predicción salarial personal."),
    ).toBeVisible();
    expect(screen.getByText(/Cohorte 2019-2020 · año 4/u)).toBeVisible();
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
        "Mostramos ambas referencias por separado porque la fuente consultada no publica ingresos por ciclo concreto en Castilla y León; solo ofrece una referencia conjunta para Grado Medio o Grado Superior.",
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
    expect(
      screen.getByRole("button", { name: "Imprimir esta orientación" }),
    ).toBeVisible();
  });

  it("keeps unavailable, invalid, and stale evidence explicit", async () => {
    installData({ outcome: false });
    const { unmount } = renderPage();
    expect(
      await screen.findByText(
        "Los datos de comparación no están disponibles en esta versión.",
      ),
    ).toBeVisible();

    unmount();
    installData({ invalid: true });
    renderPage();
    expect(
      await screen.findByText(
        "No se han podido cargar o validar los datos de comparación.",
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
    // 2022-2023 only has 2 years observed, so year 4 must be disabled
    await user.selectOptions(
      screen.getByRole("combobox", { name: "3. Cohorte de titulación" }),
      "2022-2023",
    );
    const yearFour = within(
      screen.getByRole("group", { name: "4. Año tras titularse" }),
    ).getByRole("radio", { name: "4" });
    expect(yearFour).toBeDisabled();
  });

  it("defaults to 2019-2020 cohort and year 4", async () => {
    installData();
    const user = userEvent.setup();
    renderPage();

    // Select Grado medio, which resets to 2019-2020 and year 4
    await user.click(await screen.findByRole("radio", { name: "Grado medio" }));
    await user.click(screen.getByRole("checkbox", { name: "Grupo medio 1" }));
    expect(screen.getByText(/Cohorte 2019-2020/u)).toBeVisible();
    const year4Checked = within(
      screen.getByRole("group", { name: "4. Año tras titularse" }),
    ).getByRole("radio", { name: "4" });
    expect(year4Checked).toBeChecked();
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

  it("keeps both evidence scopes and the print contract intact", () => {
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-comparison-form,\s*\.compare-page \.compare-page__actions[\s\S]*?display: none !important;/u,
    );
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-evidence-grid[\s\S]*?grid-template-columns: 1fr;/u,
    );
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-evidence-card[\s\S]*?overflow: visible;/u,
    );
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-table-scroll[\s\S]*?overflow: visible;/u,
    );
  });

  it("compacts the comparison evidence and protects the printed handoff", () => {
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-results\s*\{[\s\S]*?gap: 0\.75rem;/u,
    );
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-results__guide\s*\{[\s\S]*?gap: 0\.25rem;[\s\S]*?padding: 0\.625rem 0\.75rem;/u,
    );
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-evidence-card__header\s*\{[\s\S]*?padding: 0\.75rem 1rem;/u,
    );
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-series-list\s*\{[\s\S]*?gap: 0\.75rem;[\s\S]*?padding: 0\.75rem;/u,
    );
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-series\s*\{[\s\S]*?padding: 0\.75rem;/u,
    );
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-bars\s*\{[\s\S]*?gap: 0\.5rem;[\s\S]*?margin: 0\.75rem 0 0;/u,
    );
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-technical-detail\s*\{[\s\S]*?display: none !important;/u,
    );
    expect(comparisonStyles).toMatch(
      /\.compare-page \.income-limitation,[\s\S]*?\.compare-page \.income-results__source\s*\{[\s\S]*?break-inside: avoid;/u,
    );
  });

  it("loads outcomes and only programs from the same manifest and signal", async () => {
    installData();
    renderPage();

    await screen.findByRole("heading", { name: "Ingresos observados" });
    const outcomeCall = generatedDataClient.loadOutcomeIndicators.mock
      .calls[0] as [unknown, { signal: AbortSignal }];
    const programsCall = generatedDataClient.loadFoundationResourceSubset.mock
      .calls[0] as [unknown, readonly string[], { signal: AbortSignal }];
    expect(programsCall[0]).toBe(outcomeCall[0]);
    expect(programsCall[1]).toEqual(["programs"]);
    expect(outcomeCall[1]).toBe(programsCall[2]);
    expect(outcomeCall[1].signal).toBe(programsCall[2].signal);
  });

  it("restores a canonical selection from the URL and keeps its order", async () => {
    installData();
    const query = `level=higher&group=${groupKey(35)}&group=${groupKey(36)}&cohort=2019-2020&year=4`;
    renderPage([`/comparar?${query}`]);

    expect(await screen.findByText(/Cohorte 2019-2020 · año 4/u)).toBeVisible();
    expect(screen.getByRole("radio", { name: "Grado superior" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Desarrollo de aplicaciones web" }),
    ).toBeChecked();
    expect(screen.getByTestId("location-search")).toHaveTextContent(query);
  });

  it("keeps the outcome source and snapshot date with both printed scopes", async () => {
    installData();
    renderPage([
      `/comparar?level=higher&group=${groupKey(35)}&cohort=2019-2020&year=4`,
    ]);

    expect(
      await screen.findByRole("link", { name: /Fuente: EDUCAbase/u }),
    ).toHaveAttribute(
      "href",
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/",
    );
    expect(screen.getByText("Copia del 4 de agosto de 2026.")).toBeVisible();
  });

  it("fails closed for invalid links without echoing arbitrary URL text", async () => {
    installData();
    const query =
      "level=higher&group=secret-arbitrary-value&cohort=2019-2020&year=4";
    renderPage([`/comparar?${query}`]);

    const notice = await screen.findByRole("alert");
    expect(notice).toHaveTextContent(
      "Este enlace de comparación no es válido. Elige de nuevo los datos para continuar.",
    );
    expect(notice).not.toHaveTextContent("secret-arbitrary-value");
    expect(
      screen.queryByRole("region", { name: "Evidencia seleccionada" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Grado medio" })).toBeVisible();
  });

  it("canonicalizes one exact cycle match from a program URL", async () => {
    installData({
      programs: [
        {
          programKey: "IFC03S",
          programTitle: "Desarrollo de Aplicaciones Web",
          level: "higher",
          familyCode: "IFC",
          familyName: "Informática y Comunicaciones",
        },
      ],
    });
    renderPage(["/comparar?program=IFC03S"]);

    expect(await screen.findByText(/Cohorte 2019-2020 · año 4/u)).toBeVisible();
    await waitFor(() =>
      expect(screen.getByTestId("location-search")).toHaveTextContent(
        `level=higher&group=${groupKey(35)}&cohort=2019-2020&year=4`,
      ),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps an exact cycle manual when its default year 4 is unobserved", () => {
    const index = indexIncomeOutcomes(incomeResource());
    const windowsByLevelAndCohort = new Map(index.windowsByLevelAndCohort);
    const defaultWindow = windowsByLevelAndCohort.get("higher\u00002019-2020");
    expect(defaultWindow).toBeDefined();
    windowsByLevelAndCohort.set("higher\u00002019-2020", {
      ...defaultWindow!,
      maxObservedPostGraduationYear: 3,
    });

    const resolution = resolveProgramSelection(
      {
        programKey: "IFC03S",
        programTitle: "Desarrollo de Aplicaciones Web",
        level: "higher",
        familyCode: "IFC",
        familyName: "Informática y Comunicaciones",
      },
      { ...index, windowsByLevelAndCohort },
    );

    expect(resolution.trainingLevel).toBe("higher");
    expect(resolution.selection).toBeNull();
    expect(resolution.notice).toContain(
      "no hay un año observado completo para preseleccionarlo",
    );
  });

  it("keeps family-only, unknown, ambiguous, and unsupported program links manual", async () => {
    installData({
      programs: [
        {
          programKey: "FAMILY01",
          programTitle: "Ciclo sin grupo propio",
          level: "higher",
          familyCode: "FAM",
          familyName: "Grupo superior 2",
        },
        {
          programKey: "DUPLICATE",
          programTitle: "Uno",
          level: "higher",
          familyCode: "FAM",
          familyName: "Ninguna",
        },
        {
          programKey: "DUPLICATE",
          programTitle: "Dos",
          level: "higher",
          familyCode: "FAM",
          familyName: "Ninguna",
        },
        {
          programKey: "BASIC01",
          programTitle: "Ciclo básico",
          level: "basic",
          familyCode: "BAS",
          familyName: "Ninguna",
        },
        {
          programKey: "NOMATCH",
          programTitle: "Ciclo sin resultado",
          level: "higher",
          familyCode: "NOM",
          familyName: "Familia inexistente",
        },
      ],
    });

    const cases = [
      ["FAMILY01", /referencia de familia profesional/u],
      ["DUPLICATE", /no identifica un único ciclo oficial/u],
      ["BASIC01", /solo está disponible para grado medio y grado superior/iu],
      ["NOMATCH", /no hay una relación de ingresos publicada/iu],
      ["UNKNOWN", /no se ha encontrado el ciclo oficial solicitado/iu],
    ] as const;
    for (const [programKey, message] of cases) {
      cleanup();
      renderPage([`/comparar?program=${programKey}`]);
      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(
        screen.queryByRole("region", { name: "Evidencia seleccionada" }),
      ).not.toBeInTheDocument();
    }
  });

  it("replaces the canonical query on manual changes and keeps level-only state local", async () => {
    installData();
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("radio", { name: "Grado superior" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Desarrollo de aplicaciones web" }),
    );
    expect(screen.getByTestId("location-search")).toHaveTextContent(
      `level=higher&group=${groupKey(35)}&cohort=2019-2020&year=4`,
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Desarrollo de aplicaciones web" }),
    );
    expect(screen.getByTestId("location-search")).toHaveTextContent("");
    expect(screen.getByRole("radio", { name: "Grado superior" })).toBeChecked();
    expect(
      screen.queryByRole("region", { name: "Evidencia seleccionada" }),
    ).not.toBeInTheDocument();
  });

  it("uses router replacement so a manual selection does not add a history step", async () => {
    installData();
    const user = userEvent.setup();
    renderPage(["/comparar?unexpected=1", "/comparar"], true);

    await user.click(
      await screen.findByRole("radio", { name: "Grado superior" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Desarrollo de aplicaciones web" }),
    );
    await user.click(screen.getByRole("button", { name: "Atrás de prueba" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Este enlace de comparación no es válido.",
    );
    expect(screen.getByTestId("location-search")).toHaveTextContent(
      "?unexpected=1",
    );
  });

  it("reconstructs the empty form on Back and Forward after a controlled clear", async () => {
    installData();
    const user = userEvent.setup();
    const query = `level=higher&group=${groupKey(35)}&cohort=2019-2020&year=4`;
    renderPage(["/comparar", `/comparar?${query}`], true);

    expect(await screen.findByText(/Cohorte 2019-2020 · año 4/u)).toBeVisible();
    const group = screen.getByRole("checkbox", {
      name: "Desarrollo de aplicaciones web",
    });
    expect(group).toBeChecked();

    await user.click(group);
    expect(screen.getByTestId("location-search")).toHaveTextContent("");
    expect(screen.getByRole("radio", { name: "Grado superior" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Atrás de prueba" }));
    await waitFor(() =>
      expect(
        screen.getByRole("radio", { name: "Grado superior" }),
      ).not.toBeChecked(),
    );
    expect(
      screen.getByText("Selecciona primero el nivel de formación."),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Adelante de prueba" }),
    );
    expect(
      screen.getByRole("radio", { name: "Grado superior" }),
    ).not.toBeChecked();
    expect(
      screen.getByText("Selecciona primero el nivel de formación."),
    ).toBeVisible();
  });

  it("renders and invokes print only for a valid comparison", async () => {
    installData();
    const print = vi.fn();
    vi.stubGlobal("print", print);
    Object.defineProperty(window, "print", {
      configurable: true,
      value: print,
    });
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.queryByRole("button", { name: "Imprimir esta orientación" }),
    ).not.toBeInTheDocument();
    await user.click(
      await screen.findByRole("radio", { name: "Grado superior" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Desarrollo de aplicaciones web" }),
    );
    const printButton = screen.getByRole("button", {
      name: "Imprimir esta orientación",
    });
    await user.click(printButton);
    expect(print).toHaveBeenCalledTimes(1);
  });
});
