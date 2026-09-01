import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

for (const route of [
  { path: "/donde-estudiar", heading: /Dónde estudiar/u },
  { path: "/donde-estudiar/INA02M", heading: /Dónde estudiar/u },
  {
    path: "/desde-fp/INA02M/ofertas",
    heading: /Ofertas relacionadas con/u,
  },
  {
    path: "/desde-ocupacion/occupation%3Acno11%3A5611/ofertas",
    heading: /Ofertas relacionadas con/u,
  },
]) {
  test(`${route.path} is a direct, accessible candidate route`, async ({
    page,
  }) => {
    await page.goto(route.path);
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading }),
    ).toBeVisible();

    if (route.path === "/donde-estudiar") {
      await expect(page.locator(".center-catalog__table tbody tr")).toHaveCount(
        50,
      );
      await expect(
        page.getByRole("navigation", {
          name: "Paginación de opciones formativas",
        }),
      ).toBeVisible();
    }
    if (route.path === "/donde-estudiar/INA02M") {
      await expect(page.locator(".center-catalog__table tbody tr")).toHaveCount(
        3,
      );
      await expect(
        page.getByRole("navigation", {
          name: "Paginación de opciones formativas",
        }),
      ).toHaveCount(0);
    }

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - document.body.clientWidth,
      document:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    }));
    expect(overflow.body).toBeLessThanOrEqual(1);
    expect(overflow.document).toBeLessThanOrEqual(1);

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
}
