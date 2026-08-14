import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildOccupationIndex } from "../../src/domain/occupation";
import { validateCuratedMappings } from "./validateCuratedMappings";

const sourceUrl =
  "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/oferta-de-formacion-profesional/records";

describe("validateCuratedMappings", () => {
  it("rejects a visible relationship without approval and citation", () => {
    expect(() =>
      validateCuratedMappings(
        {
          occupations: [
            {
              occupationId: "occupation:web-development",
              preferredLabel: "Desarrollador web",
              description: "Diseña y mantiene aplicaciones web públicas.",
            },
          ],
          aliases: [],
          links: [
            {
              trainingProgramKey: "IFC03S",
              occupationId: "occupation:web-development",
              relationshipType: "official_output",
              reviewStatus: "approved",
              sourceUrl: "",
              sourceQuote: "",
              reviewedAt: "2026-08-14",
              mappingVersion: "1.0.0",
            },
          ],
        },
        ["IFC03S"],
      ),
    ).toThrow(/invalid|source/i);
  });

  it("accepts reviewed aliases and excludes draft links from production", async () => {
    const read = async (name: string) =>
      JSON.parse(
        await readFile(join(process.cwd(), "data", "curated", name), "utf8"),
      );
    const result = validateCuratedMappings(
      {
        occupations: await read("occupations.json"),
        aliases: await read("occupation-aliases.json"),
        links: await read("training-occupation-links.json"),
      },
      ["IFC03S", "ADG01M", "OTHER"],
    );
    const index = buildOccupationIndex(result.occupations, result.aliases);

    expect(index.search("desarrollador web")[0].occupationId).toBe(
      "occupation:web-development",
    );
    expect(result.links).toHaveLength(2);
    expect(result.coverage.linksByReviewStatus.draft).toBe(1);
    expect(result.coverage.uncoveredPrograms).toBe(1);
  });

  it("rejects generic one-word aliases", () => {
    expect(() =>
      validateCuratedMappings({
        occupations: [
          {
            occupationId: "occupation:web-development",
            preferredLabel: "Desarrollador web",
            description: "Diseña y mantiene aplicaciones web públicas.",
          },
        ],
        aliases: [
          {
            occupationId: "occupation:web-development",
            alias: "técnico",
            reviewStatus: "approved",
            sourceUrl,
            reviewedAt: "2026-08-14",
            mappingVersion: "1.0.0",
          },
        ],
        links: [],
      }),
    ).toThrow(/one-word alias/i);
  });
});
