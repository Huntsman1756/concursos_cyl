import { expect, test } from "@playwright/test";

test("deep links and static data work in the production server", async ({
  page,
}) => {
  await page.goto("/desde-fp/ADG01M");
  await expect(
    page.getByRole("heading", { name: /gestión administrativa/i }),
  ).toBeVisible();
  const manifest = await page.request.get("/data/v1/manifest.json");
  expect(manifest.ok()).toBe(true);

  await page.goto("/metodologia");
  await expect(
    page.getByRole("link", { name: /descargar manifiesto de datos/i }),
  ).toHaveAttribute("href", "/data/v1/manifest.json");
});
