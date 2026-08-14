# Propuesta de Correspondencia CNO-11 — SEA03S

**Programa:** SEA03S — Técnico Superior en Química y Salud Ambiental
**Familia:** Seguridad y Medio Ambiente (SEA)
**Dominios objetivo:** química, salud ambiental, análisis químico, control de calidad, seguridad medioambiental

## Candidatos CNO-11 (approved)

### 1. occupation:cno11:3129 — Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías

- **occupationId:** `occupation:cno11:3129`
- **Código:** 3129
- **Etiqueta exacta:** "Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías"
- **Cita literal (salida 6):** "Técnica / técnico de control de contaminación atmosférica."
- **Cita literal (salida 5):** "Técnica / técnico de control de contaminación acústica."
- **Cita literal (salida 10):** "Técnica / técnico en gestión ambiental."
- **Cita literal (salida 7):** "Técnica / técnico de control de organismos nocivos."
- **Justificación:** El código 3129 agrupa explícitamente técnicos de ciencias químicas y medioambientales. Es correspondencia funcional directa para las salidas de control de contaminación (acústica y atmosférica), control sanitario de aguas/atmósfera/residuos, control de organismos nocivos y gestión ambiental. Preserva el nivel funcional de técnico superior en los dominios de química, salud ambiental y seguridad medioambiental.
- **Riesgo:** MEDIO — Es un código residual ("Otros") que puede absorber perfiles heterogéneos. Podría sobreestimar la correspondencia al cubrir salidas con componentes biológicos (organismos nocivos) que no son estrictamente químicos. Requiere verificación caso a caso.

### 2. occupation:cno11:3160 — Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías

- **occupationId:** `occupation:cno11:3160`
- **Código:** 3160
- **Etiqueta exacta:** "Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías"
- **Cita literal (salida 6):** "Técnica / técnico de control de contaminación atmosférica."
- **Cita literal (salida 5):** "Técnica / técnico de control de contaminación acústica."
- **Justificación:** Corresponde directamente a análisis químico y control de calidad en ciencias físico-químicas. Las salidas de control de contaminación atmosférica y acústica implican análisis instrumental y control de calidad de mediciones ambientales. Preserva el nivel funcional de técnico de análisis químico y control de calidad.
- **Riesgo:** MEDIO — El código se centra en control de calidad industrial, no específicamente ambiental. La correspondencia con salud ambiental es indirecta. No incluye explícitamente el componente de gestión ambiental ni de seguridad medioambiental.

### 3. occupation:cno11:2640 — Profesionales de ventas técnicas y médicas (excepto las TIC)

- **occupationId:** `occupation:cno11:2640`
- **Código:** 2640
- **Etiqueta exacta:** "Profesionales de ventas técnicas y médicas (excepto las TIC)"
- **Cita literal (salida 1):** "Comercial de información de productos biocidas y fitosanitarios"
- **Justificación:** Corresponde funcionalmente a la venta de productos biocidas y fitosanitarios, que son productos químicos/sanitarios de venta técnica. Los biocidas y fitosanitarios requieren conocimiento de química y salud ambiental para su comercialización. Preserva el nivel funcional de profesional de ventas técnicas de productos químicos.
- **Riesgo:** ALTO — Es un código de ventas, no un código técnico de química o salud ambiental. La correspondencia se basa en la venta de productos químicos, no en el análisis o control ambiental directo. El componente técnico (química, salud ambiental) es secundario al rol comercial.

## Salidas sin candidato CNO-11

| #   | Salida SEA03S                                                                         | Razón de ausencia                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | Coordinador / coordinadora de sistemas de gestión ambiental                           | No existe código CNO-11 approved para coordinadores de sistemas de gestión ambiental. El rol es de coordinación/supervisión, no de técnico de campo o laboratorio.                                                                                                                 |
| 3   | Documentalista ambiental.                                                             | No existe código CNO-11 approved para documentalistas ambientales. El rol es de documentación/informática ambiental, fuera de los dominios objetivo (química, análisis químico, control de calidad).                                                                               |
| 4   | Programador / programadora de actividades ambientales.                                | No existe código CNO-11 approved para programadores de actividades ambientales. El rol es de planificación/programación, fuera de los dominios objetivo.                                                                                                                           |
| 9   | Técnica / técnico en control de plagas en el medio urbano y entorno natural asociado. | No existe código CNO-11 approved con correspondencia funcional directa. El control de plagas requiere conocimientos de entomología/biología, no de química o análisis químico. No se equipara con control de organismos nocivos (salida 7) que sí tiene cobertura parcial en 3129. |

## Notas de exclusión

- **Microbiología:** Excluida expresamente. Ninguna salida de SEA03S ni candidato CNO-11 se equipara con microbiología. El código 3314 (Técnicos en laboratorio de diagnóstico clínico) se excluye por corresponder a microbiología clínica, no a análisis químico ambiental.
- **Control de calidad alimentaria:** Excluido expresamente. La salida 8 ("Técnica / técnico de control sanitario (alimentos, aguas, atmósfera, residuos…).") incluye el componente de alimentos, pero se evalúa exclusivamente la correspondencia con los componentes de aguas, atmósfera y residuos (salud ambiental y análisis químico). No se equipara análisis químico ambiental con control de calidad alimentaria.
- **Código 3314 (Técnicos en laboratorio de diagnóstico clínico):** Excluido. Corresponde a microbiología/diagnóstico clínico, no a análisis químico ambiental ni salud ambiental.
