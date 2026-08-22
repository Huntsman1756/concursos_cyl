# Task 5 report — curate the next official FP–CNO evidence wave

## Implementation

Task 5 publishes exactly 17 new approved FP–CNO relationships. Every row uses
`reviewed_relationship`, with `reviewStatus: approved`, `reviewedAt:
2026-08-22`, and `mappingVersion: 1.0.0`. Program evidence is limited to the
registered TodoFP professional-profile records and their official URLs; CNO
identity is copied from the registered official occupation catalogue and its
INE/BOE sources. No job-offer text, title-only inference, or new alias is used.

The eight approved occupation records added to the curated catalogue are:
`2482`, `2484`, `2729`, `3831`, `7191`, `7211`, `7231`, and `9602`. The
occupation aliases file was not modified. The restore allowlist and historical
reviewed-source fallback now include exactly the Task 5 relation wave in
addition to the existing coverage.

## Exact official evidence by program

The exact source URLs and TodoFP output quotes below are copied from
`data/curated/professional-profiles.json` and are also preserved in the bounded
source excerpts under `analysis/fp_coverage_priority_20260822_wave3/sources/`.

| Program | Official TodoFP URL | Relation and exact TodoFP output quote |
| --- | --- | --- |
| `IMS01S` | `https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/animaciones3d-juegos-entornos-interactivos.html` | `IMS01S|2484` — `Grafista digital.`; `IMS01S|2713` — `Desarrollador / desarrolladora de aplicaciones y productos audiovisuales multimedia.` |
| `AGA02S` | `https://www.todofp.es/que-estudiar/familias-profesionales/agraria/paisajismo-medio-rural.html` | `AGA02S|6120` — `Encargada / encargado o capataz agrícola de huertas, viveros y jardines, en general.` |
| `COM01E` | `https://www.todofp.es/que-estudiar/familias-profesionales/comercio-marketing/ce-posicionamiento-buscadores-comunicacion-rrss.html` | `COM01E|2651` — `Especialistas en captación y fidelización de clientes (Inbound Marketing Specialist).` |
| `ELE01E` | `https://www.todofp.es/que-estudiar/familias-profesionales/electricidad-electronica/ce-ciberseguridad-tecnologias-operacion.html` | `ELE01E|2729` — `Analista de ciberseguridad en entornos de la operación.` |
| `EOC01B` | `https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html` | `EOC01B|7121` — `Ayudante de albañil.`; `EOC01B|7191` — `Ayudante de mantenimiento básico de edificios.`; `EOC01B|7211` — `Ayudante de escayolista.`; `EOC01B|7231` — `Ayudante de pintor / pintora.`; `EOC01B|7240` — `Ayudante de solador / soladora.`; `EOC01B|9602` — `Peón especializado.` |
| `EOC02M` | `https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/obras-interior-decoracion-rehabilitacion.html` | `EOC02M|7211` — `Juntera / juntero de placa de yeso laminado.`; `EOC02M|7231` — `Pintor / pintora de obra.`; `EOC02M|7240` — `Colocador / colocadora de pavimentos ligeros, en general.` |
| `FME01E` | `https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/ce-fabricacion-aditiva.html` | `FME01E|2482` — `Experto en diseño de producto para impresión 3D.` |
| `IMA02S` | `https://www.todofp.es/que-estudiar/familias-profesionales/instalacion-mantenimiento/mnto-inst-termicas-fluidos.html` | `IMA02S|7250` — `Frigorista.` |
| `IMS04S` | `https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/sonido-audiovisuales-espectaculos.html` | `IMS04S|3831` — `Técnica / técnico de grabación de sonido en estudio.` |

The three explicit exclusions remain absent: `EOC01B|7212`,
`EOC02M|3202`, and `EOC02M|7212`. CNO `3202` and `7212` remain rejected.

## No-match and pending state

The occupation catalogue changed from SHA-256
`aef572d36bbb84b2eb5e426103c78e2241856f5b492770390f8c7240b2a0bb61` to
`0c3224887ccb75806a32186e671e8e1ea670e84e17b85b42e105f19e88751cef`. All 15
existing no-match outcomes were revalidated to the new hash. `IMS03S` remains
exactly one `reviewed-no-publishable-match` outcome: the new `3831` identity is
used for the distinct IMS04S sound-recording output and does not establish an
IMS03S production or event-management role. `IFC03E` remains a queue candidate
and is absent from the outcomes document because the schema has no
`insufficient` state.

## TDD and validation output

RED was observed before the curated records were added. The restore test
reported the 17 new keys missing from the accepted historical source (7 tests
passed, 1 failed). The matrix test reported the old 248-row source and sample
metadata instead of the expected 265-row/250-not-sampled wave (2 tests failed).
After the evidence packet, curated rows, restore fallback, matrix generator,
and generated resources were implemented, the focused validation finished
GREEN:

- focused Task 5 suite: 5 files, 125 tests passed;
- research-queue check: 8 tests passed;
- `lint`, `format:check`, `typecheck`, and `build`: passed;
- matrix canonical generator and `--check`: passed;
- `git diff --check`: passed.

The full repository suite was also run once. It reported 96 files passed, 23
skipped, and 3 failed (931 tests passed, 187 skipped, 2 failed plus one
30-second timeout). The deterministic failures are the intentionally stale
pre-wave contest boundary: the existing `coverage-freeze.json` does not list
the newer `sepeOccupationMarket` resource, and the historical fallback test
expects that resource to be an array. The remaining timeout was in the
parallel full-suite run of a buildSnapshots staleness test; the focused
Task 5 suite including buildSnapshots passed. Task 5 does not regenerate the
coverage freeze or submission documents.

## Derived before/after counts

| Derived value | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Approved training–occupation links | 248 | 265 | +17 |
| Approved/public occupations | 123 | 131 | +8 |
| Curated occupation rows | 130 | 138 | +8 |
| Occupation aliases | 21 | 21 | 0 |
| Research queue reviewed bases | 104 | 113 | +9 |
| Research queue pending bases | 35 | 26 | −9 |
| Research queue no-match bases | 15 | 15 | 0 |
| Distinct reviewed modality keys | 121 | 130 | +9 |
| Evidence matrix relations | 248 | 265 | +17 |

The original generated immutable public snapshot was
`public/data/v1/snapshots/20260822074315030-a6fc9479d93c/`. The follow-up
regenerated active immutable public snapshot is
`public/data/v1/snapshots/20260822082339635-2706ba4b5a53/`, with active
manifest snapshot ID `20260822082339635-2706ba4b5a53`. The matrix reports the
existing bounded independent sample as 15 PASS / 250 not sampled / non-
exhaustive; its audit source remains the e41c boundary while the matrix
population is the current 265 approved relations.

## Changed files

- Curated source: `data/curated/occupations.json` and
  `data/curated/training-occupation-links.json`.
- Restore and focused tests: `scripts/data/restoreFrontierReviewedCoverage.ts`,
  `scripts/data/restoreFrontierReviewedCoverage.test.ts`,
  `scripts/data/validateCuratedMappings.test.ts`,
  `data/schemas/fpCoverageResearchOutcomes.test.ts`, and
  `scripts/data/buildSnapshots.test.ts`.
- Canonical matrix implementation/test and generated matrix JSON/Markdown.
- Canonical research outcomes and queue JSON/Markdown.
- Evidence packet `analysis/fp_coverage_priority_20260822_wave3/`.
- Generated `public/data/v1/manifest.json` and the immutable snapshot directory
  listed above.

## Self-review and concerns

The 17 accepted identities, 8 new occupation codes, three exclusions, 21
aliases, IMS03S singleton outcome, IFC03E pending candidate, evidence URLs,
quotes, review dates, relationship types, counts, and snapshot resources were
checked against the repository schemas and canonical generators. No coverage
freeze or submission document changed, and `occupation-aliases.json` has no
diff. The only handoff concerns are the pre-existing freeze/submission
boundary failures recorded above and the bounded-sample provenance distinction;
neither justifies changing the Task 5 source data or fabricating evidence.

The original Task 5 source-data commit used the subject
`feat: expand reviewed FP occupation coverage`. The follow-up fix commit is the
commit reported with this follow-up section.

## Follow-up review fixes — Luna Max

The follow-up review required tighter evidence boundaries without changing the
17 accepted keys or the derived coverage counts. A RED-first pass added
assertions before implementation: 4 focused tests failed and 110 passed because
the old FME01E/EOC01B quotes and missing functional-boundary metadata were still
present. The GREEN implementation then:

- replaced `FME01E|2482` with the exact official TodoFP output `Experto en
  diseño de producto para impresión 3D.`;
- replaced `EOC01B|7240` with `Ayudante de solador / soladora.`;
- added strict machine-readable `functionalBoundary` metadata to all six
  EOC01B assistant/peon rows (`assistant` for 7121/7191/7211/7231/7240,
  `adjacent` for 9602, and `fullOccupationQualification: false` for all), and
  propagated it through the derived graph JSON and CSV; and
- added exact official INE/BOE excerpts and an auditable 7211-versus-7199/7212
  rationale to the EOC02M evidence packet. The official sources are the BOE
  CNO-11 table at
  https://www.boe.es/eli/es/rd/2010/11/26/1591 and the INE CNO-11 explanatory
  notes, pp. 249–250, at
  https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf.

The official EOC02M evidence is sufficient, so no accepted relation was
deferred: 7211 remains the only plasterboard-jointing relation; 7199 and 7212
remain unpublished. The exact before/after derived counts remain 265 links,
131 approved/public occupations, 138 curated rows, 21 aliases, queue
113/26/15, 130 distinct reviewed modality keys, and 265 matrix relations. The
active immutable snapshot regenerated for this follow-up is
`public/data/v1/snapshots/20260822082339635-2706ba4b5a53/`, with manifest active
snapshot ID `20260822082339635-2706ba4b5a53`. The final fix commit SHA and
subject are recorded in the handoff accompanying this report.

### Follow-up changed files

- `data/curated/training-occupation-links.json`;
  `data/schemas/curatedMappings.ts`; and `data/schemas/openData.ts`.
- `scripts/data/restoreFrontierReviewedCoverage.ts` and its test;
  `scripts/data/validateCuratedMappings.test.ts`;
  `scripts/data/buildDerivedFpOccupationGraph.ts` and its test; and
  `scripts/data/buildSnapshots.test.ts`.
- `analysis/fp_coverage_priority_20260822_wave3/` source/proposal evidence,
  `README.md`, `frontier-review.md`, and `batch-contract.json`;
  `analysis/contest_evidence_matrix.json`; and the research queue JSON/Markdown.
- `public/data/v1/manifest.json`, the new immutable snapshot directory above,
  and the stale pre-fix snapshot directory revoked by the canonical retention
  and distribution checks.
- This report at
  `.superpowers/sdd/2026-08-22-territorial-evidence-release/task-5-report.md`.

### Follow-up validation record

The exact validation commands completed successfully after regeneration:

- RED: the pre-implementation focused run failed 4 tests and passed 110;
  after implementation the focused 6-file run passed 128/128.
- `npm run analysis:fp:research-queue:check`: 8/8 tests passed.
- `npx tsx scripts/analysis/buildContestEvidenceMatrix.ts --check`: passed.
- `npm run lint`, `npm run format:check`, `npm run typecheck`, and
  `npm run build`: passed. The build also passed runtime-data, asset-budget,
  and distribution checks.
- Full `npm test -- --reporter=dot`: 97 files passed, 23 skipped, and 2 files
  failed; Vitest reported 950 tests passed, 187 skipped, and 1 failed. The two
  failures are the known pre-freeze/submission boundary checks: the historical
  contest freeze lacks `sepeOccupationMarket`, and the historical fallback
  still expects that resource to be an array. They are outside this data and
  evidence fix; the focused Task 5 suite remains fully green.
- `git diff --check`: passed.

The fix was based on parent/source HEAD `1aa691f` (`fix: close important
accessibility findings`); the final fix commit SHA is supplied by the Git
handoff because the report itself is included in that commit.

### Explicit carry/display concern

The conservative boundary is carried in the validated link schema and in both
derived graph resources, so data consumers can read `roleLevel` and
`fullOccupationQualification`. The current `TrainingResultsPage` still renders
the CNO label without a boundary badge; this follow-up intentionally does not
touch that UI route because Task 7 owns the display change. The six EOC01B rows
are therefore retained in the data wave, with the UI carry/display follow-up
explicitly required before a final release review. No Task 7 route is included
in this commit.
