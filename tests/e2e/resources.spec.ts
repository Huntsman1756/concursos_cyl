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

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
});
