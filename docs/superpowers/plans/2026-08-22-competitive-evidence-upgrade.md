# SALIDA CyL Competitive Evidence Upgrade

## Objective

Strengthen SALIDA CyL as an explainable transition tool from vocational
training to employment without changing its core purpose. Add official,
time-scoped labour-market evidence, extend only defensible FP-to-CNO coverage,
improve the decision flow, and finish with reproducible contest evidence.

## Global Constraints

- FP remains the primary entry point and user goal.
- Use only official primary sources for published labour and classification
  claims.
- Never describe registered contracts as vacancies, people or employment
  probability.
- Never describe EDUCAbase contribution bases as an individual expected salary.
- Every published figure carries source, period, territorial scope and limits.
- CNO relationships require TodoFP/BOE output evidence plus INE/BOE/SEPE
  classification evidence; ambiguous relationships remain unpublished.
- Preserve immutable snapshots, hashes, rollback support and the public data
  catalogue.
- Follow test-driven development: each production behaviour is preceded by a
  failing test that fails for the expected reason.
- Build on the current visual system; do not redesign unrelated screens.
- No agent may push, merge, deploy or submit the contest entry.

## Task 1: Normalize official SEPE occupation-market pages

Create a fixture-driven parser and strict schema for the official SEPE monthly
occupation page. It must normalize the reporting period, CNO code and label,
national registered-contract and registered-unemployment totals and variations,
contract characteristics where present, and province rows for the nine Castilla
y Leon provinces. Missing optional sections must remain explicitly absent, not
zero. Reject a mismatched CNO code, malformed period, duplicate province or
unknown province in the CyL subset. Store source URL, retrieval timestamp and
the required attribution. Do not make live network calls in tests and do not
integrate the resource into snapshots yet.

Allowed paths:

- `data/schemas/sepeOccupationMarket.ts`
- `data/schemas/sepeOccupationMarket.test.ts`
- `scripts/data/parseSepeOccupationMarket.ts`
- `scripts/data/parseSepeOccupationMarket.test.ts`
- `tests/fixtures/sepe-occupation-market/**`

Validation:

- `npm test -- data/schemas/sepeOccupationMarket.test.ts scripts/data/parseSepeOccupationMarket.test.ts`
- `npm run lint`
- `npm run format:check`

## Task 2: Publish SEPE occupation evidence as a snapshot resource

Build a deterministic capture/normalization command around Task 1, add the
resource to the immutable snapshot manifest and resource catalogue, and expose
a selective client loader. Capture failures must preserve the last valid
snapshot and must not publish a partial month. Include provenance and legal
attribution. Tests use fixtures or injected fetches; no nondeterministic network
tests.

The checked-in capture is `data/curated/sepe-occupation-market.json`, a strict
array of Task 1 records sorted by CNO code. The capture command receives an
explicit `YYYY-MM` period and the reviewed occupation catalogue; it writes a
temporary candidate, validates the complete candidate, then renames it over the
previous capture. Any fetch, parse, coverage, schema or rename failure leaves
the previous file byte-for-byte unchanged. It must never encode unavailable
sections as zero. The actual capture may cover only official occupation codes
for which SEPE publishes the requested period, but an absent page must be
reported rather than silently skipped.

The snapshot resource key is `sepeOccupationMarket`, file name
`sepe-occupation-market.json`, and source kind `sepeOccupationMarket`. It is an
additive non-foundation resource. Older manifests without the key remain valid;
`loadSepeOccupationMarket(manifest)` returns `null` only when the manifest does
not advertise it, and throws when advertised bytes fail validation. The
snapshot build reads the validated checked-in capture and includes it in the
canonical source hash, immutable resource set, record counts and open-data
catalogue. A build failure preserves the previously active manifest and
snapshot under the existing manifest-last transaction.

Allowed paths:

- `data/curated/sepe-occupation-market.json`
- `data/schemas/sepeOccupationMarket.ts`
- `data/schemas/sepeOccupationMarket.test.ts`
- `data/schemas/generatedResourceCatalog.ts`
- `data/schemas/generatedResourceCatalog.test.ts`
- `scripts/data/captureSepeOccupationMarket.ts`
- `scripts/data/captureSepeOccupationMarket.test.ts`
- `scripts/data/buildSnapshots.ts`
- `scripts/data/buildSnapshots.test.ts`
- `src/data/generatedDataClient.ts`
- `src/data/generatedDataClient.test.ts`
- `package.json`

Validation:

- `npm test -- data/schemas/sepeOccupationMarket.test.ts data/schemas/generatedResourceCatalog.test.ts scripts/data/captureSepeOccupationMarket.test.ts scripts/data/buildSnapshots.test.ts src/data/generatedDataClient.test.ts`
- `npm run lint`
- `npm run format:check`
- `npm run typecheck`

## Task 3: Add the occupation labour-evidence panel

After capturing the current occupation flow, add a panel to occupation results
and FP-derived occupation routes. Show contracts, registered unemployment,
trend and provincial distribution with plain-language definitions, source,
period and limitations. Provide honest loading, unavailable and zero states.
Do not add ranking, scoring, predictions or international data to the user
interface. Verify desktop and mobile flows with screenshots and accessibility
checks.

## Task 4: Publish the next reviewed FP-to-CNO coverage wave

Use the completed ranks 1-47 research. Select a first coherent batch of strong
relationships, add any required CNO records from the existing official 502-code
catalogue, preserve reviewed-no-match outcomes for ambiguous programmes, and
regenerate a new immutable snapshot. Every relation must have an exact official
quote and URL. Review the batch independently before publication.

## Task 5: Competitive UX and performance pass

Use current screenshots of the FP-to-occupation and occupation-to-FP flows.
Fix only evidence-backed friction. Preserve the current design language. Verify
mobile reflow, keyboard access, target size, focus, source visibility, data
loading and bundle/distribution budgets.

## Task 6: Release and contest evidence

Run the complete submission gate, refresh deployment metadata and screenshots
against one exact commit and snapshot, verify GitHub Pages and VPS, and update
the jury memo against all seven equally weighted Products and Services
criteria. Keep the 2022 comparison factual: the public record evidences an FP
offer web application, but not the absence of undocumented features. Do not
submit the official application without a final explicit authorization.
