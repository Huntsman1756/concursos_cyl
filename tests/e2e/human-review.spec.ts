import { expect, test } from "@playwright/test";

test("profession source stays inside the viewport and Escape restores its trigger", async ({
  page,
}) => {
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/desde-ocupacion/occupation%3Acno11%3A2713");
    const trigger = page.getByLabel("Fuente y revisión de esta profesión", {
      exact: true,
    });
    await trigger.click();
    const panel = page.locator(
      ".training-page__meta .info-disclosure__content",
    );
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await trigger.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test("profession without FP has one page heading and no duplicate IDs", async ({
  page,
}) => {
  await page.goto("/desde-ocupacion/occupation%3Acno11%3A2111");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /Esta copia no contiene relaciones FP/,
    }),
  ).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  const duplicates = await page.locator("[id]").evaluateAll((elements) => {
    const ids = elements.map((e) => e.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
  expect(duplicates).toEqual([]);
});

test("empty catalogues announce their own count without global totals", async ({
  page,
}) => {
  await page.goto("/desde-oferta");
  const offerSummary = page.locator("#offer-results-heading");
  await expect(offerSummary).toContainText("1058 ofertas");
  await page.getByRole("searchbox").fill("zzzinexistente");
  await page.getByRole("button", { name: "Buscar", exact: true }).focus();
  await page
    .getByRole("button", { name: "Buscar", exact: true })
    .press("Enter");
  await expect(offerSummary).toHaveText("0–0 de 0 ofertas");
  await expect(offerSummary).toHaveAttribute("aria-live", "polite");
  await expect(offerSummary).toHaveAttribute("aria-atomic", "true");
  await expect(page.locator(".offer-explorer__count")).not.toContainText("138");
  await expect(
    page.getByRole("button", { name: "Buscar", exact: true }),
  ).toBeFocused();
  await page.goto("/donde-estudiar");
  const summary = page.locator("#center-results-summary");
  await expect(summary).toContainText("centros representados");
  const filters = page.getByRole("button", { name: "Filtros", exact: true });
  if (await filters.isVisible()) await filters.click();
  await page.getByRole("searchbox").fill("zzzinexistente");
  await page.getByRole("button", { name: "Aplicar", exact: true }).focus();
  await page
    .getByRole("button", { name: "Aplicar", exact: true })
    .press("Enter");
  await expect(summary.getByRole("status")).toHaveText(
    "0–0 de 0 combinaciones de centro y ciclo",
  );
  await expect(summary).not.toContainText("1294");
  await expect(
    page.getByRole("button", { name: "Aplicar", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Quitar filtros", exact: true })
    .click();
  await expect(summary.getByRole("status")).toContainText("1–25");
});

test("mobile comparison offers a visible shortcut to the existing result", async ({
  page,
}) => {
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/comparar");
    await expect(
      page.getByRole("link", { name: "Ver comparación", exact: true }),
    ).toHaveCount(0);
    await page.getByText("Grado superior", { exact: true }).click();
    const choices = page
      .getByRole("group", { name: "Ciclos y grupos oficiales disponibles" })
      .getByRole("checkbox");
    await choices.nth(0).check();
    await choices.nth(1).check();
    const shortcut = page.getByRole("link", {
      name: "Ver comparación",
      exact: true,
    });
    await expect(shortcut).toBeInViewport();
    await shortcut.click();
    const result = page.getByRole("region", {
      name: "Evidencia seleccionada",
      exact: true,
    });
    await expect(result).toBeFocused();
    await expect(result).toBeInViewport();
    await choices.nth(1).uncheck();
    await choices.nth(0).uncheck();
    await expect(shortcut).toHaveCount(0);
    await expect(result).toHaveCount(0);
  }
});

test("resource counters announce their section and updated amount", async ({
  page,
}) => {
  await page.goto("/recursos");
  const courses = page.getByRole("region", {
    name: "Cursos del ECYL",
    exact: true,
  });
  const counter = courses.getByRole("status");
  await expect(counter).toContainText("8 de");
  await courses.getByRole("button", { name: "Mostrar más cursos" }).focus();
  await courses
    .getByRole("button", { name: "Mostrar más cursos" })
    .press("Enter");
  await expect(counter).toContainText("16 de");
  await expect(counter).toHaveAttribute("aria-atomic", "true");
  await expect(
    courses.getByRole("button", { name: "Mostrar más cursos" }),
  ).toBeFocused();
  await page
    .getByRole("searchbox", { name: "Buscar en cursos y certificados" })
    .fill("zzzinexistente");
  await expect(counter).toHaveText("Cursos: 0 de 0");
  await expect(
    page
      .getByRole("region", {
        name: "Certificados de profesionalidad",
        exact: true,
      })
      .getByRole("status"),
  ).toHaveText("Certificados: 0 de 0");
});

test("FP offer source headings have accessible names", async ({ page }) => {
  await page.goto("/desde-fp/ADG02S");
  const card = page.locator(".offer-row").first();
  await card.getByText("Fuente y revisión", { exact: true }).click();
  const panel = card.locator(".info-disclosure__content");
  await expect(
    panel.getByRole("heading", {
      level: 4,
      name: "Por qué aparece esta oferta",
    }),
  ).toHaveCount(1);
  await expect(
    panel.getByRole("heading", {
      level: 4,
      name: "Cómo se extrajeron los requisitos",
    }),
  ).toHaveCount(1);
});
