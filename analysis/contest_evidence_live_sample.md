# Muestra independiente de suficiencia probatoria

Fecha de auditoría: 16 de agosto de 2026. Corte: 19 de agosto de 2026, 18:00 CEST.

La muestra se eligió sin intervención del proceso que creó las relaciones. Sobre las 220 claves ordenadas, se calculó `SHA-256(seed|relationKey)`, se ordenaron los hashes en sentido ascendente y se tomaron las primeras 15. La semilla fue `f3813d12cff3876db8760975cf82b0ad47c5d3ea76983d809ef45891324bf21c`.

## Resultado

- 9 relaciones superaron la comprobación de cita viva y frontera semántica.
- 4 no demostraron la frontera CNO afirmada: `EOC02SD|3129`, `IMP01S|2640`, `AGA01B|4121` y `COM01M|5300`.
- 1 requiere justificar la diferencia de nivel entre “auxiliar” y el grupo profesional CNO: `FME02B|7314`.
- 1 tiene correspondencia semántica defendible, pero la cita guardada no es literalmente exacta: `SSC01S|2252`.

La muestra no está limpia. Por tanto, el suelo común del validador —dominio oficial y cita no vacía— no basta para sostener la afirmación “nunca fuerza una correspondencia aproximada” en las 220 relaciones. La cobertura 76/220 no se ratifica para la candidatura.

## Decisión de publicación

Se activa el fallback histórico defendible: 6 cualificaciones distintas, 7 claves de modalidad, 14 relaciones aprobadas, 21 alias y 46 ofertas coincidentes sobre el snapshot de 1.077 ofertas del 9 de agosto de 2026. La activación final exige dos commits: primero los datos y el snapshot reconstruido; después el rebake de `coverage-freeze.json` con el SHA del primer commit como frontera demostrable.

El detalle completo, incluida la clasificación de las 15 relaciones, está en `analysis/contest_evidence_live_sample.json`.
