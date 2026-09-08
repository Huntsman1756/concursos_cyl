#!/usr/bin/env node
/**
 * Screenshot capture for the SALIDA home prototype.
 * Usage (repo root): node docs/design/prototypes/home/capture.mjs
 * Produces the required review set under screenshots/. The baseline captures
 * need the current product served at http://localhost:4173 (npm run preview).
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, "screenshots");
const indexUrl = `file:///${join(here, "index.html").replace(/\\/g, "/")}`;
const statesUrl = `file:///${join(here, "states.html").replace(/\\/g, "/")}`;
const BASELINE = process.env.BASELINE_URL ?? null;

async function settled(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Walk the page so loading="lazy" images enter the viewport and start.
    const step = window.innerHeight;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await Promise.race([
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
              }),
          ),
      ),
      new Promise((r) => setTimeout(r, 5000)),
    ]);
  });
  await page.waitForTimeout(150);
}

const browser = await chromium.launch();
await mkdir(shots, { recursive: true });

async function shoot(
  name,
  { url = indexUrl, width = 1440, height = 900, fullPage = false, before } = {},
) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url);
  await settled(page);
  if (before) await before(page);
  await page.screenshot({ path: join(shots, `${name}.png`), fullPage });
  await page.close();
  console.log(`captured ${name}`);
}

const selectTab = (tabId) => async (page) => {
  await page.click(`#${tabId}`);
  await page.waitForTimeout(250);
};

await shoot("home-desktop-default", { width: 1440, height: 900 });
await shoot("home-desktop-fp", { before: selectTab("tab-fp") });
await shoot("home-desktop-occupation", { before: selectTab("tab-occupation") });
await shoot("home-desktop-offer", { before: selectTab("tab-offer") });
await shoot("home-tablet", { width: 768, height: 1024 });
await shoot("home-mobile", { width: 390, height: 844 });
await shoot("home-mobile-small", { width: 320, height: 720 });
await shoot("FULL_PAGE_DESKTOP", { width: 1440, height: 900, fullPage: true });
await shoot("home-focus-visible", {
  width: 1440,
  height: 900,
  before: async (page) => {
    for (let i = 0; i < 3; i += 1) await page.keyboard.press("Tab");
    await page.waitForTimeout(120);
  },
});
await shoot("interaction-states", {
  url: statesUrl,
  width: 1440,
  height: 900,
  fullPage: true,
});

if (BASELINE) {
  await shoot("baseline-current-home-desktop", {
    url: BASELINE,
    width: 1440,
    height: 900,
  });
  await shoot("baseline-current-home-mobile", {
    url: BASELINE,
    width: 390,
    height: 844,
  });
}

await browser.close();
console.log("done");
