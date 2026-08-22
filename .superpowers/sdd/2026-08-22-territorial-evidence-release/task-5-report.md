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
| `EOC01B` | `https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html` | `EOC01B|7121` — `Ayudante de albañil.`; `EOC01B|7191` — `Ayudante de mantenimiento básico de edificios.`; `EOC01B|7211` — `Ayudante de escayolista.`; `EOC01B|7231` — `Ayudante de pintor / pintora.`; `EOC01B|7240` — `Ayudante en pavimentación para urbanización.`; `EOC01B|9602` — `Peón especializado.` |
| `EOC02M` | `https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/obras-interior-decoracion-rehabilitacion.html` | `EOC02M|7211` — `Juntera / juntero de placa de yeso laminado.`; `EOC02M|7231` — `Pintor / pintora de obra.`; `EOC02M|7240` — `Colocador / colocadora de pavimentos ligeros, en general.` |
| `FME01E` | `https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/ce-fabricacion-aditiva.html` | `FME01E|2482` — `Diseñador 3D por escaneado.` |
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

The generated immutable public snapshot is
`public/data/v1/snapshots/20260822074315030-a6fc9479d93c/`, with active
manifest snapshot ID `20260822074315030-a6fc9479d93c`. The matrix reports the
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

The final Git commit uses the requested subject:
`feat: expand reviewed FP occupation coverage`.
