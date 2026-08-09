# Data license and attribution

The foundation files under `public/data/v1/` are transformations of official
datasets published by the Junta de Castilla y León. The source catalog marks
both datasets as `CC BY 4.0 ES`:

- [Oferta de estudios de Formación Profesional](https://analisis.datosabiertos.jcyl.es/explore/dataset/oferta-de-formacion-profesional/) — Junta de Castilla y León, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es_ES).
- [Ofertas de Empleo](https://analisis.datosabiertos.jcyl.es/explore/dataset/ofertas-de-empleo/) — Junta de Castilla y León, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es_ES).

The reviewed occupation resources also preserve attribution to their primary
official sources:

- [CNO-11 explanatory notes](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf) — Instituto Nacional de Estadística, used for official occupation identifiers and labels.
- [Técnico Superior en Desarrollo de Aplicaciones Web](https://www.boe.es/buscar/doc.php?id=BOE-A-2010-9269&lang=es) — Agencia Estatal Boletín Oficial del Estado, used for cited occupational outputs.
- [Técnico en Gestión Administrativa](https://www.todofp.es/que-estudiar/familias-profesionales/administracion-gestion/gestion-administrativa.html) — TodoFP, Ministerio de Educación, Formación Profesional y Deportes, used for cited occupational outputs.

Aliases are project-authored reviewed search terms. They do not replace the
official occupation label or create an uncited training relationship.

The manifest preserves the source identifier, official records URL, fetch
time, source update time where published, record count, and content hash for
each generated resource. Employment records also preserve their own official
update timestamp. Normalization, reconciliation, and sanitization do not
remove the source attribution or replace the source license. The MIT software
license applies to project code, not to third-party source data.

## EDUCAbase income evidence

The income comparison transforms four statistical tables published by the
Ministerio de Educación, Formación Profesional y Deportes:

- [`famprof_2_08` / EMLIN0000090080](https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090080) — intermediate cycle/group, Spain.
- [`famprof_3_08` / EMLIN0000090094](https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090094) — higher cycle/group, Spain.
- [`ccaa_2_07` / EMLIN0000090044](https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090044) — intermediate level, autonomous community of the graduation center.
- [`ccaa_3_07` / EMLIN0000090057](https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090057) — higher level, autonomous community of the graduation center.

The catalog-declared conditions link is the
[Ministry legal notice](https://www.educacionyfp.gob.es/comunes/aviso-legal.html).
This project records that link as declared and does not assign a different
license to EDUCAbase data or imply endorsement by the Ministry.

The approved raw responses were retrieved and transformed on 2026-08-09.
Every generated manifest records the effective retrieval time, exact CSV and
PC-Axis URLs, raw byte counts and SHA-256 hashes, normalized artifact hash,
record count, and immutable resource path for the published build. The
transformation verifies both formats, selects only the approved scopes, and
represents unavailable source cells without substituting values. See
`docs/methodology/educabase-income.md` for the complete method.

The repository's MIT license covers project software only. It does not cover
or relicense the Ministry's source data or the normalized values derived from
those data.
