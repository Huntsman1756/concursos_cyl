import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractPublishedRequirements } from "./extractRequirements";

async function fixture(name: string): Promise<string[]> {
  return JSON.parse(
    await readFile(
      join(process.cwd(), "tests", "fixtures", "requirements", name),
      "utf8",
    ),
  ) as string[];
}

describe("extractPublishedRequirements", () => {
  it("preserves an exact quote for a published driving-license requirement", async () => {
    const quote = (await fixture("license-language-mobility.json"))[0];
    expect(extractPublishedRequirements("offer:1", [quote])).toContainEqual(
      expect.objectContaining({
        category: "driving_license_or_vehicle",
        sourceQuote: quote,
        normalizedValue: "B",
      }),
    );
  });

  it("extracts explicit categories and deterministic values", async () => {
    const [qualification] = await fixture("qualification.json");
    const [experience] = await fixture("experience.json");
    expect(
      extractPublishedRequirements("offer:1", [qualification])[0],
    ).toMatchObject({
      category: "qualification_or_specialization",
      normalizedValue: null,
    });
    expect(
      extractPublishedRequirements("offer:1", [experience])[0],
    ).toMatchObject({
      category: "experience",
      normalizedValue: 24,
      parserRule: "experience.months",
    });
  });

  it("does not force ambiguous prose into a structured category", async () => {
    const [quote] = await fixture("ambiguous.json");
    expect(extractPublishedRequirements("offer:2", [quote])).toEqual([
      expect.objectContaining({
        category: "unclassified",
        sourceQuote: quote,
        normalizedValue: null,
      }),
    ]);
  });
});
