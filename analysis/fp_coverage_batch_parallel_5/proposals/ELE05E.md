# Informe de cobertura CNO-11 — ELE05E

**Fuente:** TodoFP — Curso de Especialización en Robótica Colaborativa (Acceso GS)
**URL:** `https://www.todofp.es/que-estudiar/familias-profesionales/electricidad-electronica/ce-robotica-colaborativa.html`
**Catálogo de ocupaciones:** `data/curated/occupations.json` (CNO-11, solo `reviewStatus: "approved"`)
**Fecha de análisis:** 2026-08-14

---

## Resumen

Ninguna de las cinco salidas profesionales documentadas del ELE05E encuentra un
candidato **CNO-11 approved** en el catálogo `occupations.json`. El catálogo
curado no contiene ninguna entrada cuya etiqueta (`preferredLabel`) mencione
robótica, robótica colaborativa, robot, automatización industrial, integración
de sistemas robóticos, programación de robots, proyectista de sistemas
robóticos ni puesta en marcha de sistemas robóticos. A continuación se
documenta cada salida con los candidatos considerados y rechazados, citas
literales y justificación del rechazo conforme al plan de preservación del
nivel funcional de robótica colaborativa y a la prohibición de equiparar con
automatización general o mantenimiento eléctrico industrial.

---

## 1. Jefe de equipo de supervisión de mantenimiento de sistemas de robótica

**Cita literal del ELE05E:** _"Jefe de equipo de supervisión de mantenimiento de sistemas de robótica"_

| Campo                          | Valor             |
| ------------------------------ | ----------------- |
| **Candidatos CNO-11 approved** | Ninguno           |
| **Estado**                     | **Sin candidato** |

### Candidatos considerados y rechazados

| occupationId            | Código | Etiqueta exacta                                   | Motivo de rechazo                                                                                                                                                                                                                                 |
| ----------------------- | ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupation:cno11:3209` | 3209   | Supervisores de otras industrias manufactureras   | La etiqueta es genérica para cualquier supervisión manufacturera; no menciona robótica, mantenimiento de sistemas robóticos ni colaborativa. Asignarla perdería el nivel funcional especializado en robótica colaborativa.                        |
| `occupation:cno11:3123` | 3123   | Técnicos en electricidad                          | Dominio eléctrico general. El contrato prohíbe explícitamente equiparar robótica colaborativa con mantenimiento eléctrico industrial.                                                                                                             |
| `occupation:cno11:3124` | 3124   | Técnicos en electrónica (excepto electromedicina) | Electrónica general, no supervisión de mantenimiento de sistemas robóticos. Sin coincidencia funcional directa.                                                                                                                                   |
| `occupation:cno11:3126` | 3126   | Técnicos en mecánica                              | Mecánica general, no robótica colaborativa. La supervisión de mantenimiento de sistemas robóticos requiere un perfil multidisciplinar (mecánica, electrónica, control, programación) que no captura una etiqueta genérica de técnico en mecánica. |
| `occupation:cno11:7521` | 7521   | Mecánicos y reparadores de equipos eléctricos     | Reparación de equipos eléctricos, no supervisión de mantenimiento de sistemas robóticos. El contrato prohíbe equiparar con mantenimiento eléctrico industrial.                                                                                    |
| `occupation:cno11:3209` | 3209   | Supervisores de otras industrias manufactureras   | Evaluado de nuevo: la supervisión de mantenimiento de robótica es cualificada y especializada; 3209 es una categoría paraguas que no preserva el dominio robótica colaborativa.                                                                   |

**Riesgo:** Forzar `3209` o `3123` como candidato incumpliría el criterio de
preservación del nivel funcional de robótica colaborativa y la prohibición
contractual de equiparar con automatización general o mantenimiento eléctrico
industrial.

---

## 2. Jefe de equipo de supervisión de montaje de sistemas de robótica colaborativa

**Cita literal del ELE05E:** _"Jefe de equipo de supervisión de montaje de sistemas de robótica colaborativa."_

| Campo                          | Valor             |
| ------------------------------ | ----------------- |
| **Candidatos CNO-11 approved** | Ninguno           |
| **Estado**                     | **Sin candidato** |

### Candidatos considerados y rechazados

| occupationId            | Código | Etiqueta exacta                                               | Motivo de rechazo                                                                                                                                                                                        |
| ----------------------- | ------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupation:cno11:3209` | 3209   | Supervisores de otras industrias manufactureras               | Misma razón que salida 1. Supervisión genérica manufacturera no captura el dominio específico de montaje de sistemas de robótica colaborativa.                                                           |
| `occupation:cno11:8209` | 8209   | Montadores y ensambladores no clasificados en otros epígrafes | Nivel operativo (montador/ensamblador), no de supervisión. Asignar 8209 rebajaría el nivel funcional de jefe de equipo a ejecutor de montaje. Violación del criterio de preservación de nivel funcional. |
| `occupation:cno11:8202` | 8202   | Ensambladores de equipos eléctricos y electrónicos            | Nivel operativo y dominio eléctrico/electrónico genérico, no supervisión de montaje de robótica colaborativa.                                                                                            |
| `occupation:cno11:7314` | 7314   | Montadores de estructuras metálicas                           | Nivel operativo (montador), dominio de estructuras metálicas, no robótica colaborativa.                                                                                                                  |
| `occupation:cno11:3123` | 3123   | Técnicos en electricidad                                      | El contrato prohíbe equiparar robótica colaborativa con mantenimiento eléctrico industrial. Además, es dominio eléctrico, no supervisión de montaje robótico.                                            |
| `occupation:cno11:3124` | 3124   | Técnicos en electrónica (excepto electromedicina)             | Electrónica genérica, no supervisión de montaje de sistemas robóticos colaborativos.                                                                                                                     |

**Riesgo:** Asignar `3209` diluiría la especialización en robótica colaborativa.
Asignar `8209` o `8202` rebajaría el nivel funcional de supervisión a operativo.

---

## 3. Programador de robots colaborativos

**Cita literal del ELE05E:** _"Programador de robots colaborativos."_

| Campo                          | Valor             |
| ------------------------------ | ----------------- |
| **Candidatos CNO-11 approved** | Ninguno           |
| **Estado**                     | **Sin candidato** |

### Candidatos considerados y rechazados

| occupationId            | Código | Etiqueta exacta                                                      | Motivo de rechazo                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupation:cno11:3820` | 3820   | Programadores informáticos                                           | Dominio de programación de aplicaciones y software informático, no programación de robots colaborativos ni control de robots. El perfil del programador de robots colaborativos incluye programación de movimientos, lógica de control y seguridad colaborativa (ISO 10218, ISO/TS 15066), ajeno a la programación informática general. |
| `occupation:cno11:2713` | 2713   | Analistas, programadores y diseñadores web y multimedia              | Desarrollo web y multimedia. Sin relación funcional con programación de robots colaborativos.                                                                                                                                                                                                                                           |
| `occupation:cno11:3139` | 3139   | Técnicos en control de procesos no clasificados bajo otros epígrafes | Control de procesos industriales genérico (automatización general). El contrato prohíbe equiparar robótica colaborativa con automatización general.                                                                                                                                                                                     |
| `occupation:cno11:2722` | 2722   | Administradores de sistemas y redes                                  | Administración de sistemas TI, no programación de robots.                                                                                                                                                                                                                                                                               |
| `occupation:cno11:3811` | 3811   | Técnicos en operaciones de sistemas informáticos                     | Operaciones de sistemas informáticos, no programación de robots.                                                                                                                                                                                                                                                                        |

**Riesgo:** Forzar `3820` introduciría una sustitución de competencias
(programación informática ↔ programación de robots). Forzar `3139` violaría
la prohibición de equiparar robótica colaborativa con automatización general.

---

## 4. Proyectista de sistemas de robótica colaborativa

**Cita literal del ELE05E:** _"Proyectista de sistemas de robótica colaborativa."_

| Campo                          | Valor             |
| ------------------------------ | ----------------- |
| **Candidatos CNO-11 approved** | Ninguno           |
| **Estado**                     | **Sin candidato** |

### Candidatos considerados y rechazados

| occupationId            | Código | Etiqueta exacta                                                                         | Motivo de rechazo                                                                                                                                                                                                      |
| ----------------------- | ------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupation:cno11:3129` | 3129   | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías | Categoría residual genérica sin referencia a robótica, diseño de sistemas ni proyección. No es correspondencia funcional directa. Forzarla equivaldría a inventar una cobertura donde no existe.                       |
| `occupation:cno11:3160` | 3160   | Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías   | Control de calidad, no diseño ni proyección de sistemas robóticos. Sin coincidencia funcional.                                                                                                                         |
| `occupation:cno11:3124` | 3124   | Técnicos en electrónica (excepto electromedicina)                                       | Electrónica general, no proyectista de sistemas de robótica colaborativa.                                                                                                                                              |
| `occupation:cno11:3126` | 3126   | Técnicos en mecánica                                                                    | Mecánica general, no proyectista de sistemas robóticos.                                                                                                                                                                |
| `occupation:cno11:3139` | 3139   | Técnicos en control de procesos no clasificados bajo otros epígrafes                    | Control de procesos industriales (automatización general). El contrato prohíbe equiparar robótica colaborativa con automatización general. Además, no cubre la función de proyectista/diseñador de sistemas robóticos. |

**Riesgo:** No existe en el catálogo ninguna ocupación CNO-11 approved que
describa explícita o funcionalmente a un proyectista de sistemas robóticos.
Cualquier asignación forzada a categorías residuales o genéricas sería una
sustitución de competencias y una violación del criterio de correspondencia
funcional directa.

---

## 5. Técnico de puesta en marcha de sistemas de robótica colaborativa

**Cita literal del ELE05E:** _"Técnico de puesta en marcha de sistemas de robótica colaborativa."_

| Campo                          | Valor             |
| ------------------------------ | ----------------- |
| **Candidatos CNO-11 approved** | Ninguno           |
| **Estado**                     | **Sin candidato** |

### Candidatos considerados y rechazados

| occupationId            | Código | Etiqueta exacta                                                                         | Motivo de rechazo                                                                                                                                                                                                                                                            |
| ----------------------- | ------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupation:cno11:3124` | 3124   | Técnicos en electrónica (excepto electromedicina)                                       | Electrónica general. La puesta en marcha de sistemas robóticos colaborativos incluye integración, calibración, programación de seguridad y validación funcional; no se reduce a electrónica genérica.                                                                        |
| `occupation:cno11:3123` | 3123   | Técnicos en electricidad                                                                | El contrato prohíbe equiparar robótica colaborativa con mantenimiento eléctrico industrial. La puesta en marcha de robótica colaborativa va más allá de instalaciones eléctricas.                                                                                            |
| `occupation:cno11:3126` | 3126   | Técnicos en mecánica                                                                    | Mecánica general, no integración ni puesta en marcha de sistemas robóticos.                                                                                                                                                                                                  |
| `occupation:cno11:3139` | 3139   | Técnicos en control de procesos no clasificados bajo otros epígrafes                    | Control de procesos industriales (automatización general). El contrato prohíbe equiparar robótica colaborativa con automatización general. La puesta en marcha de robótica colaborativa requiere competencias específicas de seguridad colaborativa y calibración de robots. |
| `occupation:cno11:7531` | 7531   | Mecánicos y reparadores de equipos electrónicos                                         | Reparación de hardware electrónico, no puesta en marcha de sistemas robóticos.                                                                                                                                                                                               |
| `occupation:cno11:3129` | 3129   | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías | Categoría residual sin vínculo funcional con integración robótica.                                                                                                                                                                                                           |

**Riesgo:** Forzar `3139` para cubrir esta salida violaría la prohibición
contractual de equiparar robótica colaborativa con automatización general.
Forzar `3123` violaría la prohibición de equiparar con mantenimiento eléctrico
industrial. La puesta en marcha de sistemas robóticos colaborativos es una
función especializada (integración, calibración, validación de seguridad) que
no tiene equivalente en el catálogo CNO-11 aprobado.

---

## Anexo: Ocupaciones CNO-11 approved del catálogo (dominio ELE/robótica/automatización)

Para trazabilidad, se listan las ocupaciones **approved** del catálogo que
podrían considerarse adyacentes al dominio de electricidad, electrónica,
mecánica y automatización, con indicación explícita de por qué ninguna
corresponde a las salidas de ELE05E:

| occupationId            | Código | Etiqueta exacta (preferredLabel)                                                        | Dominio                          | ¿Robótica colaborativa?                             |
| ----------------------- | ------ | --------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------- |
| `occupation:cno11:3123` | 3123   | Técnicos en electricidad                                                                | Electricidad                     | No (excluido por contrato: mantenimiento eléctrico) |
| `occupation:cno11:3124` | 3124   | Técnicos en electrónica (excepto electromedicina)                                       | Electrónica                      | No                                                  |
| `occupation:cno11:3126` | 3126   | Técnicos en mecánica                                                                    | Mecánica                         | No                                                  |
| `occupation:cno11:3129` | 3129   | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías | Ingenierías (genérico)           | No                                                  |
| `occupation:cno11:3139` | 3139   | Técnicos en control de procesos no clasificados bajo otros epígrafes                    | Control de procesos              | No (excluido por contrato: automatización general)  |
| `occupation:cno11:3160` | 3160   | Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías   | Control de calidad               | No                                                  |
| `occupation:cno11:3209` | 3209   | Supervisores de otras industrias manufactureras                                         | Supervisión manufacturera        | No (genérica, no preserva nivel funcional)          |
| `occupation:cno11:3820` | 3820   | Programadores informáticos                                                              | Programación TI                  | No                                                  |
| `occupation:cno11:7510` | 7510   | Electricistas de la construcción y afines                                               | Electricidad construcción        | No (excluido por contrato)                          |
| `occupation:cno11:7521` | 7521   | Mecánicos y reparadores de equipos eléctricos                                           | Mantenimiento eléctrico          | No (excluido por contrato)                          |
| `occupation:cno11:7531` | 7531   | Mecánicos y reparadores de equipos electrónicos                                         | Reparación electrónica           | No                                                  |
| `occupation:cno11:8202` | 8202   | Ensambladores de equipos eléctricos y electrónicos                                      | Ensamblaje eléctrico/electrónico | No (nivel operativo)                                |
| `occupation:cno11:8209` | 8209   | Montadores y ensambladores no clasificados en otros epígrafes                           | Montaje y ensamblaje genérico    | No (nivel operativo)                                |

---

## Conclusión

El catálogo `occupations.json` no contiene ninguna ocupación CNO-11 **approved**
cuya etiqueta o ámbito funcional corresponda a robótica colaborativa,
programación de robots, automatización industrial ni integración de sistemas
robóticos. Las cinco salidas profesionales del ELE05E quedan **sin candidato**.

**Riesgo principal:** La ausencia es total y documentada. Si en el futuro se
incorporasen ocupaciones CNO-11 específicas de robótica (p.ej. un hipotético
código para técnicos en robótica, programadores de robots, o integradores de
sistemas robóticos), este informe debería revisarse. Por ahora, el catálogo
curado carece de cualquier entrada que preserve el nivel funcional de robótica
colaborativa o que pueda servir como correspondencia funcional directa sin
violar las prohibiciones contractuales (automatización general, mantenimiento
eléctrico industrial).
