# Frontier review — FP coverage priority wave 2

**Reviewed:** 2026-08-21  
**Scope:** `QUI01E`, `SAN01S`/`SAN01SD`, `SAN02S`, `SEA01M`/`SEA01MD`, and `TMV03M`  
**Evidence packet:** `analysis/fp_coverage_priority_20260821_wave2/`

## Decision

Accept exactly twelve conservative training-to-CNO relations and add exactly
seven existing official CNO-11 identities to the curated catalog in Task 2.
`SAN02S|3316` is the only direct `official_output`; all other accepted rows
use `reviewed_relationship`. No alias is accepted.

## Accepted set

| Relation key    | CNO-11 label                                                  | Type                    | TodoFP output quote used                                    | Frontier rationale                                                                                               |
| --------------- | ------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `QUI01E\|3141`  | Técnicos en ciencias biológicas (excepto en áreas sanitarias) | `reviewed_relationship` | «Experta / experto en cultivos celulares»                   | Cellular culture is biological laboratory work; 3141 preserves the function without implying clinical diagnosis. |
| `SAN01S\|3317`  | Técnicos en audioprótesis                                     | `reviewed_relationship` | «Audioprotésica / audioprotésico.»                          | Exact audioprosthetic function.                                                                                  |
| `SAN01SD\|3317` | Técnicos en audioprótesis                                     | `reviewed_relationship` | «Audioprotésica / audioprotésico.»                          | Same output on the distance modality.                                                                            |
| `SAN02S\|3316`  | Técnicos en prótesis dentales                                 | `official_output`       | «Técnica / técnico especialista en prótesis dental.»        | Direct official dental-prosthesis technician output.                                                             |
| `SAN02S\|2640`  | Profesionales de ventas técnicas y médicas (excepto las TIC)  | `reviewed_relationship` | «Comercial en la industria dental o depósitos dentales.»    | Technical/medical dental sales; rejects generic commercial substitution.                                         |
| `SEA01M\|5931`  | Bomberos (excepto forestales)                                 | `reviewed_relationship` | «Bombera / bombero de aeropuertos.»                         | Civil non-forest firefighter output.                                                                             |
| `SEA01MD\|5931` | Bomberos (excepto forestales)                                 | `reviewed_relationship` | «Bombera / bombero de aeropuertos.»                         | Same output on the distance modality.                                                                            |
| `SEA01M\|5932`  | Bomberos forestales                                           | `reviewed_relationship` | «Bombera / bombero forestal.»                               | Forest-specific firefighter output.                                                                              |
| `SEA01MD\|5932` | Bomberos forestales                                           | `reviewed_relationship` | «Bombera / bombero forestal.»                               | Same output on the distance modality.                                                                            |
| `SEA01M\|5993`  | Agentes forestales y medioambientales                         | `reviewed_relationship` | «Vigilante de incendios forestales.»                        | Forest/environmental patrol boundary; no broad security alias.                                                   |
| `SEA01MD\|5993` | Agentes forestales y medioambientales                         | `reviewed_relationship` | «Vigilante de incendios forestales.»                        | Same output on the distance modality.                                                                            |
| `TMV03M\|7403`  | Mecánicos y ajustadores de maquinaria agrícola e industrial   | `reviewed_relationship` | «Electromecánica / electromecánico de maquinaria agrícola.» | Agricultural/industrial machinery maintenance boundary; not vehicle repair or machinery operation.               |

## Seven new occupation identities

These identities already exist in `data/curated/official-occupations.json`
and are copied with approved review metadata by Task 2:

|   Code | Official catalog label                                        |
| -----: | ------------------------------------------------------------- |
| `3141` | Técnicos en ciencias biológicas (excepto en áreas sanitarias) |
| `3316` | Técnicos en prótesis dentales                                 |
| `3317` | Técnicos en audioprótesis                                     |
| `5931` | Bomberos (excepto forestales)                                 |
| `5932` | Bomberos forestales                                           |
| `5993` | Agentes forestales y medioambientales                         |
| `7403` | Mecánicos y ajustadores de maquinaria agrícola e industrial   |

`2640` is already present in the curated catalog and is used only for
`SAN02S|2640`; it is not part of the seven new occupation identities.

Classification identity is bounded by the [BOE CNO-11 decree](https://www.boe.es/eli/es/rd/2010/11/26/1591)
and the [INE explanatory notes](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf).

## Rejected alternatives and boundaries

|   Code | Rejection                                                                                                                                                                |
| -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `3314` | Clinical-diagnostic laboratory technicians do not establish cellular culture as clinical diagnosis and do not replace dental or audioprosthetic technicians.             |
| `3124` | Electronics is a component-level boundary; none of the accepted outputs establishes a generic electronics occupation.                                                    |
| `3315` | Orthoprosthetics is not dental prosthetics or audioprosthetics.                                                                                                          |
| `3510` | Generic commercial agents lose the technical/medical sales boundary of «Comercial en la industria dental o depósitos dentales.»; 2640 is the narrower reviewed relation. |
| `5622` | Emergency-health technicians do not represent the civilian firefighter, forest-firefighter, or forest-patrol outputs; the military-emergency output remains unpublished. |
| `7401` | Vehicle mechanics do not represent agricultural/industrial machinery maintenance.                                                                                        |
| `3126` | Generic mechanical technicians do not preserve the qualified machinery boundary.                                                                                         |
| `7521` | Electrical-equipment repair is not the machinery-maintenance boundary established by TMV03M.                                                                             |
| `8321` | Agricultural machinery operators operate machinery; they are not a substitute for electromechanical maintenance and repair.                                              |

The `Capataz-Encargada / encargado de extinción de incendios forestales.`
output is also rejected because it is supervisory/management work. The
`Técnica / técnico en emergencias de las FF.AA.` output is rejected as a
military-emergency role. Accessory sales, diagnosis, and generic management
outputs are not collapsed into accepted operator relations.

## Publication boundary

- No wave alias is created.
- No relation outside the twelve-key set is approved.
- Existing snapshot `20260821162954121-087e3c5155c6` is immutable.
- Task 2 must make the red mapping expectations green by adding seven
  occupations and twelve links; Task 3 owns queue, snapshot, and freeze
  regeneration.

The pre-publication catalog was intentionally at 228 approved relations, 86
reviewed base qualifications, and 102 modality keys. This wave originally
published totals of 240, 91, and 109 respectively. The subsequent catalog
revalidation documented in `no-match-catalog-revalidation.md` corrected
`AGA01S|5993`; the current frozen totals are 241 approved relations, 92
reviewed base qualifications, 110 modality keys, 15 no-match bases, and 47
pending bases.
