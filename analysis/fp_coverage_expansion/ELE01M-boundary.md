# ELE01M — Instalaciones Eléctricas y Automáticas

## Decisión

`deferred`. El ranking congelado aporta el seed `Instalador electricista`, pero el artículo 7.2 del BOE no contiene ese literal: enumera nueve ocupaciones y puestos diferenciados. El inventario muestra límites CNO-11 no intercambiables: electricistas de construcción y afines (7510), equipos eléctricos (7521), tecnologías de la información y las comunicaciones (7533) y montadores-instaladores de placas solares (7294).

No se añaden aliases, ocupaciones ni enlaces a `data/curated`. `public` y sus snapshots permanecen intactos; el delta de ofertas es vacío. `publicParity` es fail-closed.

## Fuentes oficiales

- [TodoFP — Técnico en Instalaciones Eléctricas y Automáticas](https://www.todofp.es/que-estudiar/familias-profesionales/electricidad-electronica/instalaciones-electricas-automaticas.html): identidad del programa y perfiles profesionales.
- [BOE — Real Decreto 177/2008](https://www.boe.es/eli/es/rd/2008/02/08/177): artículo 7.2, inventario normativo exhaustivo y orden de las nueve salidas.
- [INE — CNO-11, notas explicativas](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf): encabezados y límites de 7510, 7521, 7533 y 7294.
- [SEPE — ficha anual de Técnico en Instalaciones Eléctricas y Automáticas](https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-titulaciones/buscador-titulaciones/titulacion-detalle-anual~__titulaciones-fp__2025_335200027304-T-cnico-en-instalaciones-el-ctricas-y-autom-ticas~.html): corroboración de mercado y ocupaciones observadas; no sustituye la clasificación CNO exacta.

## Inventario BOE y revisión uno-a-uno

| Orden | Output BOE                                                    | Frontera CNO-11 revisada                                                              | Decisión |
| ----: | ------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------- |
|     1 | Instalador-mantenedor electricista.                           | 7510, electricistas de construcción y afines; no reconcilia literalmente el seed.     | rejected |
|     2 | Electricista de construcción.                                 | 7510, límite de construcción; distinto del seed congelado.                            | rejected |
|     3 | Electricista industrial.                                      | 7510 no demuestra una clase industrial separada en esta evidencia.                    | rejected |
|     4 | Electricista de mantenimiento.                                | 7521, equipos eléctricos; no prueba el seed genérico.                                 | rejected |
|     5 | Instalador-mantenedor de sistemas domóticos.                  | 7521 o 7533 según equipo eléctrico frente a comunicaciones; el BOE no selecciona uno. | rejected |
|     6 | Instalador-mantenedor de antenas.                             | 7533, tecnologías de la información y las comunicaciones.                             | rejected |
|     7 | Instalador de telecomunicaciones en edificios de viviendas.   | 7533, telecomunicaciones explícitas.                                                  | rejected |
|     8 | Instalador-mantenedor de equipos e instalaciones telefónicas. | 7533, equipos e instalaciones de telecomunicaciones.                                  | rejected |
|     9 | Montador de instalaciones de energía solar fotovoltaica.      | 7294, montadores-instaladores de placas de energía solar.                             | rejected |

La reconciliación exacta falla antes de cualquier publicación: `Instalador electricista` no es una salida BOE literal. TodoFP y SEPE corroboran el ámbito profesional y sus subocupaciones, pero no eliminan la ambigüedad ni autorizan aliases inventados. El expediente queda deferred.
