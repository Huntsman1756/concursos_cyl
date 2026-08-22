# Contest Product Polish Design

**Date:** 2026-08-22

**Status:** Approved for local implementation before the definitive candidate
bundle

## Goal

Remove the highest-friction points found in the contest UX audit without
changing SALIDA CyL's evidence model, adding opaque scoring, or publishing a
new candidate. The product must remain a calm, source-led orientation tool
while becoming faster to search, easier to share, usable at 390 CSS pixels,
and printable as a practical guidance sheet.

## Product principles

- Keep the current visual language, hierarchy, typography, burgundy/ochre
  palette, evidence vocabulary, and native-control preference.
- Prefer explicit public facts and explain uncertainty. Do not add predictions,
  personal scores, rankings, inferred salaries, or unsupported claims.
- A typed value is not a selected official entity. Navigation and comparison
  require an explicitly confirmed option.
- Preserve progressive loading. A contextual comparison link must not fetch the
  outcome resource on the FP results route.
- Preserve privacy. Search text, filters, selected programs, provinces, and
  comparison state are not written to analytics, cookies, or local storage.
- The only local-storage value remains the non-sensitive preferred home search
  mode already documented by the product.
- Use the existing Lucide icon dependency. Do not create icons with CSS, inline
  SVG, text symbols, or emoji.
- No task in this specification may deploy, publish, push, submit the contest
  application, or alter the original parallel checkout.

## Canonical publication identity

Until the owner buys a domain, the canonical product URL remains:

`https://salida-cyl.157-90-22-40.sslip.io/`

`config/publication.json` remains the sole production source of truth. The
GitHub Pages URL is a fallback envelope and must still declare the VPS URL as
canonical. A later domain change therefore changes the publication
configuration, not scattered HTML strings.

## 1. Searchable FP selection

### Shared interaction

Create a focused `TrainingCombobox` based on the proven interaction contract of
`OccupationCombobox`. Do not introduce a generic combobox framework in this
change.

The component consumes the official `TrainingProgram[]`, an optional confirmed
program, and `onConfirm`/`onClear` callbacks. It searches accent-insensitively
and case-insensitively across:

- official program title;
- official `programKey`;
- professional family name and code;
- the Spanish presentation label for the training level.

Results are deterministic: title with Spanish base sensitivity, then official
key. Each visible option includes title, level, family, and key so equal or
similar titles remain distinguishable.

The user confirms an option only by click or Enter on an official result.
Arbitrary input never enables a route CTA. Editing confirmed text clears the
confirmed program before the next render.

The accessibility contract is:

- labelled input with `role="combobox"`;
- accurate `aria-expanded`, `aria-controls`, `aria-activedescendant`, and
  `aria-autocomplete="list"`;
- `role="listbox"`, stable option ids, `role="option"`, and accurate
  `aria-selected` only while results are rendered;
- ArrowDown and ArrowUp move the active option, Enter confirms it, and Escape
  closes the list;
- a polite live region announces the number of official cycles found;
- a visible zero-result message explains that the text must match the published
  catalogue;
- focus remains visible and touch targets are at least 44 CSS pixels.

### `/desde-fp`

Replace the native 187-option selector with the combobox. Add native selects
labelled exactly:

- `Filtrar por nivel`
- `Filtrar por familia profesional`

Filters apply only to the in-memory programs already loaded for the route. If a
filter hides the confirmed program, clear it and disable the CTA. Filters do
not alter the URL and do not fetch centers, offers, or outcome data.

Extract the current featured-program selection into
`featuredTrainingCoverage(rows)`. It returns at most three reviewed program
rows, one per family, in stable title/key order, without mutating its input.
The page shows those rows as a guided starting point with this scope statement:

`Ejemplos de ciclos con relaciones revisadas; no es el catálogo completo.`

Each example is a real link to its program route. Missing catalogue programs
are omitted rather than producing broken links.

### Home

Reuse the same `TrainingCombobox` in FP mode so the home page no longer exposes
another 187-option native select. Preserve the current mode choice and its
local-storage behavior. Occupation mode and its proven combobox remain
unchanged.

The coverage panel remains the explicit guided example. Its scope statement is
visible and its links continue to use only reviewed program coverage.

## 2. Province is context, not a center filter

On `/desde-fp`, label the control `Provincia para el contexto (opcional)` and
associate the visible hint with `aria-describedby`:

`Se usa solo para mostrar contexto provincial; no filtra los centros publicados.`

On the FP result route, show `Contexto provincial elegido: <provincia>` and
state that the published-center list remains complete. The query parameter
continues to scope provincial contract context and suitability guidance only.
It must not filter `studyCenters`, training offerings, official profiles, or
the base offer collection.

The province query accepts exactly one of the nine official Castilla y León
province names. Unknown, empty, or repeated values are ignored, are never
echoed back, and produce a short recovery notice; they must not cause a crash
or fabricate a match. The selector and result route share one typed province
constant and parser.

## 3. Shareable comparison state

### Canonical query

The canonical comparison form is:

`/comparar?level=higher&group=<groupKey>&group=<groupKey>&cohort=2019-2020&year=4`

- `level` is `intermediate` or `higher`.
- `group` is repeatable, unique, and contains one to three official group keys
  from the selected level.
- `cohort` is an exact cohort available for that level.
- `year` is `1`, `2`, `3`, or `4`.
- Parameter order is always `level`, repeated `group`, `cohort`, `year`.

Partial manual form state is not serialized. Selecting only a level, or
clearing the final group, leaves an empty query. Once one official group is
selected, the URL always carries the complete level/group/cohort/year tuple.

Implement parsing and serialization as pure functions in
`compareSelection.ts`. The parser is fail-closed. Missing optional state may
produce an empty manual form, but an unknown key, duplicate group, mixed level,
invalid cohort, invalid year, more than three groups, or conflicting duplicate
single-value parameters produces one visible invalid-link notice and no
comparison.

Form changes update `useSearchParams` with `{ replace: true }`. They must not
call `window.history` directly, so router basename behavior remains correct and
each checkbox does not add a browser-history entry.

### Contextual preselection from FP

The FP result action links to the stable public program key:

`/comparar?program=<programKey>`

The link itself performs no additional fetch. `/comparar` loads the program
slice with the manifest and outcomes, finds the exact official program, and
reuses the domain-owned `findTrainingOutcomeGroup` to resolve the published
outcome group. Only a `matchType: "cycle"` resolution selects the level/group
and replaces the transient URL with the canonical `group` query. A family-only
match is identified honestly as a broader reference and leaves manual
selection available. No match, ambiguous match, unsupported level, or unknown
program shows a clear notice and leaves manual selection available; it never
substitutes a family-level comparison as if it were the selected cycle.

The existing `Año todavía no observado` state remains explicit. It is not
silently changed to another year.

## 4. Printable orientation sheets

Create one reusable `PrintButton` with a Lucide printer icon. It is a native
button labelled `Imprimir esta orientación` by default and calls
`window.print()` exactly once. It does not modify URL, storage, network, or
application state.

Expose it only when meaningful results exist on:

- the FP result route;
- the occupation result route;
- the comparator when a valid comparison exists.

Print styles use `@page { size: A4 portrait; }` and a shared print contract:

- hide header navigation, footer navigation, forms, action controls, filter
  controls, skip link, and the print button;
- preserve title, selected official entity, decision summary, result evidence,
  public sources, dates, caveats, and limitations;
- use one readable column and avoid card breaks where supported;
- show link destinations for external sources only when they add evidence;
- do not rely on background color to convey meaning;
- comparator evidence grids become one column and do not overflow the page.

Browser print preview remains a manual release check because JSDOM cannot
validate pagination or the user's print-color settings.

## 5. Compact mobile navigation and freshness

At viewport widths below 48 rem, replace the wrapping six-link header with an
accessible disclosure menu. Desktop navigation remains visible and unchanged.

The menu button:

- uses the existing icon component with `menu` and `x` Lucide names;
- has an accessible name that changes between `Abrir menú principal` and
  `Cerrar menú principal`;
- controls the existing navigation with `aria-controls` and accurate
  `aria-expanded`;
- has a target of at least 44 by 44 CSS pixels.

The mobile menu closes after a route change, when Escape is pressed, and when a
navigation link is activated. Closing returns focus to the button only for an
explicit Escape action, not after normal navigation. When closed, hidden links
are not tabbable. No document-level horizontal overflow is allowed at 390 CSS
pixels.

The coverage heading becomes a vertical flow on mobile. The freshness badge is
allowed to wrap below the heading, has `max-width: 100%`, and never clips its
date at 390 CSS pixels.

## 6. Publication presentation and assets

Use the selected project-bound raster assets:

- `public/salida-cyl-social.png`, 1200 by 630, for Open Graph and summary-card
  previews;
- `public/salida-cyl-icon.png`, square favicon/app mark with a plain warm ivory
  background, for browser identity.

The social image reads `SALIDA CyL — FP y empleo con datos públicos`, uses no
people, rankings, scores, or fabricated numbers, and complements rather than
replaces the accessible HTML product name.

Production metadata is derived from `config/publication.json` during the
release build/packaging path. The source index may carry explicit owned
placeholders for local development, but it must not become a second production
URL source. Both envelopes declare the VPS canonical URL.

Required metadata:

- Spanish description grounded in the product's real function;
- canonical URL;
- Open Graph title, description, type `website`, URL, and social image;
- Twitter summary-large-image card fields;
- favicon and `theme-color`;
- robots policy allowing indexing and a canonical sitemap only if a real
  sitemap is generated;
- descriptive `package.json` name, description, keywords, author-independent
  project metadata, and homepage from the same publication contract where the
  format permits generation.

Task 5's one-build/two-envelope producer owns the final metadata rewrite and
must preserve exact core-byte equality. Metadata cannot introduce a
deployment-specific compiled asset path or a second publication truth.

## Verification

### Automated

- Unit tests cover combobox confirmation, keyboard behavior, accents, zero
  results, filters, featured coverage, province semantics, comparison
  parsing/serialization, contextual preselection, print invocation, mobile
  menu state, metadata rendering, and exact `programs`-only loading.
- Existing route-loading and abort tests remain green.
- Existing deferred outcome-loading test remains green.
- E2E covers the two primary search journeys, comparison deep link and reload,
  390-pixel menu/freshness behavior, document overflow, keyboard operation, and
  automated accessibility scans.
- Typecheck, lint, formatting, full unit suite, build, candidate boundary,
  asset budget, and distribution checks pass before Task 5 freezes identity.

### Manual

- Inspect home, FP search/results, occupation results, comparator, mobile menu,
  focus order, and zero/error/stale states in the in-app browser.
- Compare before/after screenshots at identical desktop and 390-by-844 mobile
  viewports.
- Verify keyboard-only operation and visible focus.
- Verify browser print preview for all three result types at A4 portrait.
- Verify social-card crop and favicon legibility at 16 and 32 pixels.

## Out of scope

- A purchased custom domain; changing the configuration later is supported.
- Deployment, DNS, pushing, merging, contest submission, or live evidence.
- Maps, PWA/offline installation, accounts, analytics, saved comparison
  profiles, AI recommendations, chat, opaque scores, rankings, or new datasets.
- Refactoring both domain comboboxes into a generic framework.
- Rebuilding or mutating generated data solely for presentation changes.

## Acceptance criteria

- Both FP entry points use the accessible searchable selector and arbitrary text
  never navigates.
- Level/family filters and guided examples work without additional data loads.
- Province copy and tests prove centers remain complete.
- A valid comparator URL reloads to the same evidence selection; invalid URLs
  fail closed with a visible recovery path.
- An FP result can open the comparator through `programKey` without eager
  outcome loading on the result page.
- All three result experiences offer a meaningful A4 print path.
- The mobile header is one compact disclosure, all targets are at least 44 CSS
  pixels, and the freshness date is fully visible at 390 CSS pixels.
- Metadata and assets identify SALIDA CyL consistently and use the configured
  temporary canonical URL.
- Existing evidence language, source links, privacy promises, loading/error/
  stale states, accessibility landmarks, and route titles do not regress.
- No publication or deployment occurs as part of this specification.
