import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const tokensCss = readFileSync(join(root, "src/styles/tokens.css"), "utf8");
const globalCss = readFileSync(join(root, "src/styles/global.css"), "utf8");

// SALIDA visual foundation contract (docs/design/tokens-proposal.css +
// docs/design/SALIDA-DESIGN.md §Typography). Promoted to production in the
// redesign; this test locks the contract so it cannot regress.

const ALLOWED_FONT_WEIGHTS = new Set(["400", "600", "700"]);
const FORBIDDEN_FONT_WEIGHTS = [
  "560",
  "650",
  "680",
  "720",
  "735",
  "750",
  "800",
];

describe("SALIDA typography foundation", () => {
  it("ships self-hosted Public Sans woff2 with OFL provenance", () => {
    for (const weight of ALLOWED_FONT_WEIGHTS) {
      const fontPath = join(
        root,
        "public/fonts",
        `public-sans-latin-${weight}.woff2`,
      );
      expect(existsSync(fontPath), `missing ${fontPath}`).toBe(true);
    }
    expect(existsSync(join(root, "public/fonts/OFL.txt"))).toBe(true);
  });

  it("declares real @font-face rules for 400/600/700 with swap and no CDN", () => {
    const fontFaces = [...globalCss.matchAll(/@font-face\s*\{([^}]*)\}/gu)].map(
      (match) => match[1],
    );
    const publicSansFaces = fontFaces.filter((face) =>
      face.includes("Public Sans"),
    );
    expect(publicSansFaces).toHaveLength(3);
    for (const face of publicSansFaces) {
      expect(face).toContain('format("woff2")');
      expect(face).toContain("font-display: swap");
      expect(face).toMatch(/url\("\/fonts\/public-sans-latin-\d+\.woff2"\)/);
      expect(face).not.toMatch(/https?:\/\//);
    }
    const weights = publicSansFaces.map(
      (face) => (face.match(/font-weight:\s*(\d+)/u) ?? [])[1],
    );
    expect([...weights].sort()).toEqual(["400", "600", "700"]);
  });

  it("sets Public Sans as the primary family in the token contract", () => {
    expect(tokensCss).toMatch(/--font-sans:\s*"Public Sans",\s*system-ui/u);
  });

  it("inherits the same family across body and every form control", () => {
    const controlRule = (selector: string): string => {
      const match = globalCss.match(
        new RegExp(
          `${selector.replace(/[.*+?^${}()[\]\\\\]/gu, "\\\\$&")}[^{]*\\{([^}]*)\\}`,
          "u",
        ),
      );
      return match?.[1] ?? "";
    };
    for (const selector of ["body", "button", "input", "select", "textarea"]) {
      const rule =
        controlRule(selector) ||
        controlRule(`${selector},`) ||
        globalCss.match(
          new RegExp(
            `${selector}[^{]*\\{[^}]*font-family:\\s*var\\(--font-sans\\)`,
            "u",
          ),
        )?.[0] ||
        "";
      expect(rule, `${selector} must inherit --font-sans`).toContain(
        "var(--font-sans)",
      );
    }
  });

  it("does not introduce off-contract font weights in the style layer", () => {
    const salidaCss = [
      join(root, "src/styles/global.css"),
      join(root, "src/styles/tokens.css"),
      join(root, "src/styles/salida.css"),
    ]
      .filter((path) => existsSync(path))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const usedWeights = [...salidaCss.matchAll(/font-weight:\s*(\d+)/gu)].map(
      (match) => match[1],
    );
    for (const weight of usedWeights) {
      expect(
        ALLOWED_FONT_WEIGHTS.has(weight),
        `off-contract font-weight ${weight}`,
      ).toBe(true);
    }
    for (const forbidden of FORBIDDEN_FONT_WEIGHTS) {
      expect(salidaCss).not.toMatch(new RegExp(`font-weight:\\s*${forbidden}`));
    }
  });
});

describe("SALIDA token contract", () => {
  it("promotes the approved token roles", () => {
    const required = [
      "--color-primary: #0e4e63",
      "--color-primary-strong: #083a4a",
      "--color-primary-soft: #e4eef1",
      "--color-accent: #8a6a1c",
      "--color-accent-soft: #f4ebd3",
      "--color-accent-warm: #a14e12",
      "--color-text: #1c2b31",
      "--color-text-muted: #56666d",
      "--color-surface: #ffffff",
      "--color-surface-alt: #f7f5f1",
      "--color-border: #dcd8d0",
      "--color-border-strong: #8f887e",
      "--color-focus: #8a5b0e",
    ];
    for (const token of required) {
      expect(tokensCss).toContain(token);
    }
  });

  it("resolves the documented additions: control height, gutter, stack-section", () => {
    expect(tokensCss).toMatch(/--control-height:\s*2\.75rem/u);
    expect(tokensCss).toMatch(/--grid-gutter:\s*var\(--space-4\)/u);
    expect(tokensCss).toMatch(/--stack-section:\s*var\(--space-8\)/u);
    // responsive gutter promotion (24px from tablet up) lives in the layer CSS
    const salidaCss = readFileSync(join(root, "src/styles/salida.css"), "utf8");
    expect(salidaCss).toMatch(
      /@media\s*\(min-width:\s*768px\)\s*\{[^}]*--grid-gutter:\s*var\(--space-5\)/su,
    );
  });

  it("keeps the editorial object-position and ratio tokens", () => {
    for (const token of [
      "--editorial-ratio-hero: 3 / 2",
      "--editorial-ratio-card: 4 / 3",
      "--editorial-ratio-wide: 16 / 9",
      "--editorial-object-hero: 67% 22%",
      "--editorial-object-card-training: 57% 35%",
      "--editorial-object-card-occupation: 47% 25%",
      "--editorial-object-card-offer: 48% 38%",
      "--editorial-object-centers: 66% 36%",
    ]) {
      expect(tokensCss).toContain(token);
    }
  });
});
