import { createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import evidenceJson from "../../tests/fixtures/educabase-income/source-evidence.json";
import {
  EDUCABASE_INCOME_SOURCES,
  EDUCABASE_INCOME_TABLE_IDS,
  type EducabaseIncomeFormat,
  type EducabaseIncomeTableId,
} from "./educabaseIncomeSources";

interface FixtureEvidence {
  tableId: EducabaseIncomeTableId;
  format: EducabaseIncomeFormat;
  capturedAt: "2026-08-09";
  byteLength: number;
  sha256: string;
  bomHex: "efbbbf" | null;
  declaredContentType: string;
  effectiveEncoding: "utf-8" | "iso-8859-15";
}

interface DownloadedFixture {
  evidence: FixtureEvidence;
  bytes: Uint8Array;
  path: string;
}

const FIXTURE_DIRECTORY = resolve(
  process.cwd(),
  "tests/fixtures/educabase-income",
);
const OFFICIAL_HOST = "estadisticas.educacion.gob.es";

function assertFixtureEvidence(
  value: unknown,
): asserts value is FixtureEvidence[] {
  if (!Array.isArray(value) || value.length !== 8) {
    throw new Error(
      "Expected exactly eight EDUCAbase fixture evidence records.",
    );
  }

  const knownTableIds = new Set<string>(EDUCABASE_INCOME_TABLE_IDS);
  const seen = new Set<string>();

  for (const item of value) {
    if (
      item === null ||
      typeof item !== "object" ||
      !("tableId" in item) ||
      !("format" in item) ||
      !("capturedAt" in item) ||
      !("byteLength" in item) ||
      !("sha256" in item) ||
      !("bomHex" in item) ||
      !("declaredContentType" in item) ||
      !("effectiveEncoding" in item)
    ) {
      throw new Error("Fixture evidence has an invalid record shape.");
    }

    const record = item as Record<string, unknown>;
    if (
      typeof record.tableId !== "string" ||
      !knownTableIds.has(record.tableId) ||
      (record.format !== "csv" && record.format !== "px") ||
      record.capturedAt !== "2026-08-09" ||
      typeof record.byteLength !== "number" ||
      !Number.isSafeInteger(record.byteLength) ||
      record.byteLength <= 0 ||
      typeof record.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/u.test(record.sha256) ||
      (record.bomHex !== "efbbbf" && record.bomHex !== null) ||
      typeof record.declaredContentType !== "string" ||
      typeof record.effectiveEncoding !== "string"
    ) {
      throw new Error("Fixture evidence contains an invalid field value.");
    }

    if (
      (record.format === "csv" &&
        (record.bomHex !== "efbbbf" || record.effectiveEncoding !== "utf-8")) ||
      (record.format === "px" &&
        (record.bomHex !== null || record.effectiveEncoding !== "iso-8859-15"))
    ) {
      throw new Error(
        "Fixture evidence has an invalid format encoding contract.",
      );
    }

    const key = `${record.tableId}:${record.format}`;
    if (seen.has(key)) {
      throw new Error(`Fixture evidence repeats ${key}.`);
    }
    seen.add(key);
  }
}

function getFixturePath(evidence: FixtureEvidence): string {
  return resolve(FIXTURE_DIRECTORY, `${evidence.tableId}.${evidence.format}`);
}

async function assertNoFixturesExist(paths: readonly string[]): Promise<void> {
  for (const path of paths) {
    try {
      await access(path);
    } catch {
      continue;
    }

    throw new Error(`refusing to overwrite existing fixture: ${path}`);
  }
}

export function assertFinalOfficialUrl(
  responseUrl: string,
  sourceUrl: string,
): void {
  const finalUrl = new URL(responseUrl);
  const expectedUrl = new URL(sourceUrl);

  if (
    finalUrl.protocol !== "https:" ||
    finalUrl.hostname !== OFFICIAL_HOST ||
    finalUrl.pathname !== expectedUrl.pathname ||
    finalUrl.search !== expectedUrl.search ||
    finalUrl.hash !== ""
  ) {
    throw new Error(`Unexpected final official URL: ${responseUrl}`);
  }
}

export function assertFixtureBom(
  bytes: Uint8Array,
  expectedBomHex: FixtureEvidence["bomHex"],
): void {
  const hasUtf8Bom =
    Buffer.from(bytes.subarray(0, 3)).toString("hex") === "efbbbf";

  if (
    (expectedBomHex === "efbbbf" && !hasUtf8Bom) ||
    (expectedBomHex === null && hasUtf8Bom)
  ) {
    throw new Error("Unexpected BOM in approved fixture response.");
  }
}

async function downloadFixture(
  fixtureEvidence: FixtureEvidence,
): Promise<DownloadedFixture> {
  const source = EDUCABASE_INCOME_SOURCES[fixtureEvidence.tableId];
  const sourceUrl =
    fixtureEvidence.format === "csv" ? source.csvUrl : source.pxUrl;
  const response = await fetch(sourceUrl, { redirect: "follow" });

  if (response.status !== 200) {
    throw new Error(
      `Expected HTTP 200 for ${fixtureEvidence.tableId}:${fixtureEvidence.format}; received ${response.status}.`,
    );
  }

  assertFinalOfficialUrl(response.url, sourceUrl);

  const declaredContentType = response.headers.get("content-type");
  if (declaredContentType !== fixtureEvidence.declaredContentType) {
    throw new Error(
      `Unexpected content type for ${fixtureEvidence.tableId}:${fixtureEvidence.format}; received ${declaredContentType ?? "none"}.`,
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (
    bytes.byteLength !== fixtureEvidence.byteLength ||
    sha256 !== fixtureEvidence.sha256
  ) {
    throw new Error(
      `Fixture evidence mismatch for ${fixtureEvidence.tableId}:${fixtureEvidence.format}; expected ${fixtureEvidence.byteLength} bytes and ${fixtureEvidence.sha256}, received ${bytes.byteLength} bytes and ${sha256}.`,
    );
  }

  assertFixtureBom(bytes, fixtureEvidence.bomHex);

  return {
    evidence: fixtureEvidence,
    bytes,
    path: getFixturePath(fixtureEvidence),
  };
}

export async function captureEducabaseIncomeFixtures(): Promise<void> {
  assertFixtureEvidence(evidenceJson);
  await mkdir(FIXTURE_DIRECTORY, { recursive: true });
  await assertNoFixturesExist(evidenceJson.map(getFixturePath));

  const downloaded = await Promise.all(evidenceJson.map(downloadFixture));
  await Promise.all(
    downloaded.map(async ({ bytes, path }) => {
      try {
        await writeFile(path, bytes, { flag: "wx" });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
          throw new Error(`refusing to overwrite existing fixture: ${path}`, {
            cause: error,
          });
        }
        throw error;
      }
    }),
  );
}

if (process.argv[1]?.endsWith("captureEducabaseIncomeFixtures.ts")) {
  await captureEducabaseIncomeFixtures();
}
