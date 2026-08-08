import { expect, test } from "@playwright/test";
import {
  installDecisionFlowFixture,
  syntheticQuotes,
  syntheticRequirementId,
  syntheticRequirementValues,
} from "../fixtures/decisionFlowFixture";

declare global {
  interface Window {
    __decisionPrivacyEvents?: string[];
  }
}

test("answer, exact-absence filter, and checklist remain ephemeral and never leave the browser", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__decisionPrivacyEvents = [];
    const record = (event: string) =>
      window.__decisionPrivacyEvents?.push(event);
    for (const method of ["setItem", "removeItem", "clear"] as const) {
      const original = Storage.prototype[method];
      Object.defineProperty(Storage.prototype, method, {
        configurable: true,
        value: function (...args: unknown[]) {
          record(`storage:${method}`);
          return original.apply(this, args as never);
        },
      });
    }
    const cookie = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "cookie",
    );
    if (cookie?.set !== undefined) {
      Object.defineProperty(Document.prototype, "cookie", {
        configurable: true,
        get: cookie.get,
        set(value: string) {
          record("cookie");
          cookie.set?.call(this, value);
        },
      });
    }
    const beacon = navigator.sendBeacon.bind(navigator);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value(url: string | URL, data?: BodyInit | null) {
        record("beacon");
        return beacon(url, data);
      },
    });
  });
  await installDecisionFlowFixture(page);
  await page.goto("/desde-fp/IFC03S");
  const card = page.getByRole("article", {
    name: "Desarrollador web para servicios públicos",
  });
  await expect(card).toBeVisible();

  await page.evaluate(() => {
    window.__decisionPrivacyEvents = [];
  });
  const interactionRequests: { method: string; url: string }[] = [];
  page.on("request", (request) => {
    interactionRequests.push({ method: request.method(), url: request.url() });
  });

  await card
    .getByRole("radio", {
      name: `No lo tengo: ${syntheticQuotes.experienceQuote}`,
    })
    .click();
  await card
    .getByRole("button", {
      name: "Ver ofertas relacionadas donde no se publica este requisito",
    })
    .click();
  await page.getByRole("button", { name: "Quitar filtro" }).click();

  await card
    .getByRole("radio", {
      name: `No lo tengo: ${syntheticQuotes.certificateQuote}`,
    })
    .click();
  const checklistButton = card.getByRole("button", {
    name: "Añadir a comprobaciones de esta sesión",
  });
  await checklistButton.click();
  await expect(
    card.getByRole("complementary", { name: "Comprobaciones de esta sesión" }),
  ).toBeVisible();
  await card.getByRole("button", { name: "Quitar de comprobaciones" }).click();
  await expect(
    card.getByRole("complementary", { name: "Comprobaciones de esta sesión" }),
  ).toHaveCount(0);
  await checklistButton.click();
  await expect(
    card.getByRole("complementary", { name: "Comprobaciones de esta sesión" }),
  ).toBeVisible();

  const events = await page.evaluate(
    () => window.__decisionPrivacyEvents ?? [],
  );
  expect(events).toEqual([]);
  expect(interactionRequests).toEqual([]);

  await page.reload();
  await expect(card).toBeVisible();
  await expect(
    card.getByRole("radio", {
      name: `No lo tengo: ${syntheticQuotes.experienceQuote}`,
    }),
  ).not.toBeChecked();
  await expect(page.getByText(/Filtro activo:/u)).toHaveCount(0);
  await expect(
    card.getByRole("complementary", { name: "Comprobaciones de esta sesión" }),
  ).toHaveCount(0);

  expect(interactionRequests.every(({ method }) => method === "GET")).toBe(
    true,
  );
  expect(interactionRequests.length).toBeGreaterThan(0);
  for (const { url } of interactionRequests) {
    const requestLocation = new URL(url);
    const serializedRequestState = [
      ...requestLocation.pathname
        .split("/")
        .filter(Boolean)
        .map(decodeURIComponent),
      ...requestLocation.searchParams.values(),
      decodeURIComponent(requestLocation.hash.slice(1)),
    ];
    expect(serializedRequestState).not.toContain(syntheticRequirementId);
    for (const answerValue of ["has", "lacks", "unsure"]) {
      expect(serializedRequestState).not.toContain(answerValue);
    }
    for (const normalizedValue of syntheticRequirementValues) {
      expect(serializedRequestState).not.toContain(normalizedValue);
    }
  }
  const location = await page.evaluate(
    () => `${location.pathname}${location.search}${location.hash}`,
  );
  expect(location).toBe("/desde-fp/IFC03S");
});
