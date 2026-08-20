import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EDUCABASE_INCOME_SOURCES } from "../../../scripts/data/educabaseIncomeSources";
import { SOURCE_CONFIG } from "../../../scripts/data/sourceConfig";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { MethodologyPage } from "./MethodologyPage";

const TERMS_URL = "https://www.educacionyfp.gob.es/comunes/aviso-legal.html";
const EXPECTED_SOURCE_HREFS = [
  "https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090080",
  "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_2_08.csv_bdsc?nocab=1",
  "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/famprof/l0/famprof_2_08.px?nocab=1",
  "https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090094",
  "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_3_08.csv_bdsc?nocab=1",
  "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/famprof/l0/famprof_3_08.px?nocab=1",
  "https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090044",
  "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/ccaa/l0/ccaa_2_07.csv_bdsc?nocab=1",
  "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/ccaa/l0/ccaa_2_07.px?nocab=1",
  "https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090057",
  "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/ccaa/l0/ccaa_3_07.csv_bdsc?nocab=1",
  "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/ccaa/l0/ccaa_3_07.px?nocab=1",
] as const;

function manifestWithIncomeEvidence() {
  const manifest = currentManifestFixture();
  const artifacts = Object.values(EDUCABASE_INCOME_SOURCES).flatMap((source) =>
    (["csv", "px"] as const).map((format, index) => ({
      tableId: source.tableId,
      format,
      sourceUrl: format === "csv" ? source.csvUrl : source.pxUrl,
      catalogUrl: source.catalogUrl,
      fetchedAt: "2026-08-09T01:43:18.761Z",
      declaredContentType:
        format === "csv"
          ? "text/plain;charset=ISO-8859-15"
          : "application/pc-axis;charset=ISO-8859-15",
      byteLength: 10_000 + index,
      sha256: (source.tableId.endsWith("08") ? "b" : "c").repeat(64),
      effectiveEncoding: format === "csv" ? "utf-8" : "iso-8859-15",
    })),
  );
  return {
    ...manifest,
    resourceSnapshots: {
      ...manifest.resourceSnapshots,
      outcomeIndicators: {
        ...manifest.resourceSnapshots.programs,
        sourceId: "educabase-income",
        sourceUrl: TERMS_URL,
        snapshotFetchedAt: "2026-08-09T01:43:18.761Z",
        recordCount: 22_170,
        sha256: "d".repeat(64),
        resourcePath: "/data/v1/snapshots/build-1/outcome-indicators.json",
        upstreamArtifacts: artifacts,
      },
    },
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MethodologyPage", () => {
  it("explains each income scope and its statistical limits without merging them", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(manifestWithIncomeEvidence()), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      ),
    );

    const { container } = render(
      <MemoryRouter>
        <MethodologyPage />
      </MemoryRouter>,
    );

    for (const disclosure of screen.getAllByText(
      "Ver actualización, identificadores y descargas",
    )) {
      await user.click(disclosure);
    }

    expect(
      screen.getByRole("heading", { level: 1, name: "Metodología y fuentes" }),
    ).toBeVisible();
    const national = screen.getByRole("article", {
      name: "Referencia por ciclo o grupo en España",
    });
    const regional = screen.getByRole("article", {
      name: "Referencia por nivel en Castilla y León",
    });
    const trainingCatalog = screen.getByRole("article", {
      name: "Qué estudiar y dónde se imparte",
    });
    await waitFor(() =>
      expect(trainingCatalog).toHaveTextContent(
        /copia publicada contiene 1 ciclo oficial/i,
      ),
    );
    expect(trainingCatalog).toHaveTextContent(
      /TodoFP aporta salidas profesionales literales.*relaciones revisadas con ocupaciones/i,
    );
    expect(
      within(trainingCatalog).getByRole("link", {
        name: "Dataset oficial de oferta de Formación Profesional",
      }),
    ).toHaveAttribute(
      "href",
      "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/oferta-de-formacion-profesional/records",
    );
    for (const card of [national, regional]) {
      for (const heading of [
        "Qué aporta",
        "Qué no permite afirmar",
        "Actualización de la copia",
        "Fuente original y archivos",
      ]) {
        expect(
          within(card).getByRole("heading", { level: 3, name: heading }),
        ).toBeVisible();
      }
    }

    expect(national).toHaveTextContent(/base de cotización.*anualizada/i);
    expect(national).toHaveTextContent(
      /personas asalariadas.*jornada completa/i,
    );
    expect(national).toHaveTextContent(/ciclos o grupos de FP en España/i);
    expect(national).toHaveTextContent(/cortes del 20 %, 40 %, 60 % y 80 %/i);
    expect(regional).toHaveTextContent(/centro donde se obtuvo la titulación/i);
    expect(regional).toHaveTextContent(/no.*residencia.*lugar de trabajo/i);

    const methodology = screen.getByRole("region", {
      name: "Metodología y fuentes",
    });
    const inventory = screen.getByRole("region", {
      name: "8 datasets de la Junta",
    });
    await waitFor(() =>
      expect(
        within(inventory).getByRole("row", { name: /Ofertas de empleo/ }),
      ).toHaveTextContent(/1/),
    );
    expect(within(inventory).getAllByText("CC BY 4.0 ES")).toHaveLength(8);
    expect(
      within(inventory).getByRole("link", { name: "Contratos por provincia" }),
    ).toHaveAttribute("href", SOURCE_CONFIG.regionalContracts.recordsUrl);
    expect(inventory).toHaveTextContent(
      /Contexto laboral territorial en resultados/i,
    );
    expect(
      within(inventory).getByRole("link", {
        name: "Directorio de Centros Docentes",
      }),
    ).toHaveAttribute(
      "href",
      SOURCE_CONFIG.educationCenterDirectory.recordsUrl,
    );
    expect(methodology).toHaveTextContent(
      /cruce administrativo.*registros educativos.*Seguridad Social/i,
    );
    expect(methodology).toHaveTextContent(
      /cohorte.*curso académico.*titulación/i,
    );
    expect(methodology).toHaveTextContent(
      /periodo.*años posteriores a la graduación/i,
    );
    expect(methodology).toHaveTextContent(
      /solo.*ciclos o grupos.*información representativa/i,
    );
    expect(methodology).toHaveTextContent(
      /cuenta propia.*jornada parcial.*quedan fuera/i,
    );
    expect(methodology).toHaveTextContent(
      /algunos ciclos.*grupos oficiales.*familia profesional/i,
    );

    for (const tableId of [
      "famprof_2_08",
      "famprof_3_08",
      "ccaa_2_07",
      "ccaa_3_07",
    ]) {
      expect(screen.getByText(tableId)).toBeVisible();
    }
    expect(
      screen.getByRole("link", { name: "Aviso legal del Ministerio" }),
    ).toHaveAttribute("href", TERMS_URL);
    for (const href of EXPECTED_SOURCE_HREFS) {
      expect(container.querySelector(`a[href="${href}"]`)).not.toBeNull();
    }
    expect(screen.getByText("Controles técnicos de publicación")).toBeVisible();
    expect(methodology).toHaveTextContent(
      /lista controlada de coincidencias literales de una sola palabra/i,
    );
    expect(methodology).toHaveTextContent(/sin stemming ni inferencia difusa/i);
    expect(methodology).toHaveTextContent(/para esta copia de datos/i);
    expect(methodology).toHaveTextContent(
      /revisa cada posible colisión.*título que combina varios roles/i,
    );

    expect(methodology).not.toHaveTextContent(/respaldo del Ministerio/i);
    expect(methodology).not.toHaveTextContent(
      /tasa de (?:empleo|afiliación)|indicador de (?:empleo|afiliación)/i,
    );
    expect(methodology).not.toHaveTextContent(
      /salario esperado|predicción salarial|ganarás/i,
    );
    expect(methodology).not.toHaveTextContent(
      /comparador externo|producto de terceros|sitio de referencia/i,
    );

    await waitFor(() =>
      expect(within(national).getByText(/9 de agosto de 2026/i)).toBeVisible(),
    );
    expect(within(national).getByText(/d{12}/i)).toBeVisible();
    expect(
      within(national).getByRole("link", {
        name: "Descargar los datos utilizados",
      }),
    ).toHaveAttribute(
      "href",
      "/data/v1/snapshots/build-1/outcome-indicators.json",
    );
  });

  it("documents unavailable cells, provisional windows, and last-known-good behavior", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(manifestWithIncomeEvidence()), {
            status: 200,
          }),
        ),
      ),
    );
    render(
      <MemoryRouter>
        <MethodologyPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/El valor «\.\.\u00bb/i)).toHaveTextContent(
      /no disponible o no representativo/i,
    );
    expect(screen.getByText(/Las ventanas observadas/i)).toHaveTextContent(
      /cuatro años.*tres.*dos/i,
    );
    expect(screen.getByText(/Si una actualización falla/i)).toHaveTextContent(
      /última copia válida/i,
    );
  });

  it("reports a historical manifest without income evidence as unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(currentManifestFixture()), {
            status: 200,
          }),
        ),
      ),
    );
    render(
      <MemoryRouter>
        <MethodologyPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findAllByText(
        /esta versión no contiene la evidencia de ingresos/i,
      ),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "Descargar evidencia normalizada" }),
    ).not.toBeInTheDocument();
  });
});
