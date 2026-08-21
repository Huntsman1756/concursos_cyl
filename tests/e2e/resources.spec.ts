import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("public resources expose open JCyL employment calls with provenance", async ({
  page,
}) => {
  await page.goto("/recursos");

  await expect(
    page.getByRole("heading", { name: "Empleo público abierto ahora" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Fuente: Convocatorias de Empleo Público JCyL",
    }),
  ).toHaveAttribute("href", /convocatorias-de-empleo-publico/u);
  await expect(page.getByText(/\d+ convocatorias?$/u)).toBeVisible();

  await expect(page.getByText(/^40 de \d+ resultados$/u)).toBeVisible();
  await page.getByRole("button", { name: "Mostrar más cursos" }).click();
  await expect(page.getByText(/^80 de \d+ resultados$/u)).toBeVisible();

  await expect(page.getByText(/^60 de \d+ resultados$/u)).toBeVisible();
  await page.getByRole("button", { name: "Mostrar más certificados" }).click();
  await expect(page.getByText(/^120 de \d+ resultados$/u)).toBeVisible();

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
});
