import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import evidence from "../../tests/fixtures/educabase-income/source-evidence.json";
import {
  assertFixtureBom,
  captureEducabaseIncomeFixtures,
} from "./captureEducabaseIncomeFixtures";
import { EDUCABASE_INCOME_SOURCES } from "./educabaseIncomeSources";

function hash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function createMockEvidence(): {
  evidence: Record<string, unknown>[];
  bytesByArtifact: Map<string, Uint8Array>;
} {
  const bytesByArtifact = new Map<string, Uint8Array>();
  const evidence = Object.values(EDUCABASE_INCOME_SOURCES).flatMap(
    (source, sourceIndex) =>
      (["csv", "px"] as const).map((format) => {
        const bytes =
          format === "csv"
            ? new Uint8Array([0xef, 0xbb, 0xbf, 0x61 + sourceIndex])
            : new Uint8Array([0x50, 0x58, 0x2d, 0x61 + sourceIndex]);
        const key = `${source.tableId}:${format}`;
        bytesByArtifact.set(key, bytes);
        return {
          tableId: source.tableId,
          format,
          capturedAt: "2026-08-09",
          byteLength: bytes.byteLength,
          sha256: hash(bytes),
          bomHex: format === "csv" ? "efbbbf" : null,
          declaredContentType:
            format === "csv"
              ? "text/plain;charset=ISO-8859-15"
              : "application/pc-axis;charset=ISO-8859-15",
          effectiveEncoding: format === "csv" ? "utf-8" : "iso-8859-15",
        };
      }),
  );

  return { evidence, bytesByArtifact };
}

function getMockArtifact(
  url: string,
  evidence: readonly Record<string, unknown>[],
  bytesByArtifact: ReadonlyMap<string, Uint8Array>,
): { evidence: Record<string, unknown>; bytes: Uint8Array } {
  for (const fixture of evidence) {
    const source =
      EDUCABASE_INCOME_SOURCES[
        fixture.tableId as keyof typeof EDUCABASE_INCOME_SOURCES
      ];
    const fixtureUrl = fixture.format === "csv" ? source.csvUrl : source.pxUrl;
    if (fixtureUrl === url) {
      const bytes = bytesByArtifact.get(
        `${fixture.tableId as string}:${fixture.format as string}`,
      );
      if (bytes === undefined) {
        throw new Error(`Missing mock bytes for ${fixtureUrl}.`);
      }
      return { evidence: fixture, bytes };
    }
  }

  throw new Error(`Unexpected mock request: ${url}`);
}

function mockResponse(
  url: string,
  bytes: Uint8Array,
  options: {
    status?: number;
    responseUrl?: string;
    contentType?: string;
  } = {},
): Response {
  return {
    status: options.status ?? 200,
    url: options.responseUrl ?? url,
    headers: new Headers({
      "content-type": options.contentType ?? "text/plain;charset=ISO-8859-15",
    }),
    arrayBuffer: async () =>
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
  } as Response;
}

interface MockResponseOptions {
  status?: number;
  responseUrl?: string;
  contentType?: string;
}

async function withTemporaryDirectory(
  callback: (directory: string) => Promise<void>,
): Promise<void> {
  const directory = await mkdtemp(resolve(tmpdir(), "educabase-income-"));
  try {
    await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe("EDUCABASE_INCOME_SOURCES", () => {
  it("allows exactly four income tables and eight direct artifacts", () => {
    expect(Object.keys(EDUCABASE_INCOME_SOURCES)).toEqual([
      "famprof_2_08",
      "famprof_3_08",
      "ccaa_2_07",
      "ccaa_3_07",
    ]);
    expect(
      Object.values(EDUCABASE_INCOME_SOURCES).flatMap((source) => [
        source.csvUrl,
        source.pxUrl,
      ]),
    ).toHaveLength(8);
    expect(JSON.stringify(evidence)).not.toMatch(
      /affiliation|employment|famprof_[23]_02|ccaa_[23]_12/iu,
    );
  });

  it("pins every artifact to its exact approved direct-download tuple", () => {
    const expected = {
      famprof_2_08: {
        tableId: "famprof_2_08",
        trainingLevel: "intermediate",
        scope: "spain_cycle_group",
        catalogUrl:
          "https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090080",
        termsUrl: "https://www.educacionyfp.gob.es/comunes/aviso-legal.html",
        csvUrl:
          "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_2_08.csv_bdsc?nocab=1",
        pxUrl:
          "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/famprof/l0/famprof_2_08.px?nocab=1",
        expectedCellCount: 8160,
        expectedGroupCount: 34,
        expectedCsvHeader: [
          "Cohorte",
          "Periodo de análisis",
          "Medida (2)",
          "Ciclo-grupo (3)",
          "Total",
        ],
      },
      famprof_3_08: {
        tableId: "famprof_3_08",
        trainingLevel: "higher",
        scope: "spain_cycle_group",
        catalogUrl:
          "https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090094",
        termsUrl: "https://www.educacionyfp.gob.es/comunes/aviso-legal.html",
        csvUrl:
          "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_3_08.csv_bdsc?nocab=1",
        pxUrl:
          "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/famprof/l0/famprof_3_08.px?nocab=1",
        expectedCellCount: 14880,
        expectedGroupCount: 62,
        expectedCsvHeader: [
          "Cohorte",
          "Periodo de análisis",
          "Medida (2)",
          "Ciclo-grupo",
          "Total",
        ],
      },
      ccaa_2_07: {
        tableId: "ccaa_2_07",
        trainingLevel: "intermediate",
        scope: "autonomous_community_training_level",
        catalogUrl:
          "https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090044",
        termsUrl: "https://www.educacionyfp.gob.es/comunes/aviso-legal.html",
        csvUrl:
          "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/ccaa/l0/ccaa_2_07.csv_bdsc?nocab=1",
        pxUrl:
          "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/ccaa/l0/ccaa_2_07.px?nocab=1",
        expectedCellCount: 13680,
        expectedGroupCount: null,
        expectedCsvHeader: [
          "Cohorte",
          "Comunidad autónoma",
          "Sexo",
          "Periodo de análisis",
          "Medida (2)",
          "Total",
        ],
      },
      ccaa_3_07: {
        tableId: "ccaa_3_07",
        trainingLevel: "higher",
        scope: "autonomous_community_training_level",
        catalogUrl:
          "https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090057",
        termsUrl: "https://www.educacionyfp.gob.es/comunes/aviso-legal.html",
        csvUrl:
          "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/ccaa/l0/ccaa_3_07.csv_bdsc?nocab=1",
        pxUrl:
          "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/ccaa/l0/ccaa_3_07.px?nocab=1",
        expectedCellCount: 13680,
        expectedGroupCount: null,
        expectedCsvHeader: [
          "Cohorte",
          "Comunidad autónoma",
          "Sexo",
          "Periodo de análisis",
          "Medida (2)",
          "Total",
        ],
      },
    } as const;

    expect(EDUCABASE_INCOME_SOURCES).toStrictEqual(expected);
    expect(EDUCABASE_INCOME_SOURCES.famprof_2_08.csvUrl).not.toBe(
      expected.famprof_2_08.pxUrl,
    );
    expect(EDUCABASE_INCOME_SOURCES.famprof_2_08.csvUrl).not.toBe(
      expected.famprof_3_08.csvUrl,
    );
  });

  it("retains all eight approved full-response fixtures byte-for-byte", async () => {
    expect(evidence).toHaveLength(8);

    for (const fixture of evidence) {
      const filename = `${fixture.tableId}.${fixture.format}`;
      const bytes = await readFile(
        resolve(process.cwd(), "tests/fixtures/educabase-income", filename),
      );

      expect(bytes.byteLength).toBe(fixture.byteLength);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        fixture.sha256,
      );
      const bomHex = bytes.subarray(0, 3).toString("hex");
      if (fixture.bomHex === null) {
        expect(bomHex).not.toBe("efbbbf");
      } else {
        expect(bomHex).toBe(fixture.bomHex);
      }
      expect(fixture.effectiveEncoding).toBe(
        fixture.format === "csv" ? "utf-8" : "iso-8859-15",
      );
    }
  });

  it("matches strict UTF-8 decoded fixture headers without mojibake", async () => {
    for (const source of Object.values(EDUCABASE_INCOME_SOURCES)) {
      const bytes = await readFile(
        resolve(
          process.cwd(),
          "tests/fixtures/educabase-income",
          `${source.tableId}.csv`,
        ),
      );
      expect(bytes.subarray(0, 3).toString("hex")).toBe("efbbbf");

      const header = new TextDecoder("utf-8", { fatal: true })
        .decode(bytes.subarray(3))
        .split(/\r?\n/u, 1)[0]
        .split(";");

      expect(header).toStrictEqual(source.expectedCsvHeader);
      expect(header.join(";")).not.toMatch(/\u00c3|\u00c2|\ufffd/u);
    }
  });

  it("accepts non-BOM PC-Axis content while requiring a CSV UTF-8 BOM", () => {
    expect(() =>
      assertFixtureBom(new Uint8Array([0x50, 0x58, 0x2d]), null),
    ).not.toThrow();
    expect(() =>
      assertFixtureBom(new Uint8Array([0xef, 0xbb, 0xbf]), "efbbbf"),
    ).not.toThrow();
    expect(() =>
      assertFixtureBom(new Uint8Array([0x50, 0x58, 0x2d]), "efbbbf"),
    ).toThrow(/BOM/iu);
    expect(() =>
      assertFixtureBom(new Uint8Array([0xef, 0xbb, 0xbf]), null),
    ).toThrow(/BOM/iu);
  });

  it("records the exact declared transport contracts", () => {
    for (const fixture of evidence) {
      expect(fixture.declaredContentType).toBe(
        fixture.format === "csv"
          ? "text/plain;charset=ISO-8859-15"
          : "application/pc-axis;charset=ISO-8859-15",
      );
    }
  });

  it("writes verified fixture bytes through the injected capture boundary", async () => {
    const { evidence: mockEvidence, bytesByArtifact } = createMockEvidence();

    await withTemporaryDirectory(async (directory) => {
      await captureEducabaseIncomeFixtures({
        fixtureDirectory: directory,
        evidence: mockEvidence,
        request: async (url) => {
          const fixture = getMockArtifact(url, mockEvidence, bytesByArtifact);
          return mockResponse(url, fixture.bytes, {
            contentType: fixture.evidence.declaredContentType as string,
          });
        },
      });

      for (const [artifact, bytes] of bytesByArtifact) {
        const [tableId, format] = artifact.split(":");
        expect(
          await readFile(resolve(directory, `${tableId}.${format}`)),
        ).toEqual(Buffer.from(bytes));
      }
    });
  });

  it("refuses an existing fixture directory before any request", async () => {
    const { evidence: mockEvidence } = createMockEvidence();

    await withTemporaryDirectory(async (directory) => {
      await writeFile(resolve(directory, "famprof_2_08.csv"), "existing");
      let calls = 0;

      await expect(
        captureEducabaseIncomeFixtures({
          fixtureDirectory: directory,
          evidence: mockEvidence,
          request: async () => {
            calls += 1;
            return mockResponse("https://example.test", new Uint8Array());
          },
        }),
      ).rejects.toThrow(/refusing to overwrite existing fixture/iu);
      expect(calls).toBe(0);
    });
  });

  it.each([
    ["a non-200 response", { status: 503 }, /HTTP 200/iu],
    [
      "an off-host redirect",
      {
        responseUrl:
          "https://example.test/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_2_08.csv_bdsc?nocab=1",
      },
      /final official URL/iu,
    ],
    [
      "a redirected final path",
      {
        responseUrl:
          "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_3_08.csv_bdsc?nocab=1",
      },
      /final official URL/iu,
    ],
    [
      "a redirected final query",
      {
        responseUrl:
          "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_2_08.csv_bdsc?nocab=1&extra=1",
      },
      /final official URL/iu,
    ],
    ["an HTML content type", { contentType: "text/html" }, /content type/iu],
  ] as readonly [string, MockResponseOptions, RegExp][])(
    "rejects %s",
    async (_label, responseOptions, message) => {
      const { evidence: mockEvidence, bytesByArtifact } = createMockEvidence();

      await withTemporaryDirectory(async (directory) => {
        await expect(
          captureEducabaseIncomeFixtures({
            fixtureDirectory: directory,
            evidence: mockEvidence,
            request: async (url) => {
              const fixture = getMockArtifact(
                url,
                mockEvidence,
                bytesByArtifact,
              );
              return mockResponse(url, fixture.bytes, {
                ...responseOptions,
                contentType:
                  responseOptions.contentType ??
                  (fixture.evidence.declaredContentType as string),
              });
            },
          }),
        ).rejects.toThrow(message);
      });
    },
  );

  it.each(["length", "hash", "bom"] as const)(
    "rejects an altered verified fixture %s",
    async (failure) => {
      const { evidence: baseEvidence, bytesByArtifact } = createMockEvidence();
      const mockEvidence = structuredClone(baseEvidence) as Record<
        string,
        unknown
      >[];
      const first = mockEvidence[0];
      if (failure === "length") {
        first.byteLength = (first.byteLength as number) + 1;
      } else if (failure === "hash") {
        first.sha256 = "0".repeat(64);
      } else {
        const bytes = new Uint8Array([0x50, 0x58, 0x2d, 0x61]);
        bytesByArtifact.set("famprof_2_08:csv", bytes);
        first.byteLength = bytes.byteLength;
        first.sha256 = hash(bytes);
      }

      await withTemporaryDirectory(async (directory) => {
        await expect(
          captureEducabaseIncomeFixtures({
            fixtureDirectory: directory,
            evidence: mockEvidence,
            request: async (url) => {
              const fixture = getMockArtifact(
                url,
                mockEvidence,
                bytesByArtifact,
              );
              return mockResponse(url, fixture.bytes, {
                contentType: fixture.evidence.declaredContentType as string,
              });
            },
          }),
        ).rejects.toThrow(
          failure === "bom" ? /BOM/iu : /Fixture evidence mismatch/iu,
        );
      });
    },
  );
});
