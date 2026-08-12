# Limitaciones y alcance

## Datos de FP y empleo

La publicación trabaja con un snapshot direccionado por manifest. Las cifras describen los registros publicados por las fuentes oficiales en esa captura; una relación revisada sin coincidencias no se interpreta como ausencia del mercado laboral.

Las relaciones formación–ocupación se publican solo cuando la evidencia oficial y la revisión del catálogo sostienen el vínculo exacto. Los programas diferidos (ADG01M, ELE01M, FME01M, IMA03M, MAM01M, TMV02M) no se presentan como cobertura revisada. Los alias son formas auditadas del catálogo, no ampliaciones automáticas por similitud.

## Ingresos de titulados

EDUCAbase proporciona referencias de bases de cotización de poblaciones administrativas con el alcance declarado por cada tabla. La aplicación mantiene separadas las referencias nacionales por ciclo o grupo y las referencias territoriales por comunidad del centro de titulación. No fabrica un cruce que la fuente no publica y no transforma una medida agregada en un resultado individual.

La representatividad de las tablas nacionales es la declarada por el Ministerio: algunas etiquetas agrupan ciclos y algunas titulaciones no aparecen. Los periodos no observados y los valores no disponibles se mantienen como tales. La ubicación territorial corresponde al centro donde se obtuvo la titulación, no al lugar de residencia o de trabajo posterior.

## Producto y release

Las rutas internas son recorridos de producto; la candidatura usa únicamente la raíz pública. La experiencia no requiere cuentas ni persistencia del navegador. La accesibilidad, el responsive y la semántica se deben confirmar de nuevo en la sesión de capturas finales.

El objetivo de ampliar la cobertura está condicionado a evidencia: el freeze actual registra 13 cualificaciones distintas y deja 6 programas diferidos. El despliegue público está verificado para el commit `f1aeb187ca243165efc63753840e5eb76db9ba4c`; la verificación de rutas y recursos queda registrada en `docs/contest/release-evidence.json`.
