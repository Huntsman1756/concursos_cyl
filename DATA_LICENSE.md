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
