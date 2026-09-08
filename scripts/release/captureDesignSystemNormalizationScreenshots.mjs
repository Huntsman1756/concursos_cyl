#!/usr/bin/env node
/**
 * Production-build screenshot evidence for the normalized visual system.
 *
 * The route/viewport matrix is intentionally explicit so the evidence can be
 * regenerated without depending on a developer-server state. The contact
 * sheets are review aids; they do not replace human inspection of the full
 * page captures.
 */
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const outputRoot = join(repoRoot, "analysis", "design-system-normalization");
const port = 4218;
const baseUrl = `http://127.0.0.1:${port}`;

const routes = [
  { id: "home", path: "/", ready: [".home-page .task-selector"] },
  {
    id: "fp-detail",
    path: "/desde-fp/ADG02S",
    ready: [".training-result-page .result-summary"],
  },
  {
    id: "occupation-detail",
    path: "/desde-ocupacion/occupation%3Acno11%3A5611",
    ready: [".occupation-result-page #mercado-laboral"],
  },
  {
    id: "offers-global",
    path: "/desde-oferta",
    ready: [".offer-explorer__search"],
  },
  {
    id: "centers-global",
    path: "/donde-estudiar",
    ready: [".catalog-page .filter-bar", ".catalog-page .sheet-button"],
  },
  {
    id: "compare",
    path: "/comparar",
    ready: [".compare-page .income-comparison-form"],
  },
  {
    id: "resources",
    path: "/recursos",
    ready: [".resources-page .resources-filters"],
  },
  {
    id: "open-data",
    path: "/datos-abiertos",
    ready: [".open-data-page .open-data-release"],
  },
  {
    id: "methodology",
    path: "/metodologia",
    ready: [".methodology-page .source-method-grid"],
  },
];

const viewports = [
  { name: "320", width: 320, height: 720 },
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];

const routeById = new Map(routes.map((route) => [route.id, route]));

const shots = [
  ...routes.map((route) => ({
    name: `${route.id}-${route.id === "compare" ? "studies-" : ""}320`,
    route,
    viewport: viewports[0],
  })),
  ...routes.map((route) => ({
    name:
      route.id === "home"
        ? "home-390-long"
        : `${route.id}-${route.id === "compare" ? "studies-" : ""}390`,
    route,
    viewport: viewports[1],
    fullPage: route.id === "home",
  })),
  ...routes.map((route) => ({
    name:
      route.id === "open-data"
        ? "open-data-1440-implementation"
        : route.id === "methodology"
          ? "methodology-1440-implementation"
          : `${route.id}-${route.id === "compare" ? "studies-" : ""}1440`,
    route,
    viewport: viewports[2],
  })),
];

const supplementalShots = [
  {
    name: "offers-contextual-320",
    route: {
      id: "offers-contextual",
      path: "/desde-fp/ADG02S/ofertas",
      ready: [".offer-explorer__search"],
    },
    viewport: viewports[0],
  },
  {
    name: "centers-contextual-320",
    route: {
      id: "centers-contextual",
      path: "/donde-estudiar/ADG02S",
      ready: [".catalog-page .filter-bar", ".catalog-page .sheet-button"],
    },
    viewport: viewports[0],
  },
];

function waitForServer(url, attempts = 60) {
  return (async () => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(url);
        if (response.ok) return;
      } catch {}
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
    }
    throw new Error(`Preview server did not start at ${url}`);
  })();
}

async function waitForRoute(page, route) {
  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    ({ readySelectors }) => {
      const heading = document.querySelector("main h1");
      if (!heading || heading.textContent?.trim().length === 0) return false;

      return readySelectors.some((selector) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      });
    },
    { readySelectors: route.ready },
    { timeout: 15000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function primeLazyImages(page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight - 96, 1);
    const maxY = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0,
    );
    for (let y = 0; y <= maxY; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () =>
      [...document.images].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    undefined,
    { timeout: 15000 },
  );
}

async function createContactSheet(browser, name, imageNames, cellWidth) {
  const images = imageNames
    .map((imageName) => {
      const path = join(outputRoot, `${imageName}.png`);
      return {
        imageName,
        source: `data:image/png;base64,${readFileSync(path).toString("base64")}`,
      };
    })
    .map(
      ({ imageName, source }) => `
        <figure>
          <figcaption>${imageName}</figcaption>
          <img src="${source}" alt="${imageName}" />
        </figure>`,
    )
    .join("\n");
  const page = await browser.newPage({
    viewport: { width: cellWidth * 3 + 64, height: 900 },
  });
  await page.setContent(
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${name}</title>
    <style>
      :root { color-scheme: light; font-family: Arial, sans-serif; }
      body { margin: 0; padding: 24px; background: #f3f5f6; color: #18262c; }
      main { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
      figure { margin: 0; padding: 10px; background: white; border: 1px solid #d2dce0; border-radius: 8px; box-shadow: 0 2px 8px rgb(24 38 44 / 8%); }
      figcaption { min-height: 2.2em; margin-bottom: 8px; font-size: 13px; font-weight: 700; line-height: 1.2; }
      img { display: block; width: 100%; height: 420px; object-fit: ${name.includes("1440") ? "contain" : "cover"}; object-position: top; border: 1px solid #e4eaec; background: #fff; }
    </style>
  </head>
  <body><main>${images}</main></body>
</html>`,
    { waitUntil: "load" },
  );
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete),
  );
  await page.screenshot({
    path: join(outputRoot, `${name}.png`),
    fullPage: true,
  });
  await page.close();
}

const server = spawn(
  "npx",
  ["vite", "preview", "--host", "127.0.0.1", "--port", String(port)],
  { cwd: repoRoot, stdio: "ignore", shell: true },
);

try {
  await waitForServer(baseUrl);
  mkdirSync(outputRoot, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const shot of [...shots, ...supplementalShots]) {
      const page = await browser.newPage({ viewport: shot.viewport });
      try {
        await waitForRoute(page, shot.route);
        if (shot.fullPage) await primeLazyImages(page);
        await page.waitForTimeout(400);
        await page.screenshot({
          path: join(outputRoot, `${shot.name}.png`),
          fullPage: shot.fullPage ?? false,
        });
        console.log(`captured ${shot.name}`);
      } finally {
        await page.close();
      }
    }

    const footerPage = await browser.newPage({ viewport: viewports[1] });
    try {
      await waitForRoute(footerPage, routeById.get("open-data"));
      await footerPage.waitForTimeout(300);
      await footerPage.locator("footer").scrollIntoViewIfNeeded();
      await footerPage.locator("footer").screenshot({
        path: join(outputRoot, "footer-ai-disclosure.png"),
      });
      console.log("captured footer-ai-disclosure");
    } finally {
      await footerPage.close();
    }

    await createContactSheet(
      browser,
      "NORMALIZED-CONTACT-SHEET-320",
      routes.map(
        (route) => `${route.id}-${route.id === "compare" ? "studies-" : ""}320`,
      ),
      320,
    );
    await createContactSheet(
      browser,
      "NORMALIZED-CONTACT-SHEET-1440",
      routes.map((route) =>
        route.id === "open-data"
          ? "open-data-1440-implementation"
          : route.id === "methodology"
            ? "methodology-1440-implementation"
            : `${route.id}-${route.id === "compare" ? "studies-" : ""}1440`,
      ),
      480,
    );
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}

console.log(`wrote screenshot evidence to ${outputRoot}`);
