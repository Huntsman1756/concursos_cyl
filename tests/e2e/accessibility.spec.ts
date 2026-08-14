import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  "/",
  "/desde-fp",
  "/desde-ocupacion",
  "/comparar-estudios",
  "/metodologia",
];

for (const route of routes) {
  test(`${route} has one heading, named controls and no serious axe findings`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter(
        (item) => item.impact === "critical" || item.impact === "serious",
      ),
    ).toEqual([]);
  });
}
