import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
const [url, output, countText = "3"] = process.argv.slice(2);
if (!url || !output || !/^https?:\/\//.test(url))
  throw new Error(
    "Usage: node measureMobilePerformance.mjs <url> <output.json> [runs]",
  );
const count = Number(countText);
if (!Number.isInteger(count) || count < 1 || count > 5)
  throw new Error("Use 1–5 runs");
const browser = await chromium.launch();
const runs = [];
try {
  for (let i = 0; i < count; i++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      locale: "es-ES",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(90000);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 200000,
      uploadThroughput: 93750,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__perf = {
        lcpMs: 0,
        cls: 0,
        sessionCls: 0,
        sessionStart: 0,
        lastShift: 0,
      };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__perf.lcpMs = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) {
            const p = window.__perf;
            if (
              e.startTime - p.lastShift > 1000 ||
              e.startTime - p.sessionStart > 5000
            ) {
              p.sessionCls = 0;
              p.sessionStart = e.startTime;
            }
            p.sessionCls += e.value;
            p.lastShift = e.startTime;
            p.cls = Math.max(p.cls, p.sessionCls);
          }
      }).observe({ type: "layout-shift", buffered: true });
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page
      .getByRole("combobox", { name: "Busca tu ciclo", exact: true })
      .waitFor({ state: "visible" });
    await page.waitForFunction(
      () => !document.querySelector("#home-training-search")?.disabled,
    );
    const searchReadyMs = await page.evaluate(() => performance.now());
    const before = await page.evaluate(() => ({
      lcpMs: window.__perf.lcpMs,
      cls: window.__perf.cls,
      transferBytes: performance
        .getEntriesByType("resource")
        .reduce((n, r) => n + r.transferSize, 0),
    }));
    const start = await page.evaluate(() => performance.now());
    await page
      .getByRole("combobox", { name: "Busca tu ciclo", exact: true })
      .fill("Cuidados");
    await page.getByRole("option").first().waitFor();
    const searchResultsMs =
      (await page.evaluate(() => performance.now())) - start;
    await page.waitForTimeout(1000);
    const resources = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((r) => ({
          path: new URL(r.name).pathname,
          transferBytes: r.transferSize,
          decodedBytes: r.decodedBodySize,
          durationMs: r.duration,
        }))
        .sort((a, b) => b.transferBytes - a.transferBytes),
    );
    const result = {
      run: i + 1,
      ...before,
      searchReadyMs,
      searchResultsMs,
      largestResources: resources.slice(0, 8),
      pageErrors: errors,
    };
    runs.push(result);
    console.log(JSON.stringify(result));
    await context.close();
  }
} finally {
  await browser.close();
}
const median = (k) =>
  [...runs].map((r) => r[k]).sort((a, b) => a - b)[Math.floor(runs.length / 2)];
const report = {
  checkedAt: new Date().toISOString(),
  url,
  browser: browser.version(),
  profile: {
    viewport: "390x844",
    downloadMbps: 1.6,
    uploadMbps: 0.75,
    latencyMs: 150,
    cpuSlowdown: 4,
    cache: "cold",
  },
  method:
    "Laboratory approximation, not field Core Web Vitals; searchResultsMs includes browser automation overhead and is not INP.",
  runs,
  median: {
    lcpMs: median("lcpMs"),
    cls: median("cls"),
    searchReadyMs: median("searchReadyMs"),
    searchResultsMs: median("searchResultsMs"),
    transferBytes: median("transferBytes"),
  },
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + "\n");
