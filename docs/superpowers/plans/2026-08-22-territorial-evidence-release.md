# Territorial Evidence Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SALIDA CyL clearer and more useful by correcting evidence scopes, replacing the map-like center plot with an accessible territorial distribution, and expanding occupation-specific SEPE evidence through the official canonical resolver.

**Architecture:** Preserve the existing React/Vite application and immutable generated-resource pipeline. Presentation remains evidence-first: semantic lists and tables are the source of truth, small visual summaries are optional, and no new chart or map dependency is introduced. The SEPE capture resolves official URLs by CNO and period before parsing the existing validated record format.

**Tech Stack:** React 19, TypeScript, Vite, Zod, Vitest, Testing Library, Playwright, static versioned JSON snapshots.

**Spec:** `docs/superpowers/specs/2026-08-22-territorial-evidence-and-clarity-design.md`

## Global Constraints

- Core meaning must remain available without colour, hover, animation, or a pointer.
- Every visible metric must expose or link to its definition, unit, period, territory, classification, source, missing-data state, and primary limitation.
- Contracts are registered contracts, not people, vacancies, or occupation-specific demand unless the source is explicitly CNO-scoped.
- Contribution base, gross salary, and employer labour cost are different measures; use `Base de cotización observada de titulados` and `No es salario personal ni una predicción`.
- An absent source record is unknown, never zero.
- No synthetic employability score, prediction, program ranking, CNO-to-CNAE inference, chart library, remote map, or third-party tiles.
- Minimum mobile target is 40 CSS pixels; no overflow at 320, 360, or 390 CSS pixels; keyboard and 200% zoom remain usable.
- Loading, error, stale, suppressed, missing, and zero remain distinct states.
- Implementation uses TDD: each changed behaviour is observed failing before production code is written.
- Run every shell command through `rtk` and preserve unrelated worktree changes.
- Do not submit the official contest form, invent adoption evidence, or add personal identity or participant data.

---

### Task 1: Clarify evidence scopes and reduce repeated content

**Files:**

- Create: `src/components/ResultSectionNav.tsx`
- Create: `src/components/ResultSectionNav.test.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/features/home/HomePage.tsx`
- Modify: `src/features/home/HomePage.test.tsx`
- Modify: `tests/fixtures/generatedManifest.ts`
- Modify: `src/features/training-first/TrainingOutcomeEvidence.tsx`
- Modify: `src/features/training-first/TrainingResultsPage.tsx`
- Modify: `src/features/training-first/TrainingResultsPage.test.tsx`
- Modify: `src/features/occupation-first/OccupationResultsPage.tsx`
- Modify: `src/features/occupation-first/OccupationResultsPage.test.tsx`
- Modify: `src/features/occupation-first/TrainingRouteCard.tsx`
- Modify: `tests/e2e/home.spec.ts`
- Modify: `tests/e2e/training-first.spec.ts`
- Modify: `tests/e2e/contest-readiness.spec.ts`

**Interfaces:**

- Produces:

  ```ts
  export interface ResultSectionNavLink {
    href: string;
    label: string;
  }

  export interface ResultSectionNavProps {
    links: readonly ResultSectionNavLink[];
    ariaLabel?: string;
  }

  export function ResultSectionNav(
    props: ResultSectionNavProps,
  ): JSX.Element | null;
  ```

- `ResultSectionNav` renders only when at least two links exist, defaults to `aria-label="Secciones del resultado"`, and uses normal fragment links without JavaScript state.
- `TrainingRouteCard` removes `snapshotDate`; shared offering freshness is rendered once by `OccupationResultsPage`.

- [ ] **Step 1: Add the failing navigation-component tests**

  Add tests that render links `#resumen` and `#centros`, assert the accessible navigation name and exact `href` values, and assert that zero or one link returns no navigation.

- [ ] **Step 2: Run the navigation tests and observe RED**

  Run:

  ```bash
  rtk npm test -- src/components/ResultSectionNav.test.tsx
  ```

  Expected: FAIL because `ResultSectionNav.tsx` does not exist.

- [ ] **Step 3: Implement the minimal navigation component and responsive CSS**

  Render a `<nav>` containing an unordered list of fragment links. Add `.result-section-nav` rules with `display:flex`, `flex-wrap:wrap`, `min-width:0`, `overflow-wrap:anywhere`, and links with `min-height:2.5rem` and visible focus. Do not add sticky behaviour or animation.

- [ ] **Step 4: Verify the component GREEN**

  Run the Step 2 command and expect PASS.

- [ ] **Step 5: Add failing Home freshness and coverage tests**

  Update the manifest fixture with a `mappingCoverage` snapshot. Assert:

  ```ts
  expect(
    screen.getByRole("region", { name: "Fecha de relaciones revisadas" }),
  ).toHaveTextContent("Relaciones revisadas: copia del 31/07/2026");
  expect(screen.queryByText("Actualizado: 31/07/2026")).not.toBeInTheDocument();
  expect(
    screen.getByText(
      "Ejemplos de ciclos con relaciones revisadas; no es el catálogo completo.",
    ),
  ).toBeVisible();
  ```

- [ ] **Step 6: Run the Home test and observe RED**

  ```bash
  rtk npm test -- src/features/home/HomePage.test.tsx
  ```

  Expected: FAIL because Home still labels the job-offer timestamp as a global update and does not label the three programs as examples.

- [ ] **Step 7: Implement Home resource-specific freshness**

  Read the date from `manifest.resourceSnapshots.mappingCoverage`, store `sourceLabel`, `date`, `dateTime`, and `stale` in the ready freshness state, render `Relaciones revisadas: copia del …`, and add the exact examples disclosure. Keep the existing full-coverage methodology link.

- [ ] **Step 8: Verify Home GREEN**

  Run the Step 6 command and expect PASS.

- [ ] **Step 9: Add failing training-result semantic tests**

  Replace assertions for `Ingresos observados tras titularse` and add assertions for:

  ```ts
  expect(
    await screen.findByRole("heading", {
      name: "Base de cotización observada de titulados",
    }),
  ).toBeVisible();
  expect(
    screen.getByText("No es salario personal ni una predicción."),
  ).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "Contexto provincial" }),
  ).toBeVisible();
  expect(
    screen.getByText(/Contexto provincial — no específico de esta ocupación/u),
  ).toBeVisible();
  expect(
    screen.getByRole("navigation", { name: "Secciones del resultado" }),
  ).toBeVisible();
  ```

- [ ] **Step 10: Run the training-result tests and observe RED**

  ```bash
  rtk npm test -- src/features/training-first/TrainingResultsPage.test.tsx
  ```

  Expected: FAIL on the old income and provincial-context labels and missing section navigation.

- [ ] **Step 11: Implement the training-result labels and section navigation**

  Use the approved contribution-base title in all states. Render `Empleo por cuenta ajena a jornada completa. No es salario personal ni una predicción.` Add stable IDs `base-cotizacion-observada`, `donde-estudiar`, `contexto-provincial`, `distribucion-centros`, `salidas-profesionales`, `ocupaciones-revisadas`, and `ofertas-relacionadas`, and pass only existing sections to `ResultSectionNav`. Label general contracts `Contexto provincial`, `Contratos registrados`, and `Contexto provincial — no específico de esta ocupación. Reúne contratos registrados de todas las ocupaciones.`

- [ ] **Step 12: Verify training-result GREEN**

  Run the Step 10 command and expect PASS.

- [ ] **Step 13: Add failing occupation-result deduplication tests**

  Assert a single section-level `Oferta FP JCyL: copia del …`, one explanation per relationship type, no `Datos formativos consultados …` inside any route card, and navigation links to `#mercado-laboral` and `#rutas-formativas`.

- [ ] **Step 14: Run occupation-result tests and observe RED**

  ```bash
  rtk npm test -- src/features/occupation-first/OccupationResultsPage.test.tsx
  ```

  Expected: FAIL because the date and relationship explanations are repeated inside cards and the navigation is absent.

- [ ] **Step 15: Implement occupation-result progressive disclosure**

  Add the two stable section IDs and `ResultSectionNav`. Render the shared offering date once above the routes. Render one guide for each relationship type present. Remove `snapshotDate` and its repeated paragraph from `TrainingRouteCard`; preserve each link's exact citation, evidence disclosure, source, and review date.

- [ ] **Step 16: Verify occupation-result GREEN**

  Run the Step 14 command and expect PASS.

- [ ] **Step 17: Update focused E2E assertions**

  Cover resource-specific Home freshness, keyboard navigation through section links, approved contribution-base wording, province-wide limitation, and the single route-section date. At widths 320, 360, and 390, assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`.

- [ ] **Step 18: Run Task 1 validation**

  ```bash
  rtk npm test -- src/components/ResultSectionNav.test.tsx src/features/home/HomePage.test.tsx src/features/training-first/TrainingResultsPage.test.tsx src/features/occupation-first/OccupationResultsPage.test.tsx
  rtk npm run typecheck
  rtk npm run lint
  rtk npm run format:check
  rtk npm run test:e2e:chromium -- tests/e2e/home.spec.ts tests/e2e/training-first.spec.ts tests/e2e/contest-readiness.spec.ts
  ```

- [ ] **Step 19: Commit Task 1**

  ```bash
  rtk git add src/components/ResultSectionNav.tsx src/components/ResultSectionNav.test.tsx src/styles/global.css src/features/home/HomePage.tsx src/features/home/HomePage.test.tsx tests/fixtures/generatedManifest.ts src/features/training-first/TrainingOutcomeEvidence.tsx src/features/training-first/TrainingResultsPage.tsx src/features/training-first/TrainingResultsPage.test.tsx src/features/occupation-first/OccupationResultsPage.tsx src/features/occupation-first/OccupationResultsPage.test.tsx src/features/occupation-first/TrainingRouteCard.tsx tests/e2e/home.spec.ts tests/e2e/training-first.spec.ts tests/e2e/contest-readiness.spec.ts
  rtk git commit -m "feat: clarify evidence scopes across decision pages"
  ```

---

### Task 2: Replace the map-like center plot with an accessible distribution

**Files:**

- Create: `src/features/training-first/territorialDistributionModel.ts`
- Create: `src/features/training-first/territorialDistributionModel.test.ts`
- Modify: `src/features/training-first/TerritorialDistribution.tsx`
- Modify: `src/features/training-first/TerritorialDistribution.test.tsx`
- Modify: `src/features/training-first/TrainingResultsPage.tsx`
- Modify: `src/features/training-first/result-evidence.css`
- Modify: `src/features/methodology/MethodologyPage.tsx`
- Modify: `src/features/methodology/MethodologyPage.test.tsx`
- Modify: `tests/e2e/training-first.spec.ts`
- Modify: `docs/contest/jury-memo.md`

**Interfaces:**

- Produces:

  ```ts
  export interface TerritorialCenterRecord {
    centerCode: string;
    centerName: string;
    locality: string;
    province: string;
    latitude: number | null;
    longitude: number | null;
  }

  export interface TerritorialLocalityGroup {
    locality: string;
    centers: TerritorialCenterRecord[];
    centerCount: number;
  }

  export interface TerritorialProvinceGroup {
    province: string;
    localities: TerritorialLocalityGroup[];
    centerCount: number;
    centersWithCoordinates: number;
    centersWithoutCoordinates: number;
  }

  export interface TerritorialDistributionModel {
    totalCenters: number;
    centersWithCoordinates: number;
    centersWithoutCoordinates: number;
    provinces: TerritorialProvinceGroup[];
  }

  export function buildTerritorialDistributionModel(
    centers: readonly TerritorialCenterRecord[],
  ): TerritorialDistributionModel;

  export function mergeTerritorialCenterCoordinates(
    centers: readonly Omit<TerritorialCenterRecord, "latitude" | "longitude">[],
    directory: readonly {
      centerCode: string;
      latitude: number | null;
      longitude: number | null;
    }[],
  ): TerritorialCenterRecord[];
  ```

- `TerritorialDistribution` receives all centers, source URL, academic year, source update date, and snapshot fetch date. It does not receive prefiltered points.

- [ ] **Step 1: Add failing pure-model tests**

  Test Spanish ordering by province/locality/center, total counts, complete versus incomplete coordinates, and preservation of a center without a matching directory record.

- [ ] **Step 2: Run model tests and observe RED**

  ```bash
  rtk npm test -- src/features/training-first/territorialDistributionModel.test.ts
  ```

  Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the pure territorial model**

  Use `localeCompare(value, "es")`, preserve every center, represent absent coordinates as `null`, and count by unique center records rather than modalities. Do not clamp or infer coordinates.

- [ ] **Step 4: Verify model GREEN**

  Run the Step 2 command and expect PASS.

- [ ] **Step 5: Replace component tests with the accessible contract and observe RED**

  Assert a region named `Distribución de centros`, a table captioned `Centros por provincia`, grouped province/locality lists, a visible missing-coordinate count, course/source dates, official source link, no `svg`, and an empty state `No hay centros publicados para este ciclo en la copia actual.`

  ```bash
  rtk npm test -- src/features/training-first/TerritorialDistribution.test.tsx
  ```

  Expected: FAIL because the component still accepts `points` and renders an SVG.

- [ ] **Step 6: Implement the accessible distribution**

  Render the semantic province table and grouped center lists as primary content. Add a closed `<details>` named `Ver coordenadas oficiales publicadas` containing only complete official coordinates and the warning `Información técnica complementaria. No es un mapa y no calcula distancias, rutas ni tiempos de desplazamiento.` Remove the SVG and every map-like claim.

- [ ] **Step 7: Preserve all training centers in `TrainingResultsPage`**

  Replace the coordinate-filtering `flatMap` with `mergeTerritorialCenterCoordinates`. Pass `sourceUpdatedAt` and `snapshotFetchedAt` separately. Do not drop centers lacking a directory match.

- [ ] **Step 8: Replace plot CSS and update methodology copy**

  Remove plot/rect/path/circle rules. Add responsive table/list/detail classes with `width:100%`, `min-width:0`, `overflow-wrap:anywhere`, and no fixed plot height. Change methodology wording to `Centros agrupados por provincia y localidad; coordenadas técnicas opcionales` and update the jury memo to describe verified counts/lists rather than a map.

- [ ] **Step 9: Verify unit and methodology tests GREEN**

  ```bash
  rtk npm test -- src/features/training-first/territorialDistributionModel.test.ts src/features/training-first/TerritorialDistribution.test.tsx src/features/training-first/TrainingResultsPage.test.tsx src/features/methodology/MethodologyPage.test.tsx
  ```

- [ ] **Step 10: Update and run territorial E2E**

  Replace image assertions with the named region/table/source link, assert `svg` count zero, open the coordinate details with keyboard, assert the warning, run Axe, and verify no horizontal overflow in the mobile project.

  ```bash
  rtk npm run test:e2e:chromium -- tests/e2e/training-first.spec.ts
  ```

- [ ] **Step 11: Run Task 2 validation**

  ```bash
  rtk npm run typecheck
  rtk npm run lint
  rtk npm run format:check
  rtk npm run build
  rtk npm run qa:assets:check
  rtk npm run qa:distribution:check
  ```

- [ ] **Step 12: Commit Task 2**

  ```bash
  rtk git add src/features/training-first/territorialDistributionModel.ts src/features/training-first/territorialDistributionModel.test.ts src/features/training-first/TerritorialDistribution.tsx src/features/training-first/TerritorialDistribution.test.tsx src/features/training-first/TrainingResultsPage.tsx src/features/training-first/result-evidence.css src/features/methodology/MethodologyPage.tsx src/features/methodology/MethodologyPage.test.tsx tests/e2e/training-first.spec.ts docs/contest/jury-memo.md
  rtk git commit -m "feat: replace territorial plot with accessible center distribution"
  ```

---

### Task 3: Resolve and capture canonical SEPE occupation records

**Files:**

- Create: `scripts/data/resolveSepeOccupationMarketUrl.ts`
- Create: `scripts/data/resolveSepeOccupationMarketUrl.test.ts`
- Create: `scripts/data/buildSepeOccupationCatalogue.ts`
- Create: `scripts/data/buildSepeOccupationCatalogue.test.ts`
- Modify: `scripts/data/captureSepeOccupationMarket.ts`
- Modify: `scripts/data/captureSepeOccupationMarket.test.ts`
- Modify: `scripts/data/parseSepeOccupationMarket.ts`
- Modify: `scripts/data/parseSepeOccupationMarket.test.ts`
- Modify: `data/schemas/sepeOccupationMarket.ts`
- Modify: `data/schemas/sepeOccupationMarket.test.ts`
- Modify: `data/curated/sepe-occupation-market.json`
- Create: `data/curated/sepe-occupation-catalogue.json`
- Modify: `scripts/data/buildSnapshots.test.ts`
- Modify: `src/data/generatedDataClient.ts`
- Modify: `src/data/generatedDataClient.test.ts`
- Modify: `src/features/occupation-first/OccupationMarketEvidence.tsx`
- Modify: `src/features/occupation-first/OccupationMarketEvidence.test.tsx`
- Modify: `src/features/occupation-first/OccupationResultsPage.test.tsx`
- Modify: `docs/methodology/sepe-occupation-market.md`
- Modify: `docs/contest/source-ledger.md`
- Modify: `docs/contest/jury-memo.md`

**Interfaces:**

- Produces:

  ```ts
  export type SepeOccupationMarketResolution =
    | { status: "published"; sourceUrl: string }
    | { status: "not-published"; reason: "no-document" };

  export async function resolveSepeOccupationMarketPage(
    request: { cnoCode: string; period: string },
    options: {
      endpoint: string;
      fetchPage?: (input: string, init: RequestInit) => Promise<Response>;
    },
  ): Promise<SepeOccupationMarketResolution>;

  export function buildSepeOccupationCatalogue(
    links: readonly TrainingOccupationLink[],
    occupations: readonly Occupation[],
  ): SepeOccupationMarketCatalogueRecord[];
  ```

- The resolver POSTs form fields `list-mode=detail`, `ocupacion-id=<four digits>`, `year-busc=<YYYY>`, and `month-busc=<month without padding>` to `https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/main/04/content/resultados`.
- It accepts only HTTPS links on `www.sepe.es`, resolves relative links against the official origin, and returns `not-published` only when the response explicitly reports that no document exists. An empty/shell HTTP 200 is an error, not an absence.
- Capture concurrency is at most four. An explicit `not-published` result is recorded as an honest missing record and does not become a zero-valued record. HTTP 429, 5xx, network failure, malformed HTML, or CNO/period mismatch abort the candidate output atomically.

- [ ] **Step 1: Add failing resolver tests**

  Provide local HTML fixtures in the test for CNO `2252` with the official accent-mangled slug and CNO `2721` with `Dise-adores`. Assert exact form body fields, accepted official resolved URLs, relative URL resolution, explicit `not-published` only for a recognised zero-document response, rejection of a non-SEPE or mismatched-CNO link, and failure for an unrecognised empty HTTP 200 response.

- [ ] **Step 2: Run resolver tests and observe RED**

  ```bash
  rtk npm test -- scripts/data/resolveSepeOccupationMarketUrl.test.ts
  ```

  Expected: FAIL because the resolver module does not exist.

- [ ] **Step 3: Implement the minimal canonical resolver**

  Validate CNO with `/^\d{4}$/`, split `YYYY-MM`, send `URLSearchParams` with the four official fields and `Content-Type: application/x-www-form-urlencoded`, require HTTP success, parse only the returned anchor whose detail URL encodes the requested period and CNO, and return `not-published` only for the explicit zero-document state. Do not derive a slug from the occupation label.

- [ ] **Step 4: Verify resolver GREEN**

  Run the Step 2 command and expect PASS.

- [ ] **Step 5: Add failing capture and parser integrity tests**

  In capture tests, inject the resolver/fetch implementation, assert canonical URL use, maximum concurrency four, one retained missing CNO without fabricated record, deterministic CNO ordering, and complete failure when the fetched page CNO or period mismatches. In parser tests, retain the existing explicit expected-CNO check and add an expected-period mismatch assertion at the capture boundary.

- [ ] **Step 6: Run capture/parser tests and observe RED**

  ```bash
  rtk npm test -- scripts/data/captureSepeOccupationMarket.test.ts scripts/data/parseSepeOccupationMarket.test.ts
  ```

  Expected: FAIL because capture still derives URLs and requires all catalogue codes to return a record.

- [ ] **Step 7: Integrate the resolver and bounded concurrency**

  Resolve each catalogue entry before fetch, use at most four workers, verify the parsed heading CNO and parsed period, sort output by CNO, and keep resolver misses separate from hard HTTP/parser failures. Preserve fail-closed behaviour for malformed pages, mismatches, and nonofficial URLs. Remove the label-to-slug URL builder except for an explicitly tested backwards-compatible single-record fallback if an existing fixture requires it.

- [ ] **Step 8: Build the approved linked-CNO catalogue**

  Test first that `buildSepeOccupationCatalogue` uses only approved relationships, joins every CNO to an official occupation label, fails on a missing label, deduplicates codes, and sorts by code. Generate the checked-in catalogue from current curated relationships; the current expected count is 116 and must come from the build result rather than a hand-written constant.

- [ ] **Step 9: Add resource-level coverage metadata**

  Replace the checked-in array with a strict versioned envelope while preserving a read adapter for historical array snapshots:

  ```ts
  {
    schemaVersion: "1.1.0";
    period: string;
    records: SepeOccupationMarket[];
    coverage: {
      requestedCnoCodes: string[];
      publishedCnoCodes: string[];
      notPublishedCnoCodes: string[];
      resolverEndpoint: string;
      capturedAt: string;
    };
  }
  ```

  Require unique sorted code lists; exact union of published and not-published codes equals requested codes; no overlap; every record is in `publishedCnoCodes`; every record period equals the envelope period; and `records.length === publishedCnoCodes.length`. Add `loadSepeOccupationMarketResource()` returning records plus coverage and keep the current records-only loader as a compatibility adapter.

- [ ] **Step 10: Surface honest coverage in the occupation UI**

  In ready and not-found states, show the resource period and `Datos SEPE disponibles para X de Y grupos CNO consultados.` A not-found state links the official SEPE source and says `Sin evidencia SEPE publicada para este CNO en el periodo consultado; no equivale a cero.` Keep the existing descriptions of contracts and registered unemployment.

- [ ] **Step 11: Verify schema, catalogue, capture, snapshot, and UI GREEN**

  ```bash
  rtk npm test -- data/schemas/sepeOccupationMarket.test.ts scripts/data/resolveSepeOccupationMarketUrl.test.ts scripts/data/buildSepeOccupationCatalogue.test.ts scripts/data/captureSepeOccupationMarket.test.ts scripts/data/parseSepeOccupationMarket.test.ts scripts/data/buildSnapshots.test.ts src/data/generatedDataClient.test.ts src/features/occupation-first/OccupationMarketEvidence.test.tsx src/features/occupation-first/OccupationResultsPage.test.tsx
  ```

- [ ] **Step 12: Run two bounded live probes**

  Resolve and parse only CNO `2252` and `2721` for `2026-07`, with serial requests and no repository write. Verify each returned page heading and period before the full capture.

- [ ] **Step 13: Capture the linked CNO catalogue and build a new immutable snapshot**

  Generate a temporary catalogue from the unique approved occupation IDs in `data/curated/training-occupation-links.json`, mapped to labels in `data/curated/occupations.json`. Run the canonical capture for `2026-07`, write the validated curated resource, and run `rtk npm run data:build`. Do not hand-edit counts or source URLs.

- [ ] **Step 14: Update methodology and contest documentation**

  Document the official POST resolver, requested period, coverage counts, missing semantics, administrative-record definitions, rate limit, source attribution, and no-prediction boundary. Update the jury memo only with counts produced by the validated capture.

- [ ] **Step 15: Run Task 3 validation**

  ```bash
  rtk npm run typecheck
  rtk npm run lint
  rtk npm run format:check
  rtk npm run build
  rtk npm run qa:assets:check
  rtk npm run qa:distribution:check
  rtk npm run contest:submission:check
  rtk npm run test:e2e:chromium -- tests/e2e/occupation-first.spec.ts
  ```

- [ ] **Step 16: Commit Task 3**

  ```bash
  rtk git add scripts/data/resolveSepeOccupationMarketUrl.ts scripts/data/resolveSepeOccupationMarketUrl.test.ts scripts/data/buildSepeOccupationCatalogue.ts scripts/data/buildSepeOccupationCatalogue.test.ts scripts/data/captureSepeOccupationMarket.ts scripts/data/captureSepeOccupationMarket.test.ts scripts/data/parseSepeOccupationMarket.ts scripts/data/parseSepeOccupationMarket.test.ts data/schemas/sepeOccupationMarket.ts data/schemas/sepeOccupationMarket.test.ts data/curated/sepe-occupation-market.json data/curated/sepe-occupation-catalogue.json scripts/data/buildSnapshots.test.ts src/data/generatedDataClient.ts src/data/generatedDataClient.test.ts src/features/occupation-first/OccupationMarketEvidence.tsx src/features/occupation-first/OccupationMarketEvidence.test.tsx src/features/occupation-first/OccupationResultsPage.test.tsx docs/methodology/sepe-occupation-market.md docs/contest/source-ledger.md docs/contest/jury-memo.md public/data/v1
  rtk git commit -m "feat: expand canonical SEPE occupation evidence"
  ```

---

### Task 4: Full release verification, documentation, and publication

**Files:**

- Modify only when generated checks require it: `docs/contest/application-summary.md`
- Modify only when generated checks require it: `docs/contest/technical-evidence.md`
- Modify only when generated checks require it: `docs/contest/claim-ledger.json`
- Generated by existing scripts: `dist/**`

**Interfaces:**

- Consumes the three reviewed task commits.
- Produces a single verified branch SHA deployed unchanged to `origin/main`, GitHub Pages, and the VPS.

- [ ] **Step 1: Run the complete local gate**

  ```bash
  rtk npm ci
  rtk npm run license:check
  rtk npm run format:check
  rtk npm run lint
  rtk npm run typecheck
  rtk npm test -- --reporter=dot
  rtk npm run build
  rtk npm run contest:submission:check
  rtk npm run test:e2e:chromium
  ```

  Expected: every command exits 0; no test failure, TypeScript error, lint error, format difference, asset-budget breach, distribution-budget breach, or submission-claim mismatch.

- [ ] **Step 2: Perform visual verification**

  Capture current-branch Home, a training result, an occupation with SEPE data, an occupation without SEPE data, and the center distribution at desktop and 390-pixel mobile width. Compare against the pre-change audit for hierarchy, overflow, repeated copy, misleading labels, broken focus, and missing source dates.

- [ ] **Step 3: Run final whole-branch review and fix one reviewed wave**

  Review the complete diff from `085faca66dee67b9f2ca56aed11d32e0522eeb97`. Any Critical or Important finding receives one consolidated fix dispatch, the covering tests, and one scoped re-review.

- [ ] **Step 4: Synchronize GitHub**

  Fast-forward or merge the reviewed branch into local `main` without rewriting history, push `main`, and verify the GitHub ref equals the reviewed SHA. Do not force-push.

- [ ] **Step 5: Verify GitHub Actions and Pages**

  Wait for the `Deploy GitHub Pages` workflow for the reviewed SHA to finish successfully. Verify `https://huntsman1756.github.io/concursos_cyl/version.json` reports that exact SHA and smoke-test the root, a training deep link, an occupation deep link, the manifest, and its active resources.

- [ ] **Step 6: Deploy and verify VPS**

  Use the repository's canonical VPS deployment path and SSH alias. Verify `https://salida-cyl.157-90-22-40.sslip.io/version.json` and `/srv/salida-cyl/current/version.json` both report the reviewed SHA. Confirm Caddy is active and the public root/deep links render.

- [ ] **Step 7: Record the release handoff**

  Update session documentation with the final SHA, workflow run, public URLs, exact evidence coverage counts, remaining human-only pilot/identity/form blockers, and explicit statement that the formal contest submission has not been sent.
