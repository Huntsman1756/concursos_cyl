# SALIDA CyL Income Outcomes Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an income-only **Comparar estudios** experience backed by four dual-verified EDUCAbase tables, with separate Spain cycle/group and Castilla y León training-level evidence and no invented territorial or employment indicator.

**Architecture:** Eight allowlisted CSV/PX downloads are parsed independently, reconciled cell-for-cell, normalized into one strict array resource, and published by the existing atomic manifest-last snapshot pipeline. The React page loads that optional manifest resource through the existing same-origin client, presents one shared cohort/year selection in two separate semantic-table cards, and retains explicit unavailable/stale behavior for historical manifests and upstream failures.

**Tech Stack:** TypeScript 6, Node 24 built-ins (`fetch`, `TextDecoder`, `crypto`), Zod 4, React 19, React Router 7, Vite 8, Vitest 4, Testing Library, Playwright, project CSS, Caddy 2, GitHub Pages. No chart or CSV/PC-Axis dependency is added.

## Global Constraints

- The controlling design is `docs/superpowers/specs/2026-08-09-salida-cyl-income-outcomes-amendment.md`; it supersedes the outcomes scope in the 2026-08-04 design.
- Exactly four tables are allowed: `famprof_2_08`, `famprof_3_08`, `ccaa_2_07`, and `ccaa_3_07`; every table requires both its exact CSV and PX URL with `?nocab=1`.
- There is no API POST, metadata endpoint, JSON-stat2 response, employment table, affiliation rate, percentage measure, Basic FP income comparison, or runtime AI in this release.
- CSV bytes require UTF-8 BOM and strict UTF-8 decoding despite the HTTP charset; PX requires `CODEPAGE="iso-8859-15"` and ISO-8859-15 decoding.
- `..`, provisional status, and a not-yet-observed post-graduation year are three different states.
- The UI says `base de cotización anualizada`; it never says `salario esperado`, predicts personal income, or creates `cycle × Castilla y León`.
- The exact limitation sentence is `Mostramos ambas referencias por separado porque no existe una estadística oficial de ingresos por ciclo formativo en Castilla y León.`
- Source labels are preserved verbatim. Internal deterministic identifiers may normalize labels only for identity/collision checks, never display.
- Public data is generated only by `rtk npm run data:build`; no agent manually edits `public/data/v1/manifest.json` or an immutable snapshot.
- A candidate is all-or-nothing and manifest-last. Any upstream or cross-format failure keeps the prior manifest-addressed last-known-good snapshot.
- Historical manifests without `outcomeIndicators` remain loadable; the comparison page reports the optional resource as unavailable.
- No account, cookie, analytics, browser storage, requirement-answer transmission, or new personal-data path is introduced.
- All code identifiers and technical documentation are English; public copy is Spanish.
- All dependencies must pass `rtk npm run license:check`. Prefer platform APIs and project CSS; do not install Observable Plot.
- Every shell command is prefixed with `rtk`; invoke binaries absent from RTK routing with `rtk proxy npx ...`.
- Every edit is made with `apply_patch`; formatters may perform only mechanical rewrites.

## Agent and Review Protocol

Each numbered task is one bounded Terra implementation assignment. Terra must work test-first, commit only the files listed for that task, and report the commit SHA plus fresh commands. After each commit, a Sol agent independently checks both specification compliance and code quality. A failed Sol gate returns to the same Terra task; no later task begins until both review dimensions pass. Task 4 has sole ownership of catalog/generated-schema/build/client/package conflicts. Tasks 1-3 can be reviewed independently but execute in order; Tasks 5-7 depend on Task 4's public contract.

## File Map

```text
scripts/data/educabaseIncomeSources.ts        four-table/eight-artifact allowlist
scripts/data/fetchOfficialBinary.ts           bounded retrying byte fetch and provenance
scripts/data/parseEducabaseIncomeCsv.ts       strict semicolon CSV parser
scripts/data/parseEducabaseIncomePx.ts        strict approved PC-Axis subset parser
scripts/data/reconcileEducabaseIncome.ts      exact CSV/PX semantic equality
scripts/data/loadEducabaseIncome.ts           four-table ingestion orchestrator
scripts/data/normalizeIncomeOutcomes.ts        public record normalization
data/schemas/outcomes.ts                       strict generated outcome union
src/domain/outcomes.ts                         comparison indexing and compatibility
tests/fixtures/educabase-income/               immutable 2026-08-09 raw evidence
data/schemas/generatedResourceCatalog.ts       outcomeIndicators catalog entry
data/schemas/generated.ts                      upstream-artifact manifest contract
scripts/data/buildSnapshots.ts                 atomic outcome publication and LKG
src/data/generatedDataClient.ts                optional same-origin outcome loader
src/features/compare-studies/                  income-only public page
src/features/methodology/                      public source and limitation page
docs/methodology/educabase-income.md            technical/public method contract
DATA_LICENSE.md                                official terms and attribution
tests/e2e/compare-studies.spec.ts              responsive comparison journey
tests/e2e/methodology.spec.ts                  source/terms journey
tests/e2e/release.spec.ts                      production assets, deep links, headers
.github/workflows/deploy-pages.yml             stable public static deployment
Dockerfile, Caddyfile                          reproducible open-source container
README.md, docs/deployment.md                   operator and contest handoff
```

---

### Task 1: Freeze the official source contract and raw fixtures

**Ownership:** Terra source-evidence worker; Sol verifies URLs, hashes, encodings, and absence of extra tables.

**Files:**

- Create: `scripts/data/educabaseIncomeSources.ts`
- Create: `scripts/data/captureEducabaseIncomeFixtures.ts`
- Create: `tests/fixtures/educabase-income/source-evidence.json`
- Create: `tests/fixtures/educabase-income/famprof_2_08.csv`
- Create: `tests/fixtures/educabase-income/famprof_2_08.px`
- Create: `tests/fixtures/educabase-income/famprof_3_08.csv`
- Create: `tests/fixtures/educabase-income/famprof_3_08.px`
- Create: `tests/fixtures/educabase-income/ccaa_2_07.csv`
- Create: `tests/fixtures/educabase-income/ccaa_2_07.px`
- Create: `tests/fixtures/educabase-income/ccaa_3_07.csv`
- Create: `tests/fixtures/educabase-income/ccaa_3_07.px`
- Create: `tests/fixtures/educabase-income/README.md`
- Test: `scripts/data/educabaseIncomeSources.test.ts`

**Interfaces:**

- Consumes: the eight exact official URLs and verified 2026-08-09 evidence in the design amendment.
- Produces: `EDUCABASE_INCOME_SOURCES`, `EducabaseIncomeSource`, `EducabaseIncomeTableId`, `EducabaseIncomeFormat`, and eight immutable full-response fixtures.

- [ ] **Step 1: Add the failing allowlist test**

```ts
import { describe, expect, it } from "vitest";
import evidence from "../../tests/fixtures/educabase-income/source-evidence.json";
import { EDUCABASE_INCOME_SOURCES } from "./educabaseIncomeSources";

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
```

- [ ] **Step 2: Run the focused test and confirm red**

Run: `rtk npm test -- scripts/data/educabaseIncomeSources.test.ts`  
Expected: FAIL because the module and evidence fixture do not exist.

- [ ] **Step 3: Define the closed TypeScript source contract**

```ts
export type EducabaseIncomeTableId =
  "famprof_2_08" | "famprof_3_08" | "ccaa_2_07" | "ccaa_3_07";
export type EducabaseIncomeFormat = "csv" | "px";

export interface EducabaseIncomeSource {
  tableId: EducabaseIncomeTableId;
  trainingLevel: "intermediate" | "higher";
  scope: "spain_cycle_group" | "autonomous_community_training_level";
  catalogUrl: string;
  termsUrl: "https://www.educacionyfp.gob.es/comunes/aviso-legal.html";
  csvUrl: string;
  pxUrl: string;
  expectedCsvHeader: readonly string[];
  expectedCellCount: 8160 | 14880 | 13680;
  expectedGroupCount: 34 | 62 | null;
}
```

Populate only the URLs and counts in section 2 of the amendment. Freeze the object with `as const satisfies Record<EducabaseIncomeTableId, EducabaseIncomeSource>` and export `EDUCABASE_INCOME_TABLE_IDS` in the displayed order.

- [ ] **Step 4: Add adversarial contract assertions**

Test exact HTTPS host, exact path, `?nocab=1`, unique URLs, exact catalog ID, terms URL, CSV header, training level, scope, and expected counts. Explicitly reject `/api/`, POST/query metadata concepts, XLSX, non-official hosts, fragments, extra query parameters, and the former employment table IDs.

- [ ] **Step 5: Implement one-time fixture capture with hash refusal**

`captureEducabaseIncomeFixtures.ts` downloads the eight allowlisted artifacts with `redirect: "follow"`, verifies status 200 and final official host, computes SHA-256 before writing, and refuses to overwrite an existing fixture. It reads `source-evidence.json` and writes only when byte length and SHA match the exact design evidence. It creates no file under `public/`.

The evidence JSON has strict entries:

```ts
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
```

Use all eight byte lengths and hashes from the amendment. CSV entries use `bomHex: "efbbbf"` and `effectiveEncoding: "utf-8"`; PX entries use `bomHex: null` and `effectiveEncoding: "iso-8859-15"`.

- [ ] **Step 6: Capture and verify all full fixtures**

Run:

```powershell
rtk proxy npx tsx scripts/data/captureEducabaseIncomeFixtures.ts
rtk npm test -- scripts/data/educabaseIncomeSources.test.ts
```

Expected: eight files are written once; a second capture invocation fails with a clear `refusing to overwrite` message; the test independently hashes each checked-in fixture and matches all eight evidence entries.

- [ ] **Step 7: Document fixture status and format mechanically**

`tests/fixtures/educabase-income/README.md` states that these are full official responses captured on 2026-08-09 for deterministic parser tests, that production refreshes do not pin their hashes, and that updating fixtures requires a new reviewed evidence record. Run:

```powershell
rtk proxy npx prettier --write scripts/data/educabaseIncomeSources.ts scripts/data/educabaseIncomeSources.test.ts scripts/data/captureEducabaseIncomeFixtures.ts tests/fixtures/educabase-income/source-evidence.json tests/fixtures/educabase-income/README.md
rtk git diff --check
```

- [ ] **Step 8: Commit and request independent Sol review**

```powershell
rtk git add scripts/data/educabaseIncomeSources.ts scripts/data/educabaseIncomeSources.test.ts scripts/data/captureEducabaseIncomeFixtures.ts tests/fixtures/educabase-income
rtk git commit -m "test: freeze Educabase income source contract"
```

Sol gate: independently compute all eight hashes, inspect the four catalog/download pairs, and confirm no employment source or unapproved host entered the commit.

---

### Task 2: Fetch, decode, parse, and reconcile both official formats

**Ownership:** Terra ingestion worker; Sol performs an adversarial parser and fail-closed review.

**Files:**

- Create: `scripts/data/fetchOfficialBinary.ts`
- Create: `scripts/data/parseEducabaseIncomeCsv.ts`
- Create: `scripts/data/parseEducabaseIncomePx.ts`
- Create: `scripts/data/reconcileEducabaseIncome.ts`
- Create: `scripts/data/loadEducabaseIncome.ts`
- Test: `scripts/data/fetchOfficialBinary.test.ts`
- Test: `scripts/data/parseEducabaseIncomeCsv.test.ts`
- Test: `scripts/data/parseEducabaseIncomePx.test.ts`
- Test: `scripts/data/reconcileEducabaseIncome.test.ts`
- Test: `scripts/data/loadEducabaseIncome.test.ts`

**Interfaces:**

- Consumes: `EducabaseIncomeSource` and the eight raw fixtures from Task 1.
- Produces: `fetchOfficialBinary`, `parseEducabaseIncomeCsv`, `parseEducabaseIncomePx`, `assertEquivalentIncomeTables`, and `loadEducabaseIncomeBundle`.

```ts
export interface RawArtifactProvenance {
  tableId: EducabaseIncomeTableId;
  format: EducabaseIncomeFormat;
  sourceUrl: string;
  catalogUrl: string;
  fetchedAt: string;
  declaredContentType: string;
  byteLength: number;
  sha256: string;
  effectiveEncoding: "utf-8" | "iso-8859-15";
}

export interface ParsedIncomeCell {
  dimensions: Readonly<Record<string, string>>;
  rawValue: string;
}

export interface ParsedIncomeTable {
  tableId: EducabaseIncomeTableId;
  dimensions: readonly { name: string; values: readonly string[] }[];
  note: string;
  cells: readonly ParsedIncomeCell[];
}

export interface VerifiedIncomeTable {
  table: ParsedIncomeTable;
  artifacts: readonly [RawArtifactProvenance, RawArtifactProvenance];
}
```

- [ ] **Step 1: Write red binary-fetch tests**

Cover 200 success, streaming size overflow beyond 5 MiB, 10-second abort, empty body, HTML content, network/429/5xx retries with existing delays, immediate 404 failure, HTTP URL, final redirect off the official host, wrong allowlisted path, and raw SHA/byte-count provenance.

Run: `rtk npm test -- scripts/data/fetchOfficialBinary.test.ts`  
Expected: FAIL because `fetchOfficialBinary` is absent.

- [ ] **Step 2: Implement the bounded byte fetch**

```ts
export type BinaryRequest = (
  input: string,
  init: RequestInit,
) => Promise<Response>;

export async function fetchOfficialBinary(
  source: EducabaseIncomeSource,
  format: EducabaseIncomeFormat,
  fetchedAt: string,
  request: BinaryRequest = globalThis.fetch,
  sleep: Sleep = wait,
): Promise<{ bytes: Uint8Array; provenance: RawArtifactProvenance }>;
```

Read `response.body` incrementally when available and abort as soon as the cap is exceeded. Validate the response's final URL against the exact selected URL after redirects. Hash raw bytes with `createHash("sha256")`. Do not decode in this module.

- [ ] **Step 3: Write red CSV parser tests against full fixtures**

Assert exact BOM behavior, strict UTF-8 accents, the two exact national headers, exact regional header, quoted delimiters/newlines, CRLF/LF support, duplicate coordinate rejection, five exact measure labels, exact cell counts, `..` preservation, and rejection of an added column, malformed quote, NUL byte, missing BOM, replacement character, or numeric token outside `..|[0-9]+(?:\.[0-9]{3})*`.

Run: `rtk npm test -- scripts/data/parseEducabaseIncomeCsv.test.ts`  
Expected: FAIL because the parser is absent.

- [ ] **Step 4: Implement strict source-specific CSV parsing**

Use a small state machine for semicolon-delimited quoted fields; do not split rows with a regular expression. Decode through `new TextDecoder("utf-8", { fatal: true })` after verifying and removing exactly one UTF-8 BOM. Validate the exact header and every dimension value set through the source contract. Preserve official labels exactly.

- [ ] **Step 5: Write red PX parser tests against full fixtures**

Assert `AXIS-VERSION="2006"`, `CHARSET="ANSI"`, `CODEPAGE="iso-8859-15"`, exact `STUB`/`HEADING`, concatenated quoted strings, escaped quotes, exact dimensions/cell counts, `DATA` cardinality, the provisional note/window text, and rejection of UTF-8 BOM, wrong code page, unknown keyword in a structural position, missing terminator, malformed string concatenation, extra/missing cell, or invalid data token.

Run: `rtk npm test -- scripts/data/parseEducabaseIncomePx.test.ts`  
Expected: FAIL because the parser is absent.

- [ ] **Step 6: Implement only the approved PC-Axis subset**

Decode with `new TextDecoder("iso-8859-15", { fatal: true })`. Tokenize semicolon-terminated assignments while respecting quoted strings and line continuation. Parse `NOTE`, `STUB`, `HEADING`, `VALUES`, and `DATA`; validate the remaining required metadata keys but do not build a general PC-Axis interpreter. Expand the flattened `DATA` array using the declared dimension order and fail if the Cartesian product differs from `expectedCellCount`.

- [ ] **Step 7: Write red semantic-reconciliation tests**

```ts
it("rejects one changed cell even when dimensions and counts match", () => {
  const changed = structuredClone(parsedPx);
  changed.cells[500].rawValue = "19.999";
  expect(() => assertEquivalentIncomeTables(parsedCsv, changed)).toThrow(
    /famprof_2_08.*cell 500.*csv.*px/iu,
  );
});
```

Also test reordered dimensions, one changed official label, NBSP versus space, changed provisional note, `..` versus zero, and a CSV thousands token equivalent to the PX numeric representation.

- [ ] **Step 8: Implement canonical comparison without masking labels**

Convert a published numeric token to integer euros only for cell comparison: CSV `14.369` and PX `14369.00` both become `14369`. Preserve the original official dimension labels and reject fractional cents, negative values, NaN, blank, or silent trimming. Compare dimensions, order, note-derived observation windows, every coordinate, and every semantic value.

- [ ] **Step 9: Orchestrate four dual downloads with dependency injection**

```ts
export async function loadEducabaseIncomeBundle(options?: {
  fetchedAt?: string;
  request?: BinaryRequest;
  sleep?: Sleep;
}): Promise<{
  tables: readonly VerifiedIncomeTable[];
  artifacts: readonly RawArtifactProvenance[];
}>;
```

Fetch eight artifacts concurrently with a maximum concurrency of four. Return tables in `EDUCABASE_INCOME_TABLE_IDS` order and artifacts as CSV then PX for each table, regardless of network completion order. One failure rejects the whole promise.

- [ ] **Step 10: Run all Task 2 gates**

```powershell
rtk npm test -- scripts/data/fetchOfficialBinary.test.ts scripts/data/parseEducabaseIncomeCsv.test.ts scripts/data/parseEducabaseIncomePx.test.ts scripts/data/reconcileEducabaseIncome.test.ts scripts/data/loadEducabaseIncome.test.ts
rtk npm run lint
rtk proxy npx prettier --check scripts/data/fetchOfficialBinary.ts scripts/data/parseEducabaseIncomeCsv.ts scripts/data/parseEducabaseIncomePx.ts scripts/data/reconcileEducabaseIncome.ts scripts/data/loadEducabaseIncome.ts
rtk git diff --check
```

- [ ] **Step 11: Commit and request independent Sol review**

```powershell
rtk git add scripts/data/fetchOfficialBinary* scripts/data/parseEducabaseIncomeCsv* scripts/data/parseEducabaseIncomePx* scripts/data/reconcileEducabaseIncome* scripts/data/loadEducabaseIncome*
rtk git commit -m "feat: verify dual-format Educabase income tables"
```

Sol gate: mutate one byte, dimension, note, cell, encoding marker, final URL, and content length independently; confirm each mutation fails before normalization.

---

### Task 3: Normalize the income-only domain and compatibility rules

**Ownership:** Terra domain worker; Sol checks statistical semantics, identities, and impossible comparisons.

**Files:**

- Create: `data/schemas/outcomes.ts`
- Create: `scripts/data/normalizeIncomeOutcomes.ts`
- Create: `src/domain/outcomes.ts`
- Test: `data/schemas/outcomes.test.ts`
- Test: `scripts/data/normalizeIncomeOutcomes.test.ts`
- Test: `src/domain/outcomes.test.ts`

**Interfaces:**

- Consumes: `VerifiedIncomeTable[]` from Task 2.
- Produces: `OutcomeIndicatorsResourceSchema`, `normalizeIncomeOutcomes`, `indexIncomeOutcomes`, and `getIncomeComparison`.

- [ ] **Step 1: Write the failing strict-schema tests**

Define the discriminated union exactly as section 6 of the amendment and test unknown-key rejection. Add negative tests for `percent`, `affiliation_rate`, `salary`, `basic`, `professional_family`, province, workplace region, value with `availability: "published"` and `null`, unavailable value with a number, group on a regional record, or mismatched provisional flags.

Run: `rtk npm test -- data/schemas/outcomes.test.ts`  
Expected: FAIL because the schema is absent.

- [ ] **Step 2: Implement the strict outcome schemas**

Export:

```ts
export const OutcomeGroupSchema: z.ZodType<OutcomeGroup>;
export const OutcomeCohortWindowSchema: z.ZodType<OutcomeCohortWindow>;
export const OutcomeObservationSchema: z.ZodType<OutcomeObservation>;
export const OutcomeIndicatorRecordSchema: z.ZodDiscriminatedUnion<
  [
    typeof OutcomeGroupSchema,
    typeof OutcomeCohortWindowSchema,
    typeof OutcomeObservationSchema,
  ]
>;
export const OutcomeIndicatorsResourceSchema = z.array(
  OutcomeIndicatorRecordSchema,
);
```

Use `superRefine` for scope/group/table/level consistency and published/null consistency.

- [ ] **Step 3: Write red normalization tests with exact totals**

```ts
it("publishes the exact approved groups, windows, and observed cells", () => {
  const records = normalizeIncomeOutcomes(verifiedFixtureTables);
  expect(records.filter((row) => row.kind === "group")).toHaveLength(96);
  expect(records.filter((row) => row.kind === "cohort_window")).toHaveLength(
    24,
  );
  expect(records.filter((row) => row.kind === "observation")).toHaveLength(
    22_050,
  );
  expect(records).toHaveLength(22_170);
});
```

Assert 34 intermediate and 62 higher groups, regional rows only for exact `Castilla y León` plus `AMBOS SEXOS`, two-year/three-year provisional windows, absence of out-of-window observations, retained `..` inside an observed window, and deterministic byte-identical serialization after shuffled input tables.

- [ ] **Step 4: Implement deterministic identities and normalization**

Derive `groupKey` from SHA-256 of `tableId + "\0" + exactOfficialLabel`, prefixed `income-group-` and truncated to 16 lowercase hexadecimal characters. Derive `observationId` from every exact coordinate. Sort group records by level/official label, window records by level/cohort, and observations by scope/level/group/cohort/year/measure. Fail on any truncated-key collision.

Normalize source measures through this exact map:

```ts
export const SOURCE_MEASURE_MAP = {
  Media: "mean",
  "Límite inferior segundo quintil": "quintile_20_lower_boundary",
  "Límite inferior tercer quintil": "quintile_40_lower_boundary",
  "Límite inferior cuarto quintil": "quintile_60_lower_boundary",
  "Límite inferior quinto quintil": "quintile_80_lower_boundary",
} as const;
```

Strip only the terminal ` (p)` from the normalized cohort value while preserving it in source parsing. Derive `provisional` and the 4/3/2-year windows from the verified PX note, not from `..` cells.

- [ ] **Step 5: Write red domain-selection tests**

```ts
expect(() =>
  getIncomeComparison(index, {
    trainingLevel: "higher",
    groupKeys: [higherGroup, intermediateGroup],
    cohort: "2020-2021",
    postGraduationYear: 4,
  }),
).toThrow(/same training level/iu);
```

Cover one-to-three groups, duplicate/fourth/unknown group rejection, mixed levels, unknown cohort, not-yet-observed year, exact same cohort/year for both scopes, missing regional reference, and `..` pass-through. Assert the returned object has separate `national` and `regional` properties and no aggregate/ratio/rank property.

- [ ] **Step 6: Implement the read-only domain index**

```ts
export interface IncomeComparisonSelection {
  trainingLevel: "intermediate" | "higher";
  groupKeys: readonly [string, ...string[]];
  cohort: string;
  postGraduationYear: 1 | 2 | 3 | 4;
}

export interface IncomeComparison {
  selection: IncomeComparisonSelection;
  groups: readonly OutcomeGroup[];
  cohortWindow: OutcomeCohortWindow;
  national: readonly OutcomeObservation[];
  regional: readonly OutcomeObservation[];
}

export function indexIncomeOutcomes(
  records: OutcomeIndicatorsResource,
): IncomeOutcomeIndex;
export function getIncomeComparison(
  index: IncomeOutcomeIndex,
  selection: IncomeComparisonSelection,
): IncomeComparison;
```

The index validates one group identity, one window per level/cohort, exactly five measures per observed coordinate, and no duplicate observation. It never interpolates or substitutes data.

- [ ] **Step 7: Run Task 3 gates**

```powershell
rtk npm test -- data/schemas/outcomes.test.ts scripts/data/normalizeIncomeOutcomes.test.ts src/domain/outcomes.test.ts
rtk npm run lint
rtk npm run build
rtk proxy npx prettier --check data/schemas/outcomes.ts scripts/data/normalizeIncomeOutcomes.ts src/domain/outcomes.ts
rtk git diff --check
```

- [ ] **Step 8: Commit and request independent Sol review**

```powershell
rtk git add data/schemas/outcomes* scripts/data/normalizeIncomeOutcomes* src/domain/outcomes*
rtk git commit -m "feat: normalize scoped FP income outcomes"
```

Sol gate: prove that `..`, `(p)`, and out-of-window periods cannot collapse into one state; search schemas and tests for forbidden employment, percentage, Basic FP, family-region, and expected-salary semantics.

---

### Task 4: Publish the optional outcome resource atomically

**Ownership:** One Terra integration worker exclusively owns all catalog, generated-schema, build, data-client, and `package.json` changes; Sol reviews atomicity and backward compatibility.

**Files:**

- Create: `scripts/data/verifyEducabaseIncome.ts`
- Modify: `data/schemas/generatedResourceCatalog.ts`
- Modify: `data/schemas/generated.ts`
- Modify: `data/schemas/generated.test.ts`
- Modify: `scripts/data/sourceConfig.ts`
- Modify: `scripts/data/buildSnapshots.ts`
- Modify: `scripts/data/buildSnapshots.test.ts`
- Modify: `src/data/generatedDataClient.ts`
- Modify: `src/data/generatedDataClient.test.ts`
- Modify: `package.json`
- Generate only with `data:build`: one new immutable snapshot plus `public/data/v1/manifest.json`

**Interfaces:**

- Consumes: `loadEducabaseIncomeBundle`, `normalizeIncomeOutcomes`, and `OutcomeIndicatorsResourceSchema`.
- Produces: catalog key `outcomeIndicators`, optional `upstreamArtifacts`, injected income fetching, and `loadOutcomeIndicators(manifest): Promise<OutcomeIndicatorsResource | null>`.

- [ ] **Step 1: Write red catalog/manifest/client tests**

Assert `outcomeIndicators` maps to `outcome-indicators.json` with source kind `educabaseIncome`; eight strict upstream artifacts reject duplicates, non-allowlisted URLs, invalid hashes, and unknown keys; an historical current-format manifest without the new key still parses; missing key returns `null`; advertised 404/schema failure throws; logical `/data/v1/...` paths are resolved beneath `import.meta.env.BASE_URL` while remaining same-origin.

Run: `rtk npm test -- data/schemas/generated.test.ts src/data/generatedDataClient.test.ts`  
Expected: FAIL on the missing catalog/schema/client contract.

- [ ] **Step 2: Add the additive manifest and client contract**

```ts
export const UpstreamArtifactSchema = z
  .object({
    tableId: EducabaseIncomeTableIdSchema,
    format: z.enum(["csv", "px"]),
    sourceUrl: z.string().url(),
    catalogUrl: z.string().url(),
    fetchedAt: z.string().datetime(),
    declaredContentType: z.string().min(1),
    byteLength: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024),
    sha256: z.string().regex(/^[a-f0-9]{64}$/u),
    effectiveEncoding: z.enum(["utf-8", "iso-8859-15"]),
  })
  .strict();
```

Add optional `upstreamArtifacts` only to generated resource snapshots. Keep foundation keys as the only required keys so retained pre-outcome manifests remain loadable. Validate all eight exact table/format pairs when the field is present. `loadGeneratedResource` continues validating the logical same-origin asset path before prepending the normalized Vite base path.

- [ ] **Step 3: Write red atomic-build tests**

Inject a valid fixture income bundle and assert a candidate contains exactly 22,170 outcome records, the manifest addresses only the immutable outcome file, all eight raw hashes appear, and the snapshot ID changes when one raw hash changes. Add failures for each download, CSV/PX mismatch, normalization error, staging validation, and pre-manifest crash; every failure must leave the prior manifest bytes and addressed snapshot intact. Verify old manifests without outcomes remain LKG-loadable.

Run: `rtk npm test -- scripts/data/buildSnapshots.test.ts`  
Expected: FAIL before income injection/publication exists.

- [ ] **Step 4: Integrate one all-or-nothing build path**

Extend `BuildSnapshotsOptions` with `fetchIncomeBundle?: () => Promise<EducabaseIncomeBundle>`. Fetch training, offers, and income concurrently; validate/normalize income before staging. Include `outcomeIndicators` and ordered upstream artifact metadata in `hashCanonicalSource({ curatedMappings, income, offers, training })`. Add the outcome array to `candidate`, `RESOURCE_DEFINITIONS`, deterministic writes, validation, resource hashes, and the manifest. Do not create `/public/data/v1/outcome-indicators.json`; only the immutable snapshot path is valid.

- [ ] **Step 5: Add the live verification command**

`verifyEducabaseIncome.ts` loads, reconciles, normalizes, validates, and prints only table IDs, raw hashes, group/window/observation counts, and no cell data. Add `"data:income:verify": "tsx scripts/data/verifyEducabaseIncome.ts"`.

- [ ] **Step 6: Run injected gates, then one standard live build**

```powershell
rtk npm test -- data/schemas/generated.test.ts scripts/data/buildSnapshots.test.ts src/data/generatedDataClient.test.ts
rtk npm run data:income:verify
rtk npm run data:build
rtk npm run lint
rtk npm run build
rtk npm run license:check
rtk git diff --check
```

If an official response changed, times out, or fails a gate, stop without relaxing validation and keep the previous manifest. Inspect the generated diff: exactly one new current immutable snapshot may be added, retention rules decide old snapshot removal, and no manually authored public JSON is permitted.

- [ ] **Step 7: Commit and request Sol review**

```powershell
rtk git add data/schemas/generatedResourceCatalog.ts data/schemas/generated.ts data/schemas/generated.test.ts scripts/data/sourceConfig.ts scripts/data/buildSnapshots.ts scripts/data/buildSnapshots.test.ts scripts/data/verifyEducabaseIncome.ts src/data/generatedDataClient.ts src/data/generatedDataClient.test.ts package.json public/data/v1
rtk git commit -m "feat: publish verified FP income outcomes"
```

Sol gate: simulate every failure boundary, load a historical manifest, verify no root outcome file, recompute the normalized hash, and confirm manifest-last/LKG behavior.

---

### Task 5: Build the income-only comparison page

**Ownership:** Terra UI worker; Sol reviews copy, accessibility, and scope separation.

**Files:**

- Create: `src/features/compare-studies/CompareStudiesPage.tsx`
- Create: `src/features/compare-studies/IncomeComparisonForm.tsx`
- Create: `src/features/compare-studies/IncomeEvidenceCard.tsx`
- Create: `src/features/compare-studies/compareStudies.css`
- Test: `src/features/compare-studies/CompareStudiesPage.test.tsx`
- Modify: `src/app/routes.tsx`
- Modify: `src/app/App.test.tsx`

**Interfaces:** Consumes `loadManifest`, `loadOutcomeIndicators`, `indexIncomeOutcomes`, and `getIncomeComparison`; produces the real `/comparar` route.

- [ ] **Step 1: Write the red page tests**

Test level-first selection, one-to-three official groups, shared cohort/year, disabled unobserved years, visible provisional label, exact five measures, `..` copy, stale and absent-resource states, and exact source labels. Require two headings and the exact limitation sentence. Forbid `/salario esperado|ganarás|afiliación|empleo e ingresos/iu`. Assert no SVG chart or canvas is required for comprehension.

Run: `rtk npm test -- src/features/compare-studies/CompareStudiesPage.test.tsx src/app/App.test.tsx`  
Expected: FAIL because `/comparar` still renders a placeholder.

- [ ] **Step 2: Implement controlled selection and states**

Load the manifest without cache, then the optional resource. Render explicit loading, source unavailable, stale, invalid, and ready states. The form selects one level, up to three groups from that level, one shared cohort, and one observed year; it never substitutes a nearby value.

- [ ] **Step 3: Implement two separate semantic-table cards**

National heading: `Ingresos observados del ciclo o grupo en España`. Regional heading: `Referencia de titulados de Grado Medio/Grado Superior en Castilla y León`. Render permanent scope labels and the exact limitation sentence from the amendment. The regional card says `comunidad del centro de titulación`. Use text plus a responsive semantic table; add no chart dependency.

- [ ] **Step 4: Verify, format, commit, and request Sol review**

```powershell
rtk npm test -- src/features/compare-studies/CompareStudiesPage.test.tsx src/app/App.test.tsx
rtk npm run lint
rtk npm run build
rtk proxy npx prettier --check src/features/compare-studies src/app/routes.tsx src/app/App.test.tsx
rtk git diff --check
rtk git add src/features/compare-studies src/app/routes.tsx src/app/App.test.tsx
rtk git commit -m "feat: add scoped FP income comparison"
```

Sol gate: keyboard-check all controls, inspect 360 px/200% zoom, and verify the two scopes cannot be visually or mathematically merged.

---

### Task 6: Publish methodology and accurate source terms

**Ownership:** Terra methodology worker; Sol compares every public claim with the amendment and official source contract.

**Files:**

- Create: `src/features/methodology/MethodologyPage.tsx`
- Create: `src/features/methodology/SourceMethodCard.tsx`
- Create: `src/features/methodology/MethodologyPage.test.tsx`
- Create: `docs/methodology/educabase-income.md`
- Modify: `src/app/routes.tsx`
- Modify: `DATA_LICENSE.md`
- Modify: `THIRD_PARTY_NOTICES.md`

**Interfaces:** Consumes generated manifest provenance; produces `/metodologia`, four official catalog/download disclosures, and correct terms attribution.

- [ ] **Step 1: Write the failing content test**

Require the four table IDs, annualized contribution-base definition, full-time employee population, cycle grouping, quintile boundaries, `..` ambiguity, provisional 4/3/2 windows, autonomous community as graduation-center location, last-known-good behavior, manifest download, and Ministry terms link. Forbid a CC BY claim for EDUCAbase, endorsement language, employment indicators, affiliation rates, and any third-party comparison-product reference.

- [ ] **Step 2: Implement concise cards and full technical documentation**

Each public card uses `Qué aporta`, `Qué no permite afirmar`, `Actualización y huella`, and `Fuente original`. Keep dense parsing and exclusion detail in disclosures and `docs/methodology/educabase-income.md`. `DATA_LICENSE.md` names the Ministry, all four catalog entries, the terms URL, transformation/fetch metadata, and the separation from the code's MIT license.

- [ ] **Step 3: Verify, commit, and request Sol review**

```powershell
rtk npm test -- src/features/methodology/MethodologyPage.test.tsx
rtk npm run license:check
rtk npm run lint
rtk npm run build
rtk git diff --check
rtk git add src/features/methodology src/app/routes.tsx docs/methodology/educabase-income.md DATA_LICENSE.md THIRD_PARTY_NOTICES.md
rtk git commit -m "docs: explain official FP income evidence"
```

Sol gate: trace every displayed scope, date, hash, limitation, and terms link to the manifest or approved source contract; reject overclaiming.

---

### Task 7: Verify, package, and deploy the public release

**Ownership:** Terra release worker; two independent Sol passes review specification and release quality before push/deploy.

**Files:**

- Create: `tests/e2e/compare-studies.spec.ts`
- Create: `tests/e2e/methodology.spec.ts`
- Create: `tests/e2e/release.spec.ts`
- Create: `Dockerfile`
- Create: `Caddyfile`
- Create: `.dockerignore`
- Create: `.github/workflows/deploy-pages.yml`
- Create: `scripts/release/preparePagesFallback.ts`
- Create: `README.md`
- Create: `docs/deployment.md`
- Modify: `vite.config.ts`
- Modify: `src/app/routes.tsx`
- Modify: `src/data/generatedDataClient.ts`
- Modify: `package.json`

- [ ] **Step 1: Write browser and production red tests**

At desktop and 360 px, complete a higher and intermediate comparison; verify `..`, provisional, unavailable historical manifest, source links, no horizontal overflow, keyboard focus, one `h1`, and axe with no serious/critical findings. In a production server, verify `/comparar`, `/metodologia`, a deep-link reload, and the manifest-addressed outcome JSON under the configured base path.

- [ ] **Step 2: Add reproducible container and Pages base-path support**

Use a Node 24 Alpine build stage and Caddy 2 Alpine runtime. Caddy serves SPA fallback, gzip/zstd, CSP, `nosniff`, strict referrer, and restrictive permissions policy. `VITE_PUBLIC_BASE_PATH` defaults to `/`; Pages sets `/concursos_cyl/`. `preparePagesFallback.ts` copies the built `index.html` to `404.html` after build. Router basename and logical generated-data paths use the same normalized base without permitting external URLs.

- [ ] **Step 3: Add least-privilege Pages deployment**

`.github/workflows/deploy-pages.yml` runs on the development branch and manual dispatch with `contents: read`, `pages: write`, `id-token: write`; it executes `npm ci`, license, lint, unit, build with the Pages base, Playwright, uploads only `dist`, and deploys through official Pages actions pinned to major versions. Expected URL: `https://huntsman1756.github.io/concursos_cyl/`.

- [ ] **Step 4: Run the complete release gate**

```powershell
rtk npm ci
rtk npm run data:income:verify
rtk npm run license:check
rtk npm run lint
rtk npm test
rtk npm run build
rtk proxy npx playwright test
rtk docker build -t salida-cyl:local .
rtk git diff --check
```

Inspect `/`, `/desde-fp`, `/desde-ocupacion`, `/comparar`, and `/metodologia` in the real browser at 360 and 1280 px. Confirm the public manifest, exact limitation sentence, terms links, CSP, no cookies/storage/analytics, and no forbidden external-product reference.

- [ ] **Step 5: Commit, dual-review, push, and verify deployment**

```powershell
rtk git add tests/e2e Dockerfile Caddyfile .dockerignore .github/workflows/deploy-pages.yml scripts/release/preparePagesFallback.ts README.md docs/deployment.md vite.config.ts src/app/routes.tsx src/data/generatedDataClient.ts package.json package-lock.json
rtk git commit -m "feat: deploy contest-ready SALIDA CyL"
```

After two Sol approvals and a clean full gate, push `feature/salida-cyl-development`. Verify the Pages workflow SHA equals local HEAD, the expected URL returns 200, deep links render, the manifest points to an accessible immutable outcome artifact, and both source cards work on mobile and desktop. If Pages authorization is externally disabled, the container remains a complete release artifact; report that external setting as the only deployment blocker without changing product behavior.

## Final Plan Self-Review

- [ ] Map every amendment acceptance gate to Tasks 1-7 and add any missing assertion before implementation.
- [ ] Run the planning-skill placeholder scan and remove every non-executable instruction.
- [ ] Verify identical names across tasks: `outcomeIndicators`, `OutcomeIndicatorsResourceSchema`, `loadEducabaseIncomeBundle`, `normalizeIncomeOutcomes`, `loadOutcomeIndicators`, and `/comparar`.
- [ ] Confirm Task 4 alone owns catalog/generated-schema/build/client/package integration and historical manifests remain optional/loadable.
- [ ] Confirm production outcomes have one atomic immutable artifact, no root copy, eight raw provenance entries, and no manual public-data edits.
- [ ] Confirm the sequence is fixtures → parsing/reconciliation → domain → snapshot/client → UI → methodology/license → E2E/release/deploy, with an independent Sol gate after every Terra commit.
