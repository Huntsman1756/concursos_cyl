import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  captureSepeOccupationMarket,
  type SepeOccupationMarketCatalogueEntry,
} from "./captureSepeOccupationMarket";
import { SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT } from "./resolveSepeOccupationMarketUrl";

const fixturePath = join(
  process.cwd(),
  "tests/fixtures/sepe-occupation-market/cno-2721-2026-07.html",
);
const sourceUrl =
  "https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2721-Dise-adores-y-administradores-de-bases-de-datos~.html";
const catalogue: SepeOccupationMarketCatalogueEntry[] = [
  {
    code: "2721",
    label: "Diseñadores y administradores de bases de datos",
  },
];
const temporaryRoots: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

async function fixture(): Promise<string> {
  return readFile(fixturePath, "utf8");
}

describe("captureSepeOccupationMarket", () => {
  it("uses the official resolver for a single catalogue entry by default", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-sepe-capture-"));
    temporaryRoots.push(root);
    const outputPath = join(root, "sepe-occupation-market.json");
    const resolverUrl =
      "https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2252-T-cnicos-en-educaci-n-infantil~.html";
    let resolverCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        resolverCalls += 1;
        expect(input).toBe(SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT);
        return new Response(
          `<a href="${resolverUrl.replace("https://www.sepe.es", "")}">CNO-11 2252: Técnicos en educación infantil · Julio 2026</a>`,
        );
      }),
    );

    await captureSepeOccupationMarket({
      period: "2026-07",
      catalogue: [{ code: "2252", label: "Técnicos en educación infantil" }],
      outputPath,
      retrievedAt: "2026-08-22T09:30:00Z",
      fetchPage: async ({ sourceUrl }) => ({
        html: (await fixture()).replaceAll("CNO-2721", "CNO-2252"),
        sourceUrl,
      }),
    });

    expect(resolverCalls).toBe(1);
  });

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
      resolvePage: async () => ({ status: "published", sourceUrl }),
      fetchPage: async ({ occupation, period }) => {
        expect(occupation.code).toBe("2721");
        expect(period).toBe("2026-07");
        return { html, sourceUrl };
      },
    });

    const captured = JSON.parse(await readFile(outputPath, "utf8")) as {
      records: Array<{
        period: string;
        cno: { code: string };
        source: { url: string; retrievedAt: string };
      }>;
      coverage: {
        requestedCnoCodes: string[];
        publishedCnoCodes: string[];
        notPublishedCnoCodes: string[];
      };
    };
    expect(captured.records).toHaveLength(1);
    expect(captured.records[0]).toMatchObject({
      period: "2026-07",
      cno: { code: "2721" },
      source: { url: sourceUrl, retrievedAt: "2026-08-22T09:30:00Z" },
    });
    expect(captured.coverage).toMatchObject({
      requestedCnoCodes: ["2721"],
      publishedCnoCodes: ["2721"],
      notPublishedCnoCodes: [],
    });
    expect(captured).toMatchObject({
      coverage: { resolverEndpoint: SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT },
    });
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
        resolvePage: async ({ cnoCode }) => ({
          status: "published",
          sourceUrl:
            cnoCode === "2721"
              ? sourceUrl
              : "https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_3812-T-cnicos-de-operaciones~.html",
        }),
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
        resolvePage: async () => ({
          status: "published",
          sourceUrl: sourceUrl.replace("_2026_07_", "_2026_08_"),
        }),
        fetchPage: async ({ sourceUrl: resolvedUrl }) => ({
          html: await fixture(),
          sourceUrl: resolvedUrl,
        }),
      }),
    ).rejects.toThrow(/period/i);

    await expect(readFile(outputPath, "utf8")).resolves.toBe(previous);
  });

  it("resolves canonical URLs with at most four concurrent fetches and keeps an explicit miss", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-sepe-capture-"));
    temporaryRoots.push(root);
    const outputPath = join(root, "sepe-occupation-market.json");
    const html = await fixture();
    const codes = ["4424", "2721", "2252", "3812", "4111"];
    const sourceUrls = new Map(
      codes.map((code) => [
        code,
        `https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_${code}-canonical~.html`,
      ]),
    );
    let active = 0;
    let maxActive = 0;
    const fetchedCodes: string[] = [];
    const records = await captureSepeOccupationMarket({
      period: "2026-07",
      catalogue: codes.map((code) => ({ code, label: `Ocupación ${code}` })),
      outputPath,
      retrievedAt: "2026-08-22T09:30:00Z",
      resolvePage: async ({ cnoCode }) =>
        cnoCode === "4424"
          ? { status: "not-published", reason: "no-document" }
          : {
              status: "published",
              sourceUrl: sourceUrls.get(cnoCode) as string,
            },
      fetchPage: async ({ occupation, sourceUrl }) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        fetchedCodes.push(occupation.code);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return {
          html: html.replaceAll("CNO-2721", `CNO-${occupation.code}`),
          sourceUrl,
        };
      },
    });

    expect(maxActive).toBeLessThanOrEqual(4);
    expect(fetchedCodes).not.toContain("4424");
    expect(records.map((record) => record.cno.code)).toEqual([
      "2252",
      "2721",
      "3812",
      "4111",
    ]);
    const captured = JSON.parse(await readFile(outputPath, "utf8")) as {
      records: Array<{ cno: { code: string }; source: { url: string } }>;
      coverage: {
        requestedCnoCodes: string[];
        publishedCnoCodes: string[];
        notPublishedCnoCodes: string[];
      };
    };
    expect(captured.coverage).toEqual({
      requestedCnoCodes: ["2252", "2721", "3812", "4111", "4424"],
      publishedCnoCodes: ["2252", "2721", "3812", "4111"],
      notPublishedCnoCodes: ["4424"],
      resolverEndpoint: SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT,
      capturedAt: "2026-08-22T09:30:00Z",
    });
    expect(captured.records.map((record) => record.source.url)).toEqual([
      sourceUrls.get("2252"),
      sourceUrls.get("2721"),
      sourceUrls.get("3812"),
      sourceUrls.get("4111"),
    ]);
  });

  it("aborts atomically when a resolved page has a mismatched CNO", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-sepe-capture-"));
    temporaryRoots.push(root);
    const outputPath = join(root, "sepe-occupation-market.json");
    const previous = '[{"period":"2026-06","sentinel":true}]\n';
    await writeFile(outputPath, previous, "utf8");

    await expect(
      captureSepeOccupationMarket({
        period: "2026-07",
        catalogue,
        outputPath,
        retrievedAt: "2026-08-22T09:30:00Z",
        resolvePage: async () => ({
          status: "published",
          sourceUrl:
            "https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2721-canonical~.html",
        }),
        fetchPage: async ({ sourceUrl }) => ({
          html: (await fixture()).replaceAll("CNO-2721", "CNO-3812"),
          sourceUrl,
        }),
      }),
    ).rejects.toThrow(/CNO|mismatch/i);
    await expect(readFile(outputPath, "utf8")).resolves.toBe(previous);
  });

  it("rejects a noncanonical resolver URL before fetching its page", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-sepe-capture-"));
    temporaryRoots.push(root);
    const outputPath = join(root, "sepe-occupation-market.json");
    let fetchCalls = 0;

    await expect(
      captureSepeOccupationMarket({
        period: "2026-07",
        catalogue,
        outputPath,
        retrievedAt: "2026-08-22T09:30:00Z",
        resolvePage: async () => ({
          status: "published",
          sourceUrl:
            "https://observatorio.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2721-Dise-adores~.html",
        }),
        fetchPage: async () => {
          fetchCalls += 1;
          return { html: await fixture(), sourceUrl };
        },
      }),
    ).rejects.toThrow(/canonical|SEPE|URL/i);
    expect(fetchCalls).toBe(0);
  });

  it("rejects a redirected Response URL instead of replacing resolver provenance", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-sepe-capture-"));
    temporaryRoots.push(root);
    const outputPath = join(root, "sepe-occupation-market.json");
    const resolverUrl =
      "https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2721-Dise-adores-y-administradores-de-bases-de-datos~.html";
    const redirected = new Response(await fixture());
    Object.defineProperty(redirected, "url", {
      value: "https://www.sepe.es/HomeSepe/redirected-document.html",
      configurable: true,
    });

    await expect(
      captureSepeOccupationMarket({
        period: "2026-07",
        catalogue,
        outputPath,
        retrievedAt: "2026-08-22T09:30:00Z",
        resolvePage: async () => ({
          status: "published",
          sourceUrl: resolverUrl,
        }),
        fetchPage: async () => redirected,
      }),
    ).rejects.toThrow(/redirect|mismatch|provenance|source/i);
  });
});
