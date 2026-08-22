import { describe, expect, it } from "vitest";

import { resolveSepeOccupationMarketPage } from "./resolveSepeOccupationMarketUrl";

const endpoint =
  "https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/main/04/content/resultados";

const canonicalResultPath =
  "/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2252-T-cnicos-en-educaci-n-infantil~.html";

describe("resolveSepeOccupationMarketPage", () => {
  it("posts the official fields and resolves an accent-mangled relative CNO link", async () => {
    const body = `<a href="${canonicalResultPath}">CNO-11 2252: Técnicos en educación infantil · Julio 2026</a>`;
    const resolution = await resolveSepeOccupationMarketPage(
      { cnoCode: "2252", period: "2026-07" },
      {
        endpoint,
        fetchPage: async (input, init) => {
          expect(input).toBe(endpoint);
          expect(init?.method).toBe("POST");
          expect(init?.headers).toEqual({
            "Content-Type": "application/x-www-form-urlencoded",
          });
          expect(init?.body).toBe(
            "list-mode=detail&ocupacion-id=2252&year-busc=2026&month-busc=7",
          );
          return new Response(body, { status: 200 });
        },
      },
    );

    expect(resolution).toEqual({
      status: "published",
      sourceUrl: `https://www.sepe.es${canonicalResultPath}`,
    });
  });

  it("accepts the official Dise-adores URL and never derives a label slug", async () => {
    const resultPath =
      "/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2721-Dise-adores-y-administradores-de-bases-de-datos~.html";
    const resolution = await resolveSepeOccupationMarketPage(
      { cnoCode: "2721", period: "2026-07" },
      {
        endpoint,
        fetchPage: async () =>
          new Response(`<a href="${resultPath}">Detalle oficial</a>`, {
            status: 200,
          }),
      },
    );

    expect(resolution).toEqual({
      status: "published",
      sourceUrl: `https://www.sepe.es${resultPath}`,
    });
  });

  it("recognises only the explicit official no-document response", async () => {
    await expect(
      resolveSepeOccupationMarketPage(
        { cnoCode: "2252", period: "2026-07" },
        {
          endpoint,
          fetchPage: async () =>
            new Response(
              '<div class="no-results">No se ha encontrado ningún documento para la consulta.</div>',
              { status: 200 },
            ),
        },
      ),
    ).resolves.toEqual({ status: "not-published", reason: "no-document" });
  });

  it("recognises an explicit no-document marker alongside unrelated navigation anchors", async () => {
    await expect(
      resolveSepeOccupationMarketPage(
        { cnoCode: "2252", period: "2026-07" },
        {
          endpoint,
          fetchPage: async () =>
            new Response(
              '<nav><a href="/HomeSepe/">Inicio</a></nav><div>No se ha encontrado ningún documento para la consulta.</div>',
              { status: 200 },
            ),
        },
      ),
    ).resolves.toEqual({ status: "not-published", reason: "no-document" });
  });

  it("rejects non-official, mismatched and shell links", async () => {
    const cases = [
      '<a href="https://evil.example/2026_07_2252.html">CNO</a>',
      '<a href="/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_3812-Tecnicos~.html">Otro CNO</a>',
      "<main><h1>Resultados</h1></main>",
    ];

    for (const html of cases) {
      await expect(
        resolveSepeOccupationMarketPage(
          { cnoCode: "2252", period: "2026-07" },
          { endpoint, fetchPage: async () => new Response(html) },
        ),
      ).rejects.toThrow(/SEPE|document|resultado|enlace|link/i);
    }
  });

  it("rejects invalid CNO, period and HTTP responses", async () => {
    await expect(
      resolveSepeOccupationMarketPage(
        { cnoCode: "225", period: "2026-07" },
        { endpoint, fetchPage: async () => new Response("") },
      ),
    ).rejects.toThrow(/CNO/i);
    await expect(
      resolveSepeOccupationMarketPage(
        { cnoCode: "2252", period: "2026-13" },
        { endpoint, fetchPage: async () => new Response("") },
      ),
    ).rejects.toThrow(/period/i);
    await expect(
      resolveSepeOccupationMarketPage(
        { cnoCode: "2252", period: "2026-07" },
        {
          endpoint,
          fetchPage: async () => new Response("retry", { status: 429 }),
        },
      ),
    ).rejects.toThrow(/429|HTTP/i);
  });

  it("rejects an arbitrary resolver endpoint before making a request", async () => {
    const fetchPage = async () => {
      throw new Error("request must not be made");
    };

    await expect(
      resolveSepeOccupationMarketPage(
        { cnoCode: "2252", period: "2026-07" },
        { endpoint: "https://evil.example/resolver", fetchPage },
      ),
    ).rejects.toThrow(/endpoint|official|SEPE/i);
  });
});
