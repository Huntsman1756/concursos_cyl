# Propuesta de mapeo: QUI02M — Técnico en Operaciones de Laboratorio

**Fuente analizada:** `sources/QUI02M.txt` (TodoFP, Ministerio de Educación, FP y Deportes)
**Catálogo base:** `data/curated/occupations.json` (CNO-11, revisionStatus = `approved`)
**Fecha propuesta:** 2026-08-14

---

## 1. Laboratorios y Control de Calidad

### Candidato 3160

| Campo                                 | Valor                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CNO-11**                            | `3160`                                                                                                                                                                                                                                                                                                                                     |
| **occupationId**                      | `occupation:cno11:3160`                                                                                                                                                                                                                                                                                                                    |
| **Etiqueta CNO-11**                   | _Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías_                                                                                                                                                                                                                                                    |
| **reviewStatus**                      | `approved` (2026-08-12)                                                                                                                                                                                                                                                                                                                    |
| **Salida literal de QUI02M que cita** | _"control de calidad de materiales"_                                                                                                                                                                                                                                                                                                       |
| **Justificación**                     | La salida de QUI02M menciona explícitamente _"control de calidad de materiales"_. La ocupación CNO-11 3160 cubre técnicos de **control de calidad** en ciencias **químicas**, que es el núcleo de las operaciones de laboratorio químico. La coincidencia es funcional por las actividades de ensayo y medición bajo protocolo de calidad. |
| **Riesgo**                            | Medio. La ocupación se denomina "control de calidad" y puede enfocarse en inspección industrial más que en operación analítica libre; sin embargo, la presencia explícita de "control de calidad de materiais" en la fuente sustenta el vínculo.                                                                                           |
| **Ausencias del candidato**           | No cubre la parte de muestreo de campo; no cubre mantenimiento de servicios auxiliares ni almacén.                                                                                                                                                                                                                                         |

### Candidato 3129

| Campo                                     | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CNO-11**                                | `3129`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **occupationId**                          | `occupation:cno11:3129`                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Etiqueta CNO-11**                       | _Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías_                                                                                                                                                                                                                                                                                                                                                                               |
| **reviewStatus**                          | `approved` (2026-08-13)                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Salidas literales de QUI02M que citan** | _"laboratorios de química"_, _"industrias químicas"_, _"sector medioambiental"_, _"centros de formación e investigación"_                                                                                                                                                                                                                                                                                                                                               |
| **Justificación**                         | El título del CNO-11 3129 incluye explícitamente **ciencias químicas** y **medioambientales**. Las salidas deQUI02M mencionan directamente "laboratorios de química", "industriasquímicas" y "sector medioambiental" como ámbitos laborales del técnico enOPERaciones de laboratorio. La ocupación actúa como categoría general para técnicos de laboratorio en esas ciencias cuando no existe un epígrafe más específico (como 3314, que es solo diagnóstico clínico). |
| **Riesgo**                                | Medio. Al ser una categoría "otros", puede ser demasiado amplia y absorber perfiles distintos; además, "centros de formación e investigación" puede requerir perfiles académicos que no encajan en todas las aplicaciones industriales de 3129.                                                                                                                                                                                                                         |
| **Ausencias del alumno**                  | No cubre muestreo de campo per se; no cubre mantenimiento ni almacén; no distingue entre análisisquímico y físico de manera granular.                                                                                                                                                                                                                                                                                                                                   |

### Candidato 3314 — Rechazado por diferencia funcional

| Campo                 | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CNO-11**            | `3314`                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **occupationId**      | `occupation:cno11:3314`                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Etiqueta CNO-11**   | _Técnicos en laboratorio de diagnóstico clínico_                                                                                                                                                                                                                                                                                                                                                                                                        |
| **reviewStatus**      | `approved`                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Motivo de rechazo** | CNO-11 3314 es **exclusivamente** de diagnóstico clínico (laboratorios médicos/hospitalarios). QUI02M describe operaciones de laboratorio en química, industrias químicas, alimentarias, medioambientales, farmacéuticas y de aguas. Aunque la industria farmacéutica aparece en la fuente, 3314 se restringe al ámbito clínico-sanitario, no a producción farmacéutica ni a control analítico de materiales. No se acepta semejanza industrial mínima. |

---

## 2. Muestreo de Campo

### Sin candidato directo

| Campo                        | Valor                                                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Salida literal de QUI02M** | _"Muestreador / muestreadora y ensayos de campo"_                                                                                                                     |
| **Estado**                   | **AUSENTE** — No existe ninguna ocupación CNO-11 `approved` etiquetada ni descrita como muestreador/a, recopilador de muestras o técnico de toma de muestras in situ. |

**Análisis:** Ninguno de los 84 elementos `approved` de `occupations.json` contiene "muestrar", "muestreo", "toma de muestras", "ensayo de campo" o término equivalente. Las ocupaciones 3160 y 3129 cubren ensayo en laboratorio, pero no la fase de recolección _in situ_. Si se mapea, sería por semejanza industrial y no por coincidencia funcional directa.

---

## 3. Mantenimiento de Servicios Auxiliares, Equipamiento y Almacén

### Sin candidato directo

| Campo                        | Valor                                                                                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Salida literal de QUI02M** | _"Operador / operadora de mantenimiento de servicios auxiliares, equipamiento y almacén"_                                                                                                     |
| **Estado**                   | **AUSENTE** — No existe ocupación CNO-11 `approved` que combine mantenimiento de servicios auxiliares + equipamiento + almacén ni que cubra el perfil de operador de mantenimiento de planta. |

**Candidatos explorados y descartados:**

| CNO-11 | Etiqueta                                                        | Motivo de descarte                                                                                                                          |
| ------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `7510` | _Electricistas de la construcción y afines_                     | Solo electricidad de obra; no mantenimiento de servicios auxiliares de planta ni equipamiento industrial. Semejanza funcional insuficiente. |
| `8209` | _Montadores y ensambladores no clasificados en otros epígrafes_ | Montaje/ensamblaje, no mantenimiento de servicios auxiliares ni almacén. Diferencia de actividad.                                           |
| `3209` | _Supervisores de otras industrias manufactureras_               | Rol de supervisión, no de operador de mantenimiento o almacén. Diferencia de nivel.                                                         |
| `3202` | _Supervisores de la construcción de edificios_                  | `reviewStatus = rejected` además de ámbito de la construcción.                                                                              |

**Conclusión para esta rama:** La salida "operador de mantenimiento de servicios auxiliares, equipamiento y almacén" no tiene equivalente directo en CNO-11 `approved`. Declarar su ausência.

---

## 4. Resumen de mapeo

| Rama funcional                            | Candidato CNO-11                                                                               | occupationId            | Justificación principal                                                                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Laboratorio / química**                 | 3129 — Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías | `occupation:cno11:3129` | El epígrafe incluye "ciencias químicas" y "medioambientales", en línea con "laboratorios de química", "industriasquímicas" y "sector medioambiental". |
| **Control de calidad de materiales**      | 3160 — Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías   | `occupation:cno11:3160` | "Control de calidad de materiales" mencionado literalmente en la fuente.                                                                              |
| **Muestreo de campo**                     | —                                                                                              | —                       | **AUSENTE**. Sin ocupación `approved` con función de muestreo _in situ_.                                                                              |
| **Mantenimiento, equipamiento y almacén** | —                                                                                              | —                       | **AUSENTE**. Sin ocupación `approved` que cubra este perfil de operador.                                                                              |
| **Diagnóstico clínico**                   | 3314 — Rechazado                                                                               | `occupation:cno11:3314` | Ámbito exclusivamente clínico, no industrial/laboratorio general.                                                                                     |

---

## 5. Salidas que no tienen equivalencia directa

Las siguientes salidas de QUI02M **no cuentan con ninguna ocupación CNO-11 `approved` cuyo rótulo o ámbito funcional las cubra de forma explícita**:

1. _"Auxiliar, operador / operadora o técnica / técnico de laboratorios de química"_ — Parcialmente cubierto por 3129 y 3160, pero el rango amplio (química, alimentaria, farmacéutica, metalurgia, galvanotecnia, ensayos mecánicos, microbiología alimentaria, aguas) excede lo que una sola ocupación puede abarcar. Se asignan los dos candidatos 3129/3160 donde su ámbito de "químicas" aplica, pero no se extiende a todas las sub-partes enumeradas.

2. _"Muestreador / muestreadora y ensayos de campo"_ — Ausente.

3. _"Industrias alimentarias"_ — La fuente enumera este sector como ámbito de salida, pero ningún candidato propuesto (`3129`, `3160`) hace mención a la industria alimentaria. No se convierte la enumeración sectorial en ocupación aprobada porque 3129/3160 se justifican por el ámbito de química/ciencia, no por alimentación.

4. _"Metalurgia y galvanotecnia"_ — Ausente.

5. _"Ensayos de productos de fabricación mecánica"_ — Ausente.

6. _"Microbiología alimentaria, medioambiental, farmacéutica y de aguas"_ — Parcialmente cubierto por 3129 (medioambiental), pero no por alimentaria, farmacéutica ni aguas específicamente.

7. _"Centros de formación e investigación"_ — Ausente como categoría profesional independiente (la investigación puede ser una actividad de 3129/3160, no una ocupación de por sí).

8. _"Control y recepción de materias"_ — No aparece literalmente; se aproxima a "control de calidad de materiales" (3160).

9. _"Operador / operadora de mantenimiento de servicios auxiliares, equipamiento y almacén"_ — Ausente.

---

_Fin de la propuesta. No se modifica ningún otro archivo. Los candidatos propuestos (3129, 3160) tienen `reviewStatus` = `approved`. Todas las citas literales provienen de `sources/QUI02M.txt`._
