# SEA01M / SEA01MD — Emergencias y Protección Civil

**Review date:** 2026-08-21  
**TodoFP:** <https://www.todofp.es/que-estudiar/familias-profesionales/seguridad-medio-ambiente/emergencias-proteccion-civil.html>  
**Classification:** [BOE CNO-11](https://www.boe.es/eli/es/rd/2010/11/26/1591), [INE explanatory notes](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf)

## Exact outputs

TodoFP records the same twelve outputs for the base and distance modalities:

- «Bombera / bombero de aeropuertos.»
- «Bombera / bombero de empresa privada.»
- «Bombera / bombero de otros servicios en entes públicos, entre otros.»
- «Bombera / bombero de servicios consorciados.»
- «Bombera / bombero de servicios de comunidad autónoma.»
- «Bombera / bombero de servicios mancomunados.»
- «Bombera / bombero de servicios municipales.»
- «Bombera / bombero de servicios provinciales.»
- «Bombera / bombero forestal.»
- «Capataz-Encargada / encargado de extinción de incendios forestales.»
- «Técnica / técnico en emergencias de las FF.AA.»
- «Vigilante de incendios forestales.»

## Accepted relations

| Key             | CNO-11 label                          | Type                    | Evidence quote                       | Rationale                                                                                                                                    |
| --------------- | ------------------------------------- | ----------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `SEA01M\|5931`  | Bomberos (excepto forestales)         | `reviewed_relationship` | «Bombera / bombero de aeropuertos.»  | Airport, private, municipal, provincial, consorciado, mancomunado, and other public-service firefighter outputs are non-forest firefighting. |
| `SEA01MD\|5931` | Bomberos (excepto forestales)         | `reviewed_relationship` | «Bombera / bombero de aeropuertos.»  | The distance modality has the same official output and receives the same relation.                                                           |
| `SEA01M\|5932`  | Bomberos forestales                   | `reviewed_relationship` | «Bombera / bombero forestal.»        | The forest-firefighter output matches the forest-specific CNO-11 boundary.                                                                   |
| `SEA01MD\|5932` | Bomberos forestales                   | `reviewed_relationship` | «Bombera / bombero forestal.»        | The distance modality has the same forest-firefighter output.                                                                                |
| `SEA01M\|5993`  | Agentes forestales y medioambientales | `reviewed_relationship` | «Vigilante de incendios forestales.» | The forest-fire patrol output is retained at the forest/environmental-agent boundary; no generic security or emergency alias is added.       |
| `SEA01MD\|5993` | Agentes forestales y medioambientales | `reviewed_relationship` | «Vigilante de incendios forestales.» | The distance modality has the same forest-fire patrol output.                                                                                |

## Rejected alternatives

| Candidate      | Reason                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `5622`         | «Técnica / técnico en emergencias de las FF.AA.» is military emergency work, not a civilian emergency-health technician relationship for this wave.                            |
| Capataz output | «Capataz-Encargada / encargado de extinción de incendios forestales.» is a management/supervision output; it is not collapsed into an operator-level firefighter or agent row. |

The forest/non-forest split is preserved, and no generic management, military,
or emergency alias is published.
