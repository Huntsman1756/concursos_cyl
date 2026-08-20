import { expect, test, type Page } from "@playwright/test";
import {
  installDecisionFlowFixture,
  syntheticQuotes,
  syntheticRequirementId,
  syntheticRequirementValues,
} from "../fixtures/decisionFlowFixture";

declare global {
  interface Window {
    recordDecisionPrivacyEvent?: (event: string) => Promise<void>;
  }
}

async function expectPrivateLocation(page: Page): Promise<void> {
  const rawUrl = page.url();
  const decodedRawUrl = decodeURIComponent(rawUrl);
  const location = new URL(rawUrl);
  const decodedLocation = decodeURIComponent(
    `${location.pathname}${location.search}${location.hash}`,
  );

  expect(location.pathname).toBe("/desde-fp/IFC03S");
  expect(location.search).toBe("");
  expect(location.hash).toBe("");
  expect(decodedRawUrl).not.toContain(syntheticRequirementId);
  for (const answerValue of ["has", "lacks", "unsure"]) {
    expect(decodedRawUrl).not.toContain(answerValue);
  }
  for (const normalizedValue of syntheticRequirementValues) {
    expect(decodedLocation).not.toContain(normalizedValue);
  }
}

async function expectEmptyBrowserPersistence(page: Page): Promise<void> {
  const persistence = await page.evaluate(async () => {
    const cookieStore = (
      window as Window & {
        cookieStore?: { getAll?: () => Promise<unknown[]> };
      }
    ).cookieStore;
    return {
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage),
      cookie: document.cookie,
      cookieStoreCount:
        typeof cookieStore?.getAll === "function"
          ? (await cookieStore.getAll()).length
          : null,
    };
  });

  expect(persistence.localStorageKeys).toEqual([]);
  expect(persistence.sessionStorageKeys).toEqual([]);
  expect(persistence.cookie).toBe("");
  if (persistence.cookieStoreCount !== null) {
    expect(persistence.cookieStoreCount).toBe(0);
  }
}

async function expectNoPrivacyEvents(
  page: Page,
  privacyEvents: string[],
): Promise<void> {
  const barrier = "privacy-event-barrier";
  await page.evaluate(async (event) => {
    await window.recordDecisionPrivacyEvent?.(event);
  }, barrier);
  expect(privacyEvents).toEqual([barrier]);
  privacyEvents.splice(0);
}

function expectNoSerializedRequestState(url: string): void {
  const location = new URL(url);
  const decodedPath = decodeURIComponent(location.pathname);
  const decodedQueryAndHash = decodeURIComponent(
    `${location.search}${location.hash}`,
  );

  expect(decodedPath).not.toContain(syntheticRequirementId);
  expect(decodedQueryAndHash).not.toContain(syntheticRequirementId);
  for (const answerValue of ["has", "lacks", "unsure"]) {
    expect(decodedQueryAndHash).not.toContain(answerValue);
    if (!decodedPath.startsWith("/node_modules/")) {
      expect(decodedPath).not.toContain(answerValue);
    }
  }
  for (const normalizedValue of syntheticRequirementValues) {
    expect(decodedPath).not.toContain(normalizedValue);
    expect(decodedQueryAndHash).not.toContain(normalizedValue);
  }
}

test("answer, exact-absence filter, and checklist remain ephemeral and never leave the browser", async ({
  page,
  browserName,
}) => {
  const privacyEvents: string[] = [];
  const domStorageMutations: string[] = [];
  await page.exposeBinding(
    "recordDecisionPrivacyEvent",
    (_source, event: string) => {
      privacyEvents.push(event);
    },
  );
  await page.addInitScript(() => {
    const record = (event: string) => {
      void window.recordDecisionPrivacyEvent?.(event);
    };
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
          record("cookie:document");
          cookie.set?.call(this, value);
        },
      });
    }
    const cookieStore = (
      window as Window & {
        cookieStore?: Record<string, unknown>;
      }
    ).cookieStore;
    for (const method of ["set", "delete"] as const) {
      const original = cookieStore?.[method];
      if (typeof original !== "function" || cookieStore === undefined) continue;
      Object.defineProperty(cookieStore, method, {
        configurable: true,
        value: function (...args: unknown[]) {
          record(`cookie-store:${method}`);
          return original.apply(this, args as never);
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
    for (const method of ["pushState", "replaceState"] as const) {
      const original = history[method];
      Object.defineProperty(history, method, {
        configurable: true,
        value: function (...args: unknown[]) {
          record(`history:${method}`);
          return original.apply(this, args as never);
        },
      });
    }
    window.addEventListener("hashchange", () => record("history:hashchange"));
  });
  await installDecisionFlowFixture(page);
  if (browserName === "chromium") {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("DOMStorage.enable");
    for (const event of [
      "DOMStorage.domStorageItemAdded",
      "DOMStorage.domStorageItemUpdated",
      "DOMStorage.domStorageItemRemoved",
      "DOMStorage.domStorageItemsCleared",
    ]) {
      cdp.on(event, () => domStorageMutations.push(event));
    }
  }
  await page.goto("/desde-fp/IFC03S");
  const card = page.getByRole("article", {
    name: "Desarrollador web para servicios públicos",
  });
  await expect(card).toBeVisible();

  if (browserName === "chromium") {
    await page.evaluate((probeKey) => {
      localStorage[probeKey] = "probe";
      delete localStorage[probeKey];
      sessionStorage[probeKey] = "probe";
      delete sessionStorage[probeKey];
    }, "__e2e_direct_storage_probe__");
    await expect
      .poll(() => domStorageMutations.length)
      .toBeGreaterThanOrEqual(4);
  } else {
    await page.evaluate((probeKey) => {
      localStorage.setItem(probeKey, "probe");
      localStorage.removeItem(probeKey);
      sessionStorage.setItem(probeKey, "probe");
      sessionStorage.removeItem(probeKey);
    }, "__e2e_storage_probe__");
    await expect.poll(() => privacyEvents.length).toBeGreaterThanOrEqual(4);
  }
  await expectEmptyBrowserPersistence(page);
  await page.evaluate(async () => {
    await window.recordDecisionPrivacyEvent?.("privacy-calibration-barrier");
  });

  privacyEvents.splice(0);
  domStorageMutations.splice(0);
  const interactionRequests: { method: string; url: string }[] = [];
  const recordRequest = (request: { method(): string; url(): string }) => {
    interactionRequests.push({ method: request.method(), url: request.url() });
  };
  page.on("request", recordRequest);

  await card.getByText("Ver evidencia y requisitos", { exact: true }).click();

  await card
    .getByRole("radio", {
      name: `No lo tengo: ${syntheticQuotes.experienceQuote}`,
    })
    .click();
  await expectPrivateLocation(page);
  await card
    .getByRole("button", {
      name: "Ver ofertas relacionadas donde no se publica este requisito",
    })
    .click();
  await expectPrivateLocation(page);
  await page.getByRole("button", { name: "Quitar filtro" }).click();
  await expectPrivateLocation(page);

  await card.getByText("Ver evidencia y requisitos", { exact: true }).click();

  await card
    .getByRole("radio", {
      name: `No lo tengo: ${syntheticQuotes.certificateQuote}`,
    })
    .click();
  await expectPrivateLocation(page);
  const checklistButton = card.getByRole("button", {
    name: "Añadir a comprobaciones de esta sesión",
  });
  await checklistButton.click();
  await expect(
    card.getByRole("complementary", { name: "Comprobaciones de esta sesión" }),
  ).toBeVisible();
  await expectPrivateLocation(page);
  await card.getByRole("button", { name: "Quitar de comprobaciones" }).click();
  await expect(
    card.getByRole("complementary", { name: "Comprobaciones de esta sesión" }),
  ).toHaveCount(0);
  await expectPrivateLocation(page);
  await checklistButton.click();
  await expect(
    card.getByRole("complementary", { name: "Comprobaciones de esta sesión" }),
  ).toBeVisible();
  await expectPrivateLocation(page);

  await expectNoPrivacyEvents(page, privacyEvents);
  expect(interactionRequests).toEqual([]);

  await page.reload();
  await expect(card).toBeVisible();
  await card.getByText("Ver evidencia y requisitos", { exact: true }).click();
  await expect(
    card.getByRole("radio", {
      name: `No lo tengo: ${syntheticQuotes.experienceQuote}`,
    }),
  ).not.toBeChecked();
  await expect(page.getByText(/Filtro activo:/u)).toHaveCount(0);
  await expect(
    card.getByRole("complementary", { name: "Comprobaciones de esta sesión" }),
  ).toHaveCount(0);
  await expectPrivateLocation(page);
  await expectEmptyBrowserPersistence(page);
  await expectNoPrivacyEvents(page, privacyEvents);
  expect(domStorageMutations).toEqual([]);
  expect(interactionRequests.length).toBeGreaterThan(0);
  for (const { method, url } of interactionRequests) {
    expect(method).toBe("GET");
    expectNoSerializedRequestState(url);
  }
});
