# Frontier proposal — EOC02M

## Accepted

| Key     | CNO-11 identity | Type                                       | Exact TodoFP output     |
| ------- | --------------- | ------------------------------------------ | ----------------------- |
| `EOC02M | 7231`           | Pintores y empapeladores                   | `reviewed_relationship` | `Pintor / pintora de obra.`                                 |
| `EOC02M | 7240`           | Soladores, colocadores de parquet y afines | `reviewed_relationship` | `Colocador / colocadora de pavimentos ligeros, en general.` |

The painting and pavement outputs remain reviewed relationships because the CNO
groups are broader than the individual outputs. The plasterboard output is
retained in the source artifact but not published as a CNO relation.

## Why `EOC02M|7211` is deferred

The exact TodoFP output for the deferred candidate is:

> Juntera / juntero de placa de yeso laminado.

The BOE CNO-11 table identifies `7211` as `Escayolistas` and `7199` as `Otros
trabajadores de las obras estructurales de construcción no clasificados bajo
otros epígrafes` ([Real Decreto 1591/2010](https://www.boe.es/eli/es/rd/2010/11/26/1591)).
The INE explanatory notes, p. 249, include the exact 7199 example:

> Colocadores de prefabricados ligeros (pladur)

The same INE artifact, pp. 249–250, defines 7211 with:

> Los escayolistas instalan, mantienen y reparan tabiques y enlucen muros y
> techos de edificios y los decoran con adornos o revestimientos de escayola en
> interiores y exteriores de estructuras.

The 7212 entry is also distinct and defines paste/mortar work as:

> Los aplicadores de revestimientos de pasta y mortero instalan, mantienen y
> reparan tabiques y enlucen muros y techos de edificios y los decoran con
> adornos o revestimientos de cemento y otros materiales similares en interiores
> y exteriores de estructuras.

The TodoFP output describes joining a plasterboard product, but the official INE
artifact explicitly gives “pladur” prefabricated-lightweight placement as a
7199 example and defines 7211 around escayola finishing. There is no
authoritative crosswalk resolving the output to 7199 versus 7211 (or another
boundary). The conservative decision is to defer `EOC02M|7211`, publish no
replacement 7199 relation, and avoid any conclusion based on material-word or
title similarity. This is functional evidence review, not offer evidence.

Official INE artifact: [CNO-11 Notas explicativas](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf), pp. 249–250.

## Explicit rejection

`EOC02M|3202` is rejected: the profile's team-lead/manager output does not
establish the CNO supervisor group. `EOC02M|7212` is also rejected: the
available output does not support the paste-and-mortar applicator boundary.
`EOC02M|7211` remains deferred for the ambiguity above. No offer text, alias,
or title-only inference is used.
