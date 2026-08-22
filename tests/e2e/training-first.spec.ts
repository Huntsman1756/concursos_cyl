import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  installDecisionFlowFixture,
  syntheticQuotes,
} from "../fixtures/decisionFlowFixture";
import { currentManifestFixture } from "../fixtures/generatedManifest";

async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let steps = 0; steps < 80; steps += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((node) => document.activeElement === node))
      return;
  }
  throw new Error("Expected the control to be reachable in page tab order.");
}

test("FP result data stays within the initial budget and loads outcomes on request", async ({
  page,
}) => {
  const dataResponses: { path: string; bytes: number }[] = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith("/data/v1/")) return;
    void response
      .body()
      .then((body) => {
        dataResponses.push({ path: url.pathname, bytes: body.byteLength });
      })
      .catch(() => undefined);
  });

  const manifestResponsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/data/v1/manifest.json"),
  );
  await page.goto("/desde-fp/IFC03S");
  const manifest = (await (await manifestResponsePromise).json()) as ReturnType<
    typeof currentManifestFixture
  >;
  await expect(
    page.getByRole("heading", { name: "Desarrollo de Aplicaciones Web" }),
  ).toBeVisible();

  const initialKeys = [
    "programs",
    "centers",
    "trainingOfferings",
    "jobOffers",
    "publishedRequirements",
    "occupations",
    "occupationAliases",
    "trainingOccupationLinks",
    "professionalProfiles",
    "provincialContracts",
    "municipalities",
    "educationCenterDirectory",
  ] as const;
  const expectedInitialPaths = [
    "/data/v1/manifest.json",
    ...initialKeys.map((key) => manifest.resourceSnapshots[key].resourcePath),
  ].sort();
  await expect.poll(() => dataResponses.length, { timeout: 15_000 }).toBe(13);
  const initialResponses = [...dataResponses];
  expect(initialResponses.map(({ path }) => path).sort()).toEqual(
    expectedInitialPaths,
  );
  expect(new Set(initialResponses.map(({ path }) => path)).size).toBe(13);
  expect(
    initialResponses.reduce((total, response) => total + response.bytes, 0),
  ).toBeLessThanOrEqual(7_000_000);
  const outcomePath = manifest.resourceSnapshots.outcomeIndicators.resourcePath;
  expect(dataResponses.filter(({ path }) => path === outcomePath)).toHaveLength(
    0,
  );

  await page
    .getByRole("button", { name: "Cargar datos de ingresos observados" })
    .click();
  await expect(page.getByText("Fuente: EDUCAbase")).toBeVisible();
  await expect
    .poll(
      () => dataResponses.filter(({ path }) => path === outcomePath).length,
      { timeout: 15_000 },
    )
    .toBe(1);
});

test("FP catalog loading is announced as a polite status", async ({ page }) => {
  let releaseManifest!: () => void;
  const manifestDelay = new Promise<void>((resolve) => {
    releaseManifest = resolve;
  });
  await page.route("**/data/v1/manifest.json", async (route) => {
    await manifestDelay;
    await route.fulfill({ json: currentManifestFixture() });
  });

  await page.goto("/desde-fp");
  const loading = page.getByText(/Preparando los ciclos oficiales/u);
  await expect(loading).toBeVisible();
  await expect(loading).toHaveAttribute("role", "status");
  await expect(loading).toHaveAttribute("aria-live", "polite");

  releaseManifest();
});

test("FP results loading is announced as a polite status", async ({ page }) => {
  let releaseManifest!: () => void;
  const manifestDelay = new Promise<void>((resolve) => {
    releaseManifest = resolve;
  });
  await page.route("**/data/v1/manifest.json", async (route) => {
    await manifestDelay;
    await route.fulfill({ json: currentManifestFixture() });
  });

  await page.goto("/desde-fp/IFC03S");
  const loading = page.getByText(/Buscando ofertas relacionadas/u);
  await expect(loading).toBeVisible();
  await expect(loading).toHaveAttribute("role", "status");
  await expect(loading).toHaveAttribute("aria-live", "polite");

  releaseManifest();
});

test("live DAW results shows formacion link and approved occupation", async ({
  page,
}, testInfo) => {
  await page.goto("/desde-fp");

  await page
    .getByLabel("Ciclo de Formación Profesional")
    .selectOption("IFC03S");
  await page.getByRole("button", { name: "Ver salidas y ofertas" }).click();

  await expect(
    page.getByRole("link", {
      name: "Ver centros y modalidades",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Ver centros y modalidades",
    }),
  ).toHaveAttribute("href", "/formacion/IFC03S");

  await expect(
    page.getByText("Analistas, programadores y diseñadores web y multimedia"),
  ).toBeVisible();

  await expect(page.getByText("CNO-11 2713")).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Qué sabemos de este título" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Base de cotización observada de titulados",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("No es salario personal ni una predicción."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Base de cotización anualizada · empleo por cuenta ajena a jornada completa.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Contexto provincial" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Contexto provincial — no específico de esta ocupación. Reúne contratos registrados de todas las ocupaciones.",
    ),
  ).toBeVisible();
  const sectionNavigation = page.getByRole("navigation", {
    name: "Secciones del resultado",
  });
  await expect(
    sectionNavigation.getByRole("link", { name: "Dónde estudiar" }),
  ).toHaveAttribute("href", "#donde-estudiar");
  await expect(
    sectionNavigation.getByRole("link", { name: "Contexto provincial" }),
  ).toHaveAttribute("href", "#contexto-provincial");
  await expect(
    sectionNavigation.getByRole("link", { name: "Salidas profesionales" }),
  ).toHaveAttribute("href", "#salidas-profesionales");

  const studyLink = sectionNavigation.getByRole("link", {
    name: "Dónde estudiar",
  });
  await tabTo(page, studyLink);
  await expect(studyLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/desde-fp\/IFC03S#donde-estudiar$/u);
  await expect(page.locator("#donde-estudiar")).toBeVisible();
  await expect(page.locator("#donde-estudiar")).toBeFocused();
  await expect(
    page.getByText(/no representa todo el mercado laboral/u),
  ).toBeVisible();
  const distribution = page.getByRole("region", {
    name: "Distribución de centros",
  });
  await expect(distribution).toBeVisible();
  const headingLayout = await distribution
    .locator(".territorial-distribution__heading")
    .evaluate((element) => {
      const eyebrow = element.querySelector("p")?.getBoundingClientRect();
      const title = element.querySelector("h2")?.getBoundingClientRect();
      return {
        aligned:
          eyebrow !== undefined &&
          title !== undefined &&
          Math.abs(eyebrow.left - title.left) <= 1,
        stacked:
          eyebrow !== undefined &&
          title !== undefined &&
          title.top >= eyebrow.bottom,
      };
    });
  expect(headingLayout).toEqual({ aligned: true, stacked: true });
  await expect(
    distribution.getByRole("table", { name: "Centros por provincia" }),
  ).toBeVisible();
  await expect(distribution.locator("svg")).toHaveCount(0);
  await expect(
    distribution.getByRole("link", {
      name: /Fuente: Directorio de Centros Docentes JCyL/,
    }),
  ).toBeVisible();
  const coordinatesSummary = distribution.getByText(
    "Ver coordenadas oficiales publicadas",
    { exact: true },
  );
  await tabTo(page, coordinatesSummary);
  await expect(coordinatesSummary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    distribution.getByText(
      "Información técnica complementaria. No es un mapa y no calcula distancias, rutas ni tiempos de desplazamiento.",
      { exact: true },
    ),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .include("#distribucion-centros")
    .analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
  if (testInfo.project.name === "chromium-mobile") {
    const overflow = await distribution.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }

  await expect(
    page.getByRole("link", {
      name: /Analistas, programadores y diseñadores web y multimedia CNO-11 2713/,
    }),
  ).toHaveAttribute("href", "/desde-ocupacion/occupation%3Acno11%3A2713");
});

test("live DAW results name the dated zero-match snapshot without claiming there are no jobs", async ({
  page,
}) => {
  const manifestResponse = page.waitForResponse((response) =>
    response.url().endsWith("/data/v1/manifest.json"),
  );
  await page.goto("/desde-fp");
  const manifest = (await (await manifestResponse).json()) as {
    resourceSnapshots: {
      jobOffers: { sourceUpdatedAt: string | null; snapshotFetchedAt: string };
    };
  };

  await page
    .getByLabel("Ciclo de Formación Profesional")
    .selectOption("IFC03S");
  await page.getByRole("button", { name: "Ver salidas y ofertas" }).click();
  const snapshotDate = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(
      manifest.resourceSnapshots.jobOffers.sourceUpdatedAt ??
        manifest.resourceSnapshots.jobOffers.snapshotFetchedAt,
    ),
  );

  await expect(
    page.getByText(
      `No hay ofertas relacionadas en la copia de datos del ${snapshotDate}.`,
    ),
  ).toBeVisible();
  await expect(page.getByText(/no hay (empleo|trabajo|puestos)/iu)).toHaveCount(
    0,
  );
});

test("COM01M exposes seven reviewed groups without inventing current offers", async ({
  page,
}) => {
  await page.goto("/desde-fp");
  await page
    .getByRole("combobox", { name: "Ciclo de Formación Profesional" })
    .selectOption("COM01M");
  await expect(
    page.getByText("Relaciones revisadas con 7 grupos de ocupación."),
  ).toContainText("Relaciones revisadas con 7 grupos de ocupación.");
  await expect(
    page.getByText("Relaciones revisadas con 7 grupos de ocupación."),
  ).toHaveAttribute("role", "status");
  await page.getByRole("button", { name: "Ver salidas y ofertas" }).click();
  await expect(page).toHaveURL(/\/desde-fp\/COM01M$/u);
  await expect(
    page.getByRole("heading", { name: "Actividades Comerciales" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Grupos de ocupación revisados para buscar ofertas",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/No hay ofertas relacionadas en la copia de datos del/u),
  ).toBeVisible();
});

test("the intercepted full DAW card makes a declared gap, action, filter, and evidence keyboard-accessible", async ({
  page,
}) => {
  await installDecisionFlowFixture(page);
  await page.goto("/desde-fp");
  await page
    .getByLabel("Ciclo de Formación Profesional")
    .selectOption("IFC03S");
  await page.getByRole("button", { name: "Ver salidas y ofertas" }).click();

  const card = page.getByRole("article", {
    name: "Desarrollador web para servicios públicos",
  });
  await expect(card).toBeVisible();

  const evidenceDisclosure = card.getByText("Ver evidencia y requisitos", {
    exact: true,
  });
  await tabTo(page, evidenceDisclosure);
  await expect(evidenceDisclosure).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(
    card.getByRole("heading", { name: "Por qué aparece" }),
  ).toBeVisible();
  await expect(
    card.getByRole("heading", { name: "Qué publica la vacante" }),
  ).toBeVisible();
  await expect(
    card.getByRole("heading", { name: "Tu comprobación" }),
  ).toBeVisible();
  await expect(
    card.getByRole("heading", { name: "Siguiente acción" }),
  ).toBeVisible();

  const mappingDisclosure = card
    .getByText("Ver cita exacta", { exact: true })
    .first();
  await tabTo(page, mappingDisclosure);
  await expect(mappingDisclosure).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    card.getByText("Desarrollador de aplicaciones en entornos Web.", {
      exact: true,
    }),
  ).toBeVisible();

  const firstExperienceAnswer = card.getByRole("radio", {
    name: `Lo tengo: ${syntheticQuotes.experienceQuote}`,
    exact: true,
  });
  await tabTo(page, firstExperienceAnswer);
  await expect(firstExperienceAnswer).toBeFocused();
  await page.keyboard.press("ArrowRight");
  const missingExperience = card.getByRole("radio", {
    name: `No lo tengo: ${syntheticQuotes.experienceQuote}`,
  });
  await expect(missingExperience).toBeFocused();
  await expect(
    card.getByText("Has indicado que no cumples este requisito."),
  ).toBeVisible();

  const exactAbsenceAction = card.getByRole("button", {
    name: "Ver ofertas relacionadas donde no se publica este requisito",
  });
  await tabTo(page, exactAbsenceAction);
  await expect(exactAbsenceAction).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(
      "Filtro activo: ofertas relacionadas que no publican este requisito exacto.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Desarrollador web junior" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Quitar filtro" }).click();
  await expect(page.getByText(/Filtro activo:/u)).toHaveCount(0);

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
});
