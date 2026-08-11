# Contest source ledger

This ledger keeps source evidence separate from claims about the application. URLs below are copied from the repository source contracts and methodology, not inferred from a search result.

| Evidence boundary                         | Official source                                                                                                    | Repository contract                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Castilla y León vocational-training offer | <https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/oferta-de-formacion-profesional/records> | `scripts/data/sourceConfig.ts` (`jcyl-vocational-training-offer`)         |
| Castilla y León employment offers         | <https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/ofertas-de-empleo/records>               | `scripts/data/sourceConfig.ts` (`jcyl-employment-offers`)                 |
| EDUCAbase income tables                   | <https://estadisticas.educacion.gob.es/EducaJaxiPx/>                                                               | `scripts/data/sourceConfig.ts` and `docs/methodology/educabase-income.md` |
| CNO-11 classification notes               | <https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf>                                                   | curated mapping evidence contract                                         |
| TodoFP professional outputs               | <https://www.todofp.es/que-estudiar/familias-profesionales.html>                                                   | `data/curated/professional-profiles.json` and publication coverage gate   |
| BOE vocational qualification evidence     | <https://www.boe.es/>                                                                                              | curated mapping evidence contract                                         |
| Ministry legal notice and terms boundary  | <https://www.educacionyfp.gob.es/comunes/aviso-legal.html>                                                         | `docs/methodology/educabase-income.md`                                    |
| Public application root                   | <https://salida-cyl.157-90-22-40.sslip.io/>                                                                        | `docs/deployment.md` and VPS release script                               |

## Interpretation boundaries

- The Junta datasets describe the published regional training and offer snapshots; they do not prove every possible offer.
- EDUCAbase tables describe the published contribution-base measures and their declared cohorts/scopes; they are not individual salary or employment predictions.
- CNO-11 and BOE evidence is used for reviewed training–occupation relationships. An unresolved or deferred relation remains unavailable rather than being broadened by similarity.
- TodoFP outputs are literal title-level professional profiles for all current FP program keys. They are not CNO classifications and do not prove that a matching vacancy exists in the current employment snapshot.
- The root URL is the only URL intended for the contest application. Routes such as `/desde-fp`, `/ocupacion`, `/comparar`, and `/metodologia` are product journeys, not submission URLs.
