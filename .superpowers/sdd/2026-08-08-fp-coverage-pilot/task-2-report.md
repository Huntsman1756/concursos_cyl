# Task 2 report — SAN21

## Outcome

`SAN21` completed with two approved official-output relationships. The manifest-addressed snapshot is `20260808172031375-7c88ca187340`; the existing matcher contract reports 43 newly reached offers for the accepted-relationship union.

## Sources considered

| Source | Review date | Purpose | Relevant exact quote |
| --- | --- | --- | --- |
| https://todofp.es/dam/jcr%3Aaf5b68fd-e75c-493b-94ff-0565d3886473/san21cuidauxilenfermeria-pdf.pdf | 2026-08-08 | Ministry title supplement: identity and professional outputs | “Auxiliar de Enfermería/Clínica..” |
| https://todofp.es/dam/jcr%3Aaf5b68fd-e75c-493b-94ff-0565d3886473/san21cuidauxilenfermeria-pdf.pdf | 2026-08-08 | Ministry title supplement: primary-care output | “Auxiliar de Atención primaria.” |
| https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf | 2026-08-08 | Official CNO-11 classification and boundaries | “5611 Auxiliares de enfermería hospitalaria” |
| https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf | 2026-08-08 | Official CNO-11 classification and boundaries | “5612 Auxiliares de enfermería de atención primaria” |

TodoFP identifies the programme as *Técnico en Cuidados Auxiliares de Enfermería* and lists hospital/clinical, primary-care, dental, home-care, geriatric, paediatric, sterilisation, special-unit and mental-health outputs. The INE CNO-11 notes were used to classify only the outputs with a direct, scope-consistent four-digit category; wording alone was not treated as a CNO crosswalk.

## Relationship dispositions

| CNO-11 | Disposition | Coded reason | Evidence |
| --- | --- | --- | --- |
| 5611 | Accepted | `official_programme_output` | TodoFP output above; INE CNO-11 defines 5611 and includes clinical, geriatric and mental-health auxiliary examples. |
| 5612 | Accepted | `official_programme_output` | TodoFP primary-care output above; INE CNO-11 defines 5612 as primary-care nursing auxiliaries. |
| 5629 | Rejected | `official_evidence_indirect` | https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf — “Ayudantes de dentista”. TodoFP's dental output does not provide a direct CNO-11 crosswalk, so no mapping was published. |
| 5710 | Rejected | `official_evidence_indirect` | https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf — “Auxiliares de enfermería en el hogar (con labores de cuidador)”. The qualified CNO example is not an official programme-to-CNO equivalence. |

Rejected CNO candidates are retained only as rejected curated catalog records so the pilot disposition is auditable; they are excluded from generated public resources.

## RED/GREEN evidence

- RED: `scripts/analysis/validateFpCoveragePilot.test.ts` expected the two reviewed SAN21 records in the manifest-addressed public snapshot and failed with `expected []` before curation/build.
- GREEN: the same focused test passed after the curated entries and standard snapshot build; no generated snapshot was hand-edited.

## Measurement

- Attempt start: `2026-08-08T17:15:59.200Z`.
- Coverage method: existing manifest/matcher contract, `accepted_relationship_union`.
- Coverage result: 43 offers in snapshot `20260808172031375-7c88ca187340`.
- Phase effort: research 2, implementation 1, test 3 and self-review 1 minute. Independent Sol review is outside this executor's elapsed phases and remains for aggregate reconciliation.

## Files and gates

Changed: curated occupations, aliases and links; pilot results; focused pilot and curated-mapping tests; manifest-addressed generated snapshots; this report.

Run: immediate pilot validation after the in-progress transition; focused RED and GREEN tests; curated-mapping tests; standard data build; pilot validator; lint, production build, licence, Prettier and diff checks. The legacy-flat-snapshot test briefly exceeded Vitest's default timeout in a broad batch but passed in its isolated rerun.

## Concerns

No generic “auxiliar de enfermería” alias was published because it cannot distinguish CNO-11 5611 from 5612. Dental and home-care outputs remain unmapped pending direct official CNO crosswalk evidence.
