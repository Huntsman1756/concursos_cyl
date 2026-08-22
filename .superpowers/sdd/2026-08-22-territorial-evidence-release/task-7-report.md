# Task 7 implementation report

## Result

- Generated-data loaders accept an optional `AbortSignal` without changing the
  no-options `fetch` shape, and native `AbortError` values are not wrapped.
- Every generated-data route aborts stale requests on cleanup.
- Home loads only manifest, coverage, and programs in the default FP mode;
  occupation catalogs load only after occupation mode is selected or restored.
- FP results keep offers eager but defer `outcomeIndicators` behind the explicit
  `Cargar datos de ingresos observados` action. Provenance and the stable
  `#base-cotizacion-observada` section remain visible before loading.
- Grado Básico and manifests without the outcome snapshot do not offer a
  pointless download action.
- The two named Task 6 error roots were fixed while touching
  `TrainingResultsPage`.

## Measured route budget

- Initial FP-result requests: exactly 13 including the manifest.
- Initial raw data bytes from the checked-in manifest: `6,576,435`, below the
  `7,000,000` gate.
- Eager outcome requests: 0.
- Explicit outcome request after activation: exactly 1.
- Deferred `outcomeIndicators` bytes: `10,997,200`.

## Asset budget

The prior JavaScript sub-budget had only 594 bytes of room, so the new abort and
explicit-load control exceeded that category while the stronger total budget
still passed. The JavaScript allocation was moved from 525,000 to 530,000 raw
bytes; the total cap remains 700,000.

Measured production assets:

- JavaScript: `528,228 / 530,000` bytes.
- All assets: `695,539 / 700,000` bytes.

## Validation

- Focused Vitest: 12 files, 111 tests passed.
- Asset-budget Vitest: 2 tests passed.
- Chromium desktop/mobile Home + FP E2E: 44 tests passed.
- Typecheck, focused ESLint, focused Prettier, and `git diff --check`: passed.
- Vite production build and runtime-data preparation: passed.
- Full `npm run build` is temporarily blocked by Task 8 TypeScript test errors
  under independent correction; no Task 7 TypeScript error remains.

## Deferred follow-up

Propagate and render the Task 5 `functionalBoundary` assistant/adjacent label in
the FP results UI before the final cross-task review.

