# FME01M — Mecanizado

## Decisión

`deferred`. El ranking congelado aporta el seed `Mecánico de mecanizado`, pero el inventario BOE exhaustivo no contiene ese literal. El BOE correcto es el Real Decreto 1398/2007; el ranking conserva una URL BOE errónea (1399/2007), por lo que el expediente no puede cerrarse como `completed` ni publicar una relación.

No se añaden aliases ni cambios en `data/curated`, `public` o snapshots. Se conservan únicamente relaciones auditadas con límites CNO-11 explícitos para una revisión posterior.

## Fuentes revisadas

- [TodoFP — Técnico en Mecanizado](https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/mecanizado.html): título de Grado Medio, 2.000 horas y salidas profesionales.
- [BOE — Real Decreto 1398/2007](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2007-20203), artículo 7.2: inventario normativo de puestos.
- [INE — CNO-11, notas explicativas](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf): fronteras 7322, 7323, 7324 y 3139.
- [SEPE — perfil de ajustadores y operadores de máquinas-herramientas](https://www.sepe.es/dctm/perfiles%3A09019af480267d76/RElTRVdFQg%3D%3D/AJUSTADORES%2520Y%2520OPERADORES%2520DE%2520M_QUINAS-HERRAMIENTAS.pdf): evidencia de mercado para CNO 7323; no sustituye la clasificación INE ni reconcilia el seed.

## Inventario BOE y límites CNO

| Orden | Output BOE                                                                                                   | Decisión                 | Límite CNO                                                                                               | Motivo                                             |
| ----: | ------------------------------------------------------------------------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
|     1 | Ajustador operario de máquinas herramientas.                                                                 | accepted → 7323          | 7323 regula y maneja máquinas-herramienta de precisión.                                                  | Coincidencia directa.                              |
|     2 | Pulidor de metales y afilador de herramientas.                                                               | accepted → 7324          | 7324 pule metales y afila herramientas.                                                                  | Encabezado CNO literal.                            |
|     3 | Operador de máquinas para trabajar metales.                                                                  | accepted → 7323          | 7323 cubre máquinas-herramienta para piezas de metal.                                                    | Límite funcional directo, sin ampliar a 8121/8122. |
|     4 | Operador de máquinas herramientas.                                                                           | accepted → 7323          | 7323 incluye literalmente operadores de máquinas herramientas.                                           | Ejemplo CNO literal.                               |
|     5 | Operador de robots industriales.                                                                             | rejected → 3139 auditado | 3139 identifica controladores de robótica industrial, una frontera técnica distinta.                     | No se inventa equivalencia operador/controlador.   |
|     6 | Trabajadores de la fabricación de herramientas, mecánicos y ajustadores, modelistas matriceros y asimilados. | accepted → 7322          | 7322 es el encabezado CNO de fabricación de herramientas, mecánico-ajustadores, modelistas y matriceros. | Coincidencia de clasificación exacta.              |
|     7 | Tornero, fresador y mandrinador.                                                                             | accepted → 7323          | 7323 incluye torneros de piezas de metal y máquinas de torno, fresadora y mandrinadora.                  | Frontera de máquina-herramienta.                   |

## Reconciliación fail-closed

TodoFP y el BOE identifican el mismo título, pero el seed congelado `Mecánico de mecanizado` no aparece literalmente en los siete outputs BOE. El candidato congelado `occupation:cno11:7322` tampoco representa por sí solo todo el perímetro: INE separa 7322 (fabricación de herramientas) de 7323 (máquinas-herramienta) y 7324 (pulido/afilado). SEPE aporta contexto de demanda para 7323, no una relación título–CNO exacta.

Por esas dos discrepancias, el estado terminal es `deferred`. El hash y el snapshot solo documentan la recomputación vacía sobre el snapshot público congelado. `publicParity` queda fail-closed: ninguna relación aceptada se publica y la relación rechazada 3139 no puede filtrarse al recurso público.
