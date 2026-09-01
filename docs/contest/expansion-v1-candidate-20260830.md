# SALIDA CyL — candidato unificado de `Desde oferta`

Fecha de datos: 30 de agosto de 2026. Esta nota describe el candidato local integrado; no es una autorización de release.

## Producto

`Desde oferta` permite buscar una de las 1.058 ofertas de la instantánea, leer su requisito literal, distinguir la evidencia disponible y seguir únicamente acciones oficiales respaldadas. La ruta es `/desde-oferta`; la portada conserva los recorridos FP-first y ocupación-first.

## Datos y activación

El recurso derivado activo es:

`/data/v1/snapshots/20260830120000000-8c6c79fbd2a1/offer-evidence.json`

Está descrito por el manifest `public/data/v1/manifest.json` como uno de los 22 recursos del snapshot. El recurso contiene 1.058 registros, 196 relaciones de oferta y 138 ofertas con relación FP revisada. El loader valida descriptor, snapshot, hash y recuentos; el runtime ya no lee un JSON candidato fuera del manifest ni un archivo legacy en la raíz.

La activación conserva como procedencia el snapshot base `20260822085631889-fc9bf2ba23f9` y registra dependencias y transformaciones en `activationProvenance`. El snapshot activo de runtime es único.

## Cobertura

| Métrica                           | Valor | Lectura                               |
| --------------------------------- | ----: | ------------------------------------- |
| Programas FP                      |   187 | Catálogo consultable                  |
| Centros                           |   229 | Directorio normalizado                |
| Ofertas formativas                | 1.294 | Instantánea publicada                 |
| Ofertas laborales                 | 1.058 | Población del snapshot                |
| Relaciones FP–ocupación aprobadas |   264 | Evidencia revisada                    |
| Alias aprobados                   |    35 | Alias auditados                       |
| Ofertas con relación FP revisada  |   138 | Unión de IDs, no cobertura de mercado |
| Relaciones de oferta en sidecar   |   196 | Relaciones explícitas                 |
| Programas diferidos               |     0 | Fail-closed                           |

El delta de cinco IDs sobre el matcher determinista procede exclusivamente de dos revisiones curadas: `PEONES FORESTALES → CNO 9543 → AGA03B` y el requisito literal `Técnico en Cocina y Gastronomía → HOT01M`. No se promovieron candidatos por similitud.

## Taxonomía y límites

Los requisitos conservan cita literal y categoría normalizada (`fp`, `university`, `certificate`, `licence`, `experience`, `driving`, `language`, `skill`, `schedule`, `location`, `other`, `unknown`). Lo ambiguo o no clasificado sigue visible como límite. No se recomienda automáticamente ningún curso ECYL ni se afirma equivalencia universitaria o profesional.

## QA local

Los tests de dominio, loader, activación, allowlist, boundary y distribución validan la integración. La batería completa de release debe quedar ligada al candidato local antes de solicitar autorización; la evidencia pública histórica no se reutiliza como evidencia de este candidato.

## Decisión

`READY_FOR_AUTHORIZATION_PENDING_PUBLIC_VERIFICATION`

La expansión dejó de ser un sidecar paralelo: ahora es un recurso derivado activado en el manifest y consumido por la UI. La publicación, el despliegue, la captura pública y el envío siguen deliberadamente pendientes.
