# SALIDA CyL Income Outcomes Design Amendment

**Date:** 2026-08-09  
**Status:** approved source contract; ready for implementation  
**Supersedes:** section 5 and every employment/outcomes claim in `2026-08-04-salida-cyl-design.md` for the 2026 release  
**Does not change:** the approved training-first and occupation-first journeys, action catalog, privacy contract, or visual identity

## 1. Decision

The 2026 release includes a top-level **Comparar estudios** page, but its evidence is limited to the four verified EDUCAbase income tables below. The page compares observed annualized contribution bases, not employability, affiliation, personal salary, or a prediction.

The release exposes two deliberately separate scopes:

1. an official vocational-training cycle or cycle-group in Spain; and
2. the corresponding vocational-training level in Castilla y León.

It never manufactures a `cycle × Castilla y León`, `family × Castilla y León income`, province, workplace, or personal result. It does not ingest or render the previously proposed employment/affiliation tables because those tables and their UI contract have not passed the same source verification.

## 2. Source allowlist

Only these four statistical tables are in scope. Every table is fetched twice, once as CSV and once as PC-Axis, from the exact official download URLs with `?nocab=1`. Catalog pages are provenance and terms references; they are not scraped as data inputs.

| Source ID      | Scope                                                         | Catalog                                                                                                                                                                                                                                                                  | CSV                                                                                                                                         | PC-Axis                                                                                                                        | Expected cells |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------: |
| `famprof_2_08` | Intermediate cycle/group, Spain                               | [EMLIN0000090080](https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090080)                | [CSV](https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_2_08.csv_bdsc?nocab=1) | [PX](https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/famprof/l0/famprof_2_08.px?nocab=1) |          8,160 |
| `famprof_3_08` | Higher cycle/group, Spain                                     | [EMLIN0000090094](https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090094)             | [CSV](https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_3_08.csv_bdsc?nocab=1) | [PX](https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/famprof/l0/famprof_3_08.px?nocab=1) |         14,880 |
| `ccaa_2_07`    | Intermediate level, autonomous community of graduation center | [EMLIN0000090044](https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090044)    | [CSV](https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/ccaa/l0/ccaa_2_07.csv_bdsc?nocab=1)       | [PX](https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/ccaa/l0/ccaa_2_07.px?nocab=1)       |         13,680 |
| `ccaa_3_07`    | Higher level, autonomous community of graduation center       | [EMLIN0000090057](https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090057) | [CSV](https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/ccaa/l0/ccaa_3_07.csv_bdsc?nocab=1)       | [PX](https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/ccaa/l0/ccaa_3_07.px?nocab=1)       |         13,680 |

The catalog-declared terms link is [the Ministry legal notice](https://www.educacionyfp.gob.es/comunes/aviso-legal.html). The product records and links those terms; it does not relabel the source as CC BY and does not imply Ministry endorsement.

### Verification evidence captured on 2026-08-09

These hashes identify the exact raw responses inspected while approving this amendment. They are evidence, not a permanent production allowlist: an annual official update is allowed to change them only if every structural and semantic gate still passes and the newly fetched hashes are recorded in the generated manifest.

| Source         | Format |     Bytes | SHA-256                                                            |
| -------------- | ------ | --------: | ------------------------------------------------------------------ |
| `famprof_2_08` | CSV    |   749,058 | `e6a77a5a6ec822bbfc8791c80e6b2c021cfc7e877a49f9ea5e9b058f9d84a748` |
| `famprof_2_08` | PX     |    67,217 | `884f5c29df30101516b05308117831e4de1497998fe1ce3197421f0d7c456a5b` |
| `famprof_3_08` | CSV    | 1,479,780 | `b23f8c2fe83fbbac47d33c65a99758cebf82b4dc2c238110492f288e66b034b5` |
| `famprof_3_08` | PX     |   123,134 | `f8c3b684724aaae6a06bc5f7e357445692c7a2429edc48779c91dc8dd79552c3` |
| `ccaa_2_07`    | CSV    | 1,112,038 | `a1d84634e71726a0a7e6a0ed05a50c63f0b4682c1f0381ece90625a361c12514` |
| `ccaa_2_07`    | PX     |   107,122 | `e42874efb8661c8a68a4dc1859b452a16b48e4aa13e3cdb925e8d21f433106cf` |
| `ccaa_3_07`    | CSV    | 1,112,303 | `4c21003223ac28b3b70a8268bf3627134c72f542e91cfedb6bbbaced402b88b2` |
| `ccaa_3_07`    | PX     |   107,330 | `cc53581069ec6b54656a03e53ec44157da340565823789f1409cd290e45fc5b3` |

## 3. Exact transport and encoding contract

There is no usable JSON-stat2 endpoint, bounded POST query, or metadata API in this release. The build performs eight bounded binary GET requests to the allowlisted URLs.

- CSV responses currently declare `text/plain;charset=ISO-8859-15`, but their raw bytes begin with UTF-8 BOM `EF BB BF`. The parser requires the BOM, strips it, and decodes the remaining bytes as strict UTF-8. The misleading HTTP charset is retained in provenance but not trusted for decoding.
- PX responses declare `application/pc-axis;charset=ISO-8859-15`, have no UTF-8 BOM, declare `CODEPAGE="iso-8859-15"`, `DECIMALS=2`, and `SHOWDECIMALS=0`, and are decoded as ISO-8859-15.
- Redirects are accepted only when the final URL remains HTTPS on `estadisticas.educacion.gob.es` and matches the allowlisted path.
- Each response has a 5 MiB maximum, a finite timeout, and the existing bounded retry policy for network errors, HTTP 429, and 5xx. Other 4xx responses fail immediately.
- HTML, empty bodies, unexpected BOMs, invalid byte sequences, duplicate rows, malformed quoting, unexpected headers, dimensions, labels, cell counts, or numeric tokens fail the build.
- CSV and PX must describe the same dimensions, labels, observation window, measures, and displayed cell values. PX preserves up to two decimal places while CSV publishes the whole-euro display selected by `SHOWDECIMALS=0`; reconciliation therefore uses the exact display rule below. A mismatch fails closed; neither representation wins silently.

The source bytes are never fetched by the browser. The public application loads only normalized static JSON addressed by the generated manifest.

## 4. Exact upstream dimensions

### National cycle/group tables

The CSV headers are exact:

- `famprof_2_08`: `Cohorte;Periodo de análisis;Medida (2);Ciclo-grupo (3);Total`
- `famprof_3_08`: `Cohorte;Periodo de análisis;Medida (2);Ciclo-grupo;Total`

Their dimensions are:

- 12 cohorts: `2011-2012` through `2022-2023`; the last two labels carry `(p)`;
- four periods: `Primer año`, `Segundo año`, `Tercer año`, `Cuarto año`;
- five measures: `Media` and the lower limits of the second, third, fourth, and fifth quintiles;
- 34 official intermediate cycle/group labels or 62 official higher cycle/group labels.

Thus `12 × 4 × 5 × 34 = 8,160` and `12 × 4 × 5 × 62 = 14,880`. The official cycle/group label is preserved verbatim for display. Family-like aggregate labels remain groups; SALIDA CyL never presents them as an individual cycle.

### Regional training-level tables

The exact CSV header is:

`Cohorte;Comunidad autónoma;Sexo;Periodo de análisis;Medida (2);Total`

Their dimensions are 12 cohorts, 19 territorial values, three sex values, four periods, and five measures: `12 × 19 × 3 × 4 × 5 = 13,680` cells per table.

The normalized regional reference selects only exact source labels `Castilla y León` and `AMBOS SEXOS`. Here, autonomous community means the location of the teaching center where the qualification was obtained. It does not mean residence, workplace, employer location, or the location of a later job.

## 5. Statistical semantics

The measure is the annualized common-contingencies contribution base for employees working full time. It is an official approximation to observed gross annual remuneration for the covered population; it is not an expected personal salary.

The normalized measures are:

- `mean`;
- `quintile_20_lower_boundary` (source: lower limit of second quintile);
- `quintile_40_lower_boundary`;
- `quintile_60_lower_boundary`;
- `quintile_80_lower_boundary`.

The literal source token `..` becomes `valueEur: null` with availability `unavailable_or_unrepresentative`. SALIDA CyL must use that combined wording because the source does not let the product distinguish the two causes.

Published numeric cells have two official representations. PX may retain cents—for example `14384.61`—because it declares `DECIMALS=2`; CSV exposes the corresponding displayed whole euro `14.385` because PX declares `SHOWDECIMALS=0`. The build parses PX decimal text into integer cents using string validation and `BigInt`, accepting only non-negative decimal strings with at most two fractional digits. It then applies decimal half-up display rounding: cents `00` through `49` keep the whole euro and cents `50` through `99` advance it by one. CSV thousands separators are removed into a non-negative whole-euro `BigInt`. The displayed integer must agree exactly (`14384.61` → `14385` ↔ `14.385`). Floating-point parsing of raw source text, `parseFloat`, and `Math.round` are forbidden for this reconciliation; conversion to the public `number` occurs only after the reconciled whole-euro `BigInt` is range-checked. Negative values, exponent notation, more than two decimal places, unsafe output range, or a display mismatch fail closed.

The raw PX token remains in ingestion evidence and its raw artifact remains hash-addressed in manifest provenance. The normalized public `valueEur` is the official displayed whole-euro integer, not the unrounded PX decimal and not a value recomputed with binary floating point.

Provisional status and observation windows are separate facts:

- the cohort label `(p)` produces `provisional: true` without changing availability;
- cohorts through `2020-2021` have a four-year observation window;
- `2021-2022 (p)` has a three-year observation window;
- `2022-2023 (p)` has a two-year observation window;
- periods outside the observation window are `not_yet_observed`, not `unavailable_or_unrepresentative`, and are not emitted as observations.

The build parses and verifies the PX note that establishes those windows. A changed note fails until the contract and public explanation receive review.

## 6. Generated contract

The new generated resource is `outcomeIndicators` at immutable path `/data/v1/snapshots/<snapshot-id>/outcome-indicators.json`. It is a strict array so it fits the existing generated-resource pipeline without a parallel publication mechanism:

```ts
type OutcomeIndicatorsResource = OutcomeIndicatorRecord[];

type OutcomeIndicatorRecord =
  OutcomeGroup | OutcomeCohortWindow | OutcomeObservation;

interface OutcomeGroup {
  kind: "group";
  groupKey: string;
  trainingLevel: "intermediate" | "higher";
  officialLabel: string;
  sourceTableId: "famprof_2_08" | "famprof_3_08";
}

interface OutcomeCohortWindow {
  kind: "cohort_window";
  trainingLevel: "intermediate" | "higher";
  cohort: string;
  provisional: boolean;
  maxObservedPostGraduationYear: 1 | 2 | 3 | 4;
}

interface OutcomeObservation {
  kind: "observation";
  observationId: string;
  sourceTableId: "famprof_2_08" | "famprof_3_08" | "ccaa_2_07" | "ccaa_3_07";
  scope: "spain_cycle_group" | "castilla_leon_training_level";
  trainingLevel: "intermediate" | "higher";
  groupKey: string | null;
  officialGroupLabel: string | null;
  cohort: string;
  postGraduationYear: 1 | 2 | 3 | 4;
  measure:
    | "mean"
    | "quintile_20_lower_boundary"
    | "quintile_40_lower_boundary"
    | "quintile_60_lower_boundary"
    | "quintile_80_lower_boundary";
  valueEur: number | null;
  availability: "published" | "unavailable_or_unrepresentative";
  provisional: boolean;
}
```

`groupKey` and `observationId` are deterministic identifiers derived from the source table ID and exact official dimension labels. Slug collisions fail; labels are never normalized for display.

The manifest `recordCount` includes every group, cohort-window, and observation record. Its `outcomeIndicators` entry carries the normalized artifact hash and eight `upstreamArtifacts` with source ID, format, exact download and catalog URLs, fetched timestamp, observed content type, byte count, raw SHA-256, and effective decoding. A raw-source update therefore remains auditable even when normalized values do not change.

All production files under `public/data/v1/`, including the outcome artifact and manifest changes, are generated only by `npm run data:build`. They are never edited by hand. Tests consume checked-in source fixtures, not production snapshots.

## 7. Build publication and last-known-good behavior

Income ingestion joins the existing all-or-nothing manifest-last build:

1. fetch and hash all eight raw artifacts;
2. parse CSV and PX independently;
3. validate exact source contracts and cross-format equality;
4. normalize and validate the outcome resource;
5. run cross-resource quality gates;
6. write every resource to staging;
7. validate the complete candidate;
8. publish the immutable snapshot;
9. replace `manifest.json` last.

Any income-source failure aborts the complete candidate and preserves the previous manifest-addressed snapshot. If a previous snapshot exists, it is marked stale using the existing recovery path; a partial or income-less new snapshot is never published as success. Historical v1 manifests and retained snapshots that predate `outcomeIndicators` remain schema-loadable as last-known-good foundation data; the comparison client treats the missing optional resource as explicitly unavailable. On a first build without a last-known-good outcome artifact, the comparison page states that the official comparison data is unavailable and never substitutes another source.

## 8. Comparison rules

The user first selects one training level, then one to three official cycle/group labels from that level. All displayed values share one cohort and one post-graduation year. Unobserved years are disabled; the UI does not silently choose a different cohort or year.

Two evidence cards remain visually and semantically separate:

1. **Ingresos observados del ciclo o grupo en España** — one row per selected official group.
2. **Referencia de titulados de Grado Medio/Grado Superior en Castilla y León** — the same cohort and year, `AMBOS SEXOS`, at training-level scope.

The exact visible sentence below the cards is:

> Mostramos ambas referencias por separado porque no existe una estadística oficial de ingresos por ciclo formativo en Castilla y León.

Permanent scope labels are:

- `Base de cotización anualizada · jornada completa · España`
- `Base de cotización anualizada · jornada completa · Castilla y León · comunidad del centro de titulación`

The page never adds, divides, adjusts, indexes, ranks, or regionalizes one card using the other. It does not offer Basic FP because no equivalent verified cycle/group income table is in the four-source allowlist.

## 9. Interface and content

The route is `/comparar`. The section title is **Ingresos observados**, not **Empleo e ingresos**, because employment indicators are out of scope.

The default representation is a semantic table with concise labels. CSS may add a non-essential visual scale only when it uses the same values and remains understandable without color. No chart library is added for this release unless a later accessibility test demonstrates a material comprehension benefit that a table and CSS cannot provide.

Public copy must:

- say `base de cotización anualizada`, not `salario esperado`, `ganarás`, or unqualified `salario`;
- show the exact official group label;
- label provisional cohorts visibly;
- render `..` as `No disponible o sin representatividad suficiente`;
- render an out-of-window period as `Año todavía no observado`;
- explain the regional center-of-graduation meaning next to the regional card;
- link to methodology and each official catalog/download source without referring to any third-party comparison product.

## 10. Methodology, licensing, privacy, and accessibility

The public methodology names the administrative education/Social Security linkage, covered employee/full-time population, annualization, cohort, post-graduation year, quintile boundary meaning, exclusions stated by the Ministry, aggregation of some cycles, the `..` ambiguity, provisional windows, and geographic meaning.

`DATA_LICENSE.md` attributes the Ministry, links the four catalog entries and the Ministry terms, records transformation and retrieval dates, and explicitly says the MIT license does not apply to source data. It makes no CC BY claim for EDUCAbase.

No account, cookie, analytics, local storage, session storage, fingerprint, or server profile is introduced. Public group/cohort/year selection may remain in React memory or a non-personal shareable route; no requirement answer is joined to it or transmitted.

The page must work at 360 px, 200% zoom, keyboard-only navigation, and screen-reader reading order. Suppressed and provisional states use text, not color alone. All runtime dependencies must remain open source and pass the existing license gate.

## 11. Acceptance gates

The amendment is complete only when all of the following are true:

- exactly four table IDs and eight download URLs are accepted;
- all eight fixture hashes match the approved evidence capture;
- CSV/PX structural and official-display equality is tested adversarially, including half-up boundaries, extra PX precision, and display mismatches;
- the source cell counts are exactly 8,160, 14,880, 13,680, and 13,680;
- national output contains exactly 34 intermediate and 62 higher official groups;
- regional output contains only `Castilla y León` and `AMBOS SEXOS` rows;
- `..`, provisional status, and not-yet-observed periods remain distinct;
- no employment/affiliation measure, percentage unit, expected salary, or synthetic regional cycle value exists in schemas, generated data, copy, or tests;
- the manifest records all raw hashes and addresses the normalized immutable artifact;
- an upstream, encoding, schema, count, note, or cross-format failure retains the last-known-good manifest;
- both evidence cards, their exact limitation sentence, source links, and stale/unavailable states pass unit and browser tests;
- lint, formatting, unit tests, build, license check, full Playwright, production-container smoke test, and public deployment verification pass.
