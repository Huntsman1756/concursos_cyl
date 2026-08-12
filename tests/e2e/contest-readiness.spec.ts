import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

type RouteDiagnostics = {
  failedRequests: string[];
  badResponses: string[];
  consoleErrors: string[];
  externalRequests: string[];
};

function installRouteDiagnostics(page: Page): RouteDiagnostics {
  const diagnostics: RouteDiagnostics = {
    failedRequests: [],
    badResponses: [],
    consoleErrors: [],
    externalRequests: [],
  };
  const baseOrigin = "http://127.0.0.1:4173";

  page.on("requestfailed", (request) => {
    diagnostics.failedRequests.push(
      `${request.method()} ${request.url()} — ${request.failure()?.errorText ?? "unknown"}`,
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      diagnostics.badResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error")
      diagnostics.consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = request.url();
    if (/^https?:/u.test(url) && new URL(url).origin !== baseOrigin) {
      diagnostics.externalRequests.push(url);
    }
  });

  return diagnostics;
}

async function expectStableRoute(
  page: Page,
  diagnostics: RouteDiagnostics,
): Promise<void> {
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
  await expect(
    page.locator("p").filter({
      hasText: /^(?:Cargando|Preparando|Buscando|Comprobando)/u,
    }),
  ).toHaveCount(0);

  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);

  const { violations } = await new AxeBuilder({ page }).analyze();
  const seriousOrCritical = violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );
  expect(seriousOrCritical, JSON.stringify(violations, null, 2)).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
  expect(diagnostics.badResponses).toEqual([]);
  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.externalRequests).toEqual([]);
}

async function chooseHigherComparison(page: Page): Promise<void> {
  await page.getByText("Grado superior", { exact: true }).click();
  await page
    .getByLabel("Filtrar ciclos o grupos")
    .fill("Administración y finanzas");
  await page.getByText("Administración y finanzas", { exact: true }).click();
  await page.getByLabel("3. Cohorte de titulación").selectOption("2022-2023");
  await page
    .getByRole("group", { name: "4. Año tras titularse" })
    .getByText("2", { exact: true })
    .click();
}

test.describe("contest readiness journeys", () => {
  test("keeps the root journey loaded, navigable, and evidence-safe", async ({
    page,
  }) => {
    const diagnostics = installRouteDiagnostics(page);
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /De tu FP a tu\s*siguiente paso/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Principal" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Cobertura revisada" }),
    ).toHaveAttribute("aria-busy", "false");
    await expect(
      page.getByRole("region", { name: "Actualización de datos" }),
    ).toHaveAttribute("aria-busy", "false");
    await expectStableRoute(page, diagnostics);
  });

  test("loads the FP search before submit and preserves the root deep-link contract", async ({
    page,
  }) => {
    const diagnostics = installRouteDiagnostics(page);
    await page.goto("/desde-fp");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Consulta salidas y ofertas relacionadas con tu FP",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Ciclo de Formación Profesional" }),
    ).toBeVisible();
    await expect(page.locator("section.training-page")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expectStableRoute(page, diagnostics);
  });

  test("shows a reviewed cycle with bounded current matches on a direct route", async ({
    page,
  }) => {
    const diagnostics = installRouteDiagnostics(page);
    await page.goto("/desde-fp/EOC01M");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Construcción",
    );
    await expect(page.getByRole("article").first()).toBeVisible();
    await expect(
      page.getByText(/no hay (empleo|trabajo|puestos)/iu),
    ).toHaveCount(0);
    await expectStableRoute(page, diagnostics);
  });

  test("keeps HOT, SSC, and EOC empty or matched states honest", async ({
    page,
  }) => {
    const diagnostics = installRouteDiagnostics(page);

    for (const programKey of ["HOT01M", "SSC01M", "EOC01M"]) {
      await page.goto(`/desde-fp/${programKey}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByText(/no hay (empleo|trabajo|puestos)/iu),
      ).toHaveCount(0);
    }

    await expectStableRoute(page, diagnostics);
  });

  test("marks COM01M unavailable before and after the search", async ({
    page,
  }) => {
    const diagnostics = installRouteDiagnostics(page);
    await page.goto("/desde-fp");

    const programSelect = page.getByRole("combobox", {
      name: "Ciclo de Formación Profesional",
    });
    await programSelect.selectOption("COM01M");
    await expect(page.getByRole("status")).toContainText(
      /salidas oficiales disponibles.*todavía no hay una relación revisada para buscar ofertas/i,
    );
    await page.getByRole("button", { name: "Ver salidas y ofertas" }).click();
    await expect(page).toHaveURL(/\/desde-fp\/COM01M$/u);
    await expect(
      page.getByText(
        /Todavía no hay una relación revisada que permita buscar ofertas/i,
      ),
    ).toBeVisible();
    await expect(
      page.getByText(/no hay (empleo|trabajo|puestos)/iu),
    ).toHaveCount(0);
    await expectStableRoute(page, diagnostics);
  });

  test("renders both official comparison scopes without loading errors", async ({
    page,
  }) => {
    const diagnostics = installRouteDiagnostics(page);
    await page.goto("/comparar");
    await expect(
      page.getByRole("heading", { level: 1, name: "Ingresos observados" }),
    ).toBeVisible();
    await chooseHigherComparison(page);
    await expect(
      page.getByRole("heading", {
        name: "Ingresos observados del ciclo o grupo en España",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Referencia de titulados de grado superior en Castilla y León",
      }),
    ).toBeVisible();
    await expectStableRoute(page, diagnostics);
  });

  test("exposes methodology sources and limitations after its manifest settles", async ({
    page,
  }) => {
    const diagnostics = installRouteDiagnostics(page);
    await page.goto("/metodologia");
    await expect(
      page.getByRole("heading", { level: 1, name: "Metodología y fuentes" }),
    ).toBeVisible();
    for (const disclosure of await page
      .getByText("Ver actualización, identificadores y descargas")
      .all()) {
      await disclosure.click();
    }
    for (const tableId of [
      "famprof_2_08",
      "famprof_3_08",
      "ccaa_2_07",
      "ccaa_3_07",
    ]) {
      await page.getByText(new RegExp(`^${tableId}`, "u")).click();
    }
    await expect(
      page.getByRole("link", { name: "Ficha oficial del catálogo" }),
    ).toHaveCount(4);
    await expect(
      page.getByRole("heading", { name: "Qué no permite afirmar" }),
    ).toHaveCount(4);
    await expect(
      page.getByRole("article", { name: "Qué estudiar y dónde se imparte" }),
    ).toContainText("187 ciclos oficiales");
    await expectStableRoute(page, diagnostics);
  });

  test("does not persist or contact third-party tracking services", async ({
    page,
  }) => {
    const diagnostics = installRouteDiagnostics(page);
    await page.goto("/");
    await page
      .getByLabel("Título de Formación Profesional")
      .selectOption("COM01M");
    await page.getByRole("button", { name: "Ver mis opciones" }).click();
    await expect(page).toHaveURL(/\/desde-fp\/COM01M$/u);
    await page.getByRole("link", { name: "Comparar estudios" }).click();
    await expect(page).toHaveURL(/\/comparar$/u);
    await expect(
      page.getByRole("heading", { name: "Ingresos observados" }),
    ).toBeVisible();

    const browserState = await page.evaluate(() => ({
      cookie: document.cookie,
      localStorage: Object.keys(localStorage),
      sessionStorage: Object.keys(sessionStorage),
    }));
    expect(browserState).toEqual({
      cookie: "",
      localStorage: [],
      sessionStorage: [],
    });
    await expect(
      page.getByRole("link", { name: /iniciar sesión|mi cuenta|perfil/iu }),
    ).toHaveCount(0);
    expect(diagnostics.externalRequests).toEqual([]);
    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.failedRequests).toEqual([]);
    expect(diagnostics.badResponses).toEqual([]);
  });
});
