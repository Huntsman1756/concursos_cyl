import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PUNCTUATION_BEFORE_SPACE = /[ \u00a0\u202f][;:]/u;

async function collectPunctuationHits(
  page: Page,
): Promise<Array<{ where: string; around: string }>> {
  return page.evaluate((reSource) => {
    const re = new RegExp(reSource, "u");
    const found: Array<{ where: string; around: string }> = [];
    const push = (text: unknown, where: string) => {
      if (typeof text !== "string") return;
      const match = text.match(re);
      if (match === null) return;
      const index = text.indexOf(match[0]);
      found.push({
        where,
        around: text
          .slice(Math.max(0, index - 60), index + 60)
          .replace(/\s+/g, " "),
      });
    };
    push(document.body.innerText, "innerText");
    for (const el of document.querySelectorAll("[aria-label]")) {
      push(el.getAttribute("aria-label"), "aria-label");
    }
    return found;
  }, PUNCTUATION_BEFORE_SPACE.source);
}

test.describe("2026-09-04 Chrome audit regressions", () => {
  test("P0-A: /desde-oferta recovers on direct load and reload and resolves the home counter", async ({
    page,
  }) => {
    await page.goto("/desde-oferta");
    await expect(
      page.getByRole("heading", { level: 1, name: "Ofertas de empleo" }),
    ).toBeVisible();
    await expect(
      page.getByText("No hemos podido abrir las ofertas"),
    ).toHaveCount(0);
    await expect(page.getByText(/1–12 de .* ofertas/u)).toBeVisible();

    // Reload must not degrade into the fail-closed surface.
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Ofertas de empleo" }),
    ).toBeVisible();
    await expect(
      page.getByText("No hemos podido abrir las ofertas"),
    ).toHaveCount(0);

    // Client-side navigation from home and the authoritative counter.
    await page.goto("/");
    await page
      .getByRole("link", { name: /Desde una oferta|^Ofertas$/u })
      .last()
      .click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Ofertas de empleo" }),
    ).toBeVisible();

    await page.goto("/");
    await expect(page.locator(".proof-rail")).toBeVisible();
    await expect(page.locator(".proof-rail").getByText("138")).toBeVisible();
    await expect(
      page.getByText(/evidencia generada el 30 de agosto de 2026/u),
    ).toBeVisible();
  });

  test("P0-B: the reviewed-relationship help never widens the document", async ({
    page,
  }) => {
    for (const width of [1252, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.locator(".proof-rail")).toBeVisible();
      const scrollWidthBefore = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      const trigger = page
        .getByRole("button", { name: "Qué es una relación revisada" })
        .first();
      await trigger.click();
      const popover = page.locator(".info-popover");
      await expect(popover).toBeVisible();

      const state = await page.evaluate(() => ({
        docW: document.documentElement.scrollWidth,
        winW: window.innerWidth,
        rect: document.querySelector(".info-popover")?.getBoundingClientRect(),
      }));
      expect(
        state.docW,
        `document scrollWidth must not exceed viewport at ${width}px`,
      ).toBeLessThanOrEqual(state.winW);
      expect(state.docW).toBeLessThanOrEqual(scrollWidthBefore + 1);
      expect(state.rect).toBeDefined();
      expect(state.rect!.left).toBeGreaterThanOrEqual(0);
      expect(state.rect!.right).toBeLessThanOrEqual(state.winW);
      // Text wraps inside the popover instead of expanding it.
      expect(state.rect!.width).toBeLessThanOrEqual(state.winW);

      // Keyboard operation and accessible state are preserved.
      await page.keyboard.press("Escape");
      await expect(popover).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });

  test("P0-C: navigating to a new route opens it at the top with the heading visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1252, height: 800 });
    await page.goto("/");
    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight / 2),
    );
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);

    await page
      .getByRole("link", { name: "Desde una profesión" })
      .last()
      .click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "¿Qué FP te lleva a una profesión?",
      }),
    ).toBeVisible();
    const state = await page.evaluate(() => ({
      y: window.scrollY,
      h1Top: document.querySelector("h1")?.getBoundingClientRect().top,
    }));
    expect(state.y).toBeLessThanOrEqual(1);
    expect(state.h1Top).toBeGreaterThanOrEqual(0);
  });

  test("P0-C: a low-content route opens Para organizaciones with its H1 in view", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1252, height: 800 });
    await page.goto("/datos-abiertos");
    await expect(
      page.getByRole("heading", { level: 1, name: "Datos abiertos" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Para organizaciones" })
      .last()
      .click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Para centros y administraciones",
      }),
    ).toBeVisible();
    const h1Top = await page.evaluate(
      () => document.querySelector("h1")?.getBoundingClientRect().top,
    );
    expect(h1Top).toBeGreaterThanOrEqual(0);
  });

  test("P0-C: same-route filter updates keep the reading position", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1252, height: 800 });
    await page.goto("/desde-oferta?query=cuidador");
    await expect(page.getByText(/1–12 de /u)).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(150);
    await page.getByLabel("Provincia").selectOption({ label: "Burgos" });
    await expect(page.getByText(/1–12 de /u)).toBeVisible();
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(
      300,
    );
  });

  test("P0-C: hash navigation honors the target anchor", async ({ page }) => {
    await page.setViewportSize({ width: 1252, height: 800 });
    await page.goto("/desde-fp");
    await page
      .getByRole("link", { name: "Cómo funciona la cobertura de FP" })
      .click();
    await page.waitForURL(/metodologia#fp-catalogo/u);
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Qué estudiar y dónde se imparte",
      }),
    ).toBeVisible();
    const anchorTop = await page.evaluate(() => {
      const target = document.getElementById("fp-catalogo");
      return target === null ? null : target.getBoundingClientRect().top;
    });
    expect(anchorTop).not.toBeNull();
    expect(anchorTop!).toBeGreaterThanOrEqual(0);
  });

  test("P0-C: Back restores the previous route and its scroll position", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1252, height: 800 });
    await page.goto("/");
    // Scroll to a known offset and navigate via a DOM click event so the
    // harness performs no actionability scrolling.
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(250);
    const link = page.getByRole("link", { name: "Buscar una profesión →" });
    await link.dispatchEvent("click");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "¿Qué FP te lleva a una profesión?",
      }),
    ).toBeVisible();
    await page.goBack();
    await expect(
      page.getByRole("heading", { level: 1, name: /Tu FP, tus salidas/u }),
    ).toBeVisible();
    await page.waitForTimeout(600);
    const restored = await page.evaluate(() => window.scrollY);
    // Back must land in the same content region (the paths section). Async
    // data (search catalog, example) can still grow the page above the saved
    // offset after the restore, so a bounded tolerance applies — but the
    // position is never the top (the pre-fix behavior).
    expect(restored).toBeGreaterThanOrEqual(700);
    expect(restored).toBeLessThanOrEqual(1700);
  });

  test("P1: center modality expresses delivery only, ownership stays in its column", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1252, height: 900 });
    await page.goto("/donde-estudiar");
    await expect(
      page.getByRole("heading", { level: 1, name: /Dónde estudiar/u }),
    ).toBeVisible();
    const rows = page.locator("#center-results-table tbody tr");
    await expect(rows.first()).toBeVisible();
    const count = Math.min(await rows.count(), 8);
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const cells = rows.nth(index).locator("td");
      const modalityText = await cells.nth(2).innerText();
      expect(
        modalityText,
        `row ${index} modality must not repeat ownership`,
      ).not.toMatch(/Pública|Concertada|Privada/u);
      expect(modalityText).toMatch(
        /Presencial|A distancia|Mixta|Modalidad no publicada/u,
      );
      const titularidadText = await cells.nth(3).innerText();
      expect(titularidadText.length).toBeGreaterThan(0);
    }
  });

  test("P1: Más formación describes the public-calls copy as historical", async ({
    page,
  }) => {
    await page.goto("/recursos");
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: /Convocatorias que figuraban abiertas en la copia del/u,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Empleo público abierto al/u }),
    ).toHaveCount(0);
  });

  test("P1: citizen-facing methodology does not expose the offerEvidence identifier", async ({
    page,
  }) => {
    await page.goto("/metodologia");
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("offerEvidence");
  });

  test("P1: no rendered text contains whitespace before ; or :", async ({
    page,
  }) => {
    for (const route of [
      "/",
      "/desde-oferta",
      "/desde-fp",
      "/desde-ocupacion",
      "/donde-estudiar",
      "/comparar",
      "/recursos",
      "/datos-abiertos",
      "/metodologia",
      "/accesibilidad",
      "/para-organizaciones",
    ]) {
      await page.goto(route);
      await page.waitForTimeout(600);
      const hits = await collectPunctuationHits(page);
      expect(hits, JSON.stringify({ route, hits }, null, 2)).toEqual([]);
    }
  });

  test("P1: interior pages share one H1 scale and long prose keeps a reading measure", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1252, height: 900 });
    await page.goto("/accesibilidad");
    const accessibilityH1 = await page.evaluate(() => {
      const el = document.getElementById("accessibility-heading");
      return el === null ? null : getComputedStyle(el).fontSize;
    });
    await page.goto("/para-organizaciones");
    const organizationsH1 = await page.evaluate(() => {
      const el = document.getElementById("organizations-heading");
      return el === null ? null : getComputedStyle(el).fontSize;
    });
    await page.goto("/metodologia");
    const methodologyH1 = await page.evaluate(() => {
      const el = document.getElementById("methodology-heading");
      return el === null ? null : getComputedStyle(el).fontSize;
    });
    expect(accessibilityH1).toBe(methodologyH1);
    expect(organizationsH1).toBe(methodologyH1);

    await page.goto("/para-organizaciones");
    await expect(
      page.locator(".organizations-page .support-page-intro"),
    ).toBeVisible();
    const measure = await page.evaluate(() => {
      const intro = document.querySelector(
        ".organizations-page .support-page-intro",
      );
      return intro === null ? null : intro.clientWidth;
    });
    // ~44rem reading measure (65-75 characters per line).
    expect(measure).not.toBeNull();
    expect(measure!).toBeLessThanOrEqual(736);
  });

  test("explorar FP filter groups keep vertical spacing", async ({ page }) => {
    await page.setViewportSize({ width: 1252, height: 900 });
    await page.goto("/desde-fp");
    const summary = page.getByText("Filtrar catálogo y contexto");
    await summary.click();
    const levelField = page
      .locator(".training-search__filters .form-field")
      .first();
    await levelField.waitFor();
    const gap = await page.evaluate(() => {
      const fields = document.querySelectorAll(
        ".training-search__filters .form-field",
      );
      if (fields.length < 2) return null;
      const first = fields[0].getBoundingClientRect();
      const second = fields[1].getBoundingClientRect();
      return second.top - first.bottom;
    });
    expect(gap).not.toBeNull();
    expect(gap!).toBeGreaterThanOrEqual(16);
  });

  test("help disclosures keep axe clean on the home data block", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".proof-rail").waitFor();
    const trigger = page
      .getByRole("button", { name: "Qué es una relación revisada" })
      .first();
    await trigger.click();
    await expect(page.locator(".info-popover")).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .include(".proof-rail")
      .analyze();
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
