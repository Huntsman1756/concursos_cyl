# Informe de cobertura CNO-11 — IFC01E

**Fuente:** TodoFP — Curso de Especialización en Ciberseguridad en Entornos
de las Tecnologías de la Información (Acceso GS)
**URL:** `https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/ce-ciberseguridad-entornos-tecnologias-informacion.html`
**Catálogo de ocupaciones:** `data/curated/occupations.json` (CNO-11)
**Fecha de análisis:** 2026-08-14

---

## Resumen

Ninguna de las cuatro salidas profesionales del IFC01E encuentra un candidato
**CNO-11 approved** en el catálogo `occupations.json`. A continuación se
documenta cada salida con los candidatos considerados y rechazados, citas
literales y justificación del rechazo conforme al plan de razonamiento.

---

## 1. Auditoría de ciberseguridad

**Cita literal del IFC01E:** _"Auditor/a de ciberseguridad."_

| Campo                          | Valor             |
| ------------------------------ | ----------------- |
| **Candidatos CNO-11 approved** | Ninguno           |
| **Estado**                     | **Sin candidato** |

### Candidatos considerados y rechazados

| occupationId            | Código | Etiqueta exacta                                                                         | Motivo de rechazo                                                                                                                                           |
| ----------------------- | ------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupation:cno11:2722` | 2722   | Administradores de sistemas y redes                                                     | El contrato prohíbe explícitamente equiparar ciberseguridad con administración de sistemas. La etiqueta no menciona seguridad, auditoría ni ciberseguridad. |
| `occupation:cno11:3813` | 3813   | Técnicos en redes                                                                       | El contrato prohíbe explícitamente equiparar ciberseguridad con redes genéricas. La etiqueta no menciona seguridad ni auditoría.                            |
| `occupation:cno11:3811` | 3811   | Técnicos en operaciones de sistemas informáticos                                        | Operaciones de sistemas, no auditoría de seguridad. Sin coincidencia funcional directa.                                                                     |
| `occupation:cno11:3820` | 3820   | Programadores informáticos                                                              | Programación de aplicaciones, no auditoría de seguridad.                                                                                                    |
| `occupation:cno11:2721` | 2721   | Diseñadores y administradores de bases de datos                                         | Administración de bases de datos, no auditoría de seguridad.                                                                                                |
| `occupation:cno11:3129` | 3129   | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías | Categoría residual genérica sin referencia a ciberseguridad. No es correspondencia funcional directa.                                                       |

**Riesgo:** Si se forzase `2722` o `3813` como candidato se incumpliría el
criterio de aceptación que exige no confundir ciberseguridad con administración
de sistemas o redes genéricas.

---

## 2. Consultoría de ciberseguridad

**Cita literal del IFC01E:** _"Consultor/a de ciberseguridad."_

| Campo                          | Valor             |
| ------------------------------ | ----------------- |
| **Candidatos CNO-11 approved** | Ninguno           |
| **Estado**                     | **Sin candidato** |

### Candidatos considerados y rechazados

| occupationId            | Código | Etiqueta exacta                                                                         | Motivo de rechazo                                                                              |
| ----------------------- | ------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `occupation:cno11:2722` | 2722   | Administradores de sistemas y redes                                                     | Misma prohibición contractual. Consultoría de ciberseguridad no es administración de sistemas. |
| `occupation:cno11:3813` | 3813   | Técnicos en redes                                                                       | Misma prohibición contractual. Consultoría de ciberseguridad no es soporte de redes.           |
| `occupation:cno11:3812` | 3812   | Técnicos en asistencia al usuario de tecnologías de la información                      | Soporte a usuarios, no consultoría de seguridad.                                               |
| `occupation:cno11:3820` | 3820   | Programadores informáticos                                                              | Programación, no consultoría de seguridad.                                                     |
| `occupation:cno11:2713` | 2713   | Analistas, programadores y diseñadores web y multimedia                                 | Desarrollo web, no consultoría de seguridad.                                                   |
| `occupation:cno11:3814` | 3814   | Técnicos de la Web                                                                      | Operación y soporte web, no consultoría de seguridad.                                          |
| `occupation:cno11:3129` | 3129   | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías | Categoría residual sin vínculo funcional con consultoría de ciberseguridad.                    |
| `occupation:cno11:3139` | 3139   | Técnicos en control de procesos no clasificados bajo otros epígrafes                    | Control de procesos industriales, no consultoría de seguridad de la información.               |

**Riesgo:** Asignar `2722` o `3813` introduciría una sustitución de
competencias prohibida por el contrato.

---

## 3. Analista de ciberseguridad

**Nota:** El IFC01E no incluye literalmente "Analista de ciberseguridad" entre
sus sourceQuotes; se trata de una salida adicional solicitada en el contrato
para evaluación de cobertura.

| Campo                          | Valor             |
| ------------------------------ | ----------------- |
| **Candidatos CNO-11 approved** | Ninguno           |
| **Estado**                     | **Sin candidato** |

### Candidatos considerados y rechazados

| occupationId            | Código | Etiqueta exacta                                                                  | Motivo de rechazo                                                                                                            |
| ----------------------- | ------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `occupation:cno11:2713` | 2713   | Analistas, programadores y diseñadores web y multimedia                          | La etiqueta contiene "Analistas" pero el ámbito es web/multimedia, no ciberseguridad. No hay coincidencia funcional directa. |
| `occupation:cno11:2722` | 2722   | Administradores de sistemas y redes                                              | Prohibición contractual: no equiparar ciberseguridad con administración de sistemas.                                         |
| `occupation:cno11:3813` | 3813   | Técnicos en redes                                                                | Prohibición contractual: no equiparar ciberseguridad con redes genéricas.                                                    |
| `occupation:cno11:3811` | 3811   | Técnicos en operaciones de sistemas informáticos                                 | Operaciones, no análisis de seguridad.                                                                                       |
| `occupation:cno11:3820` | 3820   | Programadores informáticos                                                       | Programación, no análisis de seguridad.                                                                                      |
| `occupation:cno11:3812` | 3812   | Técnicos en asistencia al usuario de tecnologías de la información               | Soporte, no análisis de seguridad.                                                                                           |
| `occupation:cno11:3814` | 3814   | Técnicos de la Web                                                               | Soporte web, no análisis de seguridad.                                                                                       |
| `occupation:cno11:7533` | 7533   | Instaladores y reparadores en tecnologías de la información y las comunicaciones | Instalación y reparación de telecomunicaciones, no análisis de seguridad.                                                    |

**Riesgo:** El término "Analistas" en `2713` podría inducir a error, pero el
contexto (desarrollo web/multimedia) es ajeno a la ciberseguridad.

---

## 4. Pentesting / Hacker ético

**Cita literal del IFC01E:** _"Hacker ético."_

| Campo                          | Valor             |
| ------------------------------ | ----------------- |
| **Candidatos CNO-11 approved** | Ninguno           |
| **Estado**                     | **Sin candidato** |

### Candidatos considerados y rechazados

| occupationId            | Código | Etiqueta exacta                                                                         | Motivo de rechazo                                                                                                   |
| ----------------------- | ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `occupation:cno11:2722` | 2722   | Administradores de sistemas y redes                                                     | Prohibición contractual. El hacking ético es una especialidad de seguridad ofensiva, no administración de sistemas. |
| `occupation:cno11:3813` | 3813   | Técnicos en redes                                                                       | Prohibición contractual. Redes genéricas no equivalen a pentesting.                                                 |
| `occupation:cno11:3820` | 3820   | Programadores informáticos                                                              | Programación no es pentesting ni hacking ético.                                                                     |
| `occupation:cno11:3811` | 3811   | Técnicos en operaciones de sistemas informáticos                                        | Operaciones, no pruebas de penetración.                                                                             |
| `occupation:cno11:3812` | 3812   | Técnicos en asistencia al usuario de tecnologías de la información                      | Soporte, no hacking ético.                                                                                          |
| `occupation:cno11:7531` | 7531   | Mecánicos y reparadores de equipos electrónicos                                         | Reparación de hardware electrónico, no ciberseguridad ofensiva.                                                     |
| `occupation:cno11:7533` | 7533   | Instaladores y reparadores en tecnologías de la información y las comunicaciones        | Instalación de telecomunicaciones, no hacking ético.                                                                |
| `occupation:cno11:3129` | 3129   | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías | Categoría residual sin conexión funcional.                                                                          |

**Riesgo:** Ninguna ocupación del catálogo cubre pruebas de penetración,
evaluación de vulnerabilidades o hacking ético. Cualquier asignación forzada
sería una sustitución de competencias.

---

## 5. Salida adicional del IFC01E: Experto/a en ciberseguridad

**Cita literal del IFC01E:** _"Experto/a en ciberseguridad."_

Aunque el contrato no solicita explícitamente candidatos para esta salida, se
documenta por completitud:

| occupationId | Código | Etiqueta exacta | Motivo de rechazo                                                                                                                                    |
| ------------ | ------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| —            | —      | —               | Ninguna ocupación CNO-11 approved en el catálogo menciona ciberseguridad, seguridad informática, seguridad de la información o experto en seguridad. |

---

## Anexo: Ocupaciones CNO-11 approved del catálogo (todas las TIC)

Para trazabilidad, se listan todas las ocupaciones **approved** del catálogo
relacionadas con informática y comunicaciones, con indicación explícita de por
qué ninguna corresponde a las salidas de IFC01E:

| occupationId            | Código | Etiqueta exacta (preferredLabel)                                                        | Dominio                | ¿Ciberseguridad?           |
| ----------------------- | ------ | --------------------------------------------------------------------------------------- | ---------------------- | -------------------------- |
| `occupation:cno11:2713` | 2713   | Analistas, programadores y diseñadores web y multimedia                                 | Desarrollo web         | No                         |
| `occupation:cno11:2721` | 2721   | Diseñadores y administradores de bases de datos                                         | Bases de datos         | No                         |
| `occupation:cno11:2722` | 2722   | Administradores de sistemas y redes                                                     | Sysadmin/redes         | No (excluido por contrato) |
| `occupation:cno11:3811` | 3811   | Técnicos en operaciones de sistemas informáticos                                        | Operaciones TI         | No                         |
| `occupation:cno11:3812` | 3812   | Técnicos en asistencia al usuario de tecnologías de la información                      | Soporte usuario        | No                         |
| `occupation:cno11:3813` | 3813   | Técnicos en redes                                                                       | Redes                  | No (excluido por contrato) |
| `occupation:cno11:3814` | 3814   | Técnicos de la Web                                                                      | Soporte web            | No                         |
| `occupation:cno11:3820` | 3820   | Programadores informáticos                                                              | Programación           | No                         |
| `occupation:cno11:7531` | 7531   | Mecánicos y reparadores de equipos electrónicos                                         | Hardware               | No                         |
| `occupation:cno11:7533` | 7533   | Instaladores y reparadores en tecnologías de la información y las comunicaciones        | Telecom/instalación    | No                         |
| `occupation:cno11:3129` | 3129   | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías | Ingenierías (genérico) | No                         |
| `occupation:cno11:3139` | 3139   | Técnicos en control de procesos no clasificados bajo otros epígrafes                    | Control procesos       | No                         |

---

## Conclusión

El catálogo `occupations.json` no contiene ninguna ocupación CNO-11 **approved**
cuya etiqueta (preferredLabel) o ámbito funcional corresponda a auditoría de
ciberseguridad, consultoría de ciberseguridad, analista de ciberseguridad o
pentesting/hacker ético. Las cuatro salidas evaluadas quedan **sin candidato**.

**Riesgo principal:** Si en una fase posterior se incorporasen ocupaciones
CNO-11 específicas de ciberseguridad (p.ej. un hipotético código 2723 o similar
del INE), sería necesario revisar este informe para evaluar su cobertura. Por
ahora, la ausencia en el catálogo es total y documentada.
