# Registro de cierre: candidate.3 publicada sin reabrir `main`

> HISTÓRICO / ARCHIVED: este registro describe una release anterior. No es la identidad del candidato local actual; consulta `coverage-freeze.json` y `release-evidence.json`.

## Estado final

- Repositorio canónico: <https://github.com/Huntsman1756/concursos_cyl>.
- Release candidata definitiva publicada: `v2026.08.26-candidate.3` en el commit `368c990b9be3cc3ba8cecb7f70acdd9d18593b51` (tag sobre `main`).
- Pages y VPS sirven ese SHA en `version.json`; CI registró el run `32969467349` (success) y el A4 final quedó registrado en los assets de la GitHub Release `v2026.08.26-candidate.3`.
- Baseline funcional verificada: commit `cab7a3b9dbdf8d2922506e9207242d537347d720`, release funcional de referencia `v2026.08.25-candidate.2`, con su paquete visual de 13/13 capturas.
- Snapshot publicado: `20260822085631889-7bbe69380f6d`; manifest SHA-256 `92afc80f2b839ed95def95bc90bdd3b6ad3a1363fb12904f7b109fafc92b2f18`.

Candidate.2 es la baseline funcional observada y su evidencia versionada queda ligada a ese commit. Candidate.3 es la release candidata definitiva publicada; sus observaciones posteriores al despliegue viven en la atestación y los assets de la GitHub Release `v2026.08.26-candidate.3`.

## Secuencia ejecutada

1. `main` quedó en el SHA real `368c990b9be3cc3ba8cecb7f70acdd9d18593b51`.
2. Pages y VPS se verificaron y `version.json` coincidió con ese SHA.
3. Se creó `v2026.08.26-candidate.3` sobre ese mismo SHA.
4. El A4 final se ejecutó contra ese despliegue con 13/13 resultados PASS.
5. Se generó la atestación final con SHA, tag, URLs, workflow/run, resultado A4 y hashes de las capturas.
6. La atestación y las capturas se adjuntaron a los assets de la GitHub Release `v2026.08.26-candidate.3`.
7. No se creó otro commit en `main` para registrar esas observaciones ni se sustituyeron los campos `PENDIENTE` de los documentos versionados.
8. Queda pendiente únicamente la autorización humana para identidad, declaraciones, consentimiento y envío externo.

## Límites

- La documentación no cambia `src/`, datasets, matching, CSS, workflows ni comportamiento del producto.
- Runtime V4 permanece en `BOUNDED_LOCAL` y `ANALYSIS_ONLY`; `publicationThroughRuntimeV4` permanece en `false`.
- La candidatura usa la raíz VPS pública y GitHub Pages como fallback.
- Este repositorio no envía la solicitud externa ni decide los campos de aprobación humana.
