# Próxima sesión: release pendiente y autorización separada

## Estado actual

- Repositorio canónico: <https://github.com/Huntsman1756/concursos_cyl>.
- Rama de trabajo: `codex/contest-hardening-current`.
- Fuente del freeze: `ff9e6197f926e462bea1a3e8ac6a57a23d3f825a`.
- Commit que contiene los bytes exactos del freeze: `80bc0f9d2def3f600f7701d8b20f0095cd241c71`.
- Snapshot activo: `20260822085631889-7bbe69380f6d`.
- Cobertura congelada: 113 cualificaciones base, 130 claves de modalidad,
  264 relaciones aprobadas y 21 alias; 21 recursos inmutables y 116 registros
  canónicos de SEPE.
- La evidencia de release usa schema 1 y está en estado **pending**. Sus gates
  locales, despliegue y verificación pública permanecen pendientes; los campos
  de publicación, auditoría, revisión local y captura actual son `null`.
- El commit de producto histórico `ae66d5bc8393dbb02818471ad7eb850e4d4367de`
  no es el candidato actual. Las 13 capturas existentes son históricas de ese
  producto y no constituyen captura del release actual.
- La captura nativa final A4 sigue bloqueada por el Mac bloqueado. El registro
  `A4-MACLOCK-20260822` es `ACCEPT-WITH-WAIVER` únicamente para este despliegue
  de producción autorizado por la persona usuaria; no afirma verificación A4
  nativa final.

## URLs y límites de publicación

- URL canónica: <https://salida-cyl.157-90-22-40.sslip.io/>.
- URL fallback de GitHub Pages: <https://huntsman1756.github.io/concursos_cyl/>.
- La URL canónica es la destinada a la candidatura; la fallback sirve para
  continuidad operativa y no sustituye la verificación pública pendiente.
- No hay un `publicationCommitSha` actual que registrar mientras la evidencia
  siga pendiente; no se debe inventar un SHA de publicación futura.
- `finalApplicationTextApproved`, `rootUrlApproved` y
  `submissionAuthorized` permanecen en `false`.
- Identidad, declaraciones, consentimiento y envío externo requieren una
  autorización humana explícita separada. El waiver A4 no autoriza la
  presentación al concurso.

## Siguiente sesión autorizada

1. Ejecutar la captura nativa OS A4 en un Mac desbloqueado y revisar las rutas
   de FP, ocupación y comparador.
2. Repetir los gates de release contra el commit que se autorice y actualizar
   la evidencia solo con datos observados.
3. Verificar por separado la URL canónica y la fallback, conservando sus
   identidades observadas.
4. Obtener aprobación humana explícita para el texto final, la URL y la
   presentación externa antes de cualquier envío.

Esta sesión sí autoriza el push a `main` y el despliegue de producción del
commit revisado. No autoriza una captura probatoria, pasar la evidencia a
`verified` ni el envío al concurso.
