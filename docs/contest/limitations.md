# Limitaciones y alcance

## Datos de FP y empleo

La publicación trabaja con un snapshot direccionado por manifest. Las cifras describen los registros publicados por las fuentes oficiales en esa captura; una relación revisada sin coincidencias no se interpreta como ausencia del mercado laboral.

Las relaciones formación–ocupación se publican solo cuando la evidencia oficial y la revisión del catálogo sostienen el vínculo exacto. No hay programas diferidos en esta instantánea. Los alias son formas auditadas del catálogo, no ampliaciones automáticas por similitud.

## Ingresos de titulados

EDUCAbase proporciona referencias de bases de cotización de poblaciones administrativas con el alcance declarado por cada tabla. La aplicación mantiene separadas las referencias nacionales por ciclo o grupo y las referencias territoriales por comunidad del centro de titulación. No fabrica un cruce que la fuente no publica y no transforma una medida agregada en un resultado individual.

La representatividad de las tablas nacionales es la declarada por el Ministerio: algunas etiquetas agrupan ciclos y algunas titulaciones no aparecen. Los periodos no observados y los valores no disponibles se mantienen como tales. La ubicación territorial corresponde al centro donde se obtuvo la titulación, no al lugar de residencia o de trabajo posterior.

## Producto y release

Las rutas internas son recorridos de producto; la candidatura usa únicamente la raíz pública. La experiencia no requiere cuentas y no conserva selecciones, búsquedas, respuestas ni resultados. Solo recuerda en `localStorage` la preferencia no sensible del modo de búsqueda («desde FP» o «desde ocupación»). La accesibilidad automatizada, el responsive y la semántica se comprobaron de nuevo durante la captura final.

El objetivo de ampliar la cobertura está condicionado a evidencia: el freeze actual registra 113 cualificaciones distintas y deja 0 programas diferidos. La baseline funcional está verificada para el commit `cab7a3b9dbdf8d2922506e9207242d537347d720`; la release candidata final posterior al merge permanece pendiente y la verificación de rutas y recursos queda registrada en `docs/contest/release-evidence.json`.

## Estado temporal de la candidatura

- Baseline funcional verificada: commit `cab7a3b9dbdf8d2922506e9207242d537347d720`, release funcional de referencia `v2026.08.25-candidate.2`.
- Pages y VPS de la baseline: verificados con ese SHA; `version.json`: verificado y coincidente.
- A4 de la baseline: 13/13 capturas PASS.
- Rama documental actual: `codex/final-candidature-coherence-20260826`.
- HEAD documental de referencia antes de esta corrección: `25fc0f89097e107eb47c49b0a848ba822bc4cea1`.
- Release candidata final: **PENDIENTE**.
- Nombre previsto: `v2026.08.26-candidate.3`.
- SHA final: **PENDIENTE HASTA EL MERGE**.
- Pages/VPS finales: **PENDIENTES**.
- `version.json` final: **PENDIENTE**.
- A4 final sobre ese SHA: **PENDIENTE**.
