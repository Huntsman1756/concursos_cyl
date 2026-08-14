import { expect, test } from "@playwright/test";

test("occupation-first requires confirmation and shows official routes", async ({
  page,
}) => {
  await page.goto("/desde-ocupacion");
  const combobox = page.getByRole("combobox", { name: /ocupación/i });
  await combobox.fill("programación web");
  await expect(
    page.getByRole("option", { name: /programación web/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /ver rutas/i })).toBeDisabled();
  await page.getByRole("option", { name: /programación web/i }).click();
  await page.getByRole("button", { name: /ver rutas/i }).click();
  await expect(
    page.getByRole("heading", { name: /desarrollador web/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /ver dónde estudiarlo/i })
    .first()
    .click();
  await expect(page.getByText(/valladolid/i).first()).toBeVisible();
});
