# Próxima sesión: cerrar candidate.3 sin reabrir `main`

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

## Secuencia operativa obligatoria después de esta PR

La PR #50 ya contiene el cierre documental. Con CI verde y la revisión aprobada:

1. Fusionar la PR #50 a `main`.
2. Obtener el SHA real resultante de `main`; no anticiparlo en esta rama.
3. Esperar y verificar Pages y VPS sobre ese SHA real.
4. Comprobar que el `version.json` servido coincide exactamente con ese SHA.
5. Crear `v2026.08.26-candidate.3` exactamente sobre ese mismo SHA.
6. Ejecutar el A4 final contra ese despliegue y registrar sus 13/13 resultados.
7. Generar una atestación final con SHA, tag, URLs, workflow/run, resultado A4 y hashes de las capturas.
8. Adjuntar la atestación y las capturas a los assets de la GitHub Release `v2026.08.26-candidate.3` y actualizar su descripción si fuese necesario.
9. **No crear otro commit en `main` para registrar esas observaciones ni para sustituir los campos `PENDIENTE` de los documentos versionados.**
10. Aplicar freeze absoluto de la candidatura.
11. Obtener por separado la autorización humana para identidad, declaraciones, consentimiento y envío externo.

Los campos `PENDIENTE` de esta documentación versionada describen deliberadamente el estado pre-release. La evidencia observacional posterior al despliegue vive en la atestación y los assets de la GitHub Release candidate.3; los documentos de `main` no intentan autorreferenciar el SHA del commit que los contiene. Candidate.2 sigue siendo únicamente la baseline funcional verificada.

## Límites

- La documentación no cambia `src/`, datasets, matching, CSS, workflows ni comportamiento del producto.
- Runtime V4 permanece en `BOUNDED_LOCAL` y `ANALYSIS_ONLY`; `publicationThroughRuntimeV4` permanece en `false`.
- La candidatura usa la raíz VPS pública y GitHub Pages como fallback.
- Este repositorio no envía la solicitud externa ni decide los campos de aprobación humana.
