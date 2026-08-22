# Task 6 report — close important accessibility findings

## Scope

Task 6 closes the deterministic accessibility and content findings in the Home
→ FP → occupation journeys and the shared shell. The implementation keeps the
existing visual system and tokens; the only visual change is the opaque,
two-layer focus ring. No curated/generated data, coverage freeze, or submission
document was changed.

## TDD evidence

### RED

Focused assertions were added before the production changes. The first focused
run (`OccupationSearchPage`, `OccupationMarketEvidence`, `OccupationResultsPage`,
`TrainingSearchPage`, `TrainingResultsPage`, `ResultSectionNav`, `ActionPanel`,
`App`, and `RouteLoadBoundary`) reported 27 expected failures. Representative
failures covered zero-result combobox popup ARIA, fragment destination focus,
filter-notice focus, new-tab naming, route titles, ready focus/announcement,
unnamed page roots, nested headings, and the SEPE definition.

The browser assertions were also introduced before the implementation: the
focus-ring, fragment-focus, and zero-result combobox checks failed until the
shared helpers and semantics were present.

### GREEN

- Final focused accessibility suite: 10 files, 87 tests passed.
- `rtk npm run typecheck`: passed.
- `rtk npm run lint`: passed with no warnings.
- `rtk npm run format:check`: all files matched.
- `rtk npm run build`: passed, including runtime-data, asset-budget, and
  distribution checks.
- Required Chromium E2E command: 52/52 passed across desktop and mobile.
- A local-preview manual script at 390×844 passed occupation options, market
  table, territorial distribution, income-group option list, body/document
  overflow, and keyboard fragment reach checks.
- The full Vitest suite reported 97 files passed and 23 skipped (950 passed,
  187 skipped). Two existing release-boundary suites remain red because the
  historical `coverage-freeze.json` does not include `sepeOccupationMarket` and
  the historical fallback still expects that resource to be an array:
  `scripts/release/renderContestSubmission.test.ts` and
  `scripts/release/prepareContestFallback646.test.ts`. These are outside Task
  6 and were not “fixed” by changing frozen/submission data.

## Exact fixes

- `OccupationCombobox` only exposes `aria-expanded`, `aria-controls`, and
  `aria-activedescendant` while a non-empty listbox exists; zero results remain
  a polite status without popup references.
- `--focus-ring` now uses an opaque surface keyline and
  `primary-strong` outer ring. Existing focus-visible selectors remain in use.
- Added `FragmentLink`, preserving native hash navigation/history while
  focusing the decoded destination with `{ preventScroll: true }`. Every
  training/occupation result destination and the direct reviewed-occupations
  CTA is `tabIndex={-1}`.
- Applying an unpublished-requirement filter focuses the existing named live
  notice only when the originating card is removed; clearing the filter does
  not steal focus.
- Added `ExternalLink`, which always applies `target="_blank"`,
  `rel="noopener noreferrer"`, and the Spanish visually-hidden new-tab suffix.
  All raw application links were migrated and duplicate suffixes removed.
- Added pure pathname title mapping and route-specific `document.title` values.
- Added a shared ready-status context. It announces once per current pathname
  transition, refocuses `main` only when focus is still on body/main, preserves
  focused controls, and covers async, static, and not-found routes.
- Named the main landmark, labelled page roots, added a route-error H1,
  corrected nested route/offer headings and `Distribución provincial`, and
  normalized loading messages to polite status where needed.
- Clarified SEPE copy as a source-published administrative count, explicitly
  distinguishing it from a unique-person census, vacancy measure, or
  prediction. The methodology page is consistent and missing-value behavior is
  unchanged.

## Changed files

Application and shared helpers:

- `src/app/AppShell.tsx`, `src/app/App.test.tsx`, `src/app/RouteLoadBoundary.tsx`,
  `src/app/RouteLoadBoundary.test.tsx`, `src/app/routes.tsx`,
  `src/app/RouteReady.tsx`, `src/app/RouteReadyContext.ts`,
  `src/app/routeTitles.ts`.
- `src/components/ExternalLink.tsx`, `src/components/FragmentLink.tsx`,
  `src/components/ResultSectionNav.tsx`, `src/components/ResultSectionNav.test.tsx`,
  `src/components/ActionPanel.tsx`, `src/components/ActionPanel.test.tsx`, and
  `src/components/EvidenceDisclosure.tsx`.
- `src/styles/global.css` and `src/styles/tokens.css`.

Page/content changes:

- Home, training-first, occupation-first, compare, open-data, resources,
  methodology, organizations, and accessibility page components and their
  focused tests.
- `docs/methodology/sepe-occupation-market.md`.
- `tests/e2e/home.spec.ts`, `tests/e2e/training-first.spec.ts`,
  `tests/e2e/occupation-first.spec.ts`, and the status-selector update in
  `tests/e2e/contest-readiness.spec.ts`.

## Self-review and concerns

The ready mechanism is deliberately small: pages report readiness through one
context, while route transitions are deduplicated only for the current
pathname. Returning to a previously visited route announces again. A user’s
focused link, select, or button is never replaced by a main focus move; the
skip link and fragment links retain their explicit focus behavior. All new
focusable section targets are non-tabbable in normal navigation.

The full-suite release-boundary failures are pre-existing freeze/schema-boundary
issues and should be handled by the owner of that historical submission path,
not by mutating frozen data. The implementation does not claim WCAG
certification; third-party source/PDF accessibility remains outside the app’s
control.
