import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  captureSepeOccupationMarket,
  type SepeOccupationMarketCatalogueEntry,
} from "./captureSepeOccupationMarket";

const fixturePath = join(
  process.cwd(),
  "tests/fixtures/sepe-occupation-market/cno-2721-2026-07.html",
);
const sourceUrl =
  "https://www.sepe.es/HomeSepe/es/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2721-Dise-adores-y-administradores-de-bases-de-datos~.html";
const catalogue: SepeOccupationMarketCatalogueEntry[] = [
  {
    code: "2721",
    label: "Diseñadores y administradores de bases de datos",
  },
];
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

async function fixture(): Promise<string> {
  return readFile(fixturePath, "utf8");
}

describe("captureSepeOccupationMarket", () => {
  it("writes a deterministic, period-complete capture through an injected fetcher", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-sepe-capture-"));
    temporaryRoots.push(root);
    const outputPath = join(root, "sepe-occupation-market.json");
    const html = await fixture();

    await captureSepeOccupationMarket({
      period: "2026-07",
      catalogue,
      outputPath,
      retrievedAt: "2026-08-22T09:30:00Z",
      fetchPage: async ({ occupation, period }) => {
        expect(occupation.code).toBe("2721");
        expect(period).toBe("2026-07");
        return { html, sourceUrl };
      },
    });

    const captured = JSON.parse(await readFile(outputPath, "utf8")) as Array<{
      period: string;
      cno: { code: string };
      source: { url: string; retrievedAt: string };
    }>;
    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({
      period: "2026-07",
      cno: { code: "2721" },
      source: { url: sourceUrl, retrievedAt: "2026-08-22T09:30:00Z" },
    });
    expect(await readFile(outputPath, "utf8")).toBe(
      `${JSON.stringify(captured, null, 2)}\n`,
    );
  });

  it("reports an absent page and preserves the previous capture byte-for-byte", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-sepe-capture-"));
    temporaryRoots.push(root);
    const outputPath = join(root, "sepe-occupation-market.json");
    const previous = '[{"period":"2026-06","sentinel":true}]\n';
    await writeFile(outputPath, previous, "utf8");
    const html = await fixture();

    await expect(
      captureSepeOccupationMarket({
        period: "2026-07",
        catalogue: [
          ...catalogue,
          { code: "3812", label: "Técnicos de operaciones" },
        ],
        outputPath,
        retrievedAt: "2026-08-22T09:30:00Z",
        fetchPage: async ({ occupation }) =>
          occupation.code === "2721"
            ? { html, sourceUrl }
            : new Response("not found", { status: 404 }),
      }),
    ).rejects.toThrow(/3812|missing|not found/i);

    await expect(readFile(outputPath, "utf8")).resolves.toBe(previous);
  });

  it("rejects a parsed page for the wrong period before replacing the previous capture", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-sepe-capture-"));
    temporaryRoots.push(root);
    const outputPath = join(root, "sepe-occupation-market.json");
    const previous = '[{"period":"2026-06","sentinel":true}]\n';
    await writeFile(outputPath, previous, "utf8");

    await expect(
      captureSepeOccupationMarket({
        period: "2026-08",
        catalogue,
        outputPath,
        retrievedAt: "2026-08-22T09:30:00Z",
        fetchPage: async () => ({ html: await fixture(), sourceUrl }),
      }),
    ).rejects.toThrow(/period/i);

    await expect(readFile(outputPath, "utf8")).resolves.toBe(previous);
  });
});
