# Próxima sesión: evidencia visual y autorización separada

## Estado actual

- Repositorio canónico: <https://github.com/Huntsman1756/concursos_cyl>.
- Rama estable: `main`, protegida mediante PR, checks y revisión.
- Referencia de candidatura preparada: `v2026.08.25-candidate`.
- Commit publicado y servido por GitHub Pages: `7355bb1c05aecd7452ec82333652d5070927947e`.
- Workflow de publicación verificado: `32888564295`.
- Comprobación pública observada en
  <https://huntsman1756.github.io/concursos_cyl/version.json>:

  ```json
  {
    "schemaVersion": "1.0.0",
    "commit": "7355bb1c05aecd7452ec82333652d5070927947e"
  }
  ```

- La URL canónica VPS (<https://salida-cyl.157-90-22-40.sslip.io/>) aún debe
  actualizarse a esta revisión; no se considera evidencia de candidatura hasta
  que su `version.json` coincida.
- Snapshot activo: `20260822085631889-7bbe69380f6d`.
- Cobertura congelada: 113 cualificaciones base, 130 claves de modalidad,
  264 relaciones aprobadas y 21 alias; 21 recursos inmutables y 116 registros
  canónicos de SEPE.
- La publicación técnica de GitHub Pages y su verificación pública están
  cerradas para esta revisión. El despliegue VPS, la evidencia visual actual de
  candidatura y la autorización humana para el envío externo siguen pendientes.
- Las 13 capturas existentes son históricas y no sustituyen una captura del
  release actual.

## Runtime y límites de publicación

- Runtime V4 permanece en `BOUNDED_LOCAL` y `ANALYSIS_ONLY`.
- `publicationThroughRuntimeV4` permanece en `false`; no se anuncia una
  procedencia V4 firmada ni se habilita `REQUIRED`.
- La URL canónica es la destinada a la candidatura; GitHub Pages conserva una
  fallback operativa verificada para `7355bb1c05aecd7452ec82333652d5070927947e`.
  Ambas identidades solo podrán considerarse alineadas después de publicar el
  mismo commit en el VPS.
- Cualquier cambio futuro sigue el flujo:
  `rama de trabajo → PR → checks → revisión/aprobación → merge a main → Pages`.
  Este documento no autoriza pushes directos a `main` ni cambios sobre el
  release estable sin una nueva autorización.

## Siguiente sesión autorizada

1. Ejecutar la captura nativa OS A4 en un Mac desbloqueado y revisar las rutas
   de FP, ocupación y comparador.
2. Revisar la aplicación pública del release actual desde un contexto anónimo,
   conservando únicamente evidencia visual sin datos personales ni credenciales.
3. Confirmar que las cifras visibles siguen coincidiendo con el snapshot
   `20260822085631889-7bbe69380f6d`.
4. Obtener aprobación humana explícita para el texto final, la URL, la
   identidad, las declaraciones, el consentimiento y la presentación externa.

La verificación técnica del release no autoriza por sí sola la presentación al
concurso ni decide los campos de identidad, contacto, declaraciones o
consentimiento.
