# MAM01M — Carpintería y Mueble

## Decisión

`deferred`. El seed congelado del ranking, `Carpintero de madera`, no coincide exactamente con ninguno de los seis outputs exhaustivos del BOE. El contrato permite conservar la evidencia terminal, pero impide cerrar el slot como `completed` mientras el seed no se reconcilie con la fuente autoritativa.

No se añaden alias. Se aprueban únicamente las dos relaciones que tienen evidencia CNO-11 directa y acotada: 7812 para operación de máquinas de madera y 8209 para montaje de productos de madera. Esas relaciones quedan en curación para la siguiente revisión, pero no se publican porque el estado es `deferred`.

## Fuentes oficiales

- [TodoFP — Técnico en Carpintería y Mueble](https://www.todofp.es/que-estudiar/familias-profesionales/madera-mueble-corcho/carpinteria-mueble.html): título de Grado Medio, 2.000 horas y salidas profesionales.
- [BOE — Real Decreto 1128/2010](https://www.boe.es/boe/buscar/doc.php?id=BOE-A-2010-15356): identificación del título y lista normativa de puestos de trabajo.
- [INE — CNO-11, notas explicativas](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf): límites de 7812, 7820, 8209 y 3206.

## Inventario BOE y decisión CNO

| Orden | Output BOE                                                    | Decisión                 | Evidencia CNO-11                                                                                                                       | Motivo                                                                               |
| ----: | ------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
|     1 | Operador de máquinas fijas para fabricar productos de madera. | accepted → 7812          | `7812 Ajustadores y operadores de máquinas para trabajar la madera`; incluye operadores de máquinas para elaborar productos de madera. | Coincidencia directa de función y material.                                          |
|     2 | Operador de prensas.                                          | accepted → 7812          | 7812 incluye operaciones de prensado en el trabajo de piezas de madera.                                                                | La fuente no separa una ocupación de prensas de madera distinta.                     |
|     3 | Operador-armador en banco.                                    | accepted → 8209          | 8209 incluye ensambladores de productos de madera y materiales afines.                                                                 | El output describe montaje/ensamblaje de producto de madera, sin ampliar a ebanista. |
|     4 | Montador-ensamblador de elementos de carpintería.             | accepted → 8209          | 8209 incluye ensambladores de productos de madera y ensambladores de puertas.                                                          | Coincidencia directa de montaje y ensamblaje.                                        |
|     5 | Barnizador-lacador.                                           | accepted → 8209          | 8209 incluye técnicos en acabado de muebles de madera.                                                                                 | El output de acabado queda acotado al producto de madera del título.                 |
|     6 | Responsable de sección de acabados.                           | rejected → 3206 auditado | 3206 describe supervisores de industrias de la madera, pero no identifica de forma exacta una sección de acabados del título.          | Se rechaza por frontera de supervisión insuficientemente específica.                 |

## Reconciliación y límites

TodoFP y BOE identifican el mismo título de Grado Medio de la familia Madera, Mueble y Corcho. El inventario BOE exhaustivo contiene seis labels y se conserva en el expediente en el orden de la fuente. El seed congelado `Carpintero de madera` no aparece literalmente en ese inventario; por ello el estado terminal es `deferred` y no se publica ninguna relación.

La auditoría no crea el seed, no incorpora el candidato 7811 por intuición y no genera snapshot. Los deltas calculados sobre el snapshot público congelado son vacíos; la curación añadida queda pendiente de una futura reconciliación del seed y de la operación de publicación.
