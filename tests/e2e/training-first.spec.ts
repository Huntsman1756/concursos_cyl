import { expect, test } from "@playwright/test";

test("training-first preserves quote-backed evidence and declared gaps", async ({
  page,
}) => {
  await page.goto("/desde-fp");
  await page
    .getByRole("combobox", { name: /ciclo formativo/i })
    .fill("Gestión Administrativa");
  await page
    .getByRole("option", { name: /Gestión Administrativa \(ADG01M\)/i })
    .click();
  await page.getByRole("button", { name: /ver ofertas y rutas/i }).click();
  await expect(
    page.getByRole("heading", { name: /gestión administrativa/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: "No lo tengo" }).first().click();
  await expect(page.getByText("Brecha declarada")).toBeVisible();
  await expect(page.getByText(/no se publica este requisito/i)).toBeVisible();
});
