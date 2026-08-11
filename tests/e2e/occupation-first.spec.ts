import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the live occupation journey confirms a reviewed everyday alias and reaches official DAW centers", async ({
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

  await expect(page.getByText("Salida profesional oficial")).toHaveCount(2);
  await expect(
    page.getByText("Grado superior · IFC03S", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Grado superior · IFC03SD", { exact: true }),
  ).toBeVisible();
  await page.getByText("Ver cita exacta").first().click();
  await expect(
    page.getByText("Desarrollador de aplicaciones en entornos Web.").first(),
  ).toBeVisible();
  await expect(page.getByText("Modalidades", { exact: true })).toHaveCount(2);

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);

  const resultsUrl = page.url();
  for (const programKey of ["IFC03S", "IFC03SD"]) {
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
