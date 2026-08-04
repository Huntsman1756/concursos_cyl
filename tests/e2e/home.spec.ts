import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { currentManifestFixture } from "../fixtures/generatedManifest";

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
  const manifestResponsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/data/v1/manifest.json"),
  );
  await page.goto("/");
  const manifestResponse = await manifestResponsePromise;
  const manifest = (await manifestResponse.json()) as ReturnType<
    typeof currentManifestFixture
  >;

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
  const sourceUpdatedAt = manifest.resourceSnapshots.jobOffers.sourceUpdatedAt;
  expect(sourceUpdatedAt).not.toBeNull();
  const freshness = page.getByRole("region", {
    name: "Actualización de datos",
  });
  await expect(freshness.locator("time")).toHaveAttribute(
    "datetime",
    sourceUpdatedAt!,
  );
  await expect(freshness).toContainText(
    new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(sourceUpdatedAt!)),
  );

  const results = await new AxeBuilder({ page }).analyze();
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
  await expect(
    page.getByRole("heading", { name: "Empezar desde mi título de FP" }),
  ).toBeVisible();
  await expect(
    page.getByText("Relaciona tu ciclo con ofertas y requisitos publicados."),
  ).toBeVisible();

  await page.getByRole("link", { name: "Volver al inicio" }).click();
  await page
    .getByRole("link", { name: "Explorar: Quiero trabajar de…" })
    .click();
  await expect(page).toHaveURL(/\/desde-ocupacion$/u);
  await expect(
    page.getByRole("heading", { name: "Empezar desde una ocupación" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Consulta ciclos y centros relacionados en Castilla y León.",
    ),
  ).toBeVisible();
});

test("each remaining public route has distinct destination content", async ({
  page,
}) => {
  const destinations = [
    {
      path: "/comparar",
      heading: "Comparar estudios",
      outcome:
        "Compara indicadores de empleo e ingresos con su alcance visible.",
    },
    {
      path: "/metodologia",
      heading: "Metodología",
      outcome:
        "Consulta cómo se seleccionan, actualizan y explican las fuentes.",
    },
    {
      path: "/ruta-inexistente",
      heading: "Página no encontrada",
      outcome: "La dirección no corresponde a una página disponible.",
    },
  ];

  for (const destination of destinations) {
    await page.goto(destination.path);
    await expect(
      page.getByRole("heading", { name: destination.heading }),
    ).toBeVisible();
    await expect(page.getByText(destination.outcome)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Volver al inicio" }),
    ).toBeVisible();
  }
});

test("loading freshness is visible and marked busy before a delayed current manifest resolves", async ({
  page,
}) => {
  let releaseManifest!: () => void;
  const manifestDelay = new Promise<void>((resolve) => {
    releaseManifest = resolve;
  });
  await page.route("**/data/v1/manifest.json", async (route) => {
    await manifestDelay;
    await route.fulfill({ json: currentManifestFixture() });
  });

  await page.goto("/");
  const freshness = page.getByRole("region", {
    name: "Actualización de datos",
  });
  await expect(freshness).toHaveAttribute("aria-busy", "true");
  await expect(
    freshness.getByText("Comprobando la fecha de los datos…"),
  ).toBeVisible();

  releaseManifest();
  await expect(freshness).toHaveAttribute("aria-busy", "false");
  await expect(freshness.locator("time")).toHaveAttribute(
    "datetime",
    "2026-07-31T00:00:00.000Z",
  );
});

test("a current manifest falls back to the fetched timestamp and formats its UTC date", async ({
  page,
}) => {
  const fetchedAt = "2026-08-01T23:30:00.000Z";
  await page.route("**/data/v1/manifest.json", (route) =>
    route.fulfill({
      json: currentManifestFixture({
        sourceUpdatedAt: null,
        snapshotFetchedAt: fetchedAt,
      }),
    }),
  );
  await page.goto("/");

  const freshness = page.getByRole("region", {
    name: "Actualización de datos",
  });
  await expect(freshness.locator("time")).toHaveAttribute(
    "datetime",
    fetchedAt,
  );
  await expect(freshness).toContainText(
    "Datos actualizados: 1 de agosto de 2026",
  );
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
  await expect(
    page.getByRole("heading", { name: "Comparar estudios" }),
  ).toBeVisible();
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
