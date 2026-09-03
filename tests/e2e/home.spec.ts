import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { currentManifestFixture } from "../fixtures/generatedManifest";

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

type HomePathImageDiagnostic = {
  currentSrc: string;
  naturalWidth: number;
  naturalHeight: number;
  complete: boolean;
  alt: string;
  display: string;
  visibility: string;
  opacity: string;
  box: { width: number; height: number };
  picturePresent: boolean;
  imagePresent: boolean;
};

const HOME_PATH_ASSETS = [
  "path-training",
  "path-occupation",
  "path-offer",
] as const;

async function expectHomePathImages(
  page: Page,
  imageResponses: Map<string, number>,
): Promise<void> {
  const paths = page.locator(".paths-grid .path");
  await expect(paths).toHaveCount(HOME_PATH_ASSETS.length);
  await page.locator(".paths-grid").scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight - 64, 1);
    const maxY = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0,
    );
    for (let y = 0; y <= maxY; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);
  });

  const diagnostics: HomePathImageDiagnostic[] = await paths.evaluateAll(
    (cards) =>
      cards.map((card) => {
        const picture = card.querySelector("picture");
        const image = card.querySelector("img");
        const style = image === null ? null : getComputedStyle(image);
        const box = image?.getBoundingClientRect();
        return {
          currentSrc: image?.currentSrc ?? "",
          naturalWidth: image?.naturalWidth ?? 0,
          naturalHeight: image?.naturalHeight ?? 0,
          complete: image?.complete ?? false,
          alt: image?.alt ?? "",
          display: style?.display ?? "",
          visibility: style?.visibility ?? "",
          opacity: style?.opacity ?? "",
          box: { width: box?.width ?? 0, height: box?.height ?? 0 },
          picturePresent: picture !== null,
          imagePresent: image !== null,
        };
      }),
  );

  expect(diagnostics).toHaveLength(HOME_PATH_ASSETS.length);
  diagnostics.forEach((diagnostic, index) => {
    const asset = HOME_PATH_ASSETS[index];
    expect(diagnostic.picturePresent).toBe(true);
    expect(diagnostic.imagePresent).toBe(true);
    expect(diagnostic.currentSrc).toMatch(
      new RegExp(`/images/editorial/${asset}-\\d+\\.(?:avif|webp)$`, "u"),
    );
    expect(imageResponses.get(diagnostic.currentSrc)).toBe(200);
    expect(diagnostic.naturalWidth).toBeGreaterThan(0);
    expect(diagnostic.naturalHeight).toBeGreaterThan(0);
    expect(diagnostic.complete).toBe(true);
    expect(diagnostic.alt.trim()).not.toBe("");
    expect(diagnostic.display).not.toBe("none");
    expect(diagnostic.visibility).not.toBe("hidden");
    expect(Number(diagnostic.opacity)).toBeGreaterThan(0);
    expect(diagnostic.box.width).toBeGreaterThan(0);
    expect(diagnostic.box.height).toBeGreaterThan(0);
  });
}

async function chooseFirstResult(page: Page, query: string): Promise<Locator> {
  const combobox = page.getByRole("combobox", {
    name: "Busca tu ciclo",
  });
  await combobox.fill(query);
  const option = page.getByRole("option").filter({ hasText: query }).first();
  await expect(option).toBeVisible();
  return option;
}

async function expectHomeReadyForLayout(page: Page): Promise<void> {
  await expect(
    page.getByRole("combobox", {
      name: "Busca tu ciclo",
    }),
  ).toBeVisible();
  const freshness = page.getByRole("region", {
    name: "Fecha de relaciones revisadas",
  });
  await expect(freshness).toHaveAttribute("aria-busy", "false");
  await expect(freshness.locator("time")).toBeVisible();
  await expect(page.locator(".example-cta a")).toHaveCount(1);
}

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

test("home exposes three clear intents, navigation, freshness, and no automated accessibility violations", async ({
  page,
}) => {
  const imageResponses = new Map<string, number>();
  page.on("response", (response) => {
    if (
      /\/images\/editorial\/path-(?:training|occupation|offer)-\d+\.(?:avif|webp)$/u.test(
        response.url(),
      )
    ) {
      imageResponses.set(response.url(), response.status());
    }
  });
  const manifestResponsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/data/v1/manifest.json"),
  );
  await page.goto("/");
  const manifestResponse = await manifestResponsePromise;
  const manifest = (await manifestResponse.json()) as ReturnType<
    typeof currentManifestFixture
  >;

  await expect(
    page.getByRole("heading", {
      name: "Tu FP, tus salidas profesionales y dónde dar el siguiente paso.",
    }),
  ).toBeVisible();
  const combobox = page.getByRole("combobox", {
    name: "Busca tu ciclo",
  });
  await expect(combobox).toBeVisible();
  await expect(combobox).toHaveAttribute("aria-autocomplete", "list");

  const mappingSnapshot = manifest.resourceSnapshots.mappingCoverage;
  const expectedDateTime =
    mappingSnapshot.sourceUpdatedAt ?? mappingSnapshot.snapshotFetchedAt;
  const freshness = page.getByRole("region", {
    name: "Fecha de relaciones revisadas",
  });
  await expect(freshness.locator("time")).toHaveAttribute(
    "datetime",
    expectedDateTime,
  );
  const expectedDate = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(expectedDateTime));
  const expectedDateKind =
    mappingSnapshot.sourceUpdatedAt === null
      ? "snapshot consultado el"
      : "fuente actualizada el";
  await expect(freshness).toContainText(
    `Relaciones revisadas · ${expectedDateKind} ${expectedDate}`,
  );
  await expect(page.locator(".example-cta a")).toHaveCount(1);
  await expectHomePathImages(page, imageResponses);
  await expectNoHorizontalOverflow(page);
  await expectStrictAxe(page);
});

test("the three-intent home reaches FP and occupation routes after official confirmation", async ({
  page,
}) => {
  await page.goto("/");
  const combobox = page.getByRole("combobox", {
    name: "Busca tu ciclo",
  });

  await combobox.fill("IFC03S");
  const fpOption = page.locator('[role="option"][id$="-option-IFC03S"]');
  await expect(fpOption).toBeVisible();
  await fpOption.click();
  await page.getByRole("button", { name: "Ver mis salidas" }).click();
  await expect(page).toHaveURL(/\/desde-fp\/IFC03S\?query=/u);
  await expect(
    page.getByRole("heading", { name: /Desarrollo de Aplicaciones Web/iu }),
  ).toBeVisible();
  await expectStrictAxe(page);

  await page.getByRole("link", { name: "SALIDA CyL" }).click();
  await page.getByRole("tab", { name: "Busco una profesión" }).click();
  const universityCombobox = page.getByRole("combobox", {
    name: "Busca una profesión",
  });
  await universityCombobox.fill("Programación web");
  await page
    .getByRole("option", {
      name: /Analistas, programadores y diseñadores web y multimedia/iu,
    })
    .click();
  await page.getByRole("button", { name: "Buscar profesión" }).click();
  await expect(page).toHaveURL(
    /\/desde-ocupacion\/occupation%3Acno11%3A2713\?query=/u,
  );
  await expect(
    page.getByRole("heading", {
      name: /Analistas, programadores y diseñadores web y multimedia/iu,
    }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("home search requires an official option selection and never free-routes", async ({
  page,
}) => {
  await page.goto("/");
  const combobox = page.getByRole("combobox", {
    name: "Busca tu ciclo",
  });
  await combobox.fill("texto inventado");
  await expect(
    page.getByText("No encontramos un ciclo oficial con ese nombre."),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/u);
  await expectStrictAxe(page);

  await chooseFirstResult(page, "IFC03S");
  await page.keyboard.press("ArrowDown");
  await expect(combobox).toHaveAttribute("aria-activedescendant", /.+/u);
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Ver mis salidas" }).click();
  await expect(page).toHaveURL(/\/desde-fp\/IFC03S\?query=/u);
});

test("the initial ready-state focus does not outline the whole page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Contenido listo" }),
  ).toBeAttached();
  const main = page.locator("main#main-content");
  await expect(main).toBeFocused();
  await expect
    .poll(() =>
      main.evaluate((element) => getComputedStyle(element).outlineStyle),
    )
    .toBe("none");
});

test("the keyboard focus indicator is visible and opaque on the search control", async ({
  page,
}) => {
  await page.goto("/");
  const combobox = page.getByRole("combobox", {
    name: "Busca tu ciclo",
  });
  for (let index = 0; index < 20; index += 1) {
    if (
      await combobox.evaluate((element) => element === document.activeElement)
    ) {
      break;
    }
    await page.keyboard.press("Tab");
  }
  await expect(combobox).toBeFocused();
  await expect
    .poll(() =>
      combobox.evaluate((element) => getComputedStyle(element).boxShadow),
    )
    .not.toBe("none");
});

test("the complete Spanish home copy fits without horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expectHomeReadyForLayout(page);

  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);

  if (testInfo.project.name === "chromium-mobile") {
    const menuButton = page.getByRole("button", {
      name: "Menú",
    });
    const box = await menuButton.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

test("the home copy fits at the narrow mobile widths", async ({ page }) => {
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expectHomeReadyForLayout(page);
    await expect(
      page.getByRole("heading", {
        name: "Tu FP, tus salidas profesionales y dónde dar el siguiente paso.",
      }),
    ).toBeVisible();
    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - document.body.clientWidth,
      document:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    }));
    expect(overflow.body, `body overflow at ${width}px`).toBeLessThanOrEqual(1);
    expect(
      overflow.document,
      `document overflow at ${width}px`,
    ).toBeLessThanOrEqual(1);
  }
});

test("a stale legacy manifest keeps navigation and names the last update", async ({
  page,
}, testInfo) => {
  await page.route("**/data/v1/manifest.json", (route) =>
    route.fulfill({ json: staleLegacyManifest }),
  );
  await page.goto("/");

  const freshness = page.getByRole("region", {
    name: "Fecha de ofertas laborales",
  });
  await expect(freshness).toContainText(
    "Ofertas laborales · fuente actualizada el 31 jul 2026",
  );
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

  if (testInfo.project.name === "chromium-mobile") {
    await page.getByRole("button", { name: "Menú" }).click();
    await page
      .locator("#mobile-menu")
      .getByRole("link", { name: "Comparar estudios" })
      .click();
  } else {
    await page
      .locator(".global-nav-list")
      .getByRole("link", { name: "Comparar estudios" })
      .click();
  }
  await expect(page).toHaveURL(/\/comparar$/u);
});

test("the skip link moves keyboard focus to the main content", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "WebKit keyboard focus follows the host Safari full-keyboard-access preference.",
  );
  await page.goto("/");
  const main = page.locator("main#main-content");
  await expect(main).toBeFocused();
  const skipLink = page.getByRole("link", { name: "Saltar al contenido" });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(main).toBeFocused();
});

test("SPA navigation preserves the focused control while content becomes ready", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "chromium-mobile") {
    await page.getByRole("button", { name: "Menú" }).click();
    const mobileLink = page
      .locator("#mobile-menu")
      .getByRole("link", { name: "Explorar" });
    await mobileLink.click();
    await expect(page).toHaveURL(/\/desde-fp$/u);
  } else {
    const fpLink = page
      .locator(".global-nav-list")
      .getByRole("link", { name: "Explorar" });
    await fpLink.click();
    await expect(page).toHaveURL(/\/desde-fp$/u);
  }
  await expect(
    page.getByRole("status", { name: "Contenido listo" }),
  ).toBeAttached();
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
    name: "Fecha de relaciones revisadas",
  });
  await expect(freshness).toHaveAttribute("aria-busy", "true");
  await expect(freshness.getByText("Comprobando fecha…")).toBeVisible();

  releaseManifest();
  await expect(freshness).toHaveAttribute("aria-busy", "false");
  await expect(freshness.locator("time")).toHaveAttribute(
    "datetime",
    "2026-07-31T00:00:00.000Z",
  );
  await expect(freshness).toContainText(
    "Relaciones revisadas · fuente actualizada el 31 jul 2026",
  );
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
