# Shakedown NAN real del 13 de agosto de 2026

Este directorio conserva copias sanitizadas de tres telemetrías reales usadas
para producir el lote COM04S fusionado mediante la PR #25. Se omiten la salida
libre del modelo, rutas locales y cualquier material de credenciales. Los hashes
`sourceTelemetrySha256` y `candidatePatchSha256` identifican los artefactos
originales retenidos fuera del worktree candidato por el supervisor.

Las tres ejecuciones declaran `simulated: false`, una sesión nativa NAN, consumo
positivo, validación con código cero y decisión frontier `ACCEPT`. Los commits de
resultado permiten comprobar que cada ruta declarada llegó al historial Git.

Esto demuestra un shakedown real `frontier → NAN → validación → revisión` para
el lote acotado. No demuestra que todas las ediciones elegibles del repositorio
estén obligatoriamente delegadas. Tampoco es evidencia V4 firmada por el host:
`hostSigned` permanece en `false` y `provenanceEnforcement` en `DISABLED` hasta
que el runtime certificado y la recuperación de evidencia protegida estén
disponibles en CI.
