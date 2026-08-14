import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sanitizeOfferHtml } from "./sanitizeOfferHtml";

describe("sanitizeOfferHtml", () => {
  it("removes scripts while preserving requirement list text", async () => {
    const html = await readFile(
      resolve(process.cwd(), "tests/fixtures/offer-description.html"),
      "utf8",
    );
    const result = sanitizeOfferHtml(html);

    expect(result.plainText).toContain("Requisitos: Carné B");
    expect(result.plainText).not.toContain("discard this");
    expect(result.sections.requirements).toEqual([
      "Requisitos:",
      "Carné B",
      "Experiencia con bases de datos",
    ]);
    expect(JSON.stringify(result)).not.toContain("<li>");
  });
});
