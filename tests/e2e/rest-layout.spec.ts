import { expect, test } from "@playwright/test";

test("centers for a specific cycle paginate and preserve their scope", async ({
  page,
}) => {
  await page.goto("/donde-estudiar/ADG02S");
  const pager = page.getByRole("navigation", {
    name: "Paginación de opciones formativas",
  });
  await expect(pager).toContainText("1–25 de 45");
  await expect(page.locator("#center-results-table tbody tr")).toHaveCount(25);
  await pager.getByRole("button", { name: "Página siguiente" }).click();
  await expect(page).toHaveURL(/\/donde-estudiar\/ADG02S\?page=2$/);
  await expect(pager).toContainText("26–45 de 45");
  await expect(page.locator("#center-results-table tbody tr")).toHaveCount(20);
  await page.reload();
  await expect(pager).toContainText("26–45 de 45");
  await pager.getByRole("button", { name: "Página anterior" }).click();
  await expect(pager).toContainText("1–25 de 45");
});

test("resource lists expand independently and reset when searching", async ({
  page,
}) => {
  await page.goto("/recursos");
  const courses = page.getByRole("region", { name: "Cursos del ECYL" });
  const certificates = page.getByRole("region", {
    name: "Certificados de profesionalidad",
  });
  await expect(courses.getByRole("article")).toHaveCount(8);
  await expect(certificates.getByRole("article")).toHaveCount(8);
  await courses.getByRole("button", { name: "Mostrar más cursos" }).click();
  await expect(courses.getByRole("article")).toHaveCount(16);
  await expect(certificates.getByRole("article")).toHaveCount(8);
  await certificates
    .getByRole("button", { name: "Mostrar más certificados" })
    .click();
  await expect(certificates.getByRole("article")).toHaveCount(16);
  const search = page.getByRole("searchbox", {
    name: "Buscar por nombre, localidad o código",
  });
  await search.fill("sin coincidencias xyz");
  await expect(courses.getByRole("article")).toHaveCount(0);
  await search.clear();
  await expect(courses.getByRole("article")).toHaveCount(8);
  await expect(certificates.getByRole("article")).toHaveCount(8);
});

test("training center summary names each locality once without changing center counts", async ({
  page,
}) => {
  await page.goto("/desde-fp/ADG02S");
  const province = page
    .locator(".province-groups > li")
    .filter({ has: page.getByText("Valladolid", { exact: true }) });
  await expect(province).toContainText("10 centros");
  await expect(province).toContainText(
    "Laguna de Duero, Medina del Campo y Valladolid",
  );
  const locations = await province.locator("span").innerText();
  expect(locations.match(/Valladolid/g)).toHaveLength(1);
});
