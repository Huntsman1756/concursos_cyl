# Resumen técnico de evidencia

- Límite fuente: `ff9e6197f926e462bea1a3e8ac6a57a23d3f825a`.
- Commit que contiene los bytes exactos del freeze: `80bc0f9d2def3f600f7701d8b20f0095cd241c71`.
- Snapshot: `20260822085631889-7bbe69380f6d`.
- Cobertura: 113 cualificaciones, 130 claves de modalidad, 264 relaciones aprobadas y 21 alias.
- Muestra determinista: 15 PASS y 0 FAIL en una segunda revisión independiente; 249 relaciones `not_sampled`.
- Alcance de la muestra: delimitado y no exhaustivo. No convierte las 15 relaciones en una auditoría semántica completa del catálogo.
- Matriz: las 15 relaciones seleccionadas están marcadas `sample_pass`; las 249 restantes, `not_sampled`.
- Estado de release: publicación y capturas pendientes para el commit final. Las capturas anteriores son históricas y no verifican este freeze.
- Límites humanos: adopción, piloto, identidad, consentimiento y envío externo permanecen pendientes de evidencia o autorización humana.

La procedencia detallada de cada relación está en
`analysis/contest_evidence_live_sample.json` y la matriz completa en
`analysis/contest_evidence_matrix.json`. El renderer del informe de piloto
conserva el diferido histórico de `COM01M` y permite describir por separado
cualquier publicación posterior.
