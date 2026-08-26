# Próxima sesión: publicar la PR documental y cerrar la release

## Estado temporal inequívoco

- Repositorio canónico: <https://github.com/Huntsman1756/concursos_cyl>.
- Baseline funcional verificada: commit `cab7a3b9dbdf8d2922506e9207242d537347d720`.
- Release funcional de referencia: `v2026.08.25-candidate.2`.
- Pages y VPS de la baseline están verificados con ese SHA; `version.json` coincide.
- A4 de la baseline: **13/13 capturas PASS**, recapturadas el 2026-08-26 desde contexto anónimo.
- Rama documental actual: `codex/final-candidature-coherence-20260826`.
- HEAD documental de referencia al iniciar esta corrección: `25fc0f89097e107eb47c49b0a848ba822bc4cea1`.
- Release candidata definitiva posterior al merge: **PENDIENTE**.
- Nombre previsto: `v2026.08.26-candidate.3`.
- SHA final: **PENDIENTE HASTA EL MERGE**.
- Pages/VPS finales: **PENDIENTES**.
- `version.json` final: **PENDIENTE**.
- A4 final sobre ese SHA: **PENDIENTE**.

Candidate.2 es únicamente la baseline funcional observada. No se debe presentar como la release definitiva posterior al merge ni reutilizar su SHA, tag, run, `version.json` o capturas como evidencia de candidate.3.

## Secuencia operativa obligatoria

1. Hacer push de `codex/final-candidature-coherence-20260826`.
2. Abrir la PR exclusivamente documental/release-evidence.
3. Esperar CI y completar la revisión de la documentación y de las capturas.
4. Fusionar la PR a `main` tras la aprobación correspondiente.
5. Obtener el SHA real resultante de `main`; no anticiparlo en esta rama.
6. Verificar la publicación de Pages y VPS y observar el `version.json` servido.
7. Crear `v2026.08.26-candidate.3` sobre ese SHA real.
8. Ejecutar y registrar el A4 final sobre ese SHA.
9. Actualizar la evidencia observacional con el SHA, Pages/VPS, `version.json` y A4 reales; ejecutar los validadores y congelar la candidatura.
10. Obtener por separado la autorización humana para identidad, declaraciones, consentimiento y envío externo.

Tras el merge será necesaria una actualización observacional mínima para sustituir los campos `PENDIENTE` por los valores reales de candidate.3. No se debe inventar ese SHA antes del merge.

## Límites

- La documentación no cambia `src/`, datasets, matching, CSS, workflows ni comportamiento del producto.
- Runtime V4 permanece en `BOUNDED_LOCAL` y `ANALYSIS_ONLY`; `publicationThroughRuntimeV4` permanece en `false`.
- La candidatura usa la raíz VPS pública y GitHub Pages como fallback.
- Este repositorio no envía la solicitud externa ni decide los campos de aprobación humana.
