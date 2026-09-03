#!/usr/bin/env node
/**
 * Machine-readable gates for the before/after computed-style audit.
 *
 * This is intentionally a gate, not a visual approval. The contact sheets
 * still require human inspection before any candidate decision.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const reportPath = join(
  repoRoot,
  "analysis",
  "design-system-normalization-after.json",
);
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const samples = report.samples ?? [];

function unique(values) {
  return [
    ...new Set(values.filter((value) => value !== null && value !== undefined)),
  ];
}

function variantCount(values) {
  return unique(values).length;
}

function styleSignature(record, properties) {
  return properties
    .map((property) => record?.styles?.[property] ?? "")
    .join(" / ");
}

function maxVariance(values) {
  if (values.length === 0) return Number.POSITIVE_INFINITY;
  return Math.max(...values) - Math.min(...values);
}

const mobileSamples = samples.filter((sample) => sample.viewport.width < 768);
const mobileGutters = mobileSamples.flatMap((sample) => {
  const content = sample.page?.contentRoot;
  return content
    ? [
        sample.viewport.width - content.contentEdgeRight,
        content.contentEdgeLeft,
      ]
    : [];
});
const interiorH1 = samples
  .filter((sample) => sample.route !== "home")
  .map((sample) => sample.h1)
  .filter(Boolean);
const eyebrows = samples.map((sample) => sample.eyebrow).filter(Boolean);
const controls = samples.flatMap((sample) => sample.controls ?? []);
const failedOverflow = samples.filter(
  (sample) => sample.page?.horizontalOverflow === true,
);

const checks = [
  [
    "MOBILE_OUTER_GUTTER_VARIANCE",
    maxVariance(mobileGutters) <= 1,
    `${maxVariance(mobileGutters).toFixed(2)}px`,
  ],
  [
    "INTERIOR_H1_FONT_FAMILY_VARIANTS",
    variantCount(interiorH1.map((record) => record.styles["font-family"])) ===
      1,
    String(
      variantCount(interiorH1.map((record) => record.styles["font-family"])),
    ),
  ],
  [
    "INTERIOR_H1_FONT_WEIGHT_VARIANTS",
    variantCount(interiorH1.map((record) => record.styles["font-weight"])) ===
      1,
    String(
      variantCount(interiorH1.map((record) => record.styles["font-weight"])),
    ),
  ],
  [
    "INTERIOR_H1_TOKEN_VARIANTS",
    variantCount(
      interiorH1.map((record) => record.styles["--type-page-title"]),
    ) === 1,
    String(
      variantCount(
        interiorH1.map((record) => record.styles["--type-page-title"]),
      ),
    ),
  ],
  [
    "EYEBROW_STYLE_VARIANTS",
    variantCount(
      eyebrows.map((record) =>
        styleSignature(record, [
          "font-family",
          "font-size",
          "font-weight",
          "text-transform",
          "letter-spacing",
          "color",
        ]),
      ),
    ) === 1,
    String(
      variantCount(
        eyebrows.map((record) =>
          styleSignature(record, [
            "font-family",
            "font-size",
            "font-weight",
            "text-transform",
            "letter-spacing",
            "color",
          ]),
        ),
      ),
    ),
  ],
  [
    "CONTROL_FONT_FAMILY_VARIANTS",
    controls.length === samples.length &&
      variantCount(controls.map((record) => record.styles["font-family"])) ===
        1,
    String(
      variantCount(controls.map((record) => record.styles["font-family"])),
    ),
  ],
  [
    "NO_HORIZONTAL_OVERFLOW",
    failedOverflow.length === 0,
    String(failedOverflow.length),
  ],
  ["AUDIT_SAMPLE_COUNT", samples.length === 36, String(samples.length)],
];

for (const [name, passed, detail] of checks) {
  console.log(`${name}: ${passed ? "PASS" : "FAIL"} (${detail})`);
}

if (checks.some(([, passed]) => !passed)) {
  process.exitCode = 1;
}
