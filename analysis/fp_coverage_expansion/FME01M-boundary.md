# FME01M — Mecanizado

## Decisión

`deferred`. El BOE correcto es el Real Decreto 1398/2007 (BOE-A-2007-20203). Se corrige la URL BOE errónea a la URL completa `eli/es/rd/2007/10/29/1398`, y los siete outputs BOE se revisan exhaustivamente: seis outputs se aceptan como CNO 7322, 7323 y 7324 (tres ocupaciones), un output se rechaza como CNO 3139. No existe reconciliación demostrable: TodoFP no contiene el seed congelado "Mecánico de mecanizado" y el título genérico de TodoFP ("Técnico en Mecanizado") no equivale literalmente al seed del ranking. Por tanto, ninguna relación se publica; las aceptadas se retienen solo como auditoría.

**No se publican** relaciones `approved` en `training-occupation-links` para FME01M. Se mantiene el rechazo 3139; no se crean aliases ni ofertas adicionales.

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

- **Cero relaciones publicadas**: `publishedRelationKeys` vacío. Las tres relaciones aceptadas (7322, 7323, 7324) solo se conservan como evidencia de auditoría.
- **1 relación rechazada**: `FME01M|occupation:cno11:3139` (Operador de robots industriales).
- **Seed no reconciliado**: "Mecánico de mecanizado" no aparece en TodoFP; no existe `seedReconciliations`.
- **Cero aliases** añadidos. Sin delta de ofertas ni recursos modificados fuera de las rutas permitidas.

## Causa del cierre fail-closed

TodoFP presenta "Técnico en Mecanizado" pero no contiene el seed congelado "Mecánico de mecanizado" del ranking. El inventario exhaustivo del BOE-A-2007-20203 enumera siete salidas profesionales, ninguna de las cuales equivale literalmente al seed. Las fronteras CNO-11 (7322, 7323, 7324) son válidas como clasificación auditada pero no se publican hasta que exista reconciliación demostrable entre el seed y el inventario BOE.
