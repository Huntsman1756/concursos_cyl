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
  ).toHaveText([
    "Inicio",
    "Desde FP",
    "Desde ocupación",
    "Comparar estudios",
    "Más formación",
    "Metodología",
  ]);

  const journeyButtons = page
    .getByLabel("Elige tu punto de partida")
    .getByRole("button");
  await expect(journeyButtons).toHaveText([
    "Ver mis opciones",
    "Buscar ocupación",
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
      day: "2-digit",
      month: "2-digit",
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

  await page
    .getByLabel("Título de Formación Profesional")
    .selectOption("IFC03S");
  await page.getByRole("button", { name: "Ver mis opciones" }).click();
  await expect(page).toHaveURL(/\/desde-fp\/IFC03S$/u);
  await expect(
    page.getByRole("heading", {
      name: "Desarrollo de Aplicaciones Web",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "SALIDA CyL" }).click();
  const occupationSearch = page.getByRole("combobox", {
    name: "Ocupación que te interesa",
  });
  await occupationSearch.fill("Programación web");
  await page
    .getByRole("option", {
      name: /Analistas, programadores y diseñadores web y multimedia/iu,
    })
    .click();
  await page.getByRole("button", { name: "Buscar ocupación" }).click();
  await expect(page).toHaveURL(
    /\/desde-ocupacion\/occupation%3Acno11%3A2713$/u,
  );
  await expect(
    page.getByRole("heading", {
      name: /Analistas, programadores y diseñadores web y multimedia/iu,
    }),
  ).toBeVisible();
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
    page.getByRole("button", { name: "Ver salidas y ofertas" }),
  ).toBeDisabled();
  await programSelect.selectOption("IFC03S");
  await page.getByRole("button", { name: "Ver salidas y ofertas" }).click();

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
      `No hay ofertas relacionadas en la copia de datos del ${expectedDate}.`,
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
        "Compara la base de cotización anualizada publicada de hasta tres ciclos, usando la misma cohorte y el mismo año.",
      hasHomeLink: false,
    },
    {
      path: "/metodologia",
      heading: "Metodología y fuentes",
      outcome:
        "Explicamos qué aporta cada fuente, cuándo la consultamos y qué no permite concluir.",
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
  await expect(freshness.getByText("Comprobando fecha…")).toBeVisible();

  releaseManifest();
  await expect(freshness).toHaveAttribute("aria-busy", "false");
  await expect(freshness.locator("time")).toHaveAttribute(
    "datetime",
    "2026-07-31T00:00:00.000Z",
  );
  await expect(freshness).toContainText("Actualizado: 31/07/2026");
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
  await expect(freshness).toContainText("Actualizado: 01/08/2026");
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
  await expect(freshness).toContainText("Actualizado: 31/07/2026");
  await expect(freshness.locator("time")).toHaveAttribute(
    "datetime",
    "2026-07-31T00:00:00.000Z",
  );
  await expect(
    page.getByText("Mostramos la última copia disponible."),
  ).toBeVisible();
  await expect(
    page.getByText(/datos actuales|datos al día|ofertas actuales/iu),
  ).toHaveCount(0);

  await page.getByRole("link", { name: "Comparar estudios" }).click();
  await expect(page).toHaveURL(/\/comparar$/u);
  await expect(
    page.getByRole("heading", { name: "Ingresos observados" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Los datos de comparación no están disponibles en esta versión.",
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
      name: /De tu FP a tu\s*siguiente paso/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Relaciones revisadas", { exact: true }),
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
  const coverage = page.getByRole("region", { name: "Cobertura revisada" });
  const reviewedPrograms = coverage
    .getByRole("list", {
      name: "Ciclos revisados destacados",
    })
    .getByRole("listitem");
  await expect(reviewedPrograms).toHaveCount(3);
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
    const firstCta = await panels.nth(0).getByRole("button").boundingBox();
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

  const coverage = page.getByRole("region", { name: "Cobertura revisada" });
  const links = coverage
    .getByRole("list", { name: "Ciclos revisados destacados" })
    .getByRole("link");
  await expect(links).toHaveCount(3);
  const hrefs = await links.evaluateAll((items) =>
    items.map((item) => item.getAttribute("href")),
  );
  expect(
    hrefs.every((href) => /^\/desde-fp\/[A-Z0-9]+$/u.test(href ?? "")),
  ).toBe(true);
  await expect(coverage.getByText("COM01M", { exact: false })).toHaveCount(0);
});
