# Muestra independiente de suficiencia probatoria

## Muestra vigente

- Límite de datos: `7a9a05a2ddcb3a89173a645e7308d327763a4e17`.
- Población: 264 relaciones aprobadas en `data/curated/training-occupation-links.json`.
- Tamaño: 15 relaciones seleccionadas de forma determinista.
- Corte: 2026-08-22T12:08:22+02:00.
- Semilla: `f3813d12cff3876db8760975cf82b0ad47c5d3ea76983d809ef45891324bf21c`.
- Selección: ordenar `SHA-256(seed|relationKey)` y tomar las primeras 15 claves.
- Resultado: **15 PASS / 0 FAIL** en una segunda revisión independiente de la URL y la cita oficial registrada para cada relación.
- Alcance: muestra delimitada, no auditoría exhaustiva. Las otras 249 relaciones quedan `not_sampled`.

El detalle de las 15 relaciones y sus citas está en
`analysis/contest_evidence_live_sample.json`. La matriz marca esas relaciones
como `sample_pass` y las 249 restantes como `not_sampled`. El resultado no
ratifica por sí solo la suficiencia semántica de todo el catálogo.

## Auditoría histórica

La muestra anterior se extrajo sobre 220 claves, con corte 2026-08-19T18:00:00+02:00. Encontró 9 relaciones con cita y frontera semántica defendibles, 4 fallos de frontera CNO, 1 diferencia de nivel pendiente y 1 cita no literal. Esa auditoría no ratificó la propuesta 76/220.

Sus hallazgos se usaron para retirar seis relaciones de la publicación y corregir una cita. No se trasladan como resultado vivo al límite `ab534c7`; el detalle histórico y las claves remediadas quedan en el JSON.

## Decisión

La cobertura actual conserva el freeze rebakeado y la distinción entre la muestra aprobada y las relaciones no muestreadas. No se afirma que la muestra sea exhaustiva ni se usa para afirmar despliegue, adopción, piloto o envío de la candidatura.
