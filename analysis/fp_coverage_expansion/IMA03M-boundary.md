# IMA03M — Mantenimiento Electromecánico

## Decisión

`deferred`. TodoFP y el BOE identifican el mismo título, pero el seed congelado `Mantenedor electromecánico` no es una salida BOE literal. Se conserva el inventario completo de nueve salidas en orden normativo y se cierran las fronteras CNO-11 sin publicar relaciones.

No se crean aliases. `data/curated`, `public` y los snapshots permanecen intactos; la paridad pública y el delta de ofertas son vacíos.

## Fuentes oficiales

- [TodoFP — Técnico en Mantenimiento Electromecánico](https://www.todofp.es/que-estudiar/familias-profesionales/instalacion-mantenimiento/mantenimiento-electromecanico.html): identidad del programa.
- [BOE — Real Decreto 1589/2011](https://www.boe.es/eli/es/rd/1589/2011): artículo 7, inventario exhaustivo de ocupaciones.
- [INE — CNO-11, notas explicativas](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf): límites 7403, 7510, 7521, 7531, 8201 y 8202.
- [SEPE — ficha anual de Técnico en Mantenimiento Electromecánico](https://www.sepe.es/HomeSepe/es/que-es-observatorio/informacion-titulaciones/buscador-titulaciones/titulacion-detalle-anual~__titulaciones-fp__2025_335220027504-T-cnico-en-mantenimiento-electromec-nico~.html): corroboración laboral; no sustituye la clasificación CNO exacta.

## Inventario BOE y revisión uno-a-uno

| Orden | Output BOE                                                                            | Límite CNO-11 auditado                                                                      | Decisión |
| ----: | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------- |
|     1 | Mecánico de mantenimiento.                                                            | 7403 maquinaria agrícola e industrial; no reconcilia el seed literal.                       | rejected |
|     2 | Montador industrial.                                                                  | 8201 maquinaria mecánica o 8202 equipos eléctricos/electrónicos; frontera no resuelta.      | rejected |
|     3 | Montador de equipos eléctricos.                                                       | 8202 ensambladores de equipos eléctricos y electrónicos.                                    | rejected |
|     4 | Montador de equipos electrónicos.                                                     | 8202 ensambladores de equipos eléctricos y electrónicos.                                    | rejected |
|     5 | Mantenedor de línea automatizada.                                                     | 7403, 7521 o 7531 según componente mecánico, eléctrico o electrónico; frontera no resuelta. | rejected |
|     6 | Montador de bienes de equipo.                                                         | 8201 o 8202 según el subconjunto; frontera no resuelta.                                     | rejected |
|     7 | Montador de automatismos neumáticos e hidráulicos.                                    | 7403 como límite de maquinaria industrial; no reconcilia el seed literal.                   | rejected |
|     8 | Instalador electricista industrial.                                                   | 7521 para equipos eléctricos en fábricas; no reconcilia el seed literal.                    | rejected |
|     9 | Electricista de mantenimiento y reparación de equipos de control, medida y precisión. | 7521 o 7531 según equipo eléctrico o electrónico; frontera no resuelta.                     | rejected |

El CNO 7510 se conserva como exclusión de límite: describe electricistas de construcción y afines, no una relación industrial exacta para este inventario. El expediente es `deferred` por fallo de reconciliación literal del seed y permanece fail-closed.
