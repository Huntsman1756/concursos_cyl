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
  ).toHaveText(["Inicio", "Comparar", "Metodología"]);

  const journeyLinks = page
    .getByLabel("Elige tu punto de partida")
    .getByRole("link");
  await expect(journeyLinks).toHaveText([
    "Explorar salidas laborales",
    "Buscar ciclos que te preparan",
  ]);
  const jobOffersSnapshot = manifest.resourceSnapshots.jobOffers;
  const expectedDateTime =
    jobOffersSnapshot.sourceUpdatedAt ?? jobOffersSnapshot.snapshotFetchedAt;
  const freshness = page.getByRole("region", {
    name: "Actualización de datos",
  });
  await expect(freshness.locator("time")).toHaveAttribute(
    "datetime",
    expectedDateTime,
  );
  await expect(freshness).toContainText(
    new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(expectedDateTime)),
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

  await page.getByRole("link", { name: "Explorar salidas laborales" }).click();
  await expect(page).toHaveURL(/\/desde-fp$/u);
  await expect(
    page.getByRole("heading", {
      name: "Encuentra ofertas relacionadas con tu FP",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Ciclo de Formación Profesional")).toBeVisible();

  await page.getByRole("link", { name: "SALIDA CyL" }).click();
  await page
    .getByRole("link", { name: "Buscar ciclos que te preparan" })
    .click();
  await expect(page).toHaveURL(/\/desde-ocupacion$/u);
  await expect(
    page.getByRole("heading", {
      name: "Descubre qué FP conduce a un trabajo concreto",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", {
      name: "¿En qué ocupación quieres trabajar?",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ver rutas formativas" }),
  ).toBeDisabled();
});

test("the training-first journey keeps the live zero-match snapshot honest and accessible", async ({
  page,
}) => {
  const manifestResponsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/data/v1/manifest.json"),
  );
  await page.goto("/desde-fp");
  const manifestResponse = await manifestResponsePromise;
  const manifest = (await manifestResponse.json()) as ReturnType<
    typeof currentManifestFixture
  >;

  const programSelect = page.getByLabel("Ciclo de Formación Profesional");
  await expect(programSelect).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ver ofertas" }),
  ).toBeDisabled();
  await programSelect.selectOption("IFC03S");
  await page.getByRole("button", { name: "Ver ofertas" }).click();

  await expect(page).toHaveURL(/\/desde-fp\/IFC03S$/u);
  await expect(
    page.getByRole("heading", { name: "Desarrollo de Aplicaciones Web" }),
  ).toBeVisible();
  const jobSnapshot = manifest.resourceSnapshots.jobOffers;
  const expectedDate = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(jobSnapshot.sourceUpdatedAt ?? jobSnapshot.snapshotFetchedAt),
  );
  await expect(
    page.getByText(
      `No hay ofertas relacionadas en la instantánea del ${expectedDate}.`,
    ),
  ).toBeVisible();
  await expect(page.getByText(/compatibilidad|porcentaje|%/iu)).toHaveCount(0);

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("the regulated training route uses official offerings and centers", async ({
  page,
}) => {
  await page.goto("/formacion/IFC03S");

  await expect(
    page.getByRole("heading", {
      name: /Dónde estudiar Desarrollo de Aplicaciones WEB/iu,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Grado superior · Código oficial IFC03S/),
  ).toBeVisible();
  const centers = page.getByRole("list", {
    name: "Centros que imparten el ciclo",
  });
  await expect(centers.getByRole("listitem").first()).toBeVisible();
  await expect(
    centers.getByRole("link", { name: /Web del centro/ }).first(),
  ).toHaveAttribute("target", "_blank");

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("each remaining public route has distinct destination content", async ({
  page,
}) => {
  const destinations = [
    {
      path: "/comparar",
      heading: "Ingresos observados",
      outcome:
        "Consulta la base de cotización anualizada publicada para una cohorte, sin convertirla en una predicción personal.",
      hasHomeLink: false,
    },
    {
      path: "/metodologia",
      heading: "Metodología y fuentes",
      outcome:
        "Separamos las referencias oficiales por su alcance y publicamos la huella de la copia exacta utilizada.",
      hasHomeLink: false,
    },
    {
      path: "/ruta-inexistente",
      heading: "Página no encontrada",
      outcome: "La dirección no corresponde a una página disponible.",
      hasHomeLink: true,
    },
  ];

  for (const destination of destinations) {
    await page.goto(destination.path);
    await expect(
      page.getByRole("heading", { name: destination.heading }),
    ).toBeVisible();
    await expect(page.getByText(destination.outcome)).toBeVisible();
    if (destination.hasHomeLink) {
      await expect(
        page.getByRole("link", { name: "Volver al inicio" }),
      ).toBeVisible();
    }
  }
});

test("loading freshness is visible before a delayed current manifest prioritizes its source date", async ({
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
  await expect(freshness).toContainText(
    "Datos actualizados: 31 de julio de 2026",
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

  await page.getByRole("link", { name: "Comparar" }).click();
  await expect(page).toHaveURL(/\/comparar$/u);
  await expect(
    page.getByRole("heading", { name: "Ingresos observados" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "La comparación oficial no está disponible en esta versión de los datos.",
    ),
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
      name: "Elige tu camino y actúa con información oficial",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Dónde se imparten y cómo acceder"),
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

test("the selected workspace uses equal desktop panels and a stacked mobile flow", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  const panels = page.locator(".entry-card");
  const coverage = page.getByRole("region", { name: "Disponible ahora" });
  const reviewedPrograms = coverage
    .getByRole("list", {
      name: "Ciclos revisados",
    })
    .getByRole("listitem");
  await expect(reviewedPrograms).toHaveCount(6);
  const firstPanel = await panels.nth(0).boundingBox();
  const secondPanel = await panels.nth(1).boundingBox();
  const coveragePanel = await coverage.boundingBox();
  expect(firstPanel).not.toBeNull();
  expect(secondPanel).not.toBeNull();
  expect(coveragePanel).not.toBeNull();

  if (!firstPanel || !secondPanel || !coveragePanel) {
    return;
  }

  if (testInfo.project.name === "chromium-desktop") {
    expect(Math.abs(firstPanel.y - secondPanel.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(firstPanel.width - secondPanel.width)).toBeLessThanOrEqual(
      1,
    );
    expect(secondPanel.x).toBeGreaterThanOrEqual(
      firstPanel.x + firstPanel.width,
    );
    expect(coveragePanel.x).toBeGreaterThan(secondPanel.x + secondPanel.width);
  } else {
    expect(secondPanel.y).toBeGreaterThan(firstPanel.y + firstPanel.height);
    expect(coveragePanel.y).toBeGreaterThan(secondPanel.y + secondPanel.height);
    const firstCta = await panels.nth(0).getByRole("link").boundingBox();
    expect(firstCta).not.toBeNull();
    if (firstCta) {
      expect(firstCta.width).toBeGreaterThan(firstPanel.width * 0.8);
    }
  }

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("the home coverage panel exposes only manifest-reviewed program keys", async ({
  page,
}) => {
  await page.goto("/");

  const coverage = page.getByRole("region", { name: "Disponible ahora" });
  for (const programKey of [
    "IFC03S",
    "IFC03SD",
    "SAN21",
    "HOT01M",
    "SSC01M",
    "EOC01M",
  ]) {
    await expect(
      coverage.getByText(new RegExp(`^${programKey} ·`, "u")),
    ).toBeVisible();
  }
  await expect(coverage.getByText("COM01M", { exact: false })).toHaveCount(0);
});
