import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { currentManifestFixture } from "../fixtures/generatedManifest";

async function expectReleaseAccessibility(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    ),
  ).toEqual([]);
}

async function installPrintSpy(page: Page): Promise<void> {
  await page.evaluate(() => {
    type PrintWindow = Window & { __task8PrintCalls?: number };
    const target = window as PrintWindow;
    Object.defineProperty(target, "__task8PrintCalls", {
      configurable: true,
      value: 0,
      writable: true,
    });
    Object.defineProperty(target, "print", {
      configurable: true,
      value: () => {
        target.__task8PrintCalls = (target.__task8PrintCalls ?? 0) + 1;
      },
    });
  });
}

async function printCallCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    type PrintWindow = Window & { __task8PrintCalls?: number };
    return (window as PrintWindow).__task8PrintCalls ?? 0;
  });
}

async function chooseComparison(
  page: Page,
  level: "Grado medio" | "Grado superior",
  group: string,
  cohort: string,
  year: string,
): Promise<void> {
  await page.getByText(level, { exact: true }).click();
  await expectReleaseAccessibility(page);
  await page.getByLabel("Filtrar ciclos o grupos").fill(group);
  await page.getByText(group, { exact: true }).click();
  await expectReleaseAccessibility(page);
  await page.getByLabel("3. Cohorte de titulación").selectOption(cohort);
  await expectReleaseAccessibility(page);
  await page
    .getByRole("group", { name: "4. Año tras titularse" })
    .getByText(year, { exact: true })
    .click();
  await expectReleaseAccessibility(page);
}

test("completes a higher comparison with one shared provisional period", async ({
  page,
}) => {
  await page.goto("/comparar");
  await chooseComparison(
    page,
    "Grado superior",
    "Administración y finanzas",
    "2022-2023",
    "2",
  );

  await expect(
    page.getByText("Cohorte 2022-2023 · provisional · año 2 tras titularse"),
  ).toBeVisible();
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
  await expectReleaseAccessibility(page);
});

test("preserves an unavailable source cell in an intermediate comparison", async ({
  page,
}) => {
  await page.goto("/comparar");
  await chooseComparison(
    page,
    "Grado medio",
    "Actividades comerciales",
    "2011-2012",
    "1",
  );

  await expect(
    page.getByText("No disponible", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Mostramos ambas referencias por separado porque la fuente consultada no publica ingresos por ciclo concreto en Castilla y León; solo ofrece una referencia conjunta para Grado Medio o Grado Superior.",
    ),
  ).toBeVisible();
  await expectReleaseAccessibility(page);
});

test("reloads the canonical comparison query with its selected evidence", async ({
  page,
}) => {
  const canonical =
    "/comparar?level=higher&group=income-group-db9adff8e25e2290&cohort=2019-2020&year=4";
  await page.goto(canonical);

  await expect(page).toHaveURL(`http://127.0.0.1:4173${canonical}`);
  await expect(
    page.getByText("Cohorte 2019-2020 · año 4 tras titularse"),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Desarrollo de aplicaciones web" }),
  ).toBeChecked();
  await expectReleaseAccessibility(page);

  await page.reload();
  await expect(page).toHaveURL(`http://127.0.0.1:4173${canonical}`);
  await expect(
    page.getByText("Cohorte 2019-2020 · año 4 tras titularse"),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Desarrollo de aplicaciones web" }),
  ).toBeChecked();
  await expectReleaseAccessibility(page);
});

test("rewrites an exact program comparator link to the canonical tuple and prints once", async ({
  page,
}) => {
  const canonical =
    "/comparar?level=higher&group=income-group-db9adff8e25e2290&cohort=2019-2020&year=4";
  await page.goto("/comparar?program=IFC03S");

  await expect(page).toHaveURL(`http://127.0.0.1:4173${canonical}`);
  const validQuery = new URL(page.url()).searchParams;
  expect(validQuery.get("level")).toBe("higher");
  expect(validQuery.get("group")).toBe("income-group-db9adff8e25e2290");
  expect(validQuery.get("cohort")).toBe("2019-2020");
  expect(validQuery.get("year")).toBe("4");
  await expect(
    page.getByRole("heading", {
      name: "Ingresos observados del ciclo o grupo en España",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Desarrollo de aplicaciones web" }),
  ).toBeChecked();
  await expectReleaseAccessibility(page);
  await expect(
    page.getByRole("button", { name: "Imprimir esta orientación" }),
  ).toBeVisible();
  await installPrintSpy(page);
  await page.getByRole("button", { name: "Imprimir esta orientación" }).click();
  await expect.poll(() => printCallCount(page)).toBe(1);
  await expectReleaseAccessibility(page);
});

test("keeps invalid comparison recovery fixed and non-reflective", async ({
  page,
}) => {
  const invalid =
    "/comparar?level=higher&group=secret-arbitrary-value&cohort=2019-2020&year=4";
  await page.goto(invalid);

  await expect(page).toHaveURL(`http://127.0.0.1:4173${invalid}`);
  await expect(page.getByRole("alert")).toHaveText(
    "Este enlace de comparación no es válido. Elige de nuevo los datos para continuar.",
  );
  await expect(page.getByText("secret-arbitrary-value")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Evidencia seleccionada" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Imprimir esta orientación" }),
  ).toHaveCount(0);
  await expectReleaseAccessibility(page);

  await chooseComparison(
    page,
    "Grado superior",
    "Administración y finanzas",
    "2019-2020",
    "4",
  );
  await expect(page).toHaveURL(
    "http://127.0.0.1:4173/comparar?level=higher&group=income-group-ed85f6e57803de93&cohort=2019-2020&year=4",
  );
  const validQuery = new URL(page.url()).searchParams;
  expect(validQuery.get("level")).toBe("higher");
  expect(validQuery.get("group")).toBe("income-group-ed85f6e57803de93");
  expect(validQuery.get("cohort")).toBe("2019-2020");
  expect(validQuery.get("year")).toBe("4");
  await expect(
    page.getByRole("region", { name: "Evidencia seleccionada" }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Administración y finanzas" }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Imprimir esta orientación" }),
  ).toBeVisible();
  await expectReleaseAccessibility(page);
});

test("reports an historical manifest without income evidence", async ({
  page,
}) => {
  const historical = currentManifestFixture() as ReturnType<
    typeof currentManifestFixture
  > & {
    resourceSnapshots: Record<string, unknown>;
  };
  delete historical.resourceSnapshots.outcomeIndicators;
  await page.route("**/data/v1/manifest.json", (route) =>
    route.fulfill({ json: historical }),
  );

  await page.goto("/comparar");
  await expect(
    page.getByText(
      "No se han podido cargar o validar los datos de comparación.",
    ),
  ).toBeVisible();
  await expectReleaseAccessibility(page);
});

test("keeps the comparison form keyboard reachable", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "WebKit keyboard focus follows the host Safari full-keyboard-access preference.",
  );
  await page.goto("/comparar");
  await expect(
    page.getByRole("button", { name: "Imprimir esta orientación" }),
  ).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Saltar al contenido" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("exposes comparison progress and technical tables to assistive technology", async ({
  page,
}) => {
  await page.goto("/comparar");

  const form = page.getByRole("form", {
    name: "Seleccionar datos de comparación",
  });
  await expect(form).toBeVisible();
  await expect(form.locator('[aria-current="step"]')).toHaveText(/Nivel/u);

  await page.getByText("Grado superior", { exact: true }).click();
  await expect(form.locator('[aria-current="step"]')).toHaveText(/Ciclos/u);

  await form.getByRole("checkbox").first().check();
  await expect(form.locator('[aria-current="step"]')).toHaveText(/Cohorte/u);

  await page
    .getByText("Ver términos técnicos y tabla de datos", { exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("region", { name: /Tabla técnica:/u }).first(),
  ).toBeVisible();
});
