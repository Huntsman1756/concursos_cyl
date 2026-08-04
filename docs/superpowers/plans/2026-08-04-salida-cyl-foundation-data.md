# SALIDA CyL Foundation and Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a production-ready open-source React application shell and a validated, versioned static-data pipeline for the official Castilla y León vocational-training and ECYL offer datasets.

**Architecture:** A Vite React application consumes generated JSON contracts under `/public/data/v1`. TypeScript ingestion scripts fetch, validate, normalize and sanitize official sources, then atomically replace the last known good snapshots only when quality gates pass.

**Tech Stack:** React, TypeScript, Vite, React Router, Zod, Radix UI, Lucide, MiniSearch, Vitest, Testing Library, Playwright, axe-core, ESLint and Prettier. All dependencies must have OSI-approved licenses.

## Global Constraints

- Source code, identifiers, test names and technical documentation are written in English; public UI copy is Spanish.
- No account, cookies, analytics, fingerprinting or runtime generative AI.
- No SBB UI package, brand asset, font, logo or pictogram may be installed or copied.
- Generated data lives under `/data/v1/` and every resource family exposes source and freshness metadata.
- Upstream HTML is sanitized during ingestion and is never rendered directly.
- Every shell command in this workspace starts with `rtk`.
- Implement with tests first and commit after every task.

---

## File structure locked by this plan

```text
package.json                         scripts and locked dependencies
vite.config.ts                      Vite and Vitest configuration
playwright.config.ts                browser-test configuration
eslint.config.js                    TypeScript/React lint rules
index.html                          SPA entry document
src/main.tsx                        application bootstrap
src/app/App.tsx                     route composition only
src/app/AppShell.tsx                header, navigation and page frame
src/app/routes.tsx                  public route definitions
src/components/                     shared accessible UI primitives
src/styles/tokens.css               semantic design tokens
src/styles/global.css               reset and global foundations
src/domain/sourceSnapshot.ts        generated-manifest domain contract
src/data/generatedDataClient.ts     fetch and validate static resources
src/features/home/HomePage.tsx      approved equal-entry home
scripts/data/sourceConfig.ts        official source URLs and identifiers
scripts/data/fetchJson.ts           retrying HTTP fetch helper
scripts/data/sanitizeOfferHtml.ts   HTML-to-safe-structured-text conversion
scripts/data/normalizeTraining.ts   FP source normalization
scripts/data/normalizeOffers.ts     ECYL source normalization
scripts/data/buildSnapshots.ts      atomic orchestration and manifest output
data/schemas/                       Zod source/output contracts
public/data/v1/                     generated snapshots
tests/fixtures/                     deterministic source fragments
```

### Task 1: Repository, toolchain and executable app shell

**Files:**
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `eslint.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/routes.tsx`
- Create: `src/test/setup.ts`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: none.
- Produces: `App(): JSX.Element`, a working `npm run dev`, `npm run test`, `npm run lint` and `npm run build` contract.

- [ ] **Step 1: Initialize Git and package metadata**

Run:

```powershell
rtk git init -b main
rtk npm init -y
rtk npm install react react-dom react-router-dom zod minisearch @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-tooltip lucide-react
rtk npm install -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier playwright @playwright/test axe-core @axe-core/playwright sanitize-html @types/sanitize-html tsx
```

Merge these scripts into `package.json` without removing the dependency and metadata fields created by npm:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "format:check": "prettier --check .",
    "data:build": "tsx scripts/data/buildSnapshots.ts"
  }
}
```

- [ ] **Step 2: Write the failing application test**

```tsx
// src/app/App.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";

describe("App", () => {
  it("presents both approved entry points", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /he terminado fp/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /quiero trabajar de/i })).toBeVisible();
  });
});
```

- [ ] **Step 3: Run the test and verify the red state**

Run: `rtk npm test -- src/app/App.test.tsx`  
Expected: FAIL because `App` and the test environment do not exist.

- [ ] **Step 4: Implement the smallest routed shell**

```tsx
// src/app/App.tsx
import { AppRoutes } from "./routes";

export function App() {
  return <AppRoutes />;
}
```

```tsx
// src/app/routes.tsx
import { Link, Route, Routes } from "react-router-dom";

function HomePage() {
  return (
    <main>
      <h1>SALIDA CyL</h1>
      <Link to="/desde-fp">He terminado FP</Link>
      <Link to="/desde-ocupacion">Quiero trabajar de…</Link>
    </main>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
```

Configure Vitest with `environment: "jsdom"` and `setupFiles: ["./src/test/setup.ts"]`; import `@testing-library/jest-dom/vitest` in the setup file. `src/main.tsx` wraps `<App />` in `BrowserRouter` and renders it through `createRoot`.

- [ ] **Step 5: Verify toolchain and build**

Run:

```powershell
rtk npm test
rtk npm run lint
rtk npm run build
```

Expected: all commands exit 0 and `dist/index.html` exists.

- [ ] **Step 6: Commit the executable foundation**

```powershell
rtk git add .gitignore .editorconfig package.json package-lock.json tsconfig*.json vite.config.ts eslint.config.js index.html src
rtk git commit -m "chore: initialize Salida CyL web application"
```

### Task 2: Project-owned accessible visual foundation and approved home

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/app/AppShell.tsx`
- Create: `src/components/Icon.tsx`
- Create: `src/components/EntryCard.tsx`
- Create: `src/features/home/HomePage.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/features/home/HomePage.test.tsx`

**Interfaces:**
- Consumes: React Router links from Task 1.
- Produces: `EntryCardProps`, `IconName`, `AppShell` and the approved equal-entry responsive home.

- [ ] **Step 1: Write the behavior and semantics test**

```tsx
it("describes two different outcomes without decorative icon text", () => {
  render(<HomePage />);
  expect(screen.getByText("Título → ofertas → requisitos → acciones")).toBeVisible();
  expect(screen.getByText("Ocupación → ciclos y centros de CyL")).toBeVisible();
  expect(screen.getAllByRole("link")).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ textContent: expect.stringMatching(/He terminado FP/) }),
      expect.objectContaining({ textContent: expect.stringMatching(/Quiero trabajar de/) })
    ])
  );
});
```

- [ ] **Step 2: Verify the test fails**

Run: `rtk npm test -- src/features/home/HomePage.test.tsx`  
Expected: FAIL because `HomePage` is not exported from its feature module.

- [ ] **Step 3: Implement semantic tokens and components**

Define at minimum these tokens in `tokens.css`:

```css
:root {
  --color-surface: #ffffff;
  --color-surface-subtle: #f3f7f5;
  --color-text: #163c32;
  --color-text-muted: #5d716a;
  --color-border: #cad7d1;
  --color-primary: #1d5f4b;
  --color-action: #b94f36;
  --color-warning-surface: #fff6e5;
  --focus-ring: 0 0 0 3px #9ad1be;
  --radius-sm: 0.5rem;
  --radius-md: 0.875rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --motion-fast: 160ms;
}
```

`Icon.tsx` maps a closed `IconName` union to Lucide components and applies `aria-hidden="true"` when a visible label exists. `EntryCard` keeps a text heading, outcome line and text CTA; the icon never replaces the heading.

- [ ] **Step 4: Implement the approved equal-entry home**

`HomePage` renders two equal cards at desktop width and a single column below 48rem. Add three short proof points: `Fuentes visibles`, `Sin nota opaca` and `Datos con fecha`. `AppShell` contains `Inicio`, `Comparar estudios` and `Metodología` links with a visible skip link and focus styles.

- [ ] **Step 5: Verify tests and responsive CSS**

Run:

```powershell
rtk npm test -- src/features/home/HomePage.test.tsx
rtk npm run lint
rtk npm run build
```

Expected: PASS; no text is clipped at a 360 px viewport when inspected later by Playwright.

- [ ] **Step 6: Commit the visual foundation**

```powershell
rtk git add src/app src/components src/features/home src/styles
rtk git commit -m "feat: add accessible equal-entry home"
```

### Task 3: Versioned source and output contracts

**Files:**
- Create: `scripts/data/sourceConfig.ts`
- Create: `data/schemas/trainingSource.ts`
- Create: `data/schemas/offerSource.ts`
- Create: `data/schemas/generated.ts`
- Create: `src/domain/sourceSnapshot.ts`
- Test: `data/schemas/generated.test.ts`

**Interfaces:**
- Consumes: Zod.
- Produces: `TrainingProgram`, `TrainingOffering`, `EducationCenter`, `JobOffer`, `SourceSnapshot`, `GeneratedManifest` and `SOURCE_CONFIG`.

- [ ] **Step 1: Write failing schema tests with official-shaped fixtures**

```ts
it("accepts a normalized training offering and rejects an empty program key", () => {
  const valid = {
    programKey: "IFC03S",
    programTitle: "Desarrollo de Aplicaciones Web",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
    centerCode: "47000000",
    province: "Valladolid",
    locality: "Valladolid",
    modality: "on_site"
  };
  expect(TrainingOfferingSchema.safeParse(valid).success).toBe(true);
  expect(TrainingOfferingSchema.safeParse({ ...valid, programKey: "" }).success).toBe(false);
});
```

- [ ] **Step 2: Verify the test fails**

Run: `rtk npm test -- data/schemas/generated.test.ts`  
Expected: FAIL because schemas do not exist.

- [ ] **Step 3: Implement exact domain contracts**

Use discriminated unions:

```ts
export const TrainingLevelSchema = z.enum(["basic", "intermediate", "higher", "specialization"]);
export const ModalitySchema = z.enum(["on_site", "distance", "mixed", "unknown"]);

export const SourceSnapshotSchema = z.object({
  sourceId: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceUpdatedAt: z.string().datetime().nullable(),
  snapshotFetchedAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
  recordCount: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  qualityStatus: z.enum(["passed", "stale"])
});
```

`JobOfferSchema` includes `id`, `title`, `province`, `locality`, `publishedAt`, `sourceName`, `descriptionText`, `descriptionSections`, `originalUrl` and snapshot provenance. It never exposes raw HTML.

- [ ] **Step 4: Define official source configuration**

`SOURCE_CONFIG` uses these stable IDs and URLs:

```ts
export const SOURCE_CONFIG = {
  training: {
    id: "jcyl-vocational-training-offer",
    recordsUrl: "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/oferta-de-formacion-profesional/records"
  },
  offers: {
    id: "jcyl-employment-offers",
    recordsUrl: "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/ofertas-de-empleo/records"
  }
} as const;
```

- [ ] **Step 5: Run contract tests**

Run: `rtk npm test -- data/schemas/generated.test.ts`  
Expected: PASS for valid fixtures and clear Zod failures for invalid IDs, URLs and dates.

- [ ] **Step 6: Commit contracts**

```powershell
rtk git add data/schemas scripts/data/sourceConfig.ts src/domain/sourceSnapshot.ts
rtk git commit -m "feat: define versioned public data contracts"
```

### Task 4: Reliable official-dataset fetching and HTML sanitization

**Files:**
- Create: `scripts/data/fetchJson.ts`
- Create: `scripts/data/fetchAllRecords.ts`
- Create: `scripts/data/sanitizeOfferHtml.ts`
- Create: `tests/fixtures/offer-description.html`
- Test: `scripts/data/fetchAllRecords.test.ts`
- Test: `scripts/data/sanitizeOfferHtml.test.ts`

**Interfaces:**
- Consumes: `SOURCE_CONFIG`, upstream Opendatasoft `{ total_count, results }` pages.
- Produces: `fetchAllRecords<T>(url, schema): Promise<T[]>` and `sanitizeOfferHtml(html): SanitizedOfferDescription`.

- [ ] **Step 1: Write failing pagination and sanitization tests**

```ts
it("fetches pages until total_count is reached", async () => {
  const fetchPage = vi.fn()
    .mockResolvedValueOnce({ total_count: 3, results: [{ id: 1 }, { id: 2 }] })
    .mockResolvedValueOnce({ total_count: 3, results: [{ id: 3 }] });
  await expect(fetchAllRecords("https://example.test/records", ItemSchema, fetchPage, 2))
    .resolves.toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
});

it("removes scripts while preserving requirement list text", () => {
  const result = sanitizeOfferHtml("<script>alert(1)</script><strong>Requisitos:</strong><ul><li>Carné B</li></ul>");
  expect(result.plainText).toContain("Requisitos: Carné B");
  expect(result.plainText).not.toContain("alert");
  expect(result.sections.requirements).toEqual(["Carné B"]);
});
```

- [ ] **Step 2: Verify red tests**

Run: `rtk npm test -- scripts/data/fetchAllRecords.test.ts scripts/data/sanitizeOfferHtml.test.ts`  
Expected: FAIL because both functions are missing.

- [ ] **Step 3: Implement bounded retries and pagination**

`fetchJson` retries network errors and HTTP 429/5xx up to three attempts with `250 ms`, `750 ms`, `1500 ms` delays. It does not retry schema failures or 4xx errors other than 429. `fetchAllRecords` uses `limit=100` and `offset`, rejects duplicate pages and validates every upstream record.

- [ ] **Step 4: Implement safe structural text extraction**

Use `sanitize-html` with no executable tags or attributes. Convert headings, paragraphs and list items into normalized text blocks. Populate only these sections: `summary`, `functions`, `requirements`, `conditions`, `application`, `other`. Preserve source order and never return raw HTML.

- [ ] **Step 5: Run focused and full tests**

Run:

```powershell
rtk npm test -- scripts/data/fetchAllRecords.test.ts scripts/data/sanitizeOfferHtml.test.ts
rtk npm test
```

Expected: PASS, including script removal and deterministic pagination.

- [ ] **Step 6: Commit fetch and sanitization**

```powershell
rtk git add scripts/data tests/fixtures
rtk git commit -m "feat: fetch and sanitize official source data"
```

### Task 5: Normalize vocational-training and employment records

**Files:**
- Create: `scripts/data/normalizeTraining.ts`
- Create: `scripts/data/normalizeOffers.ts`
- Test: `scripts/data/normalizeTraining.test.ts`
- Test: `scripts/data/normalizeOffers.test.ts`

**Interfaces:**
- Consumes: validated upstream records and `sanitizeOfferHtml`.
- Produces: `normalizeTraining(records): { programs, centers, offerings }` and `normalizeOffers(records): JobOffer[]`.

- [ ] **Step 1: Write failing normalization tests**

```ts
it("deduplicates programs and centers while retaining each offering", () => {
  const result = normalizeTraining([trainingSourceA, trainingSourceBAtSameCenter]);
  expect(result.programs).toHaveLength(2);
  expect(result.centers).toHaveLength(1);
  expect(result.offerings).toHaveLength(2);
});

it("does not expose upstream HTML", () => {
  const [offer] = normalizeOffers([offerSourceWithRequirements]);
  expect(offer.descriptionText).toContain("Carné B");
  expect(JSON.stringify(offer)).not.toContain("<li>");
});
```

- [ ] **Step 2: Verify tests fail**

Run: `rtk npm test -- scripts/data/normalizeTraining.test.ts scripts/data/normalizeOffers.test.ts`  
Expected: FAIL because normalizers do not exist.

- [ ] **Step 3: Implement deterministic training normalization**

Map official levels and modalities through explicit lookup objects. Reject blank `clave_ciclo` and `codigo_centro`. Use `programKey`, `centerCode` and the pair `${programKey}:${centerCode}:${modality}` as stable keys. Sort output by Spanish `Intl.Collator("es")` labels, then stable IDs.

- [ ] **Step 4: Implement deterministic offer normalization**

Use official `identificador` as ID. Strip and sanitize description HTML, preserve publication/update dates, and use `enlace_al_contenido` as `originalUrl`. Normalize absent locality/province fields to `null`, not empty strings. Do not parse requirements in this plan.

- [ ] **Step 5: Run tests and typecheck**

Run:

```powershell
rtk npm test -- scripts/data/normalizeTraining.test.ts scripts/data/normalizeOffers.test.ts
rtk npm run build
```

Expected: PASS with no raw HTML in generated types.

- [ ] **Step 6: Commit normalizers**

```powershell
rtk git add scripts/data/normalize*.ts scripts/data/normalize*.test.ts
rtk git commit -m "feat: normalize training and employment records"
```

### Task 6: Atomic snapshot generation, quality gates and client

**Files:**
- Create: `scripts/data/hashFile.ts`
- Create: `scripts/data/qualityGates.ts`
- Create: `scripts/data/buildSnapshots.ts`
- Create: `src/data/generatedDataClient.ts`
- Create: `public/data/v1/manifest.json`
- Test: `scripts/data/qualityGates.test.ts`
- Test: `src/data/generatedDataClient.test.ts`

**Interfaces:**
- Consumes: fetchers, normalizers and generated schemas.
- Produces: `runQualityGates(candidate, previous): QualityReport`, `buildSnapshots(): Promise<void>`, `loadGeneratedResource<T>(path, schema): Promise<T>`.

- [ ] **Step 1: Write failing quality-gate tests**

```ts
it("rejects a candidate that unexpectedly loses most records", () => {
  expect(() => runQualityGates(
    { programs: 20, centers: 20, offerings: 100, offers: 80 },
    { programs: 187, centers: 223, offerings: 1294, offers: 1000 }
  )).toThrow(/unexpected record loss/i);
});

it("accepts an explicit stale manifest in the client", async () => {
  mockFetchJson({ schemaVersion: "1.0.0", qualityStatus: "stale" });
  await expect(loadManifest()).resolves.toMatchObject({ qualityStatus: "stale" });
});
```

- [ ] **Step 2: Verify tests fail**

Run: `rtk npm test -- scripts/data/qualityGates.test.ts src/data/generatedDataClient.test.ts`  
Expected: FAIL because gates and client do not exist.

- [ ] **Step 3: Implement quality gates**

Fail snapshot replacement when identifiers are duplicated, references are broken, URLs are invalid, required labels are blank, or any main record family drops by more than 25% from the previous good snapshot. Record null rates for optional location/description fields but do not fail solely on documented nulls.

- [ ] **Step 4: Implement atomic snapshot writing**

Write candidate files to `.codex-tmp/data-build-<timestamp>`, validate them, compute SHA-256, then replace `public/data/v1` only after all gates pass. If refresh fails and a prior snapshot exists, leave it untouched and mark its manifest stale in a separate successful recovery step.

Generated files:

```text
public/data/v1/manifest.json
public/data/v1/programs.json
public/data/v1/centers.json
public/data/v1/training-offerings.json
public/data/v1/job-offers.json
```

- [ ] **Step 5: Implement the validating browser client**

`loadGeneratedResource` fetches a relative asset, checks HTTP status, validates JSON with Zod and throws `GeneratedDataError` with codes `network`, `schema` or `missing`. It never silently accepts malformed data.

- [ ] **Step 6: Build live snapshots and verify counts**

Run:

```powershell
rtk npm run data:build
rtk npm test
rtk npm run build
```

Expected: generated counts are non-zero, manifest hashes validate and the application build succeeds. Record the actual fetch date; do not hard-code the 2026-08-03 research counts as assertions.

- [ ] **Step 7: Commit the working data foundation**

```powershell
rtk git add scripts/data src/data public/data/v1 data/schemas package.json package-lock.json
rtk git commit -m "feat: generate validated official data snapshots"
```

### Task 7: Foundation end-to-end and accessibility checkpoint

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/home.spec.ts`
- Modify: `src/features/home/HomePage.tsx`
- Modify: `src/app/AppShell.tsx`

**Interfaces:**
- Consumes: built SPA and generated manifest.
- Produces: browser verification for home, navigation, responsive layout and freshness rendering.

- [ ] **Step 1: Write the failing Playwright test**

```ts
test("home exposes both journeys and no critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /he terminado fp/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /quiero trabajar de/i })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => item.impact === "critical")).toEqual([]);
});
```

- [ ] **Step 2: Run and confirm the initial failure**

Run: `rtk npx playwright test tests/e2e/home.spec.ts`  
Expected: FAIL until browser configuration, data freshness and accessible shell are complete.

- [ ] **Step 3: Add visible source freshness**

Load `manifest.json` in the home feature and display `Datos actualizados: <date>`. When `qualityStatus === "stale"`, render a text warning and preserve navigation. Do not label stale offers current.

- [ ] **Step 4: Verify desktop, mobile and keyboard paths**

Configure Chromium projects at 1280×800 and 360×800. Add assertions for skip-link focus, navigation labels, no horizontal overflow and both equal entry cards in DOM order.

- [ ] **Step 5: Run the complete foundation gate**

Run:

```powershell
rtk npm run lint
rtk npm test
rtk npx playwright test tests/e2e/home.spec.ts
rtk npm run build
```

Expected: all exit 0.

- [ ] **Step 6: Commit the checkpoint**

```powershell
rtk git add playwright.config.ts tests/e2e src/features/home src/app
rtk git commit -m "test: verify home accessibility and data freshness"
```
