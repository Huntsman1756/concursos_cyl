#!/usr/bin/env node
/**
 * Final-scope evidence capture against the Vite production preview.
 *
 * This is intentionally separate from the visual-normalization matrix: it
 * records the selected Home path assets and the current Open Data labels.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const outputRoot = join(repoRoot, "analysis", "final-scope-evidence");
const port = 4219;
const baseUrl = `http://127.0.0.1:${port}`;
const homeHeading =
  "Tu FP, tus salidas profesionales y dónde dar el siguiente paso.";
const homePathAssets = ["path-training", "path-occupation", "path-offer"];

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

function installResponseRecorder(page) {
  const responses = new Map();
  const failedRequests = [];
  page.on("response", (response) => {
    if (
      /\/images\/editorial\/path-(?:training|occupation|offer)-/u.test(
        response.url(),
      )
    ) {
      responses.set(response.url(), {
        status: response.status(),
        contentType: response.headers()["content-type"] ?? null,
      });
    }
  });
  page.on("requestfailed", (request) => {
    if (
      /\/images\/editorial\/path-(?:training|occupation|offer)-/u.test(
        request.url(),
      )
    ) {
      failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText ?? "unknown",
      });
    }
  });
  return { responses, failedRequests };
}

async function primeHomePathImages(page) {
  await page.getByRole("heading", { name: homeHeading }).waitFor();
  await page.locator(".paths-grid .path").first().waitFor();
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight - 64, 1);
    const maxY = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0,
    );
    for (let y = 0; y <= maxY; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll(".paths-grid .path img")].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    undefined,
    { timeout: 15000 },
  );
  await page.evaluate(() => document.fonts.ready);
}

async function collectHomePathDiagnostics(page, recorder) {
  const diagnostics = await page
    .locator(".paths-grid .path")
    .evaluateAll((cards) =>
      cards.map((card) => {
        const picture = card.querySelector("picture");
        const image = card.querySelector("img");
        const style = image === null ? null : getComputedStyle(image);
        const box = image?.getBoundingClientRect();
        const pathNumber =
          card.querySelector(".path-number")?.textContent?.trim() ?? "";
        const title = card.querySelector("h3")?.textContent?.trim() ?? "";
        return {
          pathNumber,
          title,
          picturePresent: picture !== null,
          imgPresent: image !== null,
          currentSrc: image?.currentSrc ?? "",
          naturalWidth: image?.naturalWidth ?? 0,
          naturalHeight: image?.naturalHeight ?? 0,
          complete: image?.complete ?? false,
          alt: image?.alt ?? "",
          selectedFormat:
            image?.currentSrc.match(/\.(avif|webp)$/u)?.[1]?.toUpperCase() ??
            null,
          visibleBoundingBox: {
            x: box?.x ?? 0,
            y: box?.y ?? 0,
            width: box?.width ?? 0,
            height: box?.height ?? 0,
          },
          opacity: style?.opacity ?? "",
          display: style?.display ?? "",
          visibility: style?.visibility ?? "",
        };
      }),
    );

  return diagnostics.map((diagnostic, index) => {
    const response = recorder.responses.get(diagnostic.currentSrc);
    const loadedSuccessfully =
      diagnostic.picturePresent &&
      diagnostic.imgPresent &&
      diagnostic.naturalWidth > 0 &&
      diagnostic.naturalHeight > 0 &&
      diagnostic.complete &&
      diagnostic.visibleBoundingBox.width > 0 &&
      diagnostic.visibleBoundingBox.height > 0 &&
      diagnostic.opacity !== "0" &&
      diagnostic.display !== "none" &&
      diagnostic.visibility !== "hidden" &&
      response?.status === 200;
    return {
      expectedAsset: homePathAssets[index] ?? null,
      ...diagnostic,
      httpStatus: response?.status ?? null,
      httpContentType: response?.contentType ?? null,
      loadedSuccessfully,
    };
  });
}

function renderHomePathMarkdown(diagnostics) {
  const rows = diagnostics
    .map(
      (diagnostic) =>
        `| ${diagnostic.pathNumber} | ${diagnostic.title} | ${diagnostic.expectedAsset} | ${diagnostic.picturePresent ? "YES" : "NO"} | ${diagnostic.imgPresent ? "YES" : "NO"} | ${diagnostic.selectedFormat ?? "—"} | ${diagnostic.httpStatus ?? "—"} | ${diagnostic.naturalWidth}×${diagnostic.naturalHeight} | ${diagnostic.loadedSuccessfully ? "YES" : "NO"} |`,
    )
    .join("\n");
  return `# Home path image verification

Production-build evidence captured from the Vite preview.

- HOME_PATH_EDITORIAL_IMAGES: ${diagnostics.length}
- HOME_PATH_IMAGES_LOADED: ${diagnostics.filter(({ loadedSuccessfully }) => loadedSuccessfully).length}
- PATH_01_IMAGE: ${diagnostics[0]?.loadedSuccessfully ? "PASS" : "FAIL"}
- PATH_02_IMAGE: ${diagnostics[1]?.loadedSuccessfully ? "PASS" : "FAIL"}
- PATH_03_IMAGE: ${diagnostics[2]?.loadedSuccessfully ? "PASS" : "FAIL"}

| Path | Title | Asset | picture | img | Selected | HTTP | Natural size | Loaded |
| ---: | --- | --- | --- | --- | --- | ---: | ---: | --- |
${rows}

Full diagnostics, including currentSrc, bounding boxes, visibility and alt, are in \
\`home-path-images.json\`.
`;
}

const server = spawn(
  "npx",
  ["vite", "preview", "--host", "127.0.0.1", "--port", String(port)],
  { cwd: repoRoot, stdio: "ignore", shell: true },
);

try {
  await waitForServer(baseUrl);
  await mkdir(outputRoot, { recursive: true });
  const browser = await chromium.launch();
  try {
    const home390 = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const home390Recorder = installResponseRecorder(home390);
    await home390.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await primeHomePathImages(home390);
    const home390Diagnostics = await collectHomePathDiagnostics(
      home390,
      home390Recorder,
    );
    await home390.screenshot({
      path: join(outputRoot, "home-paths-390-full.png"),
      fullPage: true,
    });
    await home390.close();

    const home1440 = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    const home1440Recorder = installResponseRecorder(home1440);
    await home1440.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await primeHomePathImages(home1440);
    const home1440Diagnostics = await collectHomePathDiagnostics(
      home1440,
      home1440Recorder,
    );
    await home1440
      .locator('section[aria-labelledby="paths-title"]')
      .screenshot({ path: join(outputRoot, "home-paths-1440.png") });
    await home1440.close();

    const openData = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await openData.goto(`${baseUrl}/datos-abiertos`, {
      waitUntil: "domcontentloaded",
    });
    await openData
      .getByRole("heading", { name: "Datos abiertos de SALIDA CyL" })
      .waitFor();
    await openData.locator(".open-data-release").first().waitFor();
    const labels = await openData
      .locator(".open-data-release")
      .first()
      .locator("dt")
      .allTextContents();
    await openData.getByText("Ciclos en el grafo", { exact: true }).waitFor();
    await openData
      .getByText("Ocupaciones CNO-11 en el grafo", { exact: true })
      .waitFor();
    await openData.screenshot({
      path: join(outputRoot, "open-data-metrics-1440.png"),
    });
    await openData.close();

    const homePaths = home390Diagnostics.map((diagnostic, index) => ({
      ...diagnostic,
      desktop: home1440Diagnostics[index] ?? null,
    }));
    const report = {
      capture: {
        source: "Vite production preview",
        baseUrl,
        viewports: { mobile: "390x844", desktop: "1440x900" },
      },
      homePaths: {
        expectedCount: homePathAssets.length,
        loadedCount: homePaths.filter(
          ({ loadedSuccessfully }) => loadedSuccessfully,
        ).length,
        paths: homePaths,
        networkFailedRequests: [
          ...home390Recorder.failedRequests,
          ...home1440Recorder.failedRequests,
        ],
        screenshots: ["home-paths-390-full.png", "home-paths-1440.png"],
      },
      openData: {
        labelSource: "src/features/open-data/OpenDataPage.tsx:143-159",
        runtimeText: labels,
        screenshots: ["open-data-metrics-1440.png"],
      },
    };
    await writeFile(
      join(outputRoot, "home-path-images.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
    await writeFile(
      join(outputRoot, "home-path-images.md"),
      renderHomePathMarkdown(home390Diagnostics),
      "utf8",
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}

console.log(`wrote final scope evidence to ${outputRoot}`);
