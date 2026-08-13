# Propuesta de correspondencias SAN07S → CNO-11

**Familidad profesional:** Técnico Superior en Imagen para el Diagnóstico y Medicina Nuclear
**Fuente:** TodoFP, Ministerio de Educación. Consulta: 2026-08-13.
**Catálogo base:** `data/curated/occupations.json`, versión 1.0.0

---

## 1. Candidatos propuestos

### 1.1 Delegado comercial de productos hospitalarios y farmacéuticos

| Campo                         | Valor                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código CNO-11**             | 2640                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **occupationId**              | `occupation:cno11:2640`                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Etiqueta del catálogo**     | _Profesionales de ventas técnicas y médicas (excepto las TIC)_                                                                                                                                                                                                                                                                                                                                                                    |
| **Cita textual de la fuente** | `delegado comercial de productos hospitalarios y farmacéuticos`                                                                                                                                                                                                                                                                                                                                                                   |
| **Justificación**             | La salida describe un puesto de delegación/comercialización de productos hospitalarios y farmacéuticos. El epígrafe CNO-11:2640 ("Profesionales de ventas técnicas y médicas") cubre específicamente la venta de productos médicos/farmacéuticos como actividad principal, sin incluir las TIC. La correspondencia es coherente tanto en sector (sanitario) como en naturaleza de actividad (comercialización de bienes médicos). |
| **Confianza**                 | **Alta** — Coincidencia semántica directa: "productos farmacéuticos" → "ventas médicas" dentro del mismo sector sanitario.                                                                                                                                                                                                                                                                                                        |

---

## 2. Salidas rechazadas o sin correspondencia

Las salidas siguientes no hallaron ningún _occupationId_ existente en `data/curated/occupations.json` cuyo contenido sea suficiente para afirmar una correspondencia CNO-11. Se rechazan por falta de evidencia directa, tal como exige el contrato.

### 2.1 Técnico superior en imagen para el diagnóstico

| Campo             | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CNO-11**        | Ninguno                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Justificación** | La fuente describe la actividad técnica de generación/interpretación de imágenes diagnósticas por rayos X, TAC, resonancia magnética, ecografía, etc. El catálogo no contiene ningún epígrafe para "técnicos de diagnóstico por imagen" ni equivalente. Los únicos campos sanitarios presentes (5611, 5612, 5621, 5629) corresponden a auxiliares de enfermería, técnicos auxiliares de farmacia y trabajadores de cuidados no clasificados, ninguno de los cuales cubre la operación de equipos de diagnóstico por imagen ni su interpretación técnica. |
| **Confianza**     | **N/A** — Rechazada por ausencia de candidato válido.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### 2.2 Técnico especialista en radiodiagnóstico

| Campo             | Valor                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CNO-11**        | Ninguno                                                                                                                                                                                                                                                                                                                                                                           |
| **Justificación** | Puesto de gestión y ejecución de pruebas de radiodiagnóstico en centros sanitarios. No existe en el catálogo ninguna categoría de "técnicos de radiodiagnóstico", "técnicos de imagen diagnóstica" ni epígrafe genérico de "técnicos sanitarios de diagnóstico". Los campos disponibles son auxiliares, farmacéuticos y cuidados generales, sin correlación con radiodiagnóstico. |
| **Confianza**     | **N/A** — Rechazada por ausencia de candidato válido.                                                                                                                                                                                                                                                                                                                             |

### 2.3 Técnico especialista en medicina nuclear

| Campo             | Valor                                                                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CNO-11**        | Ninguno                                                                                                                                                                                                                                                                   |
| **Justificación** | Puesto especializado en administración de radiofármacos y obtención de imágenes mediante técnicas de medicina nuclear (gammagrafías, PET). No figura en el catálogo ninguna categoría equivalente ni siquiera genérica para técnicos de medicina nuclear o radiofármacos. |
| **Confianza**     | **N/A** — Rechazada por ausencia de candidato válido.                                                                                                                                                                                                                     |

### 2.4 Personal técnico en equipos de radioelectrología médica

| Campo             | Valor                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CNO-11**        | Ninguno                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Justificación** | Puesto técnico dedicado al mantenimiento, instalación y soporte de equipos de radioelectrología médica. El catálogo contiene un epígrafe de "Técnicos en electrónica (excepto electromedicina)" (`occupation:cno11:3124`), pero la propia nota de exclusión ("excepto electromedicina") impide su uso. No existe ninguna categoría de mantenimiento de equipamiento médico electromédico en el catálogo curado. |
| **Confianza**     | **N/A** — Rechazada por ausencia de candidato válido.                                                                                                                                                                                                                                                                                                                                                           |

### 2.5 Personal técnico en protección radiológica

| Campo             | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CNO-11**        | Ninguno                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Justificación** | Especialista en control de seguridad radiológica, dosimetría y cumplimiento normativo de protección frente a radiaciones ionizantes. No existe en el catálogo ningún epígrafe de "técnicos de protección radiológica", "inspectores de seguridad radiológica" ni categoría ambiental/industrial equivalente (salvo el apartado 3160, "Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías", que carece de la especificidad de radioprotección y no se aplica de forma conservadora). |
| **Confianza**     | **N/A** — Rechazada por ausencia de candidato válido.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### 2.6 Personal técnico en radiología de investigación y experimentación

| Campo             | Valor                                                                                                                                                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CNO-11**        | Ninguno                                                                                                                                                                                                                                                                                 |
| **Justificación** | Puesto dedicado a la investigación y desarrollo en técnicas de imagen radiológica. No hay en el catálogo ninguna categoría de "técnicos de investigación médica", "personal de laboratorio de investigación en imágenes" ni epígrafe genérico de investigación en ciencias de la salud. |
| **Confianza**     | **N/A** — Rechazada por ausencia de candidato válido.                                                                                                                                                                                                                                   |

---

## 3. Resumen

| Salida profesional                                                | occupationId            | Confianza | Estado       |
| ----------------------------------------------------------------- | ----------------------- | --------- | ------------ |
| Delegado comercial de productos hospitalarios y farmacéuticos     | `occupation:cno11:2640` | Alta      | **Aceptado** |
| Técnico superior en imagen para el diagnóstico                    | —                       | —         | Rechazada    |
| Técnico especialista en radiodiagnóstico                          | —                       | —         | Rechazada    |
| Técnico especialista en medicina nuclear                          | —                       | —         | Rechazada    |
| Personal técnico en equipos de radioelectrología médica           | —                       | —         | Rechazada    |
| Personal técnico en protección radiológica                        | —                       | —         | Rechazada    |
| Personal técnico en radiología de investigación y experimentación | —                       | —         | Rechazada    |

**Total entradas de la fuente:** 7
**Aceptadas:** 1
**Rechazadas/sin correspondencia:** 6

---

## 4. Notas sobre las salidas rechazadas

Se mantuvo una política conservadora de _fail-closed_: ninguna salida se asignó a un `occupationId` del catálogo salvo cuando la equivalencia fue directa y verificable. En particular:

- **3121 (Técnicos en imagen médica) y 3122 (Técnicos de medicina nuclear)** son epígrafes reales del CNO-11 oficial, pero **no están presentes** en `data/curated/occupations.json`. El contrato exige exclusivamente _occupationId_ existentes en el catálogo curado; por ello no se usan.
- El epígrafe **3124** (`Técnicos en electrónica excepto electromedicina`) excluye expresamente electromedicina, lo que impide su uso para el mantenimiento de equipamiento médico.
- No se han modificado los archivos `data/curated/occupations.json` ni ningún JSON del repositorio.
