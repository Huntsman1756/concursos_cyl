import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("publishes the derived FP occupation graph in reusable formats", async ({
  page,
  request,
}) => {
  await page.goto("/datos-abiertos");

  await expect(
    page.getByRole("heading", { name: "Datos abiertos de SALIDA CyL" }),
  ).toBeVisible();
  await expect(page.getByText("Relaciones", { exact: true })).toBeVisible();
  const jsonLink = page.getByRole("link", { name: "Descargar JSON" });
  const csvLink = page.getByRole("link", { name: "Descargar CSV" });
  await expect(jsonLink).toHaveAttribute(
    "href",
    /derived-fp-occupation-graph\.json$/u,
  );
  await expect(csvLink).toHaveAttribute(
    "href",
    /derived-fp-occupation-graph\.csv$/u,
  );
  await expect(
    page.getByRole("heading", {
      name: "Ofertas: requisito, relación y acción",
    }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Dataset candidato de expansión", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Descargar dataset JSON" }),
  ).toHaveCount(0);

  const csvResponse = await request.get((await csvLink.getAttribute("href"))!);
  expect(csvResponse.ok()).toBe(true);
  expect(await csvResponse.text()).toContain("program_key,program_title");

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
