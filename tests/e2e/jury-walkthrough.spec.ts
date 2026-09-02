import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * JURY_WALKTHROUGH — every exact URL cited in docs/contest/jury-memo.md
 * (see also JURY_MEMO_URL_AUDIT in docs/design/screen-contracts.md) must keep
 * responding with stable, contract-compliant content. The memo encodes
 * occupationId percent-encoded (%3A); the encoded form is the public link.
 */
test.setTimeout(60_000);

const JURY_MEMO_URLS = [
  {
    url: "/desde-fp/SAN21",
    heading: /Cuidados Auxiliares de Enfermería/u,
    mustContain: [/profesi/u, /oferta/u, /centro/u],
    mustNotContain: [],
  },
  {
    url: "/desde-ocupacion/occupation%3Acno11%3A5611",
    heading: /Auxiliares de enfermería hospitalaria/u,
    mustContain: [/Cuidados Auxiliares de Enfermería/u],
    mustNotContain: [],
  },
  {
    url: "/desde-ocupacion/occupation%3Acno11%3A7111",
    heading: /Encofradores y operarios de puesta en obra de hormigón/u,
    mustContain: [],
    mustNotContain: [],
  },
  {
    url: "/desde-ocupacion/occupation%3Acno11%3A3820",
    heading: /Programadores informáticos/u,
    mustContain: [
      // 2 reviewed programs (DAM presencial + distancia) are shown
      /Desarrollo de Aplicaciones Multiplataforma/u,
    ],
    mustNotContain: [/no existen ofertas/iu, /¡ups!/iu],
  },
  {
    url: "/desde-oferta",
    heading: /Ofertas/u,
    mustContain: [/1058/u, /138/u],
    mustNotContain: [],
  },
  {
    url: "/datos-abiertos",
    heading: /Datos abiertos/u,
    mustContain: [],
    mustNotContain: [],
  },
];

for (const route of JURY_MEMO_URLS) {
  test(`jury memo URL ${route.url} keeps its contract content`, async ({
    page,
  }) => {
    await page.goto(route.url);
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading }),
    ).toBeVisible();

    for (const pattern of route.mustContain) {
      await expect(page.getByText(pattern).first()).toBeVisible();
    }
    for (const pattern of route.mustNotContain) {
      await expect(page.getByText(pattern)).toHaveCount(0);
    }

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - document.body.clientWidth,
      document:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    }));
    expect(overflow.body).toBeLessThanOrEqual(1);
    expect(overflow.document).toBeLessThanOrEqual(1);
  });
}

test("jury memo fail-closed CNO 3820 offers view keeps 2 reviewed programs and zero offers", async ({
  page,
}) => {
  await page.goto("/desde-ocupacion/occupation%3Acno11%3A3820/ofertas");
  await expect(
    page.getByText(/no hemos podido comprobar ofertas relacionadas/u).first(),
  ).toBeVisible();
  await expect(page.getByText(/no existen ofertas/iu)).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
});
