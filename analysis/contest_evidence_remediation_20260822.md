# Contest-evidence remediation — 2026-08-22

## Decision

The following five approved FP↔CNO-11 relationships are removed from the curated publication and from the reproducible reviewed-coverage allow-list. No replacement, alias, fallback, or inferred relationship is added.

| Key      | Published evidence | Remediation reason                                          |
| -------- | ------------------ | ----------------------------------------------------------- |
| `FME02B  | 7314`              | “Auxiliar de montador / montadora de estructuras metálicas” | The source output is auxiliary-level while CNO `7314` represents a qualified boundary; the evidence does not preserve the required responsibility level. |
| `EOC02SD | 3129`              | “Delineante de obra civil.”                                 | A specific `3110` boundary exists for the technical drafting role; the generic `3129` mapping is not safe to retain.                                     |
| `IMP01S  | 2640`              | “Técnica / técnico comercial.”                              | Generic commercial work does not establish the image-personal industry or medical-sector scope.                                                          |
| `AGA01B  | 4121`              | “Auxiliar de almacén de flores.”                            | Warehouse assistance does not establish the administrative-task boundary represented by `4121`.                                                          |
| `COM01M  | 5300`              | “Comerciante de tienda.”                                    | Retail commerce does not establish proprietor or store-manager responsibility.                                                                           |

## Invariants

- The curated link count decreases from 254 to 249.
- The number of programs with an approved link decreases from 122 to 121 because `EOC02SD` becomes uncovered; reviewed base coverage remains 104.
- The five keys are absent from `data/curated/training-occupation-links.json`, `ACCEPTED_RELATION_KEYS`, the derived graph, and the regenerated snapshot.
- The existing occupation catalog is unchanged. No new CNO code is inferred and no replacement mapping is published.
- The research queue remains at 104 reviewed bases, 15 completed no-match bases, and 35 pending candidates.

## Verification

The absence assertions are in `scripts/data/restoreFrontierReviewedCoverage.test.ts` and `scripts/data/validateCuratedMappings.test.ts`. The focused restoration and curated-mapping suites pass after the removals. The snapshot and manifest are regenerated only after the current unpublished snapshot is retired; historical snapshots remain byte-identical.

## Final evidence remediation (round 5)

The retained `ELE02B|9700` relationship now uses the exact official quote
“Peones de industrias manufactureras.”. The retained `SSC01S|2252`
relationship now uses the contiguous BOE phrase “Educador o educadora infantil
en primer ciclo de educación infantil”.

`HOT02S|3510` is removed from curated data and restoration coverage, without a
replacement: “Agente de viajes” corresponds to CNO `4421`, not `3510`.
The resulting publication contains 248 mappings; reviewed base coverage stays
at 104 and program-key coverage at 121. The active snapshot is regenerated
after retiring the prior unpublished snapshot; August 8/9 snapshots remain
unchanged.
