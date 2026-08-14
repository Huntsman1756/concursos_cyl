# INA02S — Técnico Superior en Procesos y Calidad en la Industria Alimentaria

**Fuente:** `analysis/fp_coverage_batch_parallel_4/sources/INA02S.txt`
**Catálogo:** `data/curated/occupations.json` (solo `reviewStatus: approved`)
**Fecha:** 2026-08-14

---

## Resumen del título

INA02S define 14 salidas profesionales centradas en procesos industriales, calidad, laboratorio, producción y seguridad alimentaria. No menciona bollería ni confitería como perfil definitorio.

---

## Candidatos CNO-11 approved — correspondencia exacta o funcional directa

### 1. 3160 — Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías

| Campo               | Valor                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **occupationId**    | `occupation:cno11:3160`                                                                                                                                                                                                              |
| **Código**          | 3160                                                                                                                                                                                                                                 |
| **Etiqueta exacta** | Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías                                                                                                                                                |
| **Citas literales** | "Inspector / inspectora o auditor / auditora de calidad." · "Técnica / técnico en análisis de alimentos." · "Técnica / técnico en análisis sensorial." · "Técnica / técnico en laboratorio de control de calidad."                   |
| **Justificación**   | El CNO-113160 agrupa técnicos de control de calidad en entornos científicos e industriales. Las cuatro salidas de INA02S relativas a laboratorio, análisis, auditoría y control de calidad encajan funcionalmente en esta categoría. |
| **Riesgo**          | Medio — la etiqueta CNO-11 es genérica (ciencias físicas, químicas, ingenierías) y no menciona industria alimentaria. Un food auditor o analista sensorial podría no reconocerse plenamente en la denominación oficial.              |

---

### 2. 3209 — Supervisores de otras industrias manufactureras

| Campo               | Valor                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:3209`                                                                                                                                                                                                                                                                                                                                                      |
| **Código**          | 3209                                                                                                                                                                                                                                                                                                                                                                         |
| **Etiqueta exacta** | Supervisores de otras industrias manufactureras                                                                                                                                                                                                                                                                                                                              |
| **Citas literales** | "Encargada / encargado de la línea de envasado y embalaje." · "Encargada / encargado de producción." · "Jefa / jefe de línea, planta de fabricación, sección o de almacén." · "Jefa / jefe de turno." · "Supervisor / supervisora de equipos, procesos y productos."                                                                                                         |
| **Justificación**   | Las cinco salidas de supervisión y producción de INA02S describen puestos de mando en planta alimentaria: línea, turno, producción, envasado y supervisión de procesos/productos. 3209 ("Supervisores de otras industrias manufactureras") es la categoría CNO-11 que agrupa supervisión en industrias no específicamente listadas, lo que incluye la industria alimentaria. |
| **Riesgo**          | Medio — categoría residual ("otras industrias manufactureras") sin especificidad alimentaria. La dispersión funcional (envasado ≠ producción ≠ turno) reduce la nitidez de la correspondencia.                                                                                                                                                                               |

---

### 3. 3510 — Agentes y representantes comerciales

| Campo               | Valor                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:3510`                                                                                                                                                            |
| **Código**          | 3510                                                                                                                                                                               |
| **Etiqueta exacta** | Agentes y representantes comerciales                                                                                                                                               |
| **Cita literal**    | "Técnica / técnico comercial."                                                                                                                                                     |
| **Justificación**   | Correspondencia léxica directa: "técnico comercial" ↔ "agentes y representantes comerciales". La función de venta técnica de productos alimentarios se encuadra en esta categoría. |
| **Riesgo**          | Bajo — equivalencia semántica directa sobre la función comercial.                                                                                                                  |

---

### 4. 4121 — Empleados de control de abastecimientos e inventario

| Campo               | Valor                                                                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **occupationId**    | `occupation:cno11:4121`                                                                                                                                                                                                                                                              |
| **Código**          | 4121                                                                                                                                                                                                                                                                                 |
| **Etiqueta exacta** | Empleados de control de abastecimientos e inventario                                                                                                                                                                                                                                 |
| **Cita literal**    | "Encargada / encargado de aprovisionamientos."                                                                                                                                                                                                                                       |
| **Justificación**   | "Aprovisionamientos" equivale funcionalmente a "abastecimientos". Ambos describen la gestión de compras y suministros de materia prima y envases en planta alimentaria.                                                                                                              |
| **Riesgo**          | Medio-alto — disparidad de nivel cualificativo: INA02S es Técnico Superior (nivel 5 FP), mientras que 4121 es categoría de "empleados" (nivel 4 CNO-11). Adicionalmente, "encargado" implica gestión y liderazgo que excede el alcance de "control de abastecimientos e inventario". |

---

## Salidas sin candidato CNO-11 approved

| #   | Salida fuente                                                                        | Motivo de ausencia                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | "Encargada / encargado de control ambiental y seguridad laboral."                    | No existe ocupación CNO-11 approved que cubra seguridad laboral ni control ambiental en contexto alimentario. 3129 ("Otros técnicos... medioambientales") cubre solo la mitad ambiental, no la seguridad laboral; riesgo insuficiente para incluirlo como candidato funcional directo.    |
| 3   | "Encargada / encargado de elaboración de nuevos productos y desarrollo de procesos." | I+D de nuevos productos alimentarios no tiene correspondencia CNO-11. 3139 ("Técnicos en control de procesos") describe control de procesos existentes, no desarrollo de nuevos. La función de "elaboración de nuevos productos" es intrínsecamente de innovación y no encaja en control. |
| 4   | "Encargada / encargado de la gestión de la seguridad alimentaria."                   | Food safety management (HACCP, APPCC, auditorías de seguridad alimentaria) no tiene categoría CNO-11 específica. 3160 cubre calidad genérica pero no la gestión de seguridad alimentaria como disciplina independiente.                                                                   |

---

## Nota sobre bollería y confitería

Ninguna de las 14 salidas de INA02S menciona bollería ni confitería. El título se circunscribe a procesos industriales, calidad, laboratorio, producción y seguridad alimentaria.
