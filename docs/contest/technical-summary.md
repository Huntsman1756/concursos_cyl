# Resumen técnico de evidencia

- Límite fuente: `e41c5394d71c1324fe8a3e5d12a4a6f76793eaa2`.
- Snapshot: `20260822021233066-9d8fa948959b`.
- Cobertura: 104 cualificaciones, 121 claves de modalidad, 248 relaciones aprobadas y 21 alias.
- Muestra determinista: 15 PASS y 0 FAIL en una segunda revisión independiente; 233 relaciones `not_sampled`.
- Alcance de la muestra: delimitado y no exhaustivo. No convierte las 15 relaciones en una auditoría semántica completa del catálogo.
- Matriz: las 15 relaciones seleccionadas están marcadas `sample_pass`; las 233 restantes, `not_sampled`.
- E2E Chromium: 124/124 pruebas pasan después de ajustar COM01M a 7 grupos revisados.
- Estado de release: despliegue, recaptura visual, adopción, piloto y envío externo permanecen pendientes de verificación o autorización.

La procedencia detallada de cada relación está en
`analysis/contest_evidence_live_sample.json` y la matriz completa en
`analysis/contest_evidence_matrix.json`. El renderer del informe de piloto
conserva el diferido histórico de `COM01M` y permite describir por separado
cualquier publicación posterior.
