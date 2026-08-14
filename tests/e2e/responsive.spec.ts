import { expect, test } from "@playwright/test";

for (const route of ["/", "/comparar-estudios", "/metodologia"]) {
  test(`${route} has no horizontal overflow at narrow width and 200% zoom`, async ({
    page,
  }) => {
    await page.goto(route);
    const narrowOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(narrowOverflow).toBeLessThanOrEqual(1);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    const zoomOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth * 2,
    );
    expect(zoomOverflow).toBeLessThanOrEqual(1);
  });
}
