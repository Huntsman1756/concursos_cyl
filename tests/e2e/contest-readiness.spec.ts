import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

async function chooseTrainingProgram(
  page: Page,
  query: string,
  label = "Ciclo de Formación Profesional",
): Promise<void> {
  const combobox = page.getByRole("combobox", { name: label });
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

async function expectCriticalAxe(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    ),
    JSON.stringify(violations, null, 2),
  ).toEqual([]);
}

async function expectWithinViewport(
  page: Page,
  target: Locator,
): Promise<void> {
  const viewport = page.viewportSize();
  const box = await target.boundingBox();
  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();
  if (viewport === null || box === null) return;
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
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

type RouteDiagnostics = {
  failedRequests: string[];
  badResponses: string[];
  consoleIssues: string[];
  pageErrors: string[];
  externalRequests: string[];
};

function installRouteDiagnostics(page: Page): RouteDiagnostics {
  const diagnostics: RouteDiagnostics = {
    failedRequests: [],
    badResponses: [],
    consoleIssues: [],
    pageErrors: [],
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
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push(error.message);
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
  await expect(
    page.getByRole("status", { name: "Contenido listo" }),
  ).toBeAttached();
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
  expect(diagnostics.consoleIssues).toEqual([]);
  expect(diagnostics.pageErrors).toEqual([]);
  expect(diagnostics.externalRequests).toEqual([]);
}

async function chooseHigherComparison(page: Page): Promise<void> {
  await page.getByText("Grado superior", { exact: true }).click();
  await expectCriticalAxe(page);
  await page
    .getByLabel("Filtrar ciclos o grupos")
    .fill("Administración y finanzas");
  await page.getByText("Administración y finanzas", { exact: true }).click();
  await expectCriticalAxe(page);
  await page.getByLabel("3. Cohorte de titulación").selectOption("2022-2023");
  await expectCriticalAxe(page);
  await page
    .getByRole("group", { name: "4. Año tras titularse" })
    .getByText("2", { exact: true })
    .click();
  await expectCriticalAxe(page);
}

test.describe("contest readiness journeys", () => {
  test("keeps the root journey loaded, navigable, and evidence-safe", async ({
    page,
  }, testInfo) => {
    const diagnostics = installRouteDiagnostics(page);
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /De tu FP a tu\s*siguiente paso/i,
      }),
    ).toBeVisible();
    if (testInfo.project.name === "chromium-mobile") {
      await expect(
        page.getByRole("button", { name: "Abrir menú principal" }),
      ).toBeVisible();
    } else {
      await expect(page.locator(".site-nav--desktop")).toBeVisible();
    }
    await expect(
      page.getByRole("region", { name: "Cobertura revisada" }),
    ).toHaveAttribute("aria-busy", "false");
    await expect(
      page.getByRole("region", { name: "Fecha de relaciones revisadas" }),
    ).toHaveAttribute("aria-busy", "false");
    await expect(
      page
        .getByRole("list", { name: "Ciclos revisados destacados" })
        .getByRole("listitem"),
    ).toHaveCount(3);
    await expect(
      page.getByRole("combobox", { name: "Título de Formación Profesional" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ver las salidas de este título" }),
    ).toHaveCount(1);
    await expectStableRoute(page, diagnostics);
  });

  test("serves the built publication metadata contract", async ({
    page,
    request,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Inicio · SALIDA CyL");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Explora relaciones revisadas entre formación profesional y ocupaciones en Castilla y León con datos abiertos.",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://salida-cyl.157-90-22-40.sslip.io/",
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "SALIDA CyL",
    );
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute(
      "content",
      "Explora relaciones revisadas entre formación profesional y ocupaciones en Castilla y León con datos abiertos.",
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "website",
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "https://salida-cyl.157-90-22-40.sslip.io/",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://salida-cyl.157-90-22-40.sslip.io/salida-cyl-social.png",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      "SALIDA CyL",
    );
    await expect(
      page.locator('meta[name="twitter:description"]'),
    ).toHaveAttribute(
      "content",
      "Explora relaciones revisadas entre formación profesional y ocupaciones en Castilla y León con datos abiertos.",
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      "content",
      "https://salida-cyl.157-90-22-40.sslip.io/salida-cyl-social.png",
    );
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      "href",
      "/salida-cyl-icon.png",
    );
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#7f1734",
    );

    const [faviconResponse, socialResponse, robotsResponse] = await Promise.all(
      [
        request.get("/salida-cyl-icon.png"),
        request.get("/salida-cyl-social.png"),
        request.get("/robots.txt"),
      ],
    );
    for (const response of [faviconResponse, socialResponse]) {
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toMatch(/^image\/png/u);
      expect(Array.from((await response.body()).subarray(0, 8))).toEqual([
        137, 80, 78, 71, 13, 10, 26, 10,
      ]);
    }
    expect(robotsResponse.ok()).toBe(true);
    expect(robotsResponse.headers()["content-type"]).toMatch(/^text\/plain/u);
    expect(await robotsResponse.text()).toBe("User-agent: *\nAllow: /\n");
  });

  test("keeps the 390px mobile menu shareable and keyboard-safe", async ({
    page,
  }) => {
    const diagnostics = installRouteDiagnostics(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/?tab=coverage#freshness");
    await expect(page).toHaveURL(
      "http://127.0.0.1:4173/?tab=coverage#freshness",
    );

    const menuButton = page.getByRole("button", {
      name: "Abrir menú principal",
    });
    const mobileNavigation = page.getByRole("navigation", {
      name: "Principal móvil",
      includeHidden: true,
    });
    await expect(mobileNavigation).toHaveAttribute(
      "id",
      "mobile-primary-navigation",
    );
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton).toHaveAttribute(
      "aria-controls",
      "mobile-primary-navigation",
    );
    await expect(mobileNavigation).toHaveAttribute("hidden");
    const mobileAnchors = mobileNavigation.locator("a");
    await expect(mobileAnchors).toHaveCount(6);
    expect(
      await mobileAnchors.evaluateAll((anchors) =>
        anchors.every((anchor) => anchor.getClientRects().length === 0),
      ),
    ).toBe(true);
    expect(
      await mobileNavigation.evaluate((navigation) =>
        navigation.contains(document.activeElement),
      ),
    ).toBe(false);

    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press("Tab");
      expect(
        await mobileNavigation.evaluate((navigation) =>
          navigation.contains(document.activeElement),
        ),
      ).toBe(false);
    }

    const freshness = page.getByRole("region", {
      name: "Fecha de relaciones revisadas",
    });
    await expect(freshness).toBeVisible();
    await expectWithinViewport(
      page,
      freshness.getByText(/Relaciones revisadas: copia del/u),
    );
    await expectWithinViewport(page, freshness.locator("time"));
    await expectNoHorizontalOverflow(page);
    await expectCriticalAxe(page);
    await expectStableRoute(page, diagnostics);

    await menuButton.click();
    const closeMenuButton = page.getByRole("button", {
      name: "Cerrar menú principal",
    });
    await expect(closeMenuButton).toBeVisible();
    await expect(closeMenuButton).toHaveAttribute("aria-expanded", "true");
    await expect(closeMenuButton).toHaveAttribute(
      "aria-controls",
      "mobile-primary-navigation",
    );
    await expect(mobileNavigation).toBeVisible();
    await expect(
      mobileNavigation.getByRole("link", { name: "Inicio" }),
    ).toHaveAttribute("aria-current", "page");
    const menuButtonBox = await page
      .getByRole("button", { name: "Cerrar menú principal" })
      .boundingBox();
    expect(menuButtonBox?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(menuButtonBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    for (const link of await mobileNavigation.getByRole("link").all()) {
      const box = await link.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await expectNoHorizontalOverflow(page);
    await expectCriticalAxe(page);

    await page.keyboard.press("Escape");
    await expect(menuButton).toBeFocused();
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton).toHaveAttribute(
      "aria-controls",
      "mobile-primary-navigation",
    );
    await expect(mobileNavigation).toHaveAttribute("hidden");
    await expectNoHorizontalOverflow(page);
    await expectCriticalAxe(page);

    await menuButton.click();
    await mobileNavigation.getByRole("link", { name: "Metodología" }).click();
    await expect(page).toHaveURL(/\/metodologia$/u);
    await expect(mobileNavigation).toHaveAttribute("hidden");
    await expect(
      page.getByRole("heading", { level: 1, name: "Metodología y fuentes" }),
    ).toBeVisible();
    await expect(
      page.getByRole("status", { name: "Contenido listo" }),
    ).toBeAttached();
    await expect(page.locator("main#main-content")).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await expectStableRoute(page, diagnostics);

    await page.goBack();
    await expect(page).toHaveURL(
      "http://127.0.0.1:4173/?tab=coverage#freshness",
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /De tu FP a tu\s*siguiente paso/i,
      }),
    ).toBeVisible();
    await expect(mobileNavigation).toHaveAttribute("hidden");
    await expect(menuButton).toBeVisible();
    await expect(
      page.getByRole("status", { name: "Contenido listo" }),
    ).toBeAttached();
    await expect(page.locator("main#main-content")).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await expectStableRoute(page, diagnostics);
    await page.goForward();
    await expect(page).toHaveURL(/\/metodologia$/u);
    await expect(
      page.getByRole("heading", { level: 1, name: "Metodología y fuentes" }),
    ).toBeVisible();
    await expect(mobileNavigation).toHaveAttribute("hidden");
    await expect(
      page.getByRole("status", { name: "Contenido listo" }),
    ).toBeAttached();
    await expect(page.locator("main#main-content")).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await expectStableRoute(page, diagnostics);
  });

  test("prints one valid occupation result without an operating-system dialog", async ({
    page,
  }) => {
    await page.goto("/desde-ocupacion/occupation%3Acno11%3A2713");
    await expect(
      page.getByRole("heading", {
        name: /Analistas, programadores y diseñadores web y multimedia/iu,
      }),
    ).toBeVisible();
    const printButton = page.getByRole("button", {
      name: "Imprimir esta orientación",
    });
    await expect(printButton).toBeVisible();
    await installPrintSpy(page);
    await printButton.click();
    await expect.poll(() => printCallCount(page)).toBe(1);
    await expectCriticalAxe(page);
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

  test("shows COM01M reviewed coverage with an honest zero-offer state", async ({
    page,
  }) => {
    const diagnostics = installRouteDiagnostics(page);
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
    ).toHaveCount(5);
    await expect(
      page.getByRole("article", { name: "Qué estudiar y dónde se imparte" }),
    ).toContainText("187 ciclos oficiales");
    await expectStableRoute(page, diagnostics);
  });

  test("does not persist or contact third-party tracking services", async ({
    page,
  }, testInfo) => {
    const diagnostics = installRouteDiagnostics(page);
    await page.goto("/");
    await chooseTrainingProgram(
      page,
      "COM01M",
      "Título de Formación Profesional",
    );
    await page
      .getByRole("button", { name: "Ver las salidas de este título" })
      .click();
    await expect(page).toHaveURL(/\/desde-fp\/COM01M$/u);
    if (testInfo.project.name === "chromium-mobile") {
      await page.getByRole("button", { name: "Abrir menú principal" }).click();
      await page
        .locator("#mobile-primary-navigation")
        .getByRole("link", { name: "Comparar estudios" })
        .click();
    } else {
      await page
        .locator(".site-nav--desktop")
        .getByRole("link", { name: "Comparar estudios" })
        .click();
    }
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
    await expectStableRoute(page, diagnostics);
  });
});
