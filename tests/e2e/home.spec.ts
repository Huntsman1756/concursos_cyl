import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const legacySnapshot = {
  sourceId: "jcyl-employment-offers",
  sourceUrl: "https://analisis.datosabiertos.jcyl.es/records",
  sourceUpdatedAt: "2026-07-31T00:00:00.000Z",
  snapshotFetchedAt: "2026-08-04T10:00:00.000Z",
  schemaVersion: "1.0.0",
  recordCount: 1,
  sha256: "a".repeat(64),
  qualityStatus: "stale",
} as const;

const staleLegacyManifest = {
  schemaVersion: "1.0.0",
  generatedAt: "2026-08-04T10:00:00.000Z",
  qualityStatus: "stale",
  resourceSnapshots: {
    programs: legacySnapshot,
    centers: legacySnapshot,
    trainingOfferings: legacySnapshot,
    jobOffers: legacySnapshot,
  },
} as const;

test("home exposes equal journeys, navigation, freshness, and no automated accessibility violations", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("navigation", { name: "Principal" }).getByRole("link"),
  ).toHaveText(["Inicio", "Comparar estudios", "Metodología"]);

  const journeyLinks = page
    .getByLabel("Elige tu punto de partida")
    .getByRole("link");
  await expect(journeyLinks).toHaveText([
    "Explorar: He terminado FP",
    "Explorar: Quiero trabajar de…",
  ]);
  await expect(
    page.getByRole("region", { name: "Actualización de datos" }),
  ).toContainText(/Datos actualizados: \d{1,2} de \p{L}+ de \d{4}/u);

  const results = await new AxeBuilder({ page }).analyze();
  const criticalViolations = results.violations.filter(
    ({ impact }) => impact === "critical",
  );
  expect(
    criticalViolations,
    JSON.stringify(criticalViolations, null, 2),
  ).toEqual([]);
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("both entry routes remain reachable in their approved order", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Explorar: He terminado FP" }).click();
  await expect(page).toHaveURL(/\/desde-fp$/u);

  await page.getByRole("link", { name: "Inicio" }).click();
  await page
    .getByRole("link", { name: "Explorar: Quiero trabajar de…" })
    .click();
  await expect(page).toHaveURL(/\/desde-ocupacion$/u);
});

test("the skip link moves keyboard focus to the main content", async ({
  page,
}) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main-content")).toBeFocused();
});

test("a validated stale legacy manifest keeps navigation and names the last update", async ({
  page,
}) => {
  await page.route("**/data/v1/manifest.json", (route) =>
    route.fulfill({ json: staleLegacyManifest }),
  );
  await page.goto("/");

  const freshness = page.getByRole("region", {
    name: "Actualización de datos",
  });
  await expect(freshness).toContainText(
    "Datos actualizados: 31 de julio de 2026",
  );
  await expect(freshness.locator("time")).toHaveAttribute(
    "datetime",
    "2026-07-31T00:00:00.000Z",
  );
  await expect(
    page.getByText(
      "No se han podido actualizar los datos. Mostramos la última copia disponible.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(/datos actuales|datos al día|ofertas actuales/iu),
  ).toHaveCount(0);

  await page.getByRole("link", { name: "Comparar estudios" }).click();
  await expect(page).toHaveURL(/\/comparar$/u);
});

test("the complete Spanish home copy fits without horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (testInfo.project.name === "chromium-mobile") {
    expect(viewport).toEqual({ width: 360, height: 800 });
  }

  await expect(
    page.getByRole("heading", {
      name: "Dos caminos para encontrar tu siguiente paso",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Ocupación → ciclos y centros de CyL"),
  ).toBeVisible();

  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
});
