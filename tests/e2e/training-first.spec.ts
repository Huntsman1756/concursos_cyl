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

async function chooseTrainingProgram(page: Page, query: string): Promise<void> {
  const combobox = page.getByRole("combobox", {
    name: "Ciclo de Formación Profesional",
  });
  await combobox.fill(query);
  const option = page.locator(`[role="option"][id$="-option-${query}"]`);
  await expect(option).toBeVisible();
  const expectedValue = (await option.locator("span").innerText()).trim();
  await expect(option).toHaveAttribute("aria-selected", "false");
  await combobox.press("ArrowDown");
  await expect(option).toHaveAttribute("aria-selected", "true");
  await combobox.press("Enter");
  await expect(combobox).toHaveValue(expectedValue);
  await expect(combobox).toHaveAttribute("aria-expanded", "false");
}

async function expectStrictAxe(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
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
  await expectNoHorizontalOverflow(page);
  await page.waitForLoadState("networkidle");

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
  await page.waitForLoadState("networkidle");
  await expect
    .poll(
      () => dataResponses.filter(({ path }) => path === outcomePath).length,
      { timeout: 15_000 },
    )
    .toBe(1);
  await expectNoHorizontalOverflow(page);
  await expectStrictAxe(page);
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

test("FP search confirms official options and recovers from filters and zero state", async ({
  page,
}) => {
  await page.goto("/desde-fp");

  const combobox = page.getByRole("combobox", {
    name: "Ciclo de Formación Profesional",
  });
  const submit = page.getByRole("button", { name: "Ver salidas y ofertas" });
  await expect(submit).toBeDisabled();

  await combobox.fill("texto inventado");
  await expect(submit).toBeDisabled();
  await expect(
    page.getByText("No encontramos un ciclo oficial con ese nombre."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Imprimir esta orientación" }),
  ).toHaveCount(0);
  await expectStrictAxe(page);

  await chooseTrainingProgram(page, "IFC03S");
  await expect(submit).toBeEnabled();
  await expectStrictAxe(page);

  await page.getByLabel("Filtrar por nivel").selectOption({
    label: "Grado medio",
  });
  await expect(combobox).toHaveValue("");
  await expect(submit).toBeDisabled();
  await expectStrictAxe(page);

  await page.getByLabel("Filtrar por nivel").selectOption({
    label: "Todos los niveles",
  });
  await expect(combobox).toHaveValue("");
  await expect(submit).toBeDisabled();
  await expectStrictAxe(page);
  await combobox.fill("zzzzzz");
  await expect(submit).toBeDisabled();
  await expect(
    page.getByText("No encontramos un ciclo oficial con ese nombre."),
  ).toBeVisible();
  await expectStrictAxe(page);

  await chooseTrainingProgram(page, "IFC03S");
  await expect(submit).toBeEnabled();
  await expectStrictAxe(page);
});

test("FP results preserve complete centers, province context, deferred outcomes, and one print call", async ({
  page,
}) => {
  const requestedDataPaths: string[] = [];
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.startsWith("/data/v1/")) {
      requestedDataPaths.push(pathname);
    }
  });

  const manifestResponsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/data/v1/manifest.json"),
  );
  await page.goto("/desde-fp");
  const manifest = (await manifestResponsePromise.then((response) =>
    response.json(),
  )) as ReturnType<typeof currentManifestFixture>;
  const outcomePath = new URL(
    manifest.resourceSnapshots.outcomeIndicators.resourcePath,
    page.url(),
  ).pathname;
  await chooseTrainingProgram(page, "IFC03S");
  await page.getByLabel("Provincia para el contexto (opcional)").selectOption({
    label: "León",
  });
  await page.getByRole("button", { name: "Ver salidas y ofertas" }).click();

  await expect(page).toHaveURL(
    "http://127.0.0.1:4173/desde-fp/IFC03S?province=Le%C3%B3n",
  );
  await expect(
    page.getByRole("heading", { name: "Desarrollo de Aplicaciones Web" }),
  ).toBeVisible();
  await expect(
    page.getByText("Contexto provincial elegido: León"),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(requestedDataPaths.filter((path) => path === outcomePath)).toEqual([]);

  const compareLink = page.getByRole("link", { name: "Comparar ingresos" });
  await expect(compareLink).toHaveAttribute("href", "/comparar?program=IFC03S");
  await expect(
    page.getByRole("button", { name: "Imprimir esta orientación" }),
  ).toBeVisible();
  await installPrintSpy(page);
  await page.getByRole("button", { name: "Imprimir esta orientación" }).click();
  await expect.poll(() => printCallCount(page)).toBe(1);

  await expectStrictAxe(page);

  const centersLink = page.getByRole("link", {
    name: "Ver centros y modalidades",
  });
  await expect(centersLink).toHaveAttribute("href", "/formacion/IFC03S");
  await centersLink.click();
  await expect(page).toHaveURL(/\/formacion\/IFC03S$/u);
  const centers = page.getByRole("list", {
    name: "Centros que imparten el ciclo",
  });
  await expect(centers.getByRole("listitem")).toHaveCount(18);

  await page.goBack();
  await expect(page).toHaveURL(/\/desde-fp\/IFC03S\?province=Le%C3%B3n$/u);
  await compareLink.click();
  await expect(page).toHaveURL(/\/comparar\?program=IFC03S$/u);
});

test("live DAW results shows formacion link and approved occupation", async ({
  page,
}, testInfo) => {
  await page.goto("/desde-fp");

  await chooseTrainingProgram(page, "IFC03S");
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
  await expectNoHorizontalOverflow(page);

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

  await chooseTrainingProgram(page, "IFC03S");
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
  await expectNoHorizontalOverflow(page);
  await expectStrictAxe(page);
});

test("COM01M exposes seven reviewed groups without inventing current offers", async ({
  page,
}) => {
  await page.goto("/desde-fp");
  await chooseTrainingProgram(page, "COM01M");
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
  await expectNoHorizontalOverflow(page);
  await expectStrictAxe(page);
});

test("the intercepted full DAW card makes a declared gap, action, filter, and evidence keyboard-accessible", async ({
  page,
}) => {
  await installDecisionFlowFixture(page);
  await page.goto("/desde-fp");
  await chooseTrainingProgram(page, "IFC03S");
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

  await expectNoHorizontalOverflow(page);
  await expectStrictAxe(page);
});
