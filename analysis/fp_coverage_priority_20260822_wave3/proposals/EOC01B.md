# Frontier proposal — EOC01B

## Accepted

| Key     | CNO-11 identity | Type                                       | Exact TodoFP output     |
| ------- | --------------- | ------------------------------------------ | ----------------------- |
| `EOC01B | 7121`           | Albañiles                                  | `reviewed_relationship` | `Ayudante de albañil.`                           |
| `EOC01B | 7191`           | Mantenedores de edificios                  | `reviewed_relationship` | `Ayudante de mantenimiento básico de edificios.` |
| `EOC01B | 7211`           | Escayolistas                               | `reviewed_relationship` | `Ayudante de escayolista.`                       |
| `EOC01B | 7231`           | Pintores y empapeladores                   | `reviewed_relationship` | `Ayudante de pintor / pintora.`                  |
| `EOC01B | 7240`           | Soladores, colocadores de parquet y afines | `reviewed_relationship` | `Ayudante de solador / soladora.`                |
| `EOC01B | 9602`           | Peones de la construcción de edificios     | `reviewed_relationship` | `Peón especializado.`                            |

The outputs are bounded building-maintenance and construction functions. The
reviewed type preserves the assistant/peon level and avoids claiming an exact
occupation title match.

## Machine-readable functional boundary

The five assistant outputs (`7121`, `7191`, `7211`, `7231`, and `7240`) carry:

```json
{ "roleLevel": "assistant", "fullOccupationQualification": false }
```

The `9602` peon output carries:

```json
{ "roleLevel": "adjacent", "fullOccupationQualification": false }
```

This metadata is part of each curated relationship and the derived open-data
graph. It lets consumers label the result as assistant-level or adjacent and
explicitly prevents treating any of these rows as a full occupation
qualification. The boundary is conservative and does not expand the UI.

## Explicit rejection

`EOC01B|7212` is rejected. The approved outputs do not establish the CNO group
for applicators of paste and mortar. No offer text, alias, or title-only
inference is used.
