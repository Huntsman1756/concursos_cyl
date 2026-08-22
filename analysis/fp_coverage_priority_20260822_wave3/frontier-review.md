# Frontier review — FP coverage priority wave 3

**Reviewed:** 2026-08-22  
**Scope:** nine queue bases and exactly 17 accepted relation keys  
**Evidence packet:** `analysis/fp_coverage_priority_20260822_wave3/`

## Decision

The wave publishes exactly the 17 conservative `reviewed_relationship` rows
listed below. Program evidence is the exact TodoFP output quote in the local
official professional-profile record. CNO identity is the official registered
identity checked against BOE/INE. No offer text, title-only inference, or alias
is used.

| Relation | Official CNO-11 label | Exact TodoFP output quote                                                                    |
| -------- | --------------------- | -------------------------------------------------------------------------------------------- |
| `IMS01S  | 2484`                 | Diseñadores gráficos y multimedia                                                            | `Grafista digital.`                                                                     |
| `IMS01S  | 2713`                 | Analistas, programadores y diseñadores Web y multimedia                                      | `Desarrollador / desarrolladora de aplicaciones y productos audiovisuales multimedia.`  |
| `AGA02S  | 6120`                 | Trabajadores cualificados en huertas, invernaderos, viveros y jardines                       | `Encargada / encargado o capataz agrícola de huertas, viveros y jardines, en general.`  |
| `COM01E  | 2651`                 | Profesionales de la publicidad y la comercialización                                         | `Especialistas en captación y fidelización de clientes (Inbound Marketing Specialist).` |
| `ELE01E  | 2729`                 | Especialistas en bases de datos y en redes informáticas no clasificados bajo otros epígrafes | `Analista de ciberseguridad en entornos de la operación.`                               |
| `EOC01B  | 7121`                 | Albañiles                                                                                    | `Ayudante de albañil.`                                                                  |
| `EOC01B  | 7191`                 | Mantenedores de edificios                                                                    | `Ayudante de mantenimiento básico de edificios.`                                        |
| `EOC01B  | 7211`                 | Escayolistas                                                                                 | `Ayudante de escayolista.`                                                              |
| `EOC01B  | 7231`                 | Pintores y empapeladores                                                                     | `Ayudante de pintor / pintora.`                                                         |
| `EOC01B  | 7240`                 | Soladores, colocadores de parquet y afines                                                   | `Ayudante de solador / soladora.`                                                       |
| `EOC01B  | 9602`                 | Peones de la construcción de edificios                                                       | `Peón especializado.`                                                                   |
| `EOC02M  | 7211`                 | Escayolistas                                                                                 | `Juntera / juntero de placa de yeso laminado.`                                          |
| `EOC02M  | 7231`                 | Pintores y empapeladores                                                                     | `Pintor / pintora de obra.`                                                             |
| `EOC02M  | 7240`                 | Soladores, colocadores de parquet y afines                                                   | `Colocador / colocadora de pavimentos ligeros, en general.`                             |
| `FME01E  | 2482`                 | Diseñadores de productos y de prendas                                                        | `Experto en diseño de producto para impresión 3D.`                                      |
| `IMA02S  | 7250`                 | Mecánicos-instaladores de refrigeración y climatización                                      | `Frigorista.`                                                                           |
| `IMS04S  | 3831`                 | Técnicos de grabación audiovisual                                                            | `Técnica / técnico de grabación de sonido en estudio.`                                  |

## Classification additions

The eight added approved occupation rows copy the official CNO identity and
retain the existing INE source URL, `2026-08-22` review date, and catalog
version `1.0.0`:

|   Code | Preferred label                                                                              |
| -----: | -------------------------------------------------------------------------------------------- |
| `2482` | Diseñadores de productos y de prendas                                                        |
| `2484` | Diseñadores gráficos y multimedia                                                            |
| `2729` | Especialistas en bases de datos y en redes informáticas no clasificados bajo otros epígrafes |
| `3831` | Técnicos de grabación audiovisual                                                            |
| `7191` | Mantenedores de edificios                                                                    |
| `7211` | Escayolistas                                                                                 |
| `7231` | Pintores y empapeladores                                                                     |
| `9602` | Peones de la construcción de edificios                                                       |

## Explicit exclusions

The following relation keys are rejected and must not appear in the curated
links or restore allowlist:

- `EOC01B|7212` — no official output establishes paste-and-mortar applicator
  work; curated CNO `7212` remains rejected.
- `EOC02M|3202` — a team-lead or supervisor output does not establish the
  rejected construction-supervisor CNO `3202`.
- `EOC02M|7212` — the profile does not establish the paste-and-mortar
  applicator boundary.

No aliases are changed: the occupation alias file remains exactly 21 records.

The EOC01B assistant/peon rows carry a machine-readable functional boundary:
`roleLevel: "assistant"` and `fullOccupationQualification: false` for 7121,
7191, 7211, 7231, and 7240; `roleLevel: "adjacent"` and
`fullOccupationQualification: false` for 9602. This boundary is propagated to
the derived graph so consumers cannot present an assistant or adjacent output
as a full trade qualification.

For `EOC02M|7211`, the exact TodoFP output `Juntera / juntero de placa de yeso
laminado.` is checked against the official INE explanatory notes (pp. 249–250)
and BOE CNO-11 table. INE defines 7211 escayolistas as installing and repairing
partitions and plaster/gypsum finishes, explicitly separates 7212's
cement/paste-and-mortar applicators, and defines 7199 as a residual structural-
construction group. Those official functional excerpts support 7211 only;
7199 and 7212 are not published.

## No-match and pending state

`IMS03S` remains the single existing
`reviewed-no-publishable-match` outcome. The new CNO `3831` covers audiovisual
sound recording for `IMS04S`, not the production, direction, or event roles
reviewed for `IMS03S`; therefore the prior no-match decision remains valid
against the new catalog hash. `IFC03E` remains pending and is intentionally
absent from the outcomes document because the schema has no `insufficient`
state.
