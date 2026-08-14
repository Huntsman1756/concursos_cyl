import { expect, test } from "@playwright/test";

test("decision answers and checklist never create write requests", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) {
      writes.push(request.url());
    }
  });
  await page.goto("/desde-fp/ADG01M");
  await page.getByRole("button", { name: "No lo tengo" }).first().click();
  await expect(page.getByText("Brecha declarada")).toBeVisible();
  expect(writes).toEqual([]);
  expect(page.url()).not.toMatch(/requirement:|lacks|no%20lo%20tengo/i);
});
