# FME01M — Mecanizado

## Decisión

`approved` desde el 21 de agosto de 2026. El BOE correcto es el Real Decreto 1398/2007 (BOE-A-2007-20203). Sus siete outputs se revisaron exhaustivamente: seis sustentan los CNO 7322, 7323 y 7324; el output de operador de robots industriales permanece fuera porque no demuestra equivalencia exacta con CNO 3139.

La decisión `deferred` anterior queda superada. El seed preliminar "Mecánico de mecanizado" servía para priorizar investigación, no como requisito normativo de publicación. Las relaciones se publican por el inventario oficial del título y su clasificación CNO trazable, sin crear aliases ni ampliar ofertas.

## Fuentes revisadas

- [TodoFP — Técnico en Mecanizado](https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/mecanizado.html): título de Grado Medio, 2.000 horas y salidas profesionales.
- [BOE — Real Decreto 1398/2007 (BOE-A-2007-20203)](https://www.boe.es/eli/es/rd/2007/10/29/1398), artículo 7.2: inventario exhaustivo de siete outputs profesionales.
- [INE — CNO-11, notas explicativas](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf): fronteras 7322, 7323, 7324 y 3139.

## Inventario BOE y límites CNO

| Orden | Output BOE                                                                                                   | Decisión        | Límite CNO                                                                                               | Motivo                                             |
| ----: | ------------------------------------------------------------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
|     1 | Ajustador operario de máquinas herramientas.                                                                 | accepted → 7323 | 7323 regula y maneja máquinas-herramienta de precisión.                                                  | Coincidencia directa.                              |
|     2 | Pulidor de metales y afilador de herramientas.                                                               | accepted → 7324 | 7324 pule metales y afila herramientas.                                                                  | Encabezado CNO literal.                            |
|     3 | Operador de máquinas para trabajar metales.                                                                  | accepted → 7323 | 7323 cubre máquinas-herramienta para piezas de metal.                                                    | Límite funcional directo, sin ampliar a 8121/8122. |
|     4 | Operador de máquinas herramientas.                                                                           | accepted → 7323 | 7323 incluye literalmente operadores de máquinas herramientas.                                           | Ejemplo CNO literal.                               |
|     5 | Operador de robots industriales.                                                                             | rejected → 3139 | 3139 identifica controladores de robótica industrial, una frontera técnica distinta.                     | No se inventa equivalencia operador/controlador.   |
|     6 | Trabajadores de la fabricación de herramientas, mecánicos y ajustadores, modelistas matriceros y asimilados. | accepted → 7322 | 7322 es el encabezado CNO de fabricación de herramientas, mecánico-ajustadores, modelistas y matriceros. | Coincidencia de clasificación exacta.              |
|     7 | Tornero, fresador y mandrinador.                                                                             | accepted → 7323 | 7323 incluye torneros de piezas de metal y máquinas de torno, fresadora y mandrinadora.                  | Frontera de máquina-herramienta.                   |

## Publicación

- **3 relaciones publicadas**: CNO 7322, 7323 y 7324, con cita oficial en cada relación.
- **1 relación rechazada**: `FME01M|occupation:cno11:3139` (Operador de robots industriales).
- **Seed no reconciliado**: "Mecánico de mecanizado" no aparece en TodoFP; no existe `seedReconciliations`.
- **Cero aliases** añadidos. Sin delta de ofertas ni recursos modificados fuera de las rutas permitidas.

## Límite conservado

El seed "Mecánico de mecanizado" no se publica ni se usa como evidencia. La aplicación muestra únicamente las tres relaciones derivadas de salidas explícitas del BOE; CNO 3139 sigue excluido.
