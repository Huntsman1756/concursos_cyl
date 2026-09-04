import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Candidate.11 polish regressions (second QA pass, 2026-09-04).
 * Covers: loading scaffolds under delayed data, hero image geometry,
 * truthful profession section navigation, the segmented hero tab control,
 * historical Más formación wording, date/title normalization, comparator
 * picker/distribution fixes, integrated evidence triggers, deterministic
 * pagination density and mobile metadata legibility.
 */

const PROFESSION_PATH = "/desde-ocupacion/occupation%3Acno11%3A2713";

const KEY_ROUTES = [
  "/",
  "/desde-fp",
  "/desde-fp/IFC03S",
  "/desde-ocupacion",
  PROFESSION_PATH,
  "/desde-oferta",
  "/donde-estudiar",
  "/comparar",
  "/recursos",
  "/datos-abiertos",
  "/metodologia",
  "/accesibilidad",
  "/para-organizaciones",
];

function horizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

test.describe("P1-01: no bare white loading screens", () => {
  for (const [route, readySelector] of [
    ["/desde-oferta", 'h1:has-text("Ofertas de empleo")'],
    ["/donde-estudiar", 'h1:has-text("Dónde estudiar")'],
    ["/comparar", 'form[aria-label="Seleccionar datos de comparación"]'],
    ["/recursos", ".public-calls"],
  ] as const) {
    test(`scaffold holds the page structure on ${route} while data is delayed`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(
        testInfo.project.name === "chromium-mobile" ? 45000 : 30000,
      );
      let consoleErrors = 0;
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors += 1;
      });
      page.on("pageerror", () => {
        consoleErrors += 1;
      });

      await page.route("**/data/v1/manifest.json", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1300));
        await route.continue();
      });

      await page.goto(route);

      const scaffold = page.locator('[data-loading="true"]');
      await expect(scaffold).toBeVisible();
      await expect(scaffold).toHaveAttribute("aria-busy", "true");
      await expect(scaffold.locator(".loading-skeleton__status")).toBeVisible();
      await expect(
        scaffold.locator(".loading-skeleton__surface"),
      ).toBeVisible();
      // Header must stay stable; the body must never collapse to bare text.
      await expect(page.getByRole("banner")).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

      await expect(page.locator(readySelector).first()).toBeVisible({
        timeout: 15000,
      });
      await expect(page.locator('[data-loading="true"]')).toHaveCount(0);
      expect(consoleErrors).toBe(0);
    });
  }

  test("the profession detail scaffold represents the final layout", async ({
    page,
  }) => {
    await page.route("**/data/v1/manifest.json", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1300));
      await route.continue();
    });

    await page.goto(PROFESSION_PATH);
    const scaffold = page.locator('[data-loading="true"]');
    await expect(scaffold).toBeVisible();
    await expect(
      scaffold.locator(".loading-skeleton__block--display"),
    ).toBeVisible();

    await expect(page.locator("#occupation-results-heading")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('[data-loading="true"]')).toHaveCount(0);
  });
});

test.describe("P1-02: profession section navigation is not fake tabs", () => {
  test("renders an in-page index instead of tabs and navigates truthfully", async ({
    page,
  }) => {
    await page.goto(PROFESSION_PATH);
    await expect(page.locator("#occupation-results-heading")).toBeVisible();

    const nav = page.getByRole("navigation", {
      name: "Secciones de esta página",
    });
    await expect(nav).toBeVisible();
    await expect(nav.getByText("En esta página")).toBeVisible();

    // No tab semantics anywhere in the profession result page.
    expect(await page.getByRole("tablist").count()).toBe(0);
    expect(await page.getByRole("tab").count()).toBe(0);

    // Clicking "Mercado laboral" jumps to the market section…
    await nav.getByRole("link", { name: "Mercado laboral" }).click();
    await expect(page).toHaveURL(/#mercado-laboral$/u);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(
      "mercado-laboral",
    );

    // …and back to the FP section.
    await nav.getByRole("link", { name: "FP relacionadas" }).click();
    await expect(page).toHaveURL(/#rutas-formativas$/u);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(
      "rutas-formativas",
    );

    // No giant outline is drawn around the jumped-to section.
    const outline = await page.evaluate(() => {
      const target = document.getElementById("rutas-formativas");
      return target ? getComputedStyle(target).outlineStyle : "missing";
    });
    expect(outline).toBe("none");
  });

  test("deep links to a section work on direct load", async ({ page }) => {
    await page.goto(`${PROFESSION_PATH}#mercado-laboral`);
    await expect(
      page.getByRole("heading", {
        name: "Mercado laboral de esta ocupación",
      }),
    ).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), {
        timeout: 5000,
      })
      .toBeGreaterThan(300);
  });

  test("section navigation stays keyboard operable", async ({ page }) => {
    await page.goto(PROFESSION_PATH);
    await expect(page.locator("#occupation-results-heading")).toBeVisible();

    const link = page
      .getByRole("navigation", { name: "Secciones de esta página" })
      .getByRole("link", { name: "Mercado laboral" });
    await link.focus();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/#mercado-laboral$/u);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  });
});

test.describe("P1-03: hero image geometry is stable", () => {
  test("selecting a profession does not stretch the hero image", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "Fixed geometry applies from the 1080px desktop layout",
    );

    await page.goto("/");
    await expect(page.locator(".hero-stage img")).toBeVisible();

    const before = await page.locator(".hero-stage img").boundingBox();
    expect(before).not.toBeNull();

    await page.getByRole("tab", { name: "Busco una profesión" }).click();
    const combobox = page.getByRole("combobox", {
      name: "Busca una profesión",
    });
    // The occupation picker exists once the runtime catalog has loaded.
    await expect(combobox).toBeVisible({ timeout: 15000 });
    await combobox.fill("desarrollador web");
    const option = page.getByRole("option", {
      name: /Analistas, programadores y diseñadores web y multimedia/iu,
    });
    await expect(option).toBeVisible();
    await combobox.press("ArrowDown");
    await combobox.press("Enter");
    await expect(page.locator(".confirmed-occupation")).toBeVisible();

    // Offer-mode switch adds more form content; the image must not follow.
    await page.getByRole("tab", { name: "Estoy mirando una oferta" }).click();
    await expect(page.locator("#home-offer-search")).toBeVisible();

    const after = await page.locator(".hero-stage img").boundingBox();
    expect(after).not.toBeNull();
    expect(Math.abs(before!.width - after!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(before!.height - after!.height)).toBeLessThanOrEqual(1);
    // object-fit: cover must keep the crop intentional (no distortion).
    const objectFit = await page
      .locator(".hero-stage img")
      .evaluate((img) => getComputedStyle(img).objectFit);
    expect(objectFit).toBe("cover");
  });
});

test.describe("P1-04: hero segmented control", () => {
  test("keeps real tab semantics with visible selection and keyboard support", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "Keyboard roving focus is asserted on desktop",
    );

    await page.goto("/");
    const tablist = page.getByRole("tablist", {
      name: "Elige tu punto de partida",
    });
    await expect(tablist).toBeVisible();
    const tabs = tablist.getByRole("tab");
    await expect(tabs).toHaveCount(3);

    await tabs.first().click();
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "false");

    await tabs.first().press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toBeFocused();
  });

  test("fits the 320px floor without overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    const tablist = page.getByRole("tablist", {
      name: "Elige tu punto de partida",
    });
    await expect(tablist).toBeVisible();
    for (const tab of [
      "Tengo una FP",
      "Busco una profesión",
      "Estoy mirando una oferta",
    ]) {
      await expect(tablist.getByRole("tab", { name: tab })).toBeVisible();
    }
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test("switching hero states does not increase the image height", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "chromium-mobile",
      "Fixed geometry applies from the 1080px desktop layout",
    );

    await page.goto("/");
    const image = page.locator(".hero-stage img");
    await expect(image).toBeVisible();
    const initial = await image.boundingBox();

    await page.getByRole("tab", { name: "Estoy mirando una oferta" }).click();
    await expect(page.locator("#home-offer-search")).toBeVisible();
    const offerState = await image.boundingBox();
    expect(Math.abs(initial!.height - offerState!.height)).toBeLessThanOrEqual(
      1,
    );

    await page.getByRole("tab", { name: "Tengo una FP" }).click();
    await expect(
      page.getByRole("combobox", { name: "Busca tu ciclo" }),
    ).toBeVisible({ timeout: 15000 });
    const fpState = await image.boundingBox();
    expect(Math.abs(initial!.height - fpState!.height)).toBeLessThanOrEqual(1);
  });
});

test.describe("P1-05: Más formación is temporally honest", () => {
  test("the intro describes the historical copy and shows its date", async ({
    page,
  }) => {
    await page.goto("/recursos");
    await expect(
      page.getByRole("heading", {
        name: "Formación para seguir avanzando",
      }),
    ).toBeVisible();

    // The old present-tense promise must be gone.
    await expect(page.getByText("convocatorias públicas abiertas")).toHaveCount(
      0,
    );
    await expect(
      page.getByText(
        /convocatorias que figuraban abiertas en la copia consultada/u,
      ),
    ).toBeVisible();
    // The snapshot date is shown naturally in the intro.
    await expect(page.getByText(/Copia de datos del/u)).toBeVisible();
    // Individual expired calls keep stating their published deadline passed.
    await expect(
      page.getByText(/El plazo publicado ya pasó|Plazo hasta el/u).first(),
    ).toBeVisible();
  });
});

test.describe("P2-02: citizen-facing date formats", () => {
  test("no numeric dd/mm/yyyy dates appear on citizen routes", async ({
    page,
  }) => {
    for (const route of KEY_ROUTES) {
      await page.goto(route);
      await page.waitForLoadState("load");
      const text = await page.evaluate(() => document.body.innerText);
      const numericDates = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/gu) ?? [];
      expect(numericDates, `on ${route}`).toEqual([]);
    }
  });
});

test.describe("P2-03: display-title normalization", () => {
  test("the profession detail title matches the selector casing", async ({
    page,
  }) => {
    await page.goto(PROFESSION_PATH);
    // Exact-case assertion: the official catalog "Web" is corrected for
    // display while canonical data stays untouched.
    await expect(page.locator("#occupation-results-heading")).toHaveText(
      "Analistas, programadores y diseñadores web y multimedia",
    );
  });

  test("offer titles render in a readable display form", async ({ page }) => {
    await page.goto("/desde-oferta");
    await expect(
      page.getByRole("heading", { level: 1, name: "Ofertas de empleo" }),
    ).toBeVisible();
    const titles = await page.locator(".offer-row__title").allTextContents();
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) {
      // No source title is presented as shouting ALL CAPS.
      expect(title, title).not.toBe(title.toLocaleUpperCase("es-ES"));
    }
  });
});

test.describe("P2-04 + P2-05: comparator", () => {
  test("the annual average appears once per series, not inside the distribution", async ({
    page,
  }) => {
    await page.goto("/comparar");
    await page.getByRole("radio", { name: "Grado superior" }).check();

    const picker = page.getByRole("group", {
      name: "Ciclos y grupos oficiales disponibles",
    });
    await expect(picker).toBeVisible();
    await picker.getByRole("checkbox").first().check();
    await picker.getByRole("checkbox").nth(1).check();

    await expect(
      page.getByRole("region", { name: "Evidencia seleccionada" }),
    ).toBeVisible();

    const seriesCount = await page.locator(".income-series").count();
    expect(seriesCount).toBeGreaterThanOrEqual(2);
    // One "Media anual" presentation per series header; zero inside bars.
    expect(await page.getByText("Media anual").count()).toBe(seriesCount);
    expect(
      await page.locator(".income-bars").getByText("Media anual").count(),
    ).toBe(0);
    // The percentile cuts stay the stars of the distribution.
    expect(
      await page.locator(".income-bars").getByText("Corte del 20 %").count(),
    ).toBeGreaterThan(0);
  });

  test("the option picker participates in normal page flow", async ({
    page,
  }) => {
    await page.goto("/comparar");
    await page.getByRole("radio", { name: "Grado superior" }).check();

    const options = page.getByRole("group", {
      name: "Ciclos y grupos oficiales disponibles",
    });
    const scrollState = await options.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        overflowY: style.overflowY,
        maxHeight: style.maxHeight,
      };
    });
    expect(scrollState.overflowY).toBe("visible");
    expect(scrollState.maxHeight).toBe("none");

    // Progressive disclosure instead of an inner scrollbar…
    const showMore = page.getByRole("button", { name: /Mostrar más/u });
    await expect(showMore).toBeVisible();
    const before = await options.getByRole("checkbox").count();
    await showMore.click();
    expect(await options.getByRole("checkbox").count()).toBeGreaterThan(before);

    // …and search narrows immediately.
    await page
      .getByRole("searchbox", { name: "Filtrar ciclos o grupos oficiales" })
      .fill("radioterapia");
    await expect(page.getByText("Radioterapia y dosimetría")).toBeVisible();
  });
});

test.describe("P2-06: evidence controls are integrated", () => {
  test("offer cards expose a textual source trigger, not an isolated icon", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "The isolated icon row was a mobile-specific defect",
    );

    await page.goto("/desde-oferta");
    await expect(
      page.getByRole("heading", { level: 1, name: "Ofertas de empleo" }),
    ).toBeVisible();
    const trigger = page
      .locator(".offer-row .info-disclosure__trigger-text")
      .first();
    await expect(trigger).toHaveText("Fuente y revisión");
    await expect(trigger).toBeVisible();

    // The disclosure keeps its popover behaviour.
    await page.locator(".offer-row .info-disclosure > summary").first().click();
    await expect(
      page.locator(".offer-row .info-disclosure__content").first(),
    ).toBeVisible();
  });

  test("profession route cards keep the source trigger discoverable", async ({
    page,
  }) => {
    await page.goto(PROFESSION_PATH);
    const card = page.locator('[data-testid="training-route-card"]').first();
    await expect(card).toBeVisible();
    await expect(card.getByText("Ver dónde estudiarlo")).toBeVisible();
    await expect(card.getByText("Fuente y revisión")).toBeVisible();
    await expect(card.locator(".info-disclosure__trigger-text")).toBeVisible();
  });
});

test.describe("P2-07: deterministic result density", () => {
  test("offers paginate at 10 per page after filtering", async ({ page }) => {
    await page.goto("/desde-oferta");
    await expect(page.getByText(/1–10 de .* ofertas/u)).toBeVisible();

    // Filters still happen BEFORE slicing and totals remain correct.
    await page
      .getByRole("combobox", { name: "Provincia" })
      .selectOption({ label: "Burgos" });
    await expect(page.getByText(/1–10 de \d+ ofertas/u)).toBeVisible();
    const cards = await page.locator(".offer-row").count();
    expect(cards).toBeLessThanOrEqual(10);
  });

  test("the center catalog paginates at 25 per page", async ({ page }) => {
    await page.goto("/donde-estudiar");
    await expect(
      page.getByText(/1–25 de \d+ combinaciones de centro y ciclo/u),
    ).toBeVisible();
    // URL semantics stay deterministic.
    await page.getByRole("button", { name: "Página siguiente" }).click();
    await expect(page).toHaveURL(/page=2/u);
    await expect(
      page.getByText(/26–\d+ de \d+ combinaciones de centro y ciclo/u),
    ).toBeVisible();
  });
});

test.describe("P2-08 + P1-06: mobile metadata and profession cards", () => {
  test("decision-relevant metadata is raised above 12px on mobile", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "Microtext legibility is a mobile requirement",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".proof-rail")).toBeVisible();
    const proofDateSize = await page
      .locator(".proof-stat-date")
      .first()
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );
    expect(proofDateSize).toBeGreaterThanOrEqual(13.5);

    await page.goto("/donde-estudiar");
    await expect(
      page.getByRole("heading", { level: 1, name: "Dónde estudiar" }),
    ).toBeVisible();
    const cellSubSize = await page
      .locator(".cell-sub")
      .first()
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );
    expect(cellSubSize).toBeGreaterThanOrEqual(13.5);
  });

  test("profession result cards fit and read naturally at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(PROFESSION_PATH);
    await expect(page.locator("#occupation-results-heading")).toBeVisible();

    const card = page.locator('[data-testid="training-route-card"]').first();
    await expect(card).toBeVisible();
    await expect(card.getByText("Ver dónde estudiarlo")).toBeVisible();
    // Availability is a compact summary, not a province list.
    await expect(card.locator(".route-card__availability")).toHaveText(
      /\d+ centros? · \d+ provincias?/u,
    );
    // No empty icon-only evidence row.
    await expect(card.locator(".info-disclosure__trigger-text")).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});

test.describe("global: responsive overflow", () => {
  const VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
    { width: 1440, height: 900 },
  ] as const;

  for (const viewport of VIEWPORTS) {
    test(`no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize({ ...viewport });
      for (const route of KEY_ROUTES) {
        await page.goto(route);
        await page.waitForLoadState("load");
        const overflow = await horizontalOverflow(page);
        expect(
          overflow,
          `on ${route} at ${viewport.width}px`,
        ).toBeLessThanOrEqual(1);
      }
    });
  }
});

test.describe("accessibility of changed surfaces", () => {
  test("profession detail has no automatic Axe violations", async ({
    page,
  }) => {
    await page.goto(PROFESSION_PATH);
    await expect(page.locator("#occupation-results-heading")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("comparator and resources pages have no automatic Axe violations", async ({
    page,
  }) => {
    await page.goto("/comparar");
    await page.getByRole("radio", { name: "Grado superior" }).check();
    await expect(
      page.getByRole("group", {
        name: "Ciclos y grupos oficiales disponibles",
      }),
    ).toBeVisible();
    const compareResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(compareResults.violations).toEqual([]);

    await page.goto("/recursos");
    await expect(
      page.getByRole("heading", { name: "Formación para seguir avanzando" }),
    ).toBeVisible();
    const resourcesResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(resourcesResults.violations).toEqual([]);
  });
});
