import { expect, test } from "@playwright/test";

test("reduced motion removes card and disclosure transitions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const transitionDuration = await page
    .locator(".entry-card")
    .first()
    .evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transitionDuration).toBe("0s");
  await page.getByRole("link", { name: /he terminado fp/i }).focus();
  await expect(
    page.getByRole("link", { name: /he terminado fp/i }),
  ).toBeFocused();
});
