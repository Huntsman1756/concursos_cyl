# Revisión Frontier — oleada conservadora FP→CNO

Fecha de revisión: 2026-08-22. La oleada publica exactamente 13 claves. Cada
relación apunta a una ficha TodoFP ya curada y conserva una cita literal de su
salida profesional. El código CNO-11 y su etiqueta se verificaron en BOE/INE.

## Decisiones publicables

| Clave          | Tipo                    | Etiqueta CNO-11                                                                                        | Cita literal                                                                                              |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `MAM02M\|7812` | `reviewed_relationship` | Ajustadores y operadores de máquinas para trabajar la madera                                           | «Operador / operadora de máquinas fijas para fabricar productos de madera.»                               |
| `SSC06S\|5894` | `reviewed_relationship` | Instructores de autoescuela                                                                            | «Profesor de formación vial.»                                                                             |
| `AGA03M\|6120` | `reviewed_relationship` | Trabajadores cualificados en huertas, invernaderos, viveros y jardines                                 | «Trabajador / trabajadora de huertas, viveros y jardines.»                                                |
| `INA03M\|8160` | `official_output`       | Operadores de máquinas para elaborar productos alimenticios, bebidas y tabaco                          | «Operador / operadora de máquinas y equipos para el tratamiento y elaboración de productos alimentarios.» |
| `TMV05M\|7404` | `reviewed_relationship` | Mecánicos y ajustadores de maquinaria naval y ferroviaria                                              | «Técnica / técnico en mantenimiento de sistemas de tracción y motores.»                                   |
| `ARG01M\|7621` | `reviewed_relationship` | Trabajadores de procesos de preimpresión                                                               | «Técnica / técnico en preimpresión.»                                                                      |
| `SSC04S\|3714` | `official_output`       | Promotores de igualdad de oportunidades entre mujeres y hombres                                        | «Promotor / promotora para la igualdad efectiva de mujeres y hombres.»                                    |
| `ELE05S\|3125` | `official_output`       | Técnicos en electrónica, especialidad en electromedicina                                               | «Técnica / técnico en electrónica, especialidad en electromedicina.»                                      |
| `ELE05S\|7532` | `official_output`       | Instaladores y reparadores en electromedicina                                                          | «Instalador-reparador / instaladora-reparadora en electromedicina.»                                       |
| `ENA02S\|3131` | `reviewed_relationship` | Técnicos en instalaciones de producción de energía                                                     | «Técnica / técnico de operación y mantenimiento de centrales hidroeléctricas.»                            |
| `ENA04S\|3132` | `reviewed_relationship` | Técnicos en instalaciones de tratamiento de residuos, de aguas y otros operadores en plantas similares | «Operador / operadora de planta de tratamiento de agua de abastecimiento.»                                |
| `TCP02B\|7835` | `official_output`       | Tapiceros, colchoneros y afines                                                                        | «Tapicera / tapicero de muebles.»                                                                         |
| `QUI01M\|8131` | `official_output`       | Operadores en plantas industriales químicas                                                            | «Operador / operadora principal en instalaciones de tratamiento químico.»                                 |

## Criterio y cautelas

- `official_output` se reserva a salidas TodoFP que nombran directamente la
  ocupación o una especialidad inequívoca: `INA03M|8160`, `SSC04S|3714`,
  `ELE05S|3125`, `ELE05S|7532`, `TCP02B|7835` y `QUI01M|8131`.
- `reviewed_relationship` conserva una relación prudente cuando la salida
  TodoFP es más específica, funcional o de nivel distinto que el grupo CNO-11:
  `MAM02M|7812`, `SSC06S|5894`, `AGA03M|6120`, `TMV05M|7404`, `ARG01M|7621`,
  `ENA02S|3131` y `ENA04S|3132`. La etiqueta CNO no se presenta como una
  equivalencia laboral exhaustiva.
- `7812` y `6120` ya estaban en el catálogo curado; solo se añaden los otros
  11 registros de ocupación.

## Exclusiones expresas

No se publica `AGA03M|5220`, ninguna variante `D`, ningún alias y ninguna
relación fuera de las 13 claves del contrato. Los 15 programas con resultado
`reviewed-no-publishable-match` conservan su decisión y se revalidan por
separado contra el SHA nuevo; no se convierten en mappings en esta oleada.
