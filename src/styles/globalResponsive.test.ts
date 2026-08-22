import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const globalCss = readFileSync(
  join(process.cwd(), "src/styles/global.css"),
  "utf8",
);

function extractBlocks(source: string, pattern: RegExp) {
  const blocks: string[] = [];
  for (const match of source.matchAll(pattern)) {
    const start = match.index;
    if (start === undefined) continue;
    const openBrace = source.indexOf("{", start);
    if (openBrace === -1) continue;
    let depth = 0;
    for (let index = openBrace; index < source.length; index += 1) {
      if (source[index] === "{") depth += 1;
      if (source[index] === "}") depth -= 1;
      if (depth === 0) {
        blocks.push(source.slice(openBrace + 1, index));
        break;
      }
    }
  }
  return blocks;
}

function ruleFor(block: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const matches = [
    ...block.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "gu")),
  ];
  return matches.at(-1)?.[1];
}

function declaration(rule: string | undefined, property: string) {
  return rule?.match(
    new RegExp(
      `${property.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\s*:\\s*([^;]+)`,
      "u",
    ),
  )?.[1];
}

describe("responsive shell CSS contract", () => {
  it("keeps the final mobile navigation as a compact non-scrolling panel", () => {
    const mobileBlocks = extractBlocks(
      globalCss,
      /@media\s*\(max-width:\s*47\.999rem\)\s*\{/gu,
    );
    const finalMobileBlock = mobileBlocks.at(-1);

    expect(finalMobileBlock).toBeDefined();
    expect(
      declaration(
        ruleFor(finalMobileBlock ?? "", ".site-menu-button"),
        "min-width",
      ),
    ).toBe("2.75rem");
    expect(
      declaration(
        ruleFor(finalMobileBlock ?? "", ".site-menu-button"),
        "min-height",
      ),
    ).toBe("2.75rem");
    expect(
      declaration(
        ruleFor(finalMobileBlock ?? "", ".site-nav--desktop"),
        "display",
      ),
    ).toBe("none");
    expect(
      declaration(
        ruleFor(finalMobileBlock ?? "", ".site-nav--mobile"),
        "width",
      ),
    ).toBe("100%");
    expect(
      declaration(
        ruleFor(finalMobileBlock ?? "", ".site-nav--mobile ul"),
        "display",
      ),
    ).toBe("grid");
    expect(
      declaration(
        ruleFor(finalMobileBlock ?? "", ".site-nav--mobile a"),
        "min-height",
      ),
    ).toBe("2.75rem");
    expect(
      declaration(
        ruleFor(finalMobileBlock ?? "", ".coverage-panel__heading"),
        "display",
      ),
    ).toBe("grid");
    expect(
      declaration(
        ruleFor(finalMobileBlock ?? "", ".data-freshness"),
        "max-width",
      ),
    ).toBe("100%");
    expect(
      declaration(
        ruleFor(finalMobileBlock ?? "", ".data-freshness"),
        "white-space",
      ),
    ).toBe("normal");
    expect(
      declaration(
        ruleFor(finalMobileBlock ?? "", ".data-freshness"),
        "overflow-wrap",
      ),
    ).toBe("anywhere");

    const allMobileBlocks = mobileBlocks.join("\n");
    expect(allMobileBlocks).not.toMatch(/\.site-nav\s*\{[^}]*overflow-x\s*:/u);
    expect(allMobileBlocks).not.toMatch(
      /\.site-nav\s*ul\s*\{[^}]*flex-wrap\s*:/u,
    );
    expect(allMobileBlocks).not.toMatch(
      /\.site-nav\s*\{[^}]*overflow\s*:\s*visible/u,
    );
    expect(finalMobileBlock).not.toMatch(
      /\.site-nav\s+ul\s*\{[^}]*width\s*:\s*max-content/u,
    );
  });

  it("does not reintroduce horizontal scrolling for the intermediate desktop shell", () => {
    const intermediateBlocks = extractBlocks(
      globalCss,
      /@media\s*\(max-width:\s*74rem\)\s*\{/gu,
    );
    expect(intermediateBlocks.join("\n")).not.toMatch(
      /\.site-nav\s*\{[^}]*overflow-x\s*:/u,
    );
  });

  it("keeps navigation class rules free of overflow and wrapping overrides", () => {
    const navigationRules = [
      ...globalCss.matchAll(
        /(\.site-nav--(?:desktop|mobile)[^{]*)\{([^{}]*)\}/gu,
      ),
    ];

    expect(navigationRules.length).toBeGreaterThan(0);
    for (const [, selector, body] of navigationRules) {
      expect(body).not.toMatch(/(?:^|[;\n])\s*overflow(?:-x|-y)?\s*:/u);
      expect(body).not.toMatch(/(?:^|[;\n])\s*flex-wrap\s*:/u);
      expect(body).not.toMatch(/(?:^|[;\n])\s*width\s*:\s*max-content/u);
      if (/\.site-nav--mobile(?:[^\w-]|$)/u.test(selector)) {
        expect(body).not.toMatch(/(?:^|[;\n])\s*white-space\s*:\s*nowrap/u);
      }
    }
  });

  it("keeps guided example titles visually separate from their metadata", () => {
    const guidedExampleItem = extractBlocks(
      globalCss,
      /\.training-guided-examples\s+li\s*\{/gu,
    ).at(-1);

    expect(guidedExampleItem).toBeDefined();
    expect(declaration(guidedExampleItem, "display")).toBe("grid");
    expect(declaration(guidedExampleItem, "gap")).toBe("var(--space-1)");
  });
});
