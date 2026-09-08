#!/usr/bin/env node
/**
 * Computed-style audit for the shared SALIDA CyL visual system.
 *
 * The audit intentionally runs against vite preview, not the dev server. It
 * records the rendered contract before or after a normalization pass without
 * changing the page or relying on screenshot interpretation.
 *
 * Usage:
 *   node scripts/release/auditDesignSystemNormalization.mjs before
 *   node scripts/release/auditDesignSystemNormalization.mjs after
 */
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const outputRoot = join(repoRoot, "analysis");
const phase = process.argv[2] === "after" ? "after" : "before";
const port = 4217;
const baseUrl = `http://127.0.0.1:${port}`;

const viewports = [
  { name: "320", width: 320, height: 720 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

const routes = [
  {
    id: "home",
    path: "/",
    ready: [".home-page .task-selector"],
    content: [".home-page .hero-grid"],
    masthead: [".home-page .hero-grid > div:first-child"],
    eyebrow: [
      ".home-page .hero-grid .page-eyebrow",
      ".home-page .hero-grid .eyebrow",
    ],
    lede: [".home-page .hero-grid .page-lede", ".home-page .hero-grid .lede"],
    panels: [".home-page .task-selector-list", ".home-page .path"],
    controls: [
      ".home-page .hero-search input:not([type='radio']):not([type='checkbox'])",
      ".home-page .hero-search select",
      ".home-page .task-tab",
      ".home-page button",
    ],
    sections: [".home-page > section"],
  },
  {
    id: "fp-detail",
    path: "/desde-fp/ADG02S",
    ready: [".training-result-page .result-summary"],
    content: [".training-page"],
    masthead: [
      ".training-result-page .page-masthead",
      ".training-result-page .training-page__header",
      ".page-masthead",
      ".training-page__header",
    ],
    eyebrow: [
      ".training-result-page .page-eyebrow",
      ".training-result-page .eyebrow",
      ".training-page__header .page-eyebrow",
      ".training-page__header .eyebrow",
    ],
    lede: [
      ".training-result-page .page-lede",
      ".training-result-page .training-page__lead",
      ".training-result-page .training-page__intro",
      ".training-page__header .page-subcopy",
    ],
    panels: [
      ".training-result-page .result-summary",
      ".training-result-page .decision-direction",
      ".training-result-page .result-table-wrap",
      ".training-result-page .rcard",
    ],
    controls: [
      ".training-result-page .training-page__tools button",
      ".training-result-page select",
      ".training-result-page input:not([type='radio']):not([type='checkbox'])",
      ".training-result-page button",
    ],
    sections: [
      ".training-result-page > section",
      ".training-result-page > article",
    ],
  },
  {
    id: "occupation-detail",
    path: "/desde-ocupacion/occupation%3Acno11%3A5611",
    ready: [".occupation-result-page #mercado-laboral"],
    content: [".occupation-result-page"],
    masthead: [
      ".occupation-result-page .page-masthead",
      ".occupation-result-page .training-page__header",
    ],
    eyebrow: [
      ".occupation-result-page .page-eyebrow",
      ".occupation-result-page .eyebrow",
    ],
    lede: [
      ".occupation-result-page .page-lede",
      ".occupation-result-page .training-page__lead",
      ".occupation-result-page .page-subcopy",
    ],
    panels: [
      ".occupation-result-page .status-panel",
      ".occupation-result-page .occupation-routes",
      ".occupation-result-page .route-row",
      ".occupation-result-page .rcard",
    ],
    controls: [
      ".occupation-result-page .training-page__tools button",
      ".occupation-result-page button",
      ".occupation-result-page select",
      ".occupation-result-page input:not([type='radio']):not([type='checkbox'])",
    ],
    sections: [
      ".occupation-result-page > section",
      ".occupation-result-page > article",
    ],
  },
  {
    id: "offers-global",
    path: "/desde-oferta",
    ready: [".offer-explorer__search"],
    content: [".offer-explorer"],
    masthead: [
      ".offer-explorer__intro.page-masthead",
      ".offer-explorer__intro",
    ],
    eyebrow: [
      ".offer-explorer__intro .page-eyebrow",
      ".offer-explorer__eyebrow",
    ],
    lede: [
      ".offer-explorer__intro .page-lede",
      ".offer-explorer__intro .page-subcopy",
    ],
    panels: [
      ".offer-explorer__search",
      ".offer-explorer__scope-note",
      ".offer-explorer .offer-results",
      ".offer-explorer .offer-row",
    ],
    controls: [
      ".offer-explorer__search input:not([type='radio']):not([type='checkbox'])",
      ".offer-explorer__search select",
      ".offer-explorer__search button",
    ],
    sections: [".offer-explorer > section", ".offer-explorer > .offer-results"],
  },
  {
    id: "centers-global",
    path: "/donde-estudiar",
    ready: [".catalog-page .filter-bar", ".catalog-page .sheet-button"],
    content: [".catalog-page > .container", ".catalog-page"],
    masthead: [".catalog-page .page-masthead", ".catalog-page .page-header"],
    eyebrow: [
      ".catalog-page .page-masthead .page-eyebrow",
      ".catalog-page .page-header .eyebrow",
    ],
    lede: [
      ".catalog-page .page-masthead .page-lede",
      ".catalog-page .page-header .page-subcopy",
    ],
    panels: [
      ".catalog-page .filter-bar",
      ".catalog-page .rcard",
      ".catalog-page .table-scroll",
    ],
    controls: [
      ".catalog-page .sheet-button",
      ".catalog-page .filter-bar input:not([type='radio']):not([type='checkbox'])",
      ".catalog-page .filter-bar select",
      ".catalog-page .filter-bar button",
    ],
    sections: [
      ".catalog-page > .container > section",
      ".catalog-page .centers-section",
    ],
  },
  {
    id: "compare",
    path: "/comparar",
    ready: [".compare-page .income-comparison-form"],
    content: [".compare-page"],
    masthead: [".compare-page__intro.page-masthead", ".compare-page__intro"],
    eyebrow: [".compare-page__intro .page-eyebrow", ".compare-page__eyebrow"],
    lede: [
      ".compare-page__intro .page-lede",
      ".compare-page__intro > p:not(.compare-page__eyebrow):not(.compare-page__caveat)",
    ],
    panels: [
      ".compare-page .income-comparison-form",
      ".compare-page .compare-page__caveat",
      ".compare-page .income-results__guide",
      ".compare-page .income-evidence-card",
    ],
    controls: [
      ".compare-page .income-level-choice",
      ".compare-page .income-comparison-form select",
      ".compare-page .income-comparison-form input:not([type='radio']):not([type='checkbox'])",
      ".compare-page .income-comparison-form input[type='radio']",
      ".compare-page button",
    ],
    sections: [".compare-page > section", ".compare-page > form"],
  },
  {
    id: "resources",
    path: "/recursos",
    ready: [".resources-page .resources-filters"],
    content: [".resources-page"],
    masthead: [
      ".resources-page__intro.page-masthead",
      ".resources-page__intro",
    ],
    eyebrow: [
      ".resources-page__intro .page-eyebrow",
      ".resources-page__eyebrow",
    ],
    lede: [
      ".resources-page__intro .page-lede",
      ".resources-page__intro > p:not([class*='eyebrow'])",
    ],
    panels: [
      ".resources-page .resources-filters",
      ".resources-page .public-call",
      ".resources-page .resource-card",
    ],
    controls: [
      ".resources-page .resources-filters input:not([type='radio']):not([type='checkbox'])",
      ".resources-page select",
      ".resources-page button",
    ],
    sections: [
      ".resources-page > section",
      ".resources-page > .resources-columns",
    ],
  },
  {
    id: "open-data",
    path: "/datos-abiertos",
    ready: [".open-data-page .open-data-release"],
    content: [".open-data-page"],
    masthead: [
      ".open-data-page__intro.page-masthead",
      ".open-data-page__intro",
    ],
    eyebrow: [
      ".open-data-page__intro .page-eyebrow",
      ".open-data-page__eyebrow",
    ],
    lede: [
      ".open-data-page__intro .page-lede",
      ".open-data-page__intro > p:not([class*='eyebrow'])",
    ],
    panels: [".open-data-page .open-data-release", ".open-data-page__scope"],
    controls: [
      ".open-data-page a.primary-button",
      ".open-data-page button",
      ".open-data-page a",
    ],
    sections: [".open-data-page > section"],
  },
  {
    id: "methodology",
    path: "/metodologia",
    ready: [".methodology-page .source-method-grid"],
    content: [".methodology-page"],
    masthead: [
      ".methodology-page__intro.page-masthead",
      ".methodology-page__intro",
    ],
    eyebrow: [
      ".methodology-page__intro .page-eyebrow",
      ".methodology-page__eyebrow",
    ],
    lede: [
      ".methodology-page__intro .page-lede",
      ".methodology-page__intro > p:not([class*='eyebrow'])",
    ],
    panels: [
      ".methodology-page .regional-dataset-inventory",
      ".methodology-page .source-method-card",
      ".methodology-page .methodology-notes",
    ],
    controls: [
      ".methodology-page button",
      ".methodology-page details summary",
      ".methodology-page a",
    ],
    sections: [
      ".methodology-page > section",
      ".methodology-page > .source-method-grid",
      ".methodology-page > .methodology-notes",
    ],
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
    throw new Error(`preview server did not start at ${url}`);
  })();
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function markdownCell(value) {
  if (value === null || value === undefined) return "—";
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function signature(values) {
  return [
    ...new Set(values.filter((value) => value !== null && value !== "")),
  ].sort();
}

function buildMarkdown(audit) {
  const phaseNote =
    audit.phase === "before"
      ? "No source CSS was modified before this baseline artifact was generated."
      : "This artifact was generated after the normalization changes against the production build.";
  const lines = [
    `# Design-system normalization — ${audit.phase.toUpperCase()}`,
    "",
    `Computed-style audit against the Vite production preview. ${phaseNote}`,
    "",
    `- Viewports: ${audit.viewports.map((viewport) => `${viewport.width}px`).join(", ")}`,
    `- Routes: ${audit.routes.length}`,
    `- Samples: ${audit.samples.length}`,
    "",
    "## Contract readings",
    "",
    "| Route | Viewport | Content edge | H1 | Eyebrow | Panel | Control | Breadcrumb |",
    "| --- | ---: | --- | --- | --- | --- | --- | --- |",
  ];

  for (const sample of audit.samples) {
    const content = sample.page.contentRoot;
    const h1 = sample.h1;
    const eyebrow = sample.eyebrow;
    const panel = sample.panels[0];
    const control = sample.controls[0];
    const breadcrumb = sample.breadcrumb;
    lines.push(
      `| ${sample.route} | ${sample.viewport.width} | ${markdownCell(
        content?.contentEdgeLeft,
      )} / ${markdownCell(content?.contentEdgeRight)} (${markdownCell(
        content?.contentWidth,
      )}) | ${markdownCell(h1?.styles["font-size"])} / ${markdownCell(
        h1?.styles["font-weight"],
      )} / ${markdownCell(h1?.styles["line-height"])} | ${markdownCell(
        eyebrow?.styles["font-size"],
      )} / ${markdownCell(eyebrow?.styles["font-weight"])} / ${markdownCell(
        eyebrow?.styles["text-transform"],
      )} | ${markdownCell(panel?.styles["border-radius"])} / ${markdownCell(
        panel?.styles["padding-left"],
      )} | ${markdownCell(control?.styles["font-size"])} / ${markdownCell(
        control?.styles["font-weight"],
      )} / ${markdownCell(control?.rect.height)} | ${markdownCell(
        breadcrumb?.styles["font-size"],
      )} / ${markdownCell(breadcrumb?.styles["gap"])} / ${markdownCell(
        breadcrumb?.wrap?.lineCount,
      )} lines |`,
    );
  }

  lines.push("", "## Divergence signatures", "");
  for (const [name, values] of Object.entries(audit.signatures)) {
    lines.push(
      `- **${name}**: ${values.length} variant(s) — ${values.join(" · ") || "none"}`,
    );
  }

  lines.push(
    "",
    "## Section rhythm readings",
    "",
    "| Route | Viewport | Section | Top | Heading offset | Previous gap |",
    "| --- | ---: | --- | ---: | ---: | ---: |",
  );
  for (const sample of audit.samples) {
    for (const section of sample.sections) {
      lines.push(
        `| ${sample.route} | ${sample.viewport.width} | ${markdownCell(
          section.selector,
        )} | ${markdownCell(section.rect.top)} | ${markdownCell(
          section.headingOffset,
        )} | ${markdownCell(section.previousGap)} |`,
      );
    }
  }

  lines.push("", "## Missing or deliberate exceptions to investigate", "");
  const exceptions = audit.samples.flatMap((sample) =>
    sample.exceptions.map(
      (exception) => `${sample.route}@${sample.viewport.width}: ${exception}`,
    ),
  );
  if (exceptions.length === 0)
    lines.push("- None recorded by the selector audit.");
  else for (const exception of exceptions) lines.push(`- ${exception}`);

  return `${lines.join("\n")}\n`;
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
  const samples = [];

  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });
    for (const route of routes) {
      await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: "domcontentloaded",
      });
      try {
        await page.waitForFunction(
          ({ readySelectors }) => {
            const heading = document.querySelector("main h1");
            if (!heading || heading.textContent?.trim().length === 0)
              return false;

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
      } catch (error) {
        throw new Error(
          `Route readiness timeout for ${route.id} at ${viewport.name}px (expected ${route.ready.join(", ")})`,
          { cause: error },
        );
      }
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);
      const sample = await page.evaluate(
        ({ route, viewport }) => {
          const styleProperties = [
            "--page-gutter",
            "--type-page-title",
            "--type-eyebrow",
            "--type-control",
            "font-family",
            "font-size",
            "font-weight",
            "line-height",
            "letter-spacing",
            "text-transform",
            "color",
            "margin-top",
            "margin-right",
            "margin-bottom",
            "margin-left",
            "padding-top",
            "padding-right",
            "padding-bottom",
            "padding-left",
            "max-width",
            "gap",
            "row-gap",
            "column-gap",
            "border-radius",
            "border-top-width",
            "border-right-width",
            "border-bottom-width",
            "border-left-width",
            "border-top-color",
            "border-right-color",
            "border-bottom-color",
            "border-left-color",
            "background-color",
            "height",
            "min-height",
          ];
          const visible = (element) => {
            if (!element) return false;
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              rect.width > 0 &&
              rect.height > 0
            );
          };
          const pick = (root, selectors) => {
            for (const selector of selectors) {
              const element = (root ?? document).querySelector(selector);
              if (visible(element)) return { element, selector };
            }
            return null;
          };
          const pickMany = (root, selectors, limit = 4) => {
            const result = [];
            for (const selector of selectors) {
              for (const element of (root ?? document).querySelectorAll(
                selector,
              )) {
                if (
                  !visible(element) ||
                  result.some((item) => item.element === element)
                )
                  continue;
                result.push({ element, selector });
                if (result.length === limit) return result;
              }
            }
            return result;
          };
          const rectData = (element) => {
            const rect = element.getBoundingClientRect();
            return {
              left: Math.round(rect.left * 100) / 100,
              right: Math.round(rect.right * 100) / 100,
              top: Math.round(rect.top * 100) / 100,
              bottom: Math.round(rect.bottom * 100) / 100,
              width: Math.round(rect.width * 100) / 100,
              height: Math.round(rect.height * 100) / 100,
            };
          };
          const styleData = (element) => {
            if (!element) return null;
            const computed = getComputedStyle(element);
            return Object.fromEntries(
              styleProperties.map((property) => [
                property,
                computed.getPropertyValue(property),
              ]),
            );
          };
          const record = (candidate, root = document) => {
            if (!candidate) return null;
            const { element, selector } = candidate;
            const computed = getComputedStyle(element);
            const rect = rectData(element);
            const paddingLeft = Number.parseFloat(computed.paddingLeft) || 0;
            const paddingRight = Number.parseFloat(computed.paddingRight) || 0;
            const borderLeft = Number.parseFloat(computed.borderLeftWidth) || 0;
            const borderRight =
              Number.parseFloat(computed.borderRightWidth) || 0;
            return {
              selector,
              tag: element.tagName.toLowerCase(),
              className:
                typeof element.className === "string" ? element.className : "",
              text: (element.textContent ?? "")
                .trim()
                .replace(/\s+/gu, " ")
                .slice(0, 160),
              rect,
              contentEdgeLeft:
                Math.round((rect.left + paddingLeft + borderLeft) * 100) / 100,
              contentEdgeRight:
                Math.round((rect.right - paddingRight - borderRight) * 100) /
                100,
              contentWidth:
                Math.round(
                  (rect.width -
                    paddingLeft -
                    paddingRight -
                    borderLeft -
                    borderRight) *
                    100,
                ) / 100,
              styles: styleData(element),
              rootTag:
                root === document ? "document" : root.tagName.toLowerCase(),
            };
          };
          const rootCandidate = pick(null, route.content);
          const root = rootCandidate?.element ?? document.querySelector("main");
          const mastheadCandidate = pick(null, route.masthead);
          const masthead = mastheadCandidate?.element ?? null;
          const breadcrumbCandidate = pick(null, [
            ".breadcrumbs",
            "nav[aria-label='Ruta de navegación']",
          ]);
          const breadcrumbList =
            breadcrumbCandidate?.element.querySelector("ol") ?? null;
          const breadcrumbItems = breadcrumbList
            ? [...breadcrumbList.children].filter((element) => visible(element))
            : [];
          const breadcrumbTops = [
            ...new Set(
              breadcrumbItems.map(
                (element) =>
                  Math.round(element.getBoundingClientRect().top * 100) / 100,
              ),
            ),
          ];
          const breadcrumbStyle = breadcrumbList
            ? getComputedStyle(breadcrumbList)
            : null;
          const breadcrumbRecord = breadcrumbCandidate
            ? {
                ...record(breadcrumbCandidate),
                styles: breadcrumbList
                  ? {
                      ...styleData(breadcrumbList),
                      "separator-content":
                        breadcrumbItems.length > 1
                          ? getComputedStyle(breadcrumbItems[1], "::before")
                              .content
                          : null,
                    }
                  : styleData(breadcrumbCandidate.element),
                wrap: {
                  itemCount: breadcrumbItems.length,
                  lineCount: breadcrumbTops.length,
                  lineTops: breadcrumbTops,
                  scrollWidth: breadcrumbList?.scrollWidth ?? null,
                  clientWidth: breadcrumbList?.clientWidth ?? null,
                  overflowsX: breadcrumbList
                    ? breadcrumbList.scrollWidth > breadcrumbList.clientWidth
                    : false,
                  gap: breadcrumbStyle?.gap ?? null,
                },
              }
            : null;
          const h1Candidate =
            pick(masthead ?? root, ["h1"]) ?? pick(null, ["main h1"]);
          const eyebrowCandidate = pick(masthead ?? root, route.eyebrow);
          const ledeCandidate = pick(masthead ?? root, route.lede);
          const panelCandidates = pickMany(null, route.panels);
          const controlCandidate = pick(null, route.controls);
          const main = document.querySelector("main");
          const mainRecord = main
            ? record({ element: main, selector: "main" })
            : null;
          const sections = pickMany(null, route.sections, 12)
            .map((candidate) => ({
              candidate,
              record: record(candidate, root),
            }))
            .sort(
              (left, right) => left.record.rect.top - right.record.rect.top,
            );
          const sectionRecords = sections.map((item, index) => {
            const heading =
              item.candidate.element.querySelector("h2, h3, legend");
            const headingRect =
              heading && visible(heading)
                ? heading.getBoundingClientRect()
                : null;
            const previous = sections[index - 1]?.record;
            return {
              ...item.record,
              headingOffset: headingRect
                ? Math.round((headingRect.top - item.record.rect.top) * 100) /
                  100
                : null,
              previousGap: previous
                ? Math.round(
                    (item.record.rect.top - previous.rect.bottom) * 100,
                  ) / 100
                : null,
            };
          });
          return {
            route: route.id,
            path: route.path,
            viewport,
            page: {
              main: mainRecord,
              contentRoot: record(rootCandidate),
              horizontalOverflow:
                document.documentElement.scrollWidth >
                document.documentElement.clientWidth,
            },
            masthead: record(mastheadCandidate),
            h1: record(h1Candidate),
            eyebrow: record(eyebrowCandidate),
            lede: record(ledeCandidate),
            breadcrumb: breadcrumbRecord,
            panels: panelCandidates.map((candidate) => record(candidate, root)),
            controls: controlCandidate ? [record(controlCandidate, root)] : [],
            sections: sectionRecords,
            exceptions: [
              !rootCandidate && "content root selector did not match",
              !mastheadCandidate && "masthead selector did not match",
              !h1Candidate && "h1 selector did not match",
              !eyebrowCandidate && "eyebrow selector did not match",
              !ledeCandidate && "lede selector did not match",
              !breadcrumbCandidate && "breadcrumb selector did not match",
              panelCandidates.length === 0 && "panel selector did not match",
              !controlCandidate && "control selector did not match",
            ].filter(Boolean),
          };
        },
        { route, viewport },
      );
      samples.push(sample);
    }
    await page.close();
  }
  await browser.close();

  const signatures = {
    "mobile content edge left (<=767px)": signature(
      samples
        .filter((sample) => sample.viewport.width <= 767)
        .map((sample) => sample.page.contentRoot?.contentEdgeLeft),
    ),
    "mobile content edge right (<=767px)": signature(
      samples
        .filter((sample) => sample.viewport.width <= 767)
        .map((sample) => sample.page.contentRoot?.contentEdgeRight),
    ),
    "interior H1 font family": signature(
      samples
        .filter((sample) => sample.route !== "home")
        .map((sample) => sample.h1?.styles["font-family"]),
    ),
    "interior H1 font weight": signature(
      samples
        .filter((sample) => sample.route !== "home")
        .map((sample) => sample.h1?.styles["font-weight"]),
    ),
    "interior H1 font size": signature(
      samples
        .filter((sample) => sample.route !== "home")
        .map((sample) => sample.h1?.styles["font-size"]),
    ),
    "interior H1 token": signature(
      samples
        .filter((sample) => sample.route !== "home")
        .map((sample) => sample.h1?.styles["--type-page-title"]),
    ),
    "interior H1 line height": signature(
      samples
        .filter((sample) => sample.route !== "home")
        .map((sample) => sample.h1?.styles["line-height"]),
    ),
    "eyebrow style": signature(
      samples
        .filter((sample) => sample.eyebrow)
        .map((sample) =>
          [
            sample.eyebrow.styles["font-family"],
            sample.eyebrow.styles["font-size"],
            sample.eyebrow.styles["font-weight"],
            sample.eyebrow.styles["text-transform"],
            sample.eyebrow.styles["letter-spacing"],
            sample.eyebrow.styles.color,
          ].join(" / "),
        ),
    ),
    "control font family": signature(
      samples.map((sample) => sample.controls[0]?.styles["font-family"]),
    ),
    "control font size": signature(
      samples.map((sample) => sample.controls[0]?.styles["font-size"]),
    ),
    "control font weight": signature(
      samples.map((sample) => sample.controls[0]?.styles["font-weight"]),
    ),
    "control height": signature(
      samples.map((sample) => sample.controls[0]?.rect.height),
    ),
    "control radius": signature(
      samples.map((sample) => sample.controls[0]?.styles["border-radius"]),
    ),
    "panel radius": signature(
      samples.flatMap((sample) =>
        sample.panels.map((panel) => panel.styles["border-radius"]),
      ),
    ),
    "panel padding-left": signature(
      samples.flatMap((sample) =>
        sample.panels.map((panel) => panel.styles["padding-left"]),
      ),
    ),
    "breadcrumb separator": signature(
      samples.map((sample) => sample.breadcrumb?.styles["separator-content"]),
    ),
  };

  const audit = {
    version: 1,
    phase,
    source: "vite preview production build",
    buildRoot: "dist",
    viewports,
    routes: routes.map(({ id, path }) => ({ id, path })),
    samples,
    signatures,
  };
  const jsonPath = join(
    outputRoot,
    `design-system-normalization-${phase}.json`,
  );
  const markdownPath = join(
    outputRoot,
    `design-system-normalization-${phase}.md`,
  );
  writeFileSync(jsonPath, `${JSON.stringify(audit, null, 2)}\n`);
  writeFileSync(markdownPath, buildMarkdown(audit));
  console.log(`wrote ${jsonPath}`);
  console.log(`wrote ${markdownPath}`);
  console.log(`audited ${samples.length} route/viewport combinations`);
} finally {
  server.kill();
}
