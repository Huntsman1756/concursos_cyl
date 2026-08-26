# Próxima sesión: última etiqueta y autorización separada

## Estado cerrado de producto y evidencia

- Repositorio canónico: <https://github.com/Huntsman1756/concursos_cyl>.
- Rama estable: `main`, protegida mediante PR, checks y revisión.
- Producto público verificado: `cab7a3b9dbdf8d2922506e9207242d537347d720`.
- Release público actual: `v2026.08.25-candidate.2`.
- Workflow de GitHub Pages: [`32896247977`](https://github.com/Huntsman1756/concursos_cyl/actions/runs/32896247977), completado correctamente.
- `version.json` de Pages y VPS devuelve el mismo commit `cab7a3b9dbdf8d2922506e9207242d537347d720`.
- Snapshot activo: `20260822085631889-7bbe69380f6d`.
- Cobertura congelada: 113 cualificaciones base, 130 claves de modalidad,
  264 relaciones aprobadas, 21 alias, 21 recursos inmutables y 116 registros
  canónicos de SEPE.
- El paquete de evidencia automatizada está completo: **13/13** capturas,
  recapturadas el 2026-08-26 desde un contexto anónimo contra el VPS, con
  SHA-256 y provenance del commit público. El registro está en
  `docs/contest/evidence-capture.json` y la evidencia de release en
  `docs/contest/release-evidence.json`.
- La evidencia de release queda `verified` para la publicación
  `cab7a3b9…` y conserva como `auditHeadSha` el commit de evidencia
  `a7932d0ecfa56ac9ffef79cb7fa0ab4417ad6256`. La autorización humana para el
  envío externo continúa deliberadamente en `false`.

## Cierre de candidatura

- La memoria de jurado responde por separado a los siete criterios y tiene
  menos de 1.000 palabras.
- El recorrido corto recomendado es: `IFC02S` → CNO 3820 → Datos abiertos.
- La documentación se refiere a una única revisión pública: producto
  `cab7a3b9…`, release `v2026.08.25-candidate.2`, Pages/VPS verificados y
  evidencia visual 13/13.
- La PR documental no cambia `src/`, datasets, matching, CSS, workflows ni
  comportamiento del producto.

## Última operación después del merge

1. Fusionar la PR documental con checks y revisión de los PNG en contexto
   anónimo.
2. Crear la etiqueta `v2026.08.26-candidate.3` sobre el SHA exacto del merge.
3. Dejar que Pages y VPS publiquen ese SHA y comprobar de nuevo ambos
   `version.json`; no reutilizar el SHA o el run de `candidate.2` para esa
   publicación.
4. No añadir funcionalidad ni abrir otra ronda de rediseño.

La etiqueta `candidate.3` todavía no es una publicación observada en este
checkout; no debe aparecer como release verificado hasta completar esos pasos.

## Runtime y límites

- Runtime V4 permanece en `BOUNDED_LOCAL` y `ANALYSIS_ONLY`.
- `publicationThroughRuntimeV4` permanece en `false`; no se anuncia una
  procedencia V4 firmada ni se habilita `REQUIRED`.
- La candidatura usa la raíz VPS pública; GitHub Pages conserva la fallback.
- Identidad, contacto, declaraciones, consentimiento y envío externo requieren
  aprobación humana explícita. Este repositorio no envía la solicitud.
