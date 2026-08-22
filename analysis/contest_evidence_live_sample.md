# Muestra independiente de suficiencia probatoria

## Muestra vigente

- Límite de datos: `e41c5394d71c1324fe8a3e5d12a4a6f76793eaa2`.
- Población: 248 relaciones aprobadas en `data/curated/training-occupation-links.json`.
- Tamaño: 15 relaciones.
- Corte: 2026-08-22T04:13:28+02:00.
- Semilla: `f3813d12cff3876db8760975cf82b0ad47c5d3ea76983d809ef45891324bf21c`.
- Selección: ordenar `SHA-256(seed|relationKey)` y tomar las primeras 15 claves.
- Estado: pendiente de comprobación independiente contra fuentes vivas.

La selección actual no se presenta como una auditoría ya realizada. Las 15 claves y su estado `pending_live_sample` están en `analysis/contest_evidence_live_sample.json`. Hasta completar la revisión, la matriz conserva `frontierSufficiency: pending_live_sample` para las 248 relaciones.

## Auditoría histórica

La muestra anterior se extrajo sobre 220 claves, con corte 2026-08-19T18:00:00+02:00. Encontró 9 relaciones con cita y frontera semántica defendibles, 4 fallos de frontera CNO, 1 diferencia de nivel pendiente y 1 cita no literal. Esa auditoría no ratificó la propuesta 76/220.

Sus hallazgos se usaron para retirar seis relaciones de la publicación y corregir una cita. No se trasladan como resultado vivo al límite `e41c539`; el detalle histórico y las claves remediadas quedan en el JSON.

## Decisión

La cobertura actual se describe con el freeze rebakeado y sus límites. La suficiencia semántica de las relaciones permanece pendiente hasta que la muestra vigente se revise de forma independiente. No se afirma despliegue, piloto, adopción ni envío de la candidatura.
