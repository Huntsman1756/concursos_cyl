import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("home foundation", () => {
  test("home exposes both journeys and no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /he terminado fp/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /quiero trabajar de/i }),
    ).toBeVisible();
    await expect(page.getByText(/datos actualizados:/i)).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((item) => item.impact === "critical"),
    ).toEqual([]);
  });

  test("supports keyboard focus, mobile width and ordered equal entries", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: /saltar al contenido/i }),
    ).toBeFocused();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);

    const cards = page.locator(".entry-card");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText("He terminado FP");
    await expect(cards.nth(1)).toContainText("Quiero trabajar de");
  });
});
