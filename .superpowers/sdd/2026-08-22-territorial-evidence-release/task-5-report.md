# Task 5 report — defer ambiguous plasterboard mapping and retain snapshots

## Implementation

The final curated wave publishes 16 reviewed FP–CNO relationships. The
original Task 5 candidate `EOC02M|7211` is deliberately deferred: the official
evidence does not provide an authoritative crosswalk from plasterboard
jointing to CNO 7211. The three explicitly rejected relations remain absent:
`EOC01B|7212`, `EOC02M|3202`, and `EOC02M|7212`.

The source data now has 264 approved links, 131 approved/public occupations,
138 curated occupation rows, 21 unchanged aliases, and 130 distinct reviewed
program keys. `EOC02M|7211` is absent from the curated links and the restore
allowlist. `IMS03S` remains the single `reviewed-no-publishable-match` outcome
against catalog SHA
`0c3224887ccb75806a32186e671e8e1ea670e84e17b85b42e105f19e88751cef`; `IFC03E`
remains pending and is not forced into the outcome schema.

The snapshot builder now treats a previously active snapshot as immutable
history during replacement publication: it is never renamed or deleted while
the replacement manifest is committed. All nine snapshots already versioned
in HEAD, plus the restored pre-wave snapshot, are explicitly pinned. The
pre-wave evidence snapshot `20260822074315030-a6fc9479d93c` is additionally
excluded from revocation scanning until release evidence references the
replacement. A regeneration test proves every pinned ID remains byte-identical
after four later builds.

## Exact official evidence by program

All accepted rows use `relationshipType: reviewed_relationship`,
`reviewStatus: approved`, review date `2026-08-22`, and mapping version
`1.0.0`. The program quotes are bounded excerpts copied from official TodoFP
professional-profile records in `data/curated/professional-profiles.json`.
Classification identity is from the registered official CNO-11 catalogue,
the BOE decree, and INE explanatory notes. Offer text and title-only inference
are not relation evidence.

| Program | Official TodoFP URL | Published relation(s) and exact output quote |
| --- | --- | --- |
| `IMS01S` | `https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/animaciones3d-juegos-entornos-interactivos.html` | `2484` — `Grafista digital.`; `2713` — `Desarrollador / desarrolladora de aplicaciones y productos audiovisuales multimedia.` |
| `AGA02S` | `https://www.todofp.es/que-estudiar/familias-profesionales/agraria/paisajismo-medio-rural.html` | `6120` — `Encargada / encargado o capataz agrícola de huertas, viveros y jardines, en general.` |
| `COM01E` | `https://www.todofp.es/que-estudiar/familias-profesionales/comercio-marketing/ce-posicionamiento-buscadores-comunicacion-rrss.html` | `2651` — `Especialistas en captación y fidelización de clientes (Inbound Marketing Specialist).` |
| `ELE01E` | `https://www.todofp.es/que-estudiar/familias-profesionales/electricidad-electronica/ce-ciberseguridad-tecnologias-operacion.html` | `2729` — `Analista de ciberseguridad en entornos de la operación.` |
| `EOC01B` | `https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html` | `7121` — `Ayudante de albañil.`; `7191` — `Ayudante de mantenimiento básico de edificios.`; `7211` — `Ayudante de escayolista.`; `7231` — `Ayudante de pintor / pintora.`; `7240` — `Ayudante de solador / soladora.`; `9602` — `Peón especializado.` |
| `EOC02M` | `https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/obras-interior-decoracion-rehabilitacion.html` | `7231` — `Pintor / pintora de obra.`; `7240` — `Colocador / colocadora de pavimentos ligeros, en general.` |
| `FME01E` | `https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/ce-fabricacion-aditiva.html` | `2482` — `Experto en diseño de producto para impresión 3D.` |
| `IMA02S` | `https://www.todofp.es/que-estudiar/familias-profesionales/instalacion-mantenimiento/mnto-inst-termicas-fluidos.html` | `7250` — `Frigorista.` |
| `IMS04S` | `https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/sonido-audiovisuales-espectaculos.html` | `3831` — `Técnica / técnico de grabación de sonido en estudio.` |

### Deferred EOC02M|7211 evidence

The official TodoFP output is exactly `Juntera / juntero de placa de yeso
laminado.`. The official [INE CNO-11 explanatory notes](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf), p. 249, place the exact
example `Colocadores de prefabricados ligeros (pladur)` under CNO `7199`.
The same official notes identify CNO `7211` as `Escayolistas` and describe:
`Los escayolistas instalan, mantienen y reparan tabiques y enlucen muros y
techos de edificios y los decoran con adornos o revestimientos de escayola en
interiores y exteriores de estructuras.` The [official BOE RD 1591/2010 CNO-11 table](https://www.boe.es/eli/es/rd/2010/11/26/1591) confirms the distinct CNO identities.

Neither official artifact supplies a crosswalk that distinguishes the
plasterboard output from 7199 or establishes 7211. No alternative 7199
mapping is invented; no conclusion is drawn from the shared word `yeso`,
material similarity, a title, or an offer. The bounded packet is in
`analysis/fp_coverage_priority_20260822_wave3/sources/EOC02M.txt` and
`proposals/EOC02M.md`.

## TDD and validation output

RED was observed before the fix: the new defer assertion failed while
`EOC02M|7211` was still present (1 failing file, 3 failing tests, 32 passing
tests in the combined run), and the active-snapshot test failed with the
expected `ENOENT` because the old builder quarantined the active directory.

GREEN results after the data and builder changes:

- `scripts/data/validateCuratedMappings.test.ts` and
  `scripts/data/restoreFrontierReviewedCoverage.test.ts`: 35/35 passed.
- The complete five-file Task 5 data suite (including schemas,
  `validatePublicDistribution`, and the complete builder): 139/139 passed;
  the builder alone is 78/78.
- The Task 5 routes pass targeted ESLint and targeted Prettier checks.
- `rtk npm run analysis:fp:research-queue`: completed successfully; derived
  queue counts are 113 reviewed / 26 pending / 15 no-match.
- `rtk npm run data:build`: completed successfully; the final active snapshot
  is `20260822085631889-7bbe69380f6d`.
- The subsequent-generation verification found 22 tracked files, 22 local
  files, and 0 byte mismatches for the restored 07:43 snapshot against commit
  `542cb952c11a067f4c497c3bf8403c3a691ddc7d`.

The required repository-wide checks were also run. `typecheck` passed. The
repository `lint` and `format:check` remain red only on concurrent Task 6/7 UI
files. `build` remains red in concurrent UI/release tests with TS2322, TS2339,
and TS2698 diagnostics. The full Vitest run reported 9 failing files before
the Task 5 distribution-test fixture was updated; that one data failure is now
green, leaving only the concurrent UI/release failures and the known freeze /
submission boundary checks.

The canonical matrix check is intentionally deferred to Task 8 because the
concurrent generator now fails closed while the curated source is dirty. The
exact command/output was:

```text
rtk npx tsx scripts/analysis/buildContestEvidenceMatrix.ts --check
Error: Contest evidence source is dirty: data/curated/training-occupation-links.json. Commit the source before building the matrix.
```

No `scripts/analysis/**`, `scripts/release/**`, `src/**`, coverage-freeze, or
submission document was edited by this fix. Task 8 must run the matrix
generator after this source commit; the expected matrix population is 264,
not the currently checked-in historical 265-row artifact.

## Derived before/after counts

| Derived value | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Approved training–occupation links | 248 | 264 | +16 |
| Approved/public occupations | 123 | 131 | +8 |
| Curated occupation rows | 130 | 138 | +8 |
| Occupation aliases | 21 | 21 | 0 |
| Research queue reviewed bases | 104 | 113 | +9 |
| Research queue pending bases | 35 | 26 | −9 |
| Research queue no-match bases | 15 | 15 | 0 |
| Distinct reviewed modality keys | 121 | 130 | +9 |
| Evidence matrix relations | 248 | 264 expected; generator pending | +16 expected |

## Generated artifacts and changed files

The active manifest points to
`public/data/v1/snapshots/20260822085631889-7bbe69380f6d/`. The restored
pre-wave snapshot
`public/data/v1/snapshots/20260822074315030-a6fc9479d93c/` remains alongside it
and is pinned by `scripts/data/buildSnapshots.ts`.

Task 5 paths changed in this round are:

- `data/curated/training-occupation-links.json`;
- `scripts/data/restoreFrontierReviewedCoverage.ts` and its test;
  `scripts/data/validateCuratedMappings.test.ts`; and
  `scripts/data/buildSnapshots.ts` and its test;
  `scripts/data/validatePublicDistribution.test.ts`;
- `analysis/fp_coverage_priority_20260822_wave3/README.md`,
  `batch-contract.json`, `frontier-review.md`, the EOC02M proposal/source
  packet, and this report;
- `public/data/v1/manifest.json`, the active 08:56 snapshot, and the restored
  07:43 snapshot.

## Self-review and concerns

I verified the 16 accepted keys, four non-published states (three rejected and
one deferred), eight approved occupation additions inherited from the Task 5
source commit, 21 aliases, the IMS03S singleton, IFC03E pending state, exact
official URLs/quotes, review metadata, and the absence of EOC02M|7211 from
both data and restore paths. The EOC01B assistant/adjacent functional-boundary
metadata remains machine-readable in the data/graph layer; the UI display gap
is owned by Task 7 and was not touched.

The only unresolved validation artifact is the contest evidence matrix: its
current generator belongs to concurrent Task 8 and requires a committed clean
source boundary. Task 8 must regenerate and commit the 264-row matrix after
this commit. The historical freeze/submission checks remain outside this
source-data fix. The final implementation commit SHA is supplied in the
handoff because recording a commit's own hash inside that commit is
self-referential.
