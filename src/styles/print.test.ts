import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const printCss = readFileSync(
  join(process.cwd(), "src/styles/print.css"),
  "utf8",
);

function cssBlock(source: string, selector: string): string {
  const start = source.indexOf(selector);
  if (start === -1) return "";

  const openBrace = source.indexOf("{", start);
  if (openBrace === -1) return "";

  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openBrace + 1, index);
  }

  return "";
}

describe("A4 print CSS contract", () => {
  it("keeps the A4 portrait page and hides interactive controls", () => {
    const page = cssBlock(printCss, "@page");
    const print = cssBlock(printCss, "@media print");

    expect(page).toMatch(/size:\s*A4 portrait;/u);
    expect(page).toMatch(/margin:\s*14mm;/u);
    expect(print).toMatch(
      /\.site-header,[\s\S]*\.site-footer,[\s\S]*\.skip-link,[\s\S]*\.print-control,[\s\S]*\[data-print-hidden="true"\][\s\S]*display:\s*none\s*!important;/u,
    );
  });

  it("removes blanket page-break avoidance from large result sections", () => {
    const print = cssBlock(printCss, "@media print");

    expect(print).toMatch(
      /\.print-avoid-break\s*\{\s*break-inside:\s*avoid;\s*\}/u,
    );
    expect(print).not.toMatch(
      /(?:article|\.decision-basis)[^{}]*break-inside\s*:\s*avoid/u,
    );
  });

  it("expands closed disclosures but keeps explicitly hidden details hidden", () => {
    const print = cssBlock(printCss, "@media print");

    expect(print).not.toMatch(/attr\(href\)/u);
    expect(print).toMatch(
      /details:not\(\[open\]\):not\(\[data-print-hidden="true"\]\)\s*>\s*:not\(summary\)\s*\{[\s\S]*?display:\s*block\s*!important;/u,
    );
  });

  it("lets route cards flow while keeping each card and outcome together", () => {
    const print = cssBlock(printCss, "@media print");

    expect(print).toMatch(
      /\.training-route-list\s*\{\s*display:\s*block;\s*\}/u,
    );
    expect(print).toMatch(
      /\.training-route-card\s*\{[\s\S]*?break-inside:\s*avoid;[\s\S]*?page-break-inside:\s*avoid;[\s\S]*?\}/u,
    );
    expect(print).toMatch(
      /\.training-route-card\s*\{[\s\S]*?margin-block-end:\s*var\(--space-5\);[\s\S]*?\}/u,
    );
    expect(print).toMatch(
      /\.training-outcome\s*\{[\s\S]*?break-inside:\s*avoid;[\s\S]*?page-break-inside:\s*avoid;[\s\S]*?\}/u,
    );
    expect(print).toMatch(
      /\.territorial-distribution__localities\s*>\s*li\s*\{[\s\S]*?break-inside:\s*avoid;[\s\S]*?page-break-inside:\s*avoid;[\s\S]*?\}/u,
    );
  });

  it("starts occupation market evidence on a new printed page", () => {
    const print = cssBlock(printCss, "@media print");

    expect(print).toMatch(
      /\.occupation-result-page\s+#mercado-laboral\s*\{[\s\S]*?break-before:\s*page;[\s\S]*?page-break-before:\s*always;[\s\S]*?\}/u,
    );
  });

  it("starts the provincial distribution on a new printed page", () => {
    const print = cssBlock(printCss, "@media print");

    expect(print).toMatch(
      /\.occupation-result-page\s+\.occupation-market-evidence__section-label\s*\{[\s\S]*?break-before:\s*page;[\s\S]*?page-break-before:\s*always;[\s\S]*?\}/u,
    );
  });
});
