# SALIDA CyL Outcomes and Contest Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the official “Comparar estudios” experience, complete methodology/licensing/accessibility work and produce a deployable contest release with a public-data manifest.

**Architecture:** Build-time PC-Axis ingestion converts official EDUCAbase indicators into versioned static contracts. The web application compares only compatible cohorts and scopes, while the release layer serves a static artifact through an open-source container without collecting personal interaction data.

**Tech Stack:** Existing React/Vite stack, Zod, Observable Plot, Vitest, Playwright, axe-core, TypeScript ingestion scripts and Caddy for optional static-container hosting.

## Global Constraints

- Complete the foundation/data and decision-flow plans first.
- Use “base de cotización anualizada” or “ingresos observados”; never present a personal expected salary.
- Never combine national program/program-group values with regional training-level values.
- Every chart has an accessible table using the same values.
- All dependencies must use OSI-approved licenses; code and technical identifiers are English.
- No analytics, cookies or personal-data endpoint.
- Every shell command starts with `rtk`; every task is test-first and ends in a commit.

---

## File structure locked by this plan

```text
scripts/data/pcAxisClient.ts                  official PC-Axis ingestion
scripts/data/educabaseSources.ts              exact table metadata
scripts/data/normalizeOutcomeIndicators.ts    suppression and scope rules
src/domain/outcomes.ts                        comparison compatibility rules
src/features/compare-studies/                 public comparison experience
src/features/methodology/                     visible provenance and limits
src/components/AccessibleIndicatorChart.tsx   chart + table pair
docs/methodology/                              source contracts
scripts/checkLicenses.ts                       dependency-license gate
DATA_LICENSE.md                                data terms and attribution
THIRD_PARTY_NOTICES.md                         package/reference notices
Dockerfile                                     reproducible static container
Caddyfile                                      SPA routing and security headers
```

### Task 1: EDUCAbase PC-Axis source contracts and client

**Files:**
- Create: `scripts/data/educabaseSources.ts`
- Create: `scripts/data/pcAxisClient.ts`
- Create: `tests/fixtures/educabase/table-metadata.json`
- Create: `tests/fixtures/educabase/table-response.json`
- Test: `scripts/data/pcAxisClient.test.ts`

**Interfaces:**
- Consumes: official PC-Axis API metadata and JSON-stat2 responses.
- Produces: `fetchPcAxisTable(source, selection): Promise<PcAxisDataset>`.

- [ ] **Step 1: Write failing metadata and query tests**

```ts
it("builds a bounded PC-Axis query from official dimension codes", () => {
  expect(buildPcAxisQuery(metadata, {
    cohort: ["2021-2022"],
    period: ["Año 4"],
    measure: ["Media"]
  })).toEqual({
    query: expect.arrayContaining([
      expect.objectContaining({ code: "Cohorte", selection: { filter: "item", values: ["2021-2022"] } })
    ]),
    response: { format: "json-stat2" }
  });
});

it("rejects a dimension value absent from official metadata", () => {
  expect(() => buildPcAxisQuery(metadata, { period: ["Año 8"] })).toThrow(/unknown dimension value/i);
});
```

- [ ] **Step 2: Verify the red state**

Run: `rtk npm test -- scripts/data/pcAxisClient.test.ts`  
Expected: FAIL because the client is missing.

- [ ] **Step 3: Define exact official tables**

```ts
export const EDUCABASE_SOURCES = {
  intermediateProgramEmployment: {
    id: "educabase-fp-intermediate-program-employment",
    apiUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/famprof/l0/famprof_2_02.px",
    scope: "spain_program_group"
  },
  higherProgramEmployment: {
    id: "educabase-fp-higher-program-employment",
    apiUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/famprof/l0/famprof_3_02.px",
    scope: "spain_program_group"
  },
  intermediateRegionalFamilyEmployment: {
    id: "educabase-fp-intermediate-regional-family-employment",
    apiUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/ccaa/l0/ccaa_2_12.px",
    scope: "castilla_leon_professional_family"
  },
  higherRegionalFamilyEmployment: {
    id: "educabase-fp-higher-regional-family-employment",
    apiUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/ccaa/l0/ccaa_3_12.px",
    scope: "castilla_leon_professional_family"
  },
  intermediateProgramIncome: {
    id: "educabase-fp-intermediate-program-income",
    apiUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/famprof/l0/famprof_2_08.px",
    scope: "spain_program_group"
  },
  higherProgramIncome: {
    id: "educabase-fp-higher-program-income",
    apiUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/famprof/l0/famprof_3_08.px",
    scope: "spain_program_group"
  },
  intermediateRegionalIncome: {
    id: "educabase-fp-intermediate-regional-income",
    apiUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/ccaa/l0/ccaa_2_07.px",
    scope: "castilla_leon_training_level"
  },
  higherRegionalIncome: {
    id: "educabase-fp-higher-regional-income",
    apiUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/ccaa/l0/ccaa_3_07.px",
    scope: "castilla_leon_training_level"
  }
} as const;
```

- [ ] **Step 4: Implement safe PC-Axis fetching**

Fetch metadata with GET, validate requested dimension codes/values, then POST a bounded query. Reject a response whose dimensions differ from metadata or whose cell count exceeds 100,000. Reuse the retry policy from `fetchJson` for 429/5xx responses.

- [ ] **Step 5: Verify fixtures and live metadata**

Run:

```powershell
rtk npm test -- scripts/data/pcAxisClient.test.ts
rtk npm run data:build
```

Expected: fixture tests pass; live metadata resolves for all eight official table URLs. If an official dimension label changes, the build fails with the source ID and changed code instead of publishing mislabelled data.

- [ ] **Step 6: Commit the PC-Axis client**

```powershell
rtk git add scripts/data/educabaseSources.ts scripts/data/pcAxisClient* tests/fixtures/educabase
rtk git commit -m "feat: ingest official Educabase outcome tables"
```

### Task 2: Outcome normalization and compatibility rules

**Files:**
- Create: `src/domain/outcomes.ts`
- Create: `scripts/data/normalizeOutcomeIndicators.ts`
- Create: `data/curated/program-outcome-groups.json`
- Modify: `data/schemas/generated.ts`
- Modify: `scripts/data/buildSnapshots.ts`
- Test: `scripts/data/normalizeOutcomeIndicators.test.ts`
- Test: `src/domain/outcomes.test.ts`

**Interfaces:**
- Consumes: PC-Axis datasets and official program keys.
- Produces: `OutcomeIndicator[]`, `getCompatibleComparison(indicators, selection)` and program-group labels.

- [ ] **Step 1: Write failing suppression and compatibility tests**

```ts
it("preserves suppressed official values instead of coercing them to zero", () => {
  expect(normalizeCell("..", context)).toEqual({
    value: null,
    suppressionState: "not_published"
  });
});

it("rejects comparison across different cohorts", () => {
  expect(() => getCompatibleComparison(indicators, {
    programKeys: ["ADG01M", "IFC03S"],
    cohortByProgram: { ADG01M: "2020-2021", IFC03S: "2021-2022" },
    postGraduationYear: 4
  })).toThrow(/same cohort/i);
});
```

- [ ] **Step 2: Verify red tests**

Run: `rtk npm test -- scripts/data/normalizeOutcomeIndicators.test.ts src/domain/outcomes.test.ts`  
Expected: FAIL because normalization and comparison rules are absent.

- [ ] **Step 3: Implement the outcome contract**

```ts
export interface OutcomeIndicator {
  indicatorId: string;
  trainingProgramKey: string | null;
  officialProgramGroupLabel: string | null;
  trainingLevel: "basic" | "intermediate" | "higher";
  scope: "spain_program_group" | "castilla_leon_professional_family" | "castilla_leon_training_level";
  cohort: string;
  postGraduationYear: 1 | 2 | 3 | 4;
  measure: "affiliation_rate" | "mean" | "quintile_1" | "quintile_2" | "quintile_3" | "quintile_4";
  value: number | null;
  unit: "eur_annualized_contribution_base" | "percent";
  suppressionState: "published" | "not_published" | "not_applicable" | "provisional";
  sourceId: string;
}
```

- [ ] **Step 4: Preserve official group labels**

`program-outcome-groups.json` maps a program key only to the exact label published by EDUCAbase. The UI always renders that label. A group value is never relabelled as an individual program value.

- [ ] **Step 5: Enforce comparison rules**

Only values with the same cohort, post-graduation year, measure and unit are compared. National program/program-group values and regional training-level values are returned in separate arrays and the domain module provides no function that adds, averages or divides across scopes.

- [ ] **Step 6: Add generated outcome files and commit**

Write `public/data/v1/outcome-indicators.json` and include its hash/source metadata in the manifest.

Run:

```powershell
rtk npm test -- scripts/data/normalizeOutcomeIndicators.test.ts src/domain/outcomes.test.ts
rtk npm run data:build
rtk git add src/domain/outcomes* scripts/data/normalizeOutcomeIndicators* data/curated/program-outcome-groups.json public/data/v1
rtk git commit -m "feat: normalize scoped vocational outcomes"
```

### Task 3: Accessible “Comparar estudios” experience

**Files:**
- Create: `src/features/compare-studies/CompareStudiesPage.tsx`
- Create: `src/features/compare-studies/StudyComparisonForm.tsx`
- Create: `src/features/compare-studies/EmploymentIndicators.tsx`
- Create: `src/features/compare-studies/IncomeIndicators.tsx`
- Create: `src/components/AccessibleIndicatorChart.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/features/compare-studies/CompareStudiesPage.test.tsx`

**Interfaces:**
- Consumes: program catalog, outcome indicators and comparison rules.
- Produces: `/comparar-estudios` route with compatible selection and separate scope cards.

- [ ] **Step 1: Install the open-source chart dependency and write the failing UI test**

Run: `rtk npm install @observablehq/plot`

```tsx
it("keeps national and regional income references separate", async () => {
  render(<CompareStudiesPage data={fixtureData} />);
  expect(screen.getByRole("heading", { name: /ciclo o grupo en españa/i })).toBeVisible();
  expect(screen.getByRole("heading", { name: /grado superior en castilla y león/i })).toBeVisible();
  expect(screen.getByText(/no existe una estadística oficial de ingresos por ciclo formativo en castilla y león/i)).toBeVisible();
  expect(screen.queryByText(/salario esperado/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Verify red test**

Run: `rtk npm test -- src/features/compare-studies/CompareStudiesPage.test.tsx`  
Expected: FAIL because comparison components are missing.

- [ ] **Step 3: Implement compatible selection**

Allow one to three programs. The form requires a single shared cohort and post-graduation year. Disable unavailable years with `dato aún no observado`; do not silently substitute another cohort.

- [ ] **Step 4: Implement separated employment and income cards**

Employment renders family×CyL and program-group×Spain cards with the approved explanatory sentence. Income renders national program-group and regional training-level cards with the exact permanent labels from the specification.

- [ ] **Step 5: Implement chart-table parity**

`AccessibleIndicatorChart` creates an Observable Plot chart with a concise text summary and an adjacent semantic table using the same input array. Suppressed values render `No publicado`; charts omit their mark without converting them to zero.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
rtk npm test -- src/features/compare-studies/CompareStudiesPage.test.tsx
rtk npm run build
rtk git add package.json package-lock.json src/features/compare-studies src/components/AccessibleIndicatorChart.tsx src/app/routes.tsx
rtk git commit -m "feat: add scoped study and income comparison"
```

### Task 4: Public methodology, provenance and downloadable manifest

**Files:**
- Create: `src/features/methodology/MethodologyPage.tsx`
- Create: `src/features/methodology/SourceMethodCard.tsx`
- Create: `docs/methodology/source-contracts.md`
- Create: `docs/methodology/evidence-rules.md`
- Modify: `src/app/routes.tsx`
- Test: `src/features/methodology/MethodologyPage.test.tsx`

**Interfaces:**
- Consumes: generated manifest and documented domain rules.
- Produces: `/metodologia`, source download links and contest-ready explanations.

- [ ] **Step 1: Write the failing methodology-content test**

```tsx
it("names the source, method and limitation for each public conclusion", () => {
  render(<MethodologyPage manifest={fixtureManifest} />);
  expect(screen.getByText(/oferta de formación profesional/i)).toBeVisible();
  expect(screen.getByText(/ofertas de empleo/i)).toBeVisible();
  expect(screen.getByText(/base de cotización anualizada/i)).toBeVisible();
  expect(screen.getByText(/cawi\/cati/i)).toBeVisible();
  expect(screen.getByRole("link", { name: /descargar manifiesto de datos/i })).toHaveAttribute("href", "/data/v1/manifest.json");
});
```

- [ ] **Step 2: Verify red test**

Run: `rtk npm test -- src/features/methodology/MethodologyPage.test.tsx`  
Expected: FAIL because the methodology feature is absent.

- [ ] **Step 3: Implement concise public methodology**

Use one card per source with `Qué aporta`, `Qué no permite afirmar`, update date and original link. Put full technical details in disclosures. Explicitly distinguish the JCyL CAWI/CATI survey (`n=2,024`) from EDUCAbase administrative linkage.

- [ ] **Step 4: Document source and evidence contracts**

`source-contracts.md` lists upstream IDs, URLs, licenses, refresh behavior and generated files. `evidence-rules.md` lists every evidence state, parser category and action target contract with the exact Spanish UI wording.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
rtk npm test -- src/features/methodology/MethodologyPage.test.tsx
rtk npm run build
rtk git add src/features/methodology src/app/routes.tsx docs/methodology
rtk git commit -m "docs: add public methodology and provenance"
```

### Task 5: License policy and third-party notices

**Files:**
- Create: `LICENSE`
- Create: `DATA_LICENSE.md`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `scripts/checkLicenses.ts`
- Create: `scripts/checkLicenses.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: installed package metadata and research source terms.
- Produces: `npm run licenses:check` and publishable attribution documents.

- [ ] **Step 1: Write the failing license-policy test**

```ts
it("rejects a dependency license outside the allowlist", () => {
  expect(() => assertAllowedLicenses([{ name: "bad-package", license: "BUSL-1.1" }]))
    .toThrow(/bad-package.*BUSL-1.1/i);
});
```

The initial allowlist is `MIT`, `ISC`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `MPL-2.0` and compatible dual expressions composed only of these identifiers.

- [ ] **Step 2: Verify red test**

Run: `rtk npm test -- scripts/checkLicenses.test.ts`  
Expected: FAIL because the policy script is absent.

- [ ] **Step 3: Implement dependency inspection**

Read the locked dependency graph from `node_modules` package metadata, normalize SPDX expressions and fail with package name/version/license for disallowed or missing licenses. Add `"licenses:check": "tsx scripts/checkLicenses.ts"`.

- [ ] **Step 4: Write notices**

Use MIT for project code. `DATA_LICENSE.md` records JCyL CC BY 4.0 attribution, EDUCAbase terms and the license chosen for curated mappings. `THIRD_PARTY_NOTICES.md` lists runtime packages and notes that SBB principles and agent skills are references, not bundled runtime code or branding.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
rtk npm test -- scripts/checkLicenses.test.ts
rtk npm run licenses:check
rtk git add LICENSE DATA_LICENSE.md THIRD_PARTY_NOTICES.md scripts/checkLicenses* package.json
rtk git commit -m "chore: enforce open-source licensing policy"
```

### Task 6: Accessibility, motion and copy quality gate

**Files:**
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/reduced-motion.spec.ts`
- Create: `tests/e2e/responsive.spec.ts`
- Modify: `src/styles/global.css`
- Modify: feature files only where tests expose a failure.

**Interfaces:**
- Consumes: all public routes and approved design rules.
- Produces: automated WCAG-oriented, reduced-motion, zoom and responsive regression coverage.

- [ ] **Step 1: Write route accessibility tests**

Run axe-core on `/`, `/desde-fp`, `/desde-ocupacion`, `/comparar-estudios` and `/metodologia`. Fail on critical or serious violations. Assert a single `h1`, visible keyboard focus and named form controls on every route.

- [ ] **Step 2: Write reduced-motion and hover tests**

Emulate `prefers-reduced-motion: reduce` and assert computed transition duration is `0s` for disclosures and cards. Assert hover-only information is also available through focus or visible text.

- [ ] **Step 3: Write 360 px, 200% zoom and overflow tests**

At 360×800 and browser zoom 200%, assert no page has horizontal scroll beyond one device pixel and primary actions remain visible in DOM order. At 1280 px, equal home entries remain equal width.

- [ ] **Step 4: Apply the design-review checklists**

Use Emil Kowalski principles to remove decorative/repeated animation, UI UX Pro Max only for concrete responsive/accessibility checks and Taste Skill only to review the home presentation. Do not import these skills into runtime code or let them change evidence semantics.

- [ ] **Step 5: Run full browser gate and commit**

```powershell
rtk npx playwright test tests/e2e/accessibility.spec.ts tests/e2e/reduced-motion.spec.ts tests/e2e/responsive.spec.ts
rtk npm test
rtk npm run build
rtk git add tests/e2e src
rtk git commit -m "test: enforce accessible restrained interface"
```

### Task 7: Reproducible static release and final verification

**Files:**
- Create: `Dockerfile`
- Create: `Caddyfile`
- Create: `.dockerignore`
- Create: `docs/deployment.md`
- Create: `tests/e2e/release.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: successful data build and Vite production artifact.
- Produces: `salida-cyl` static container, documented deployment and contest-ready public artifact.

- [ ] **Step 1: Write the failing production-route test**

```ts
test("deep links and static data work in the production server", async ({ page }) => {
  await page.goto("/desde-fp/ADG01M");
  await expect(page.getByRole("heading", { name: /gestión administrativa/i })).toBeVisible();
  const manifest = await page.request.get("/data/v1/manifest.json");
  expect(manifest.ok()).toBe(true);
});
```

- [ ] **Step 2: Create the multi-stage open-source container**

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 8080
```

`Caddyfile` serves `/srv`, uses `try_files {path} /index.html`, listens on `:8080`, compresses responses and sets CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and a restrictive `Permissions-Policy`.

- [ ] **Step 3: Document reproducible refresh and deployment**

`README.md` covers purpose, open-source stack, local commands, data refresh, privacy and source scope. `docs/deployment.md` documents building the static artifact/container, scheduling `npm run data:build`, keeping a last known good snapshot and setting the final public URL without requiring a proprietary runtime.

- [ ] **Step 4: Run final local release verification**

Run:

```powershell
rtk npm ci
rtk npm run licenses:check
rtk npm run data:build
rtk npm run lint
rtk npm test
rtk npm run build
rtk npx playwright test
rtk docker build -t salida-cyl:local .
```

Expected: all commands exit 0 and no generated snapshot contains raw HTML or an unreviewed mapping.

- [ ] **Step 5: Inspect release evidence**

Verify the five contest-critical routes in the user's selected in-app browser at 360 px and 1280 px. Confirm visible source dates, the two separate income scopes, keyboard focus and working original-source links. Save screenshots under `docs/release-evidence/` only after the real UI is rendered; do not use mockup images as verification.

- [ ] **Step 6: Commit the release candidate**

```powershell
rtk git add Dockerfile Caddyfile .dockerignore README.md docs/deployment.md tests/e2e/release.spec.ts docs/release-evidence
rtk git commit -m "feat: prepare contest release artifact"
```
