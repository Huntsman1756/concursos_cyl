import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { currentManifestFixture } from "../fixtures/generatedManifest";

test("occupation catalog loading is announced as a polite status", async ({
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

  await page.goto("/desde-ocupacion");
  const loading = page.getByText(/Preparando las ocupaciones oficiales/u);
  await expect(loading).toBeVisible();
  await expect(loading).toHaveAttribute("role", "status");
  await expect(loading).toHaveAttribute("aria-live", "polite");

  releaseManifest();
});

test("occupation results loading is announced as a polite status", async ({
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

  await page.goto("/desde-ocupacion/occupation%3Acno11%3A2713");
  const loading = page.getByText(/Preparando las rutas revisadas/u);
  await expect(loading).toBeVisible();
  await expect(loading).toHaveAttribute("role", "status");
  await expect(loading).toHaveAttribute("aria-live", "polite");

  releaseManifest();
});

test("occupation results fit the 320px content floor", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/desde-ocupacion/occupation%3Acno11%3A2713");
  await expect(
    page.getByRole("heading", {
      name: "Analistas, programadores y diseñadores web y multimedia",
    }),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("the live occupation journey confirms a reviewed everyday alias and reaches every reviewed development route", async ({
  page,
}, testInfo) => {
  await page.goto("/desde-ocupacion");
  const combobox = page.getByRole("combobox", {
    name: "¿En qué ocupación quieres trabajar?",
  });
  await combobox.fill("desarrollador web");
  const option = page.getByRole("option", {
    name: /Analistas, programadores y diseñadores web y multimedia/iu,
  });
  await expect(option).toBeVisible();

  if (testInfo.project.name === "chromium-mobile") {
    const listbox = await page.getByRole("listbox").boundingBox();
    const submit = await page
      .getByRole("button", { name: "Ver rutas formativas" })
      .boundingBox();
    expect(listbox).not.toBeNull();
    expect(submit).not.toBeNull();
    if (listbox && submit) {
      expect(listbox.y + listbox.height).toBeLessThanOrEqual(submit.y);
    }
  }

  if (testInfo.project.name === "chromium-mobile") {
    await option.tap();
  } else {
    await combobox.press("ArrowDown");
    await expect(combobox).toHaveAttribute("aria-activedescendant", /.+/u);
    await combobox.press("Enter");
  }

  await expect(page.locator(".confirmed-occupation")).toContainText(
    /Analistas, programadores y diseñadores web y multimedia/iu,
  );
  await page.getByRole("button", { name: "Ver rutas formativas" }).click();
  await expect(page).toHaveURL(
    /\/desde-ocupacion\/occupation%3Acno11%3A2713$/u,
  );

  const reviewedProgramKeys = ["IFC02S", "IFC02SD", "IFC03S", "IFC03SD"];
  await expect(page.getByText("Salida profesional oficial")).toHaveCount(2);
  expect(
    await page.getByText("Relación revisada").count(),
  ).toBeGreaterThanOrEqual(2);
  for (const programKey of reviewedProgramKeys) {
    await expect(
      page.getByText(`Grado superior · ${programKey}`, { exact: true }),
    ).toBeVisible();
  }
  await page.getByText("Ver cita exacta").first().click();
  await expect(
    page.getByText("Desarrollador de aplicaciones en entornos Web.").first(),
  ).toBeVisible();
  expect(
    await page.getByText("Modalidades", { exact: true }).count(),
  ).toBeGreaterThanOrEqual(reviewedProgramKeys.length);

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);

  const resultsUrl = page.url();
  for (const programKey of reviewedProgramKeys) {
    await page.goto(resultsUrl);
    await page.locator(`a[href="/formacion/${programKey}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/formacion/${programKey}$`, "u"));
    const centers = page.getByRole("list", {
      name: "Centros que imparten el ciclo",
    });
    const firstCenter = centers.getByRole("listitem").first();
    await expect(firstCenter).toBeVisible();
    await expect(
      firstCenter.getByText(/Presencial|A distancia|Mixta/iu),
    ).toBeVisible();
  }
});

test("occupation search and an unknown route make absence explicit", async ({
  page,
}) => {
  await page.goto("/desde-ocupacion");
  await page
    .getByRole("combobox", { name: "¿En qué ocupación quieres trabajar?" })
    .fill("ocupación inexistente");
  await expect(
    page.getByText("No encontramos una ocupación oficial con ese nombre."),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "¿En qué ocupación quieres trabajar?" }),
  ).not.toHaveAttribute("aria-controls");
  await expect(
    page.getByRole("combobox", { name: "¿En qué ocupación quieres trabajar?" }),
  ).toHaveAttribute("aria-expanded", "false");

  await page.goto("/desde-ocupacion/occupation%3Acno11%3A9999");
  await expect(
    page.getByRole("heading", { name: "Ocupación no encontrada" }),
  ).toBeVisible();
});

test("an official occupation without a reviewed FP relation remains searchable", async ({
  page,
}) => {
  await page.goto("/desde-ocupacion");
  const combobox = page.getByRole("combobox", {
    name: "¿En qué ocupación quieres trabajar?",
  });
  await combobox.fill("astrónomos");
  await page.getByRole("option", { name: /^Físicos y astrónomos/iu }).click();
  await page.getByRole("button", { name: "Ver rutas formativas" }).click();

  await expect(page).toHaveURL(
    /\/desde-ocupacion\/occupation%3Acno11%3A2411$/u,
  );
  await expect(
    page.getByRole("heading", { name: "Físicos y astrónomos" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Aún no hay una ruta formativa revisada para esta ocupación.",
    ),
  ).toBeVisible();
});
