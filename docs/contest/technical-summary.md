# Resumen técnico de evidencia

> NOTA HISTÓRICA. Este documento describe la revisión independiente de `v2026.08.26-candidate.3` (snapshot `20260822085631889-7bbe69380f6d`, 21 alias). La candidatura vigente es `v2026.08.28-candidate.5` — snapshot `20260822085631889-fc9bf2ba23f9`, manifest `b41189db5e116bb83f2ec07e865909e6114c31622324e5c5f0f268161f2381e1`, 35 alias, 264 relaciones, 133 de 1.058 ofertas alcanzadas. Los estados vigentes están en `release-evidence.json` y `submission-checklist.md`.

- Límite fuente: `ff9e6197f926e462bea1a3e8ac6a57a23d3f825a`.
- Commit que contiene los bytes exactos del freeze: `80bc0f9d2def3f600f7701d8b20f0095cd241c71`.
- Snapshot: `20260822085631889-7bbe69380f6d`.
- Cobertura: 113 cualificaciones, 130 claves de modalidad, 264 relaciones aprobadas y 21 alias.
- Muestra determinista: 15 PASS y 0 FAIL en una segunda revisión independiente; 249 relaciones `not_sampled`.
- Alcance de la muestra: delimitado y no exhaustivo. No convierte las 15 relaciones en una auditoría semántica completa del catálogo.
- Matriz: las 15 relaciones seleccionadas están marcadas `sample_pass`; las 249 restantes, `not_sampled`.
- Baseline funcional verificada: `v2026.08.25-candidate.2` corresponde al commit `cab7a3b9dbdf8d2922506e9207242d537347d720`; Pages y VPS sirvieron ese mismo SHA cuando se verificó la baseline y el paquete visual automatizado contiene 13/13 capturas actuales.
- Release candidata definitiva publicada: `v2026.08.26-candidate.3` en el commit `368c990b9be3cc3ba8cecb7f70acdd9d18593b51`; Pages y VPS sirven ese SHA en `version.json`, CI registró el run `32969467349` y el A4 final quedó registrado en los assets de la GitHub Release `v2026.08.26-candidate.3`.
- Límites humanos: adopción, piloto, identidad, consentimiento y envío externo permanecen pendientes de evidencia o autorización humana.

La procedencia detallada de cada relación está en
`analysis/contest_evidence_live_sample.json` y la matriz completa en
`analysis/contest_evidence_matrix.json`. El renderer del informe de piloto
conserva el diferido histórico de `COM01M` y permite describir por separado
cualquier publicación posterior.
