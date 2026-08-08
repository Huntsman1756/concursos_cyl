import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const results = JSON.parse(
  await readFile(
    new URL(
      "../../analysis/fp_official_alias_pass_results.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  programs: { programKey: string; afterOfferCount: number }[];
};

for (const program of results.programs) {
  test(`${program.programKey} exposes the validated official-alias count`, async ({
    page,
  }) => {
    await page.goto(`/desde-fp/${program.programKey}`);

    await expect(page.getByRole("article")).toHaveCount(
      program.afterOfferCount,
    );
    if (program.afterOfferCount === 0) {
      await expect(
        page.getByText(
          /No hay ofertas relacionadas en la instant\u00e1nea del/u,
        ),
      ).toBeVisible();
    }
  });
}
