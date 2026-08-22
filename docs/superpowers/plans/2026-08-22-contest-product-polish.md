# Contest Product Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SALIDA CyL searchable, shareable, printable, mobile-safe, and publication-ready without changing its evidence model or publishing a candidate.

**Architecture:** Add focused presentation primitives around the existing domain loaders: one FP combobox, one pure comparison-query codec, one print control, and one responsive navigation state. Keep manifest-addressed data loading and the existing evidence components intact; derive publication metadata from the existing publication configuration so the one-build/two-envelope release remains coherent.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Vitest, Testing Library, Lucide React, Vite 8, Playwright, CSS media queries.

**Spec:** `docs/superpowers/specs/2026-08-22-contest-product-polish-design.md`

## Global Constraints

- Work only in `/Users/dani/.codex/worktrees/CyL/contest-hardening-current`.
- Every shell command begins with `rtk`.
- Follow RED → GREEN TDD for every behavior change; do not run `data:build`.
- Do not modify `public/data`, curated data, generated schemas, candidate freeze, or release evidence.
- Keep `https://salida-cyl.157-90-22-40.sslip.io/` as the configured canonical URL.
- Do not deploy, publish, push, merge, submit the contest entry, or touch the original parallel checkout.
- Do not add dependencies, analytics, cookies, personal storage, opaque scores, AI recommendations, maps, or a PWA.
- Preserve abort handling, route readiness, error/stale states, source links, and deferred outcome loading.
- Use Lucide through `src/components/Icon.tsx`; no handwritten SVG, CSS art, emoji, or text-symbol icons.
- A task owns only its listed files. A later task may modify an earlier task's file only when its interface explicitly says so.
- Task 8 is a hard gate before release-hardening Task 5 creates any candidate identity or bundle.

---

### Task 1: FP presentation helpers and searchable combobox

**Files:**

- Create: `src/features/training-first/TrainingCombobox.tsx`
- Create: `src/features/training-first/TrainingCombobox.test.tsx`
- Create: `src/features/training-first/TrainingCombobox.css`
- Modify: `src/domain/trainingPresentation.ts`
- Create: `src/domain/trainingPresentation.test.ts`

**Interfaces:**

- Consumes: `TrainingProgram` and `MappingCoverage` schema types plus existing `trainingLevelLabel(level)`.
- Produces:

```ts
export interface TrainingComboboxProps {
  id: string;
  programs: readonly TrainingProgram[];
  confirmedProgram: TrainingProgram | null;
  onConfirm(program: TrainingProgram): void;
  onClear(): void;
  label: string;
  hint: string;
}

export function TrainingCombobox(props: TrainingComboboxProps): JSX.Element;

export function featuredTrainingCoverage(
  rows: readonly MappingCoverage[],
): Extract<MappingCoverage, { scope: "program" }>[];
```

- `TrainingCombobox` imports its own CSS so Tasks 2 and 3 do not touch shared global styles.

- [ ] **Step 1: Write failing helper tests**

Add fixtures with four reviewed program rows from three families, one uncovered
row, and two rows from the same family. Assert exact stable output, maximum
three, one row per family, filtering of uncovered/family-scope rows, and no
mutation:

```ts
const before = structuredClone(rows);
expect(
  featuredTrainingCoverage(rows).map(({ programKey }) => programKey),
).toEqual(["ADG01S", "IFC03S", "SAN01M"]);
expect(rows).toEqual(before);
```

- [ ] **Step 2: Write failing combobox tests**

Cover these observable cases with `userEvent`:

```ts
expect(screen.getByRole("combobox", { name: "Ciclo oficial" })).toHaveAttribute(
  "aria-autocomplete",
  "list",
);
await user.type(combobox, "informatica");
expect(screen.getByText(/ciclos oficiales encontrados/i)).toHaveAttribute(
  "aria-live",
  "polite",
);
await user.keyboard("{ArrowDown}{Enter}");
expect(onConfirm).toHaveBeenCalledWith(
  expect.objectContaining({ programKey: "IFC03S" }),
);
```

Also assert search by accented/unaccented family, key, level label, duplicate
title disambiguation, ArrowUp wrap, Escape close, zero results, click
confirmation, accurate ARIA state, and `onClear` when confirmed text is edited.

- [ ] **Step 3: Run Task 1 tests and confirm RED**

Run:

`rtk npm exec -- vitest run src/domain/trainingPresentation.test.ts src/features/training-first/TrainingCombobox.test.tsx --reporter=dot`

Expected: FAIL because the helper and component do not exist.

- [ ] **Step 4: Implement the helper minimally**

In `trainingPresentation.ts`, filter before sorting and never sort the input:

```ts
export function featuredTrainingCoverage(
  rows: readonly MappingCoverage[],
): Extract<MappingCoverage, { scope: "program" }>[] {
  const families = new Set<string>();
  return rows
    .filter(
      (row): row is Extract<MappingCoverage, { scope: "program" }> =>
        row.scope === "program" && row.coverageStatus === "reviewed",
    )
    .sort(
      (left, right) =>
        left.programTitle.localeCompare(right.programTitle, "es", {
          sensitivity: "base",
        }) || left.programKey.localeCompare(right.programKey),
    )
    .filter((row) => {
      if (families.has(row.familyCode)) return false;
      families.add(row.familyCode);
      return true;
    })
    .slice(0, 3);
}
```

- [ ] **Step 5: Implement the focused combobox**

Mirror the established `OccupationCombobox` event model. Normalize searchable
text with NFD/diacritic removal/lowercase, sort title then key, render level,
family, and key in every option, and keep a confirmed `programKey` separate
from editable text. Render no listbox id or active-descendant reference when
the list is closed.

Use a stable component-scoped id prefix derived from `id`; no random id or
timestamp. CSS must keep the list inside the viewport, use existing color and
focus tokens, and make options at least 44 CSS pixels tall.

- [ ] **Step 6: Run Task 1 tests and static gates**

Run:

```text
rtk npm exec -- vitest run src/domain/trainingPresentation.test.ts src/features/training-first/TrainingCombobox.test.tsx --reporter=dot
rtk npm run typecheck
rtk npm run lint
rtk npm run format:check
rtk git diff --check
```

Expected: all commands exit `0`.

- [ ] **Step 7: Commit Task 1**

```text
rtk git add src/domain/trainingPresentation.ts src/domain/trainingPresentation.test.ts src/features/training-first/TrainingCombobox.tsx src/features/training-first/TrainingCombobox.test.tsx src/features/training-first/TrainingCombobox.css
rtk git commit -m "feat(fp): add accessible program search"
```

---

### Task 2: Integrate FP discovery, filters, guided examples, and slice contract

**Files:**

- Modify: `src/features/training-first/TrainingSearchPage.tsx`
- Modify: `src/features/training-first/TrainingSearchPage.test.tsx`
- Modify: `src/data/generatedDataClient.test.ts`
- Create: `src/domain/territory.ts`
- Create: `src/domain/territory.test.ts`

**Interfaces:**

- Consumes: `TrainingCombobox`, `featuredTrainingCoverage(rows)`, `trainingLevelLabel(level)`.
- Produces: `/desde-fp/:programKey?province=<province>` exactly as before; no new data-client interface.
- Produces:

```ts
export const CYL_PROVINCES = [
  "Ávila",
  "Burgos",
  "León",
  "Palencia",
  "Salamanca",
  "Segovia",
  "Soria",
  "Valladolid",
  "Zamora",
] as const;

export type CylProvince = (typeof CYL_PROVINCES)[number];

export function parseCylProvince(
  values: readonly string[],
):
  | { kind: "none" }
  | { kind: "valid"; province: CylProvince }
  | { kind: "invalid" };
```

- [ ] **Step 1: Write failing page tests**

Replace native-program-select expectations with confirmation through the
combobox. Add assertions that:

```ts
await user.selectOptions(
  screen.getByRole("combobox", { name: "Filtrar por nivel" }),
  "higher",
);
await user.selectOptions(
  screen.getByRole("combobox", { name: "Filtrar por familia profesional" }),
  "IFC",
);
await user.type(screen.getByRole("combobox", { name: /ciclo/i }), "IFC03S");
await user.keyboard("{ArrowDown}{Enter}");
expect(screen.getByRole("button", { name: /ver salidas/i })).toBeEnabled();
```

Use `getByRole("combobox", { name: "Filtrar por nivel" })` and the equivalent
family label for the native filters. Verify a filter that hides the confirmed
program clears it and disables the CTA. Verify exactly three valid guided
examples, one per reviewed family, and no link for a missing catalogue program.

Assert the province label and associated hint exactly match the specification,
then submit León and expect the encoded existing route.

In `territory.test.ts`, assert no value is `none`, one exact official value is
`valid`, and empty, unknown, case-changed, whitespace-padded, or repeated
values are `invalid`. This avoids silently echoing arbitrary query text.

- [ ] **Step 2: Add the failing programs-only loader test**

In `generatedDataClient.test.ts`, call:

```ts
const result = await loadFoundationResourceSubset(
  currentManifest,
  ["programs"],
  { signal: controller.signal },
);
expect(result).toEqual({ contract: "current", programs: PROGRAMS_FIXTURE });
expect(requestedPaths).toEqual([programsPath]);
```

Explicitly assert that no requested path ends in `centers.json`,
`training-offerings.json`, `job-offers.json`, or `outcome-indicators.json`.

- [ ] **Step 3: Run Task 2 tests and confirm RED**

Run:

`rtk npm exec -- vitest run src/domain/territory.test.ts src/features/training-first/TrainingSearchPage.test.tsx src/data/generatedDataClient.test.ts --reporter=dot`

Expected: page assertions fail because the native program select and old
province copy remain. The data-client test may already pass and then becomes an
explicit regression lock.

- [ ] **Step 4: Implement filters, combobox, and examples**

Define the nine provinces and strict parser in `territory.ts`, then remove the
page-local province constant. Keep one `confirmedProgram: TrainingProgram |
null` state. Derive sorted unique
levels and families from the loaded catalogue, then derive filtered programs.
When either filter changes, clear the confirmed program if it is absent from
the derived list. Submit only `confirmedProgram.programKey`.

Build guided rows with `featuredTrainingCoverage(coverage)` and resolve each
row through a `Map<programKey, TrainingProgram>`. Omit unresolved rows. Keep the
scope sentence visible next to the list.

The province control uses:

```tsx
<label htmlFor="training-province">
  Provincia para el contexto (opcional)
</label>
<p id="training-province-hint">
  Se usa solo para mostrar contexto provincial; no filtra los centros publicados.
</p>
<select id="training-province" aria-describedby="training-province-hint">
```

- [ ] **Step 5: Run Task 2 tests and nearby regressions**

Run:

```text
rtk npm exec -- vitest run src/domain/territory.test.ts src/features/training-first/TrainingSearchPage.test.tsx src/features/training-first/TrainingCombobox.test.tsx src/domain/trainingPresentation.test.ts src/data/generatedDataClient.test.ts --reporter=dot
rtk npm run typecheck
rtk npm run lint
rtk npm run format:check
rtk git diff --check
```

Expected: all commands exit `0`; the page still requests only programs and
mapping coverage.

- [ ] **Step 6: Commit Task 2**

```text
rtk git add src/domain/territory.ts src/domain/territory.test.ts src/features/training-first/TrainingSearchPage.tsx src/features/training-first/TrainingSearchPage.test.tsx src/data/generatedDataClient.test.ts
rtk git commit -m "feat(fp): improve program discovery"
```

---

### Task 3: Reuse the FP combobox on the home journey

**Files:**

- Modify: `src/features/home/HomePage.tsx`
- Modify: `src/features/home/HomePage.test.tsx`

**Interfaces:**

- Consumes: `TrainingCombobox`, `featuredTrainingCoverage(rows)`.
- Produces: the existing `/desde-fp/:programKey` home navigation and unchanged occupation-mode behavior.

- [ ] **Step 1: Write failing home tests**

Assert the FP mode has a searchable combobox, not a native 187-option select;
typed text alone leaves the CTA disabled; keyboard confirmation enables it;
and submission navigates using the exact official key. Keep existing tests for
mode storage, occupation search, abort, loading, unavailable state, coverage
date, and the three guided links.

```ts
await user.type(
  screen.getByRole("combobox", { name: /título de formación/i }),
  "IFC03S",
);
expect(screen.getByRole("button", { name: /ver las salidas/i })).toBeDisabled();
await user.keyboard("{ArrowDown}{Enter}");
expect(screen.getByRole("button", { name: /ver las salidas/i })).toBeEnabled();
```

- [ ] **Step 2: Run the home tests and confirm RED**

Run: `rtk npm exec -- vitest run src/features/home/HomePage.test.tsx --reporter=dot`

Expected: FAIL because home still renders a native program select.

- [ ] **Step 3: Replace only the FP-mode selector**

Store `selectedProgram` as `TrainingProgram | null`, pass it to
`TrainingCombobox`, clear it on edit, and navigate with
`selectedProgram.programKey` only after confirmation. Replace the private
`featuredCoverage` function with the domain helper. Do not change occupation
mode or the `SEARCH_MODE_STORAGE_KEY` contract.

- [ ] **Step 4: Run Task 3 tests and static gates**

```text
rtk npm exec -- vitest run src/features/home/HomePage.test.tsx src/features/training-first/TrainingCombobox.test.tsx src/domain/trainingPresentation.test.ts --reporter=dot
rtk npm run typecheck
rtk npm run lint
rtk npm run format:check
rtk git diff --check
```

Expected: all commands exit `0`.

- [ ] **Step 5: Commit Task 3**

```text
rtk git add src/features/home/HomePage.tsx src/features/home/HomePage.test.tsx
rtk git commit -m "feat(home): add searchable FP entry"
```

---

### Task 4: Province semantics and reusable printable orientation

**Files:**

- Create: `src/components/PrintButton.tsx`
- Create: `src/components/PrintButton.test.tsx`
- Create: `src/styles/print.css`
- Modify: `src/components/Icon.tsx`
- Modify: `src/features/training-first/TrainingResultsPage.tsx`
- Modify: `src/features/training-first/TrainingResultsPage.test.tsx`
- Modify: `src/features/occupation-first/OccupationResultsPage.tsx`
- Modify: `src/features/occupation-first/OccupationResultsPage.test.tsx`

**Interfaces:**

- Produces:

```ts
export interface PrintButtonProps {
  label?: string;
  className?: string;
}

export function PrintButton({
  label = "Imprimir esta orientación",
  className,
}: PrintButtonProps): JSX.Element;
```

- Adds `printer` to `IconName`; Task 5 consumes `PrintButton` unchanged.

- [ ] **Step 1: Write failing PrintButton tests**

```ts
const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
await user.click(
  screen.getByRole("button", { name: "Imprimir esta orientación" }),
);
expect(print).toHaveBeenCalledTimes(1);
expect(window.location.href).toBe(beforeUrl);
```

Assert native `type="button"`, visible label, decorative printer icon, optional
class merge, and no storage/network calls.

- [ ] **Step 2: Write failing province and result-page tests**

For the same fixture with and without `?province=Le%C3%B3n`, assert identical
published center names/counts. Assert the provincial contracts shown are only
León, the heading says `Contexto provincial elegido: León`, and visible copy
says the center list remains complete.

On both FP and occupation ready states, assert one print button. Do not render
the button in loading, failed, or unknown states.

- [ ] **Step 3: Run Task 4 tests and confirm RED**

Run:

`rtk npm exec -- vitest run src/components/PrintButton.test.tsx src/features/training-first/TrainingResultsPage.test.tsx src/features/occupation-first/OccupationResultsPage.test.tsx --reporter=dot`

Expected: FAIL because the component and explicit province copy do not exist.

- [ ] **Step 4: Implement PrintButton and shared print CSS**

Render a native button that directly calls `window.print`. Import
`src/styles/print.css` from the component. The stylesheet must contain:

```css
@page {
  size: A4 portrait;
  margin: 14mm;
}

@media print {
  .site-header,
  .site-footer,
  .skip-link,
  .print-control,
  [data-print-hidden="true"] {
    display: none !important;
  }

  .page-content {
    width: 100%;
    max-width: none;
    padding: 0;
  }

  .print-avoid-break,
  article,
  .decision-basis {
    break-inside: avoid;
  }
}
```

Add only source-preserving, color-independent print overrides. Do not hide
evidence cards, dates, sources, caveats, or limitations.

- [ ] **Step 5: Integrate both result routes and province copy**

Place `PrintButton` next to existing next-step actions in each ready result.
Use `data-print-hidden="true"` on interactive-only action/filter controls and
`print-avoid-break` on evidence cards where needed. Change only explanatory
province copy; parse `searchParams.getAll("province")` with
`parseCylProvince`. A valid province feeds the existing provincial
context/suitability logic. Invalid input shows a fixed recovery notice, is not
echoed, and behaves as no province. Leave `studyCenters` derivation unfiltered.

- [ ] **Step 6: Run Task 4 tests and static gates**

```text
rtk npm exec -- vitest run src/components/PrintButton.test.tsx src/features/training-first/TrainingResultsPage.test.tsx src/features/occupation-first/OccupationResultsPage.test.tsx --reporter=dot
rtk npm run typecheck
rtk npm run lint
rtk npm run format:check
rtk git diff --check
```

Expected: all commands exit `0`.

- [ ] **Step 7: Commit Task 4**

```text
rtk git add src/components/PrintButton.tsx src/components/PrintButton.test.tsx src/components/Icon.tsx src/styles/print.css src/features/training-first/TrainingResultsPage.tsx src/features/training-first/TrainingResultsPage.test.tsx src/features/occupation-first/OccupationResultsPage.tsx src/features/occupation-first/OccupationResultsPage.test.tsx
rtk git commit -m "feat(results): add printable orientation sheets"
```

---

### Task 5: Canonical comparator URL, FP preselection, and comparator print

**Files:**

- Create: `src/features/compare-studies/compareSelection.ts`
- Create: `src/features/compare-studies/compareSelection.test.ts`
- Create: `src/domain/trainingOutcomeMatching.ts`
- Create: `src/domain/trainingOutcomeMatching.test.ts`
- Modify: `src/features/training-first/trainingOutcome.ts`
- Modify: `src/features/compare-studies/CompareStudiesPage.tsx`
- Modify: `src/features/compare-studies/CompareStudiesPage.test.tsx`
- Modify: `src/features/compare-studies/compareStudies.css`
- Modify: `src/features/training-first/TrainingResultsPage.tsx`
- Modify: `src/features/training-first/TrainingResultsPage.test.tsx`

**Interfaces:**

- Consumes: `PrintButton`, domain-owned `findTrainingOutcomeGroup`,
  `loadFoundationResourceSubset(manifest, ["programs"], options)`, and
  `IncomeOutcomeIndex`.
- Produces:

```ts
export interface CompareSelection {
  trainingLevel: OutcomeTrainingLevel;
  groupKeys: readonly [string, ...string[]];
  cohort: string;
  postGraduationYear: 1 | 2 | 3 | 4;
}

export type CompareSearchResult =
  | { kind: "empty" }
  | { kind: "program"; programKey: string }
  | { kind: "selection"; selection: CompareSelection }
  | { kind: "invalid"; message: string };

export function parseCompareSearch(
  params: URLSearchParams,
  index: IncomeOutcomeIndex,
): CompareSearchResult;

export function serializeCompareSelection(
  selection: CompareSelection,
): URLSearchParams;
```

- [ ] **Step 1: Write failing pure codec tests**

Assert empty params, exact valid parsing, stable order, repeated `group`,
round-trip equality, and these invalid inputs: repeated single-value params,
unknown level/group/cohort, duplicate groups, mixed-level groups, zero or more
than three groups, invalid year, empty `program`, repeated `program`, and a
mixed `program` plus canonical selection.

In `trainingOutcomeMatching.test.ts`, preserve exact cycle and family match
classification plus unsupported-level/null behavior while moving the existing
logic out of the feature directory.

```ts
expect(serializeCompareSelection(selection).toString()).toBe(
  "level=higher&group=ifc-a&group=ifc-b&cohort=2019-2020&year=4",
);
```

- [ ] **Step 2: Write failing page and contextual-link tests**

Use `MemoryRouter` plus a `LocationProbe` to assert:

- a canonical URL restores level, groups, cohort, year, and comparison;
- form changes call router replacement and update the canonical query;
- clearing the last group clears the query;
- invalid input shows one alert/status notice and no fabricated comparison;
- `?program=IFC03S` resolves the exact program/group then replaces the URL;
- unknown/ambiguous/unsupported programs leave manual selection usable;
- a valid comparison renders `Imprimir esta orientación` and calls print once.

In `TrainingResultsPage.test.tsx`, expect the action href
`/comparar?program=IFC03S` and retain the existing assertion that outcomes are
not requested before explicit evidence activation.

- [ ] **Step 3: Run Task 5 tests and confirm RED**

Run:

`rtk npm exec -- vitest run src/domain/trainingOutcomeMatching.test.ts src/features/compare-studies/compareSelection.test.ts src/features/compare-studies/CompareStudiesPage.test.tsx src/features/training-first/TrainingResultsPage.test.tsx --reporter=dot`

Expected: FAIL because the codec and contextual URL do not exist.

- [ ] **Step 4: Implement fail-closed parsing and serialization**

Read every parameter with `getAll`. Reject duplicate `level`, `cohort`, `year`,
or `program`. A `program` intent is valid only when it is the only supported
parameter and contains one non-empty key. Canonical selection is valid only
with one to three unique groups, all present in `index.groupsByKey`, all at the
declared level, an existing cohort window, and a year in the literal union.

Return a fixed Spanish recovery message without echoing arbitrary query text.
Serialization appends parameters in the interface order and never sorts group
keys supplied by the user's visible selection.

Move `TrainingOutcomeGroupMatch`, level conversion, normalization, and
`findTrainingOutcomeGroup` into `src/domain/trainingOutcomeMatching.ts`.
Import and re-export them from `trainingOutcome.ts` so existing FP evidence
callers retain their API. The comparator imports only from the domain module.

- [ ] **Step 5: Integrate router state and program resolution**

Load programs and outcomes from the same manifest and abort signal on the
comparator route. Parse only after the index exists. For `program`, find one
exact `programKey`, reject unsupported levels, call
`findTrainingOutcomeGroup`, and require `matchType === "cycle"` before setting
state and calling `setSearchParams(canonical, { replace: true })`. A family
match displays a fixed broader-reference notice and leaves manual selection
available; it is never serialized as the selected cycle.

For form changes, set React state and replace the query only when at least one
group is selected; clear params when the last group is removed or level
changes. Do not call `window.history`, local storage, or a route onClick loader.

Render `PrintButton` only beside a non-null comparison. In print media, make
`.income-evidence-grid` one column, remove overflow, and hide the form and
interactive controls while preserving both official scopes and limitations.

- [ ] **Step 6: Run Task 5 tests and regressions**

```text
rtk npm exec -- vitest run src/domain/trainingOutcomeMatching.test.ts src/features/compare-studies/compareSelection.test.ts src/features/compare-studies/CompareStudiesPage.test.tsx src/features/training-first/TrainingResultsPage.test.tsx src/data/generatedDataClient.test.ts --reporter=dot
rtk npm run typecheck
rtk npm run lint
rtk npm run format:check
rtk git diff --check
```

Expected: all commands exit `0`; the FP result route still performs no eager
outcome request.

- [ ] **Step 7: Commit Task 5**

```text
rtk git add src/domain/trainingOutcomeMatching.ts src/domain/trainingOutcomeMatching.test.ts src/features/training-first/trainingOutcome.ts src/features/compare-studies/compareSelection.ts src/features/compare-studies/compareSelection.test.ts src/features/compare-studies/CompareStudiesPage.tsx src/features/compare-studies/CompareStudiesPage.test.tsx src/features/compare-studies/compareStudies.css src/features/training-first/TrainingResultsPage.tsx src/features/training-first/TrainingResultsPage.test.tsx
rtk git commit -m "feat(compare): make selections shareable"
```

---

### Task 6: Accessible mobile disclosure navigation and 390-pixel fixes

**Files:**

- Modify: `src/app/AppShell.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/components/Icon.tsx`
- Modify: `src/styles/global.css`
- Create: `src/styles/globalResponsive.test.ts`

**Interfaces:**

- Adds `menu` and `x` to `IconName`.
- Preserves the six existing destinations and route-title behavior.

- [ ] **Step 1: Write failing shell interaction tests**

Render `AppShell` in a memory router. Assert the closed button has
`aria-expanded="false"`, the mobile navigation is hidden, click opens it,
Escape closes it and restores focus, clicking a link closes it, and a route
change closes it without stealing focus.

```ts
const button = screen.getByRole("button", { name: "Abrir menú principal" });
await user.click(button);
expect(button).toHaveAttribute("aria-expanded", "true");
expect(
  screen.getByRole("navigation", { name: "Principal móvil" }),
).toBeVisible();
await user.keyboard("{Escape}");
expect(button).toHaveFocus();
```

Keep an assertion that the desktop navigation always contains the exact six
links once.

- [ ] **Step 2: Write failing responsive CSS contract test**

Read `global.css` and assert the final mobile block contains:

```css
.site-menu-button {
  min-width: 2.75rem;
  min-height: 2.75rem;
}
.site-nav--desktop {
  display: none;
}
.site-nav--mobile {
  width: 100%;
}
.coverage-panel__heading {
  display: grid;
}
.coverage-panel__heading > .data-freshness {
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
}
```

Also assert no later mobile rule restores `overflow: visible` plus wrapped
desktop navigation.

- [ ] **Step 3: Run Task 6 tests and confirm RED**

Run:

`rtk npm exec -- vitest run src/app/App.test.tsx src/styles/globalResponsive.test.ts --reporter=dot`

Expected: FAIL because there is no menu button and the final mobile rule wraps
the full navigation.

- [ ] **Step 4: Implement separate desktop/mobile navigation views**

Extract the six `<li>` elements into a local `PrimaryNavigationLinks`
component. Keep `.site-nav--desktop` visible by default. Add a mobile button
and a second navigation with `id="mobile-primary-navigation"`,
`aria-label="Principal móvil"`, and `hidden={!menuOpen}`.

Use `useState`, the existing `useLocation`, a button ref, a route-change effect,
and a document keydown effect active only while open. Escape closes and focuses
the button. Link activation closes without an explicit focus call.

- [ ] **Step 5: Implement mobile layout and freshness wrapping**

Below 48 rem, hide desktop nav, show the 44-pixel menu button, stack the mobile
list as one compact panel, and retain visible focus/current-page styling. Above
the breakpoint, hide the button and mobile nav regardless of state.

Delete or override the final wrapping-nav rules that caused two rows. Make the
coverage heading a grid and the freshness badge wrap without document overflow.

- [ ] **Step 6: Run Task 6 tests and static gates**

```text
rtk npm exec -- vitest run src/app/App.test.tsx src/styles/globalResponsive.test.ts src/features/home/HomePage.test.tsx --reporter=dot
rtk npm run typecheck
rtk npm run lint
rtk npm run format:check
rtk git diff --check
```

Expected: all commands exit `0`.

- [ ] **Step 7: Commit Task 6**

```text
rtk git add src/app/AppShell.tsx src/app/App.test.tsx src/components/Icon.tsx src/styles/global.css src/styles/globalResponsive.test.ts
rtk git commit -m "feat(shell): add compact mobile navigation"
```

---

### Task 7: Publication assets and configuration-derived metadata

**Files:**

- Create: `public/salida-cyl-social.png`
- Create: `public/salida-cyl-icon.png`
- Create: `public/robots.txt`
- Create: `scripts/release/publicationMetadata.ts`
- Create: `scripts/release/publicationMetadata.test.ts`
- Modify: `vite.config.ts`
- Modify: `index.html`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/superpowers/plans/2026-08-22-contest-release-candidate-hardening.md`

**Interfaces:**

- Consumes: `config/publication.json` through the existing validated publication identity loader.
- Produces:

```ts
export interface PublicationMetadata {
  canonicalUrl: string;
  title: "SALIDA CyL";
  description: string;
  socialImageUrl: string;
  themeColor: "#7f1734";
}

export function publicationMetadata(rootDir: string): PublicationMetadata;
export function renderPublicationHead(
  html: string,
  metadata: PublicationMetadata,
): string;
```

- Vite calls the renderer through `transformIndexHtml`; release-hardening Task
  5 must preserve that plugin while removing deployment-base build inputs.

- [ ] **Step 1: Materialize and inspect the selected raster assets**

Copy, without deleting the generated originals:

```text
rtk cp /Users/dani/.codex/generated_images/01a02817-3c57-78a1-bbc1-667f87d5e782/exec-e18cb297-a303-4789-b09c-c00f23d066b7.png public/salida-cyl-social.png
rtk sips -z 630 1200 public/salida-cyl-social.png
rtk cp /Users/dani/.codex/generated_images/01a02817-3c57-78a1-bbc1-667f87d5e782/exec-5763886b-e57d-4501-b0f4-33dbf5e7e36a.png public/salida-cyl-icon.png
rtk sips -z 512 512 public/salida-cyl-icon.png
rtk file public/salida-cyl-social.png public/salida-cyl-icon.png
```

Expected: RGB PNG, exactly 1200×630 and 512×512. Open both images and reject
cropped text, checkerboard patterns, invented numbers, unreadable favicon form,
or an aspect-ratio mismatch.

- [ ] **Step 2: Write failing metadata tests**

Use a temporary fixture with a publication config and assert exact metadata,
escaped attributes, one occurrence of each owned head field, and failure on a
missing or duplicate marker. Assert the fallback build still renders the VPS
canonical URL.

```ts
expect(result).toContain(
  '<link rel="canonical" href="https://salida-cyl.157-90-22-40.sslip.io/">',
);
expect(result).toContain(
  '<meta property="og:image" content="https://salida-cyl.157-90-22-40.sslip.io/salida-cyl-social.png">',
);
```

Read the resulting HTML with an HTML parser already available in the repository
or exact owned-marker matching; do not add a dependency.

- [ ] **Step 3: Run metadata tests and confirm RED**

Run: `rtk npm exec -- vitest run scripts/release/publicationMetadata.test.ts --reporter=dot`

Expected: FAIL because the renderer does not exist.

- [ ] **Step 4: Implement one-source metadata rendering**

Put one marker in source `index.html`:

```html
<!-- salida-publication-metadata -->
```

Replace that marker exactly once at dev/build transform time with title,
description, canonical, Open Graph, Twitter card, favicon, and theme-color tags.
Construct `socialImageUrl` with `new URL("salida-cyl-social.png",
canonicalUrl)`. Reject a missing/duplicate marker and invalid configuration.

Add `public/robots.txt` with only:

```text
User-agent: *
Allow: /
```

Do not claim a sitemap that is not generated. Change package metadata to name
`salida-cyl` in both `package.json` and the lockfile root package, then add a
factual Spanish description and relevant FP/open-data/Castilla y León
keywords. Do not duplicate the canonical URL in `package.json`.

- [ ] **Step 5: Amend release-hardening Task 5 before it starts**

In the Task 5 file list, include `scripts/release/publicationMetadata.ts`, its
test, the two public images, and `public/robots.txt` as inputs that the
one-build/two-envelope producer must preserve. Add an acceptance assertion that
both envelopes declare the configured VPS canonical URL and resolve the social
image while retaining byte-identical compiled core assets.

- [ ] **Step 6: Run Task 7 tests and build-level gates**

```text
rtk npm exec -- vitest run scripts/release/publicationMetadata.test.ts scripts/release/releaseIdentity.test.ts --reporter=dot
rtk npm run build
rtk npm exec -- tsx scripts/release/validateCandidateBoundary.ts --bundle-root dist
rtk npm run typecheck
rtk npm run lint
rtk npm run format:check
rtk git diff --check
```

Expected: all commands exit `0`; build reports the existing 21-resource/116-SEPE
candidate boundary and the social image is reachable in `dist`.

- [ ] **Step 7: Commit Task 7**

```text
rtk git add public/salida-cyl-social.png public/salida-cyl-icon.png public/robots.txt scripts/release/publicationMetadata.ts scripts/release/publicationMetadata.test.ts vite.config.ts index.html package.json package-lock.json docs/superpowers/plans/2026-08-22-contest-release-candidate-hardening.md
rtk git commit -m "feat(publication): add canonical product metadata"
```

---

### Task 8: E2E migration, accessibility, print, and visual release gate

**Files:**

- Modify: `tests/e2e/home.spec.ts`
- Modify: `tests/e2e/training-first.spec.ts`
- Modify: `tests/e2e/compare-studies.spec.ts`
- Modify: `tests/e2e/contest-readiness.spec.ts`
- Create: `docs/qa/2026-08-22-contest-product-polish.md`

**Interfaces:**

- Consumes all Tasks 1–7.
- Produces a local QA record and the hard precondition for release-hardening Task 5.

- [ ] **Step 1: Migrate E2E selectors and write failing journeys**

Replace only `/desde-fp` and home FP `.selectOption()` calls with combobox
typing plus official option confirmation. Keep native filter/province selects.
Add scenarios for:

- keyboard FP search and filter reset;
- home FP confirmation;
- comparator canonical deep-link reload and `programKey` preselection;
- invalid comparator query recovery;
- 390×844 mobile menu open/close/Escape/current route;
- no document overflow and fully visible freshness text;
- Axe scans after each primary interaction.

Do not automate the operating-system print dialog. Instead assert the print
button is available in valid result states and use browser evaluation to spy on
one `window.print()` call.

- [ ] **Step 2: Run focused E2E and confirm at least one RED before migration**

Run:

`rtk npm run test:e2e:chromium -- tests/e2e/home.spec.ts tests/e2e/training-first.spec.ts tests/e2e/compare-studies.spec.ts tests/e2e/contest-readiness.spec.ts`

Expected before completing selector migration: at least one old native-select or
new mobile/shareable-state assertion fails.

- [ ] **Step 3: Complete E2E expectations without weakening accessibility**

Keep `document.documentElement.scrollWidth <= clientWidth + 1` and the same for
`body`. Scope mobile navigation assertions to `Principal móvil`; do not permit
horizontal nav scrolling as a substitute for the disclosure. Require every
visible menu/control target to be at least 44 CSS pixels in both dimensions.

- [ ] **Step 4: Run the full automated gate**

```text
rtk npm test
rtk npm run test:e2e:chromium
rtk npm run build
rtk npm exec -- tsx scripts/release/validateCandidateBoundary.ts --bundle-root dist
rtk npm run license:check
rtk npm run typecheck
rtk npm run lint
rtk npm run format:check
rtk git diff --check
```

Expected: every command exits `0`, bundle stays within budgets, distribution has
21 resources, and SEPE has 116 records.

- [ ] **Step 5: Perform in-app browser verification**

At identical desktop and 390×844 viewports, inspect and capture:

- `/` in FP and occupation modes;
- `/desde-fp` with filters, zero results, and a confirmed cycle;
- one FP result with province context;
- one occupation result;
- `/comparar` from canonical and `program` URLs;
- mobile menu closed/open and freshness heading.

Use keyboard-only operation, inspect console errors, run the accessibility scan,
and open A4 print preview for FP, occupation, and comparator. Reset viewport at
the end. Record screenshot paths, tested routes/states, print findings, any
waiver, exact HEAD, and command results in the QA document.

- [ ] **Step 6: Review the complete product diff**

Run:

```text
rtk git diff --stat 0ba4c50d383364554ea1e9e8f077708bba47910b..HEAD
rtk git log --oneline --decorate 0ba4c50d383364554ea1e9e8f077708bba47910b..HEAD
rtk git status --short
```

Expected: only planned product, test, asset, metadata, and QA paths changed;
worktree is clean before Task 5 starts.

- [ ] **Step 7: Commit Task 8**

```text
rtk git add tests/e2e/home.spec.ts tests/e2e/training-first.spec.ts tests/e2e/compare-studies.spec.ts tests/e2e/contest-readiness.spec.ts docs/qa/2026-08-22-contest-product-polish.md
rtk git commit -m "test(product): verify contest polish journeys"
```

---

## Integration order and agent ownership

1. Task 1 first because Tasks 2 and 3 consume its component/helper.
2. After Task 1 approval, Tasks 2, 3, 4, and 6 are logically independent, but
   Task 4 and Task 6 both add icon names. Run them sequentially or reserve
   `Icon.tsx` for one integrator to avoid a shared-file collision.
3. Task 5 starts after Task 4 because both edit `TrainingResultsPage`.
4. Task 7 starts after Task 6 and before release-hardening Task 5 because both
   touch shared build/integration files.
5. Task 8 runs only after Tasks 1–7 pass independent review.
6. Every implementation commit receives a fresh spec-compliance review and a
   fresh code-quality review before the next dependent task.

## Final pre-candidate checkpoint

Do not begin release-hardening Task 5 until all of the following are true:

- Tasks 1–8 are committed and independently approved.
- Full unit, Chromium E2E, build, boundary, licence, typecheck, lint, format,
  and diff checks exit `0` on the same HEAD.
- The browser QA record contains desktop, 390-pixel, accessibility, console,
  and A4 print evidence.
- `config/publication.json` still contains the approved temporary canonical URL.
- The worktree is clean and no deployment, publication, push, merge, or contest
  submission has occurred.
