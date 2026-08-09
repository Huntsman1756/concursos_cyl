import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { currentManifestFixture } from "../fixtures/generatedManifest";

async function expectReleaseAccessibility(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    ),
  ).toEqual([]);
}

async function chooseComparison(
  page: Page,
  level: "Grado Medio" | "Grado Superior",
  group: string,
  cohort: string,
  year: string,
): Promise<void> {
  await page.getByText(level, { exact: true }).click();
  await page.getByLabel("Filtrar ciclos o grupos").fill(group);
  await page.getByText(group, { exact: true }).click();
  await page.getByLabel("3. Cohorte de titulación").selectOption(cohort);
  await page.getByText(year, { exact: true }).click();
}

test("completes a higher comparison with one shared provisional period", async ({
  page,
}) => {
  await page.goto("/comparar");
  await chooseComparison(
    page,
    "Grado Superior",
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
      name: "Referencia de titulados de Grado Superior en Castilla y León",
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
    "Grado Medio",
    "Actividades comerciales",
    "2011-2012",
    "1",
  );

  await expect(
    page.getByText("No disponible o sin representatividad suficiente").first(),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Mostramos ambas referencias por separado porque no existe una estadística oficial de ingresos por ciclo formativo en Castilla y León.",
    ),
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
      "La comparación oficial no está disponible en esta versión de los datos.",
    ),
  ).toBeVisible();
  await expectReleaseAccessibility(page);
});

test("keeps the comparison form keyboard reachable", async ({ page }) => {
  await page.goto("/comparar");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Saltar al contenido" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});
