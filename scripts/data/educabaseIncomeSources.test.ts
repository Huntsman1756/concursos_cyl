import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import evidence from "../../tests/fixtures/educabase-income/source-evidence.json";
import {
  assertFinalOfficialUrl,
  assertFixtureBom,
  captureEducabaseIncomeFixtures,
} from "./captureEducabaseIncomeFixtures";
import { EDUCABASE_INCOME_SOURCES } from "./educabaseIncomeSources";

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

  it("pins every artifact to the approved official direct-download contract", () => {
    const expected = [
      {
        tableId: "famprof_2_08",
        trainingLevel: "intermediate",
        scope: "spain_cycle_group",
        catalogId: "EMLIN0000090080",
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
      {
        tableId: "famprof_3_08",
        trainingLevel: "higher",
        scope: "spain_cycle_group",
        catalogId: "EMLIN0000090094",
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
      {
        tableId: "ccaa_2_07",
        trainingLevel: "intermediate",
        scope: "autonomous_community_training_level",
        catalogId: "EMLIN0000090044",
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
      {
        tableId: "ccaa_3_07",
        trainingLevel: "higher",
        scope: "autonomous_community_training_level",
        catalogId: "EMLIN0000090057",
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
    ] as const;

    for (const source of Object.values(EDUCABASE_INCOME_SOURCES)) {
      const approved = expected.find((row) => row.tableId === source.tableId);
      expect(approved).toBeDefined();
      expect(source.trainingLevel).toBe(approved?.trainingLevel);
      expect(source.scope).toBe(approved?.scope);
      expect(source.expectedCellCount).toBe(approved?.expectedCellCount);
      expect(source.expectedGroupCount).toBe(approved?.expectedGroupCount);
      expect(source.expectedCsvHeader).toEqual(approved?.expectedCsvHeader);
      expect(source.termsUrl).toBe(
        "https://www.educacionyfp.gob.es/comunes/aviso-legal.html",
      );

      const catalog = new URL(source.catalogUrl);
      expect(catalog.protocol).toBe("https:");
      expect(catalog.hostname).toBe("datos.gob.es");
      expect(catalog.pathname).toContain(
        approved?.catalogId.toLowerCase() ?? "",
      );
      expect(catalog.search).toBe("");
      expect(catalog.hash).toBe("");

      for (const url of [source.csvUrl, source.pxUrl]) {
        const parsed = new URL(url);
        expect(parsed.protocol).toBe("https:");
        expect(parsed.hostname).toBe("estadisticas.educacion.gob.es");
        expect(parsed.pathname).toMatch(
          /^\/EducaJaxiPx\/files\/_px\/es\/(csv_bdsc|px)\/laborales\/insercion\/(famprof|ccaa)\/l0\/(famprof_[23]_08|ccaa_[23]_07)\.(csv_bdsc|px)$/u,
        );
        expect(parsed.search).toBe("?nocab=1");
        expect(parsed.hash).toBe("");
        expect(url).not.toMatch(/\/api\/|post|metadata|xlsx/iu);
      }
    }

    expect(
      new Set(
        Object.values(EDUCABASE_INCOME_SOURCES).flatMap((source) => [
          source.csvUrl,
          source.pxUrl,
        ]),
      ).size,
    ).toBe(8);
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

  it("rejects an off-host or altered final redirect target", () => {
    const sourceUrl = EDUCABASE_INCOME_SOURCES.famprof_2_08.csvUrl;
    expect(() => assertFinalOfficialUrl(sourceUrl, sourceUrl)).not.toThrow();
    expect(() =>
      assertFinalOfficialUrl(
        "https://example.test/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_2_08.csv_bdsc?nocab=1",
        sourceUrl,
      ),
    ).toThrow(/final official URL/iu);
    expect(() =>
      assertFinalOfficialUrl(
        "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_2_08.csv_bdsc?nocab=1&extra=1",
        sourceUrl,
      ),
    ).toThrow(/final official URL/iu);
  });

  it("refuses to overwrite a checked-in fixture before downloading", async () => {
    await expect(captureEducabaseIncomeFixtures()).rejects.toThrow(
      /refusing to overwrite existing fixture/iu,
    );
  });
});
