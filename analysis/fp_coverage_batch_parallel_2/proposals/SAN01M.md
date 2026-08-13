# Propuesta de correspondencias SAN01M → CNO-11

**Fuente:** TodoFP — Técnico en Emergencias Sanitarias (SAN01M)
**Fecha de consulta:** 2026-08-13
**Catálogo de referencia:** `data/curated/occupations.json` (CNO-11, v1.0.0, 100 entradas curadas)
**Estado:** Propuesta pre-revisión — debe ser validada por Codex antes de cualquier inclusión.

---

## 1. Salidas profesionales (Fuente TodoFP)

| # | Salida profesional | Cita literal de TodoFP |
|---|-------------------|------------------------|
| 1 | Centros de coordinación de urgencias y emergencias | `centros de coordinación de urgencias y emergencias` |
| 2 | Emergencias sanitarias | `emergencias sanitarias` |
| 3 | Teleasistencia | `teleasistencia` |
| 4 | Transporte sanitario | `transporte sanitario` |

---

## 2. Candidatos propuestos (correspondencia)

### 2.1. Centros de coordinación de urgencias y emergencias

| Campo         | Valor                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| CNO-11 código | 4411                                                                                                                         |
| occupationId  | `occupation:cno11:4411`                                                                                                      |
| Etiqueta CNO  | Empleados de información al usuario                                                                                          |
| Cita TodoFP   | `centros de coordinación de urgencias y emergencias`                                                                         |
| Justificación | Los centros de coordinación de urgencias y emergencias funcionan como centrales de recepción y clasificación de llamadas y emergencias. CNO 4411 ("Empleados de información al usuario") cubre la recepción, orientación y canalización de información al público, que es la función principal del operador del centro de coordinación (recepción de la emergencia, clasificación y derivación). No corresponde a teleoperador de ventas (4424) ni a telefonista (4423), cuyo ámbito es comercial. |
| Confianza     | **Media-Baja** — CNO 4411 está orientado a información general al usuario, no a emergencias técnicas. La correspondencia se basa en la función de recepción y canalización de información, pero no existe en el catálogo curado ningún epígrafe dedicado específicamente a centros de emergencia o urgencias. |

---

### 2.2. Emergencias sanitarias

| Campo         | Valor                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| CNO-11 código | 5611                                                                                                                               |
| occupationId  | `occupation:cno11:5611`                                                                                                            |
| Etiqueta CNO  | Auxiliares de enfermería hospitalaria                                                                                              |
| Cita TodoFP   | `emergencias sanitarias`                                                                                                           |
| Justificación | El técnico en emergencias sanitarias ejerce en urgencias y emergencias hospitalarias (UCI, RCP, inmovilización, transporte intrahospitalario, soporte vital básico/avanzado en situación de urgencia). CNO 5611 ("Auxiliares de enfermería hospitalaria") cubre la asistencia sanitaria en ámbito hospitalario, donde se desarrollan las competencias clínicas del Técnico en Emergencias Sanitarias (apoyo a facultativos, asistencia en urgencias, monitorización de constantes vitales). La correspondencia se justifica por ámbito hospitalario y funciones de apoyo asistencial. |
| Confianza     | **Media-Alta** — La ocupación CNO 5611 coincide en ámbito (hospitalario/urgencias) y categoría profesional (auxiliar técnico sanitario). Las funciones específicas de emergencias sanitarias (RCP, inmovilización, soporte vital) son más especializadas que las de un auxiliar de enfermería genérico, pero es el epígrafe más cercano del catálogo curado para este perfil técnico-sanitario en entorno hospitalario. **No se fuerza emergencia hacia cuidados genéricos**: 5611 se aplica al ámbito hospitalario de urgencias, no a cuidados domiciliarios. |

---

## 3. Salidas rechazadas o sin correspondencia

### 3.1. Teleasistencia

| Campo                | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resultado            | Sin correspondencia suficiente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Cita TodoFP          | `teleasistencia`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Motivo del rechazo   | La teleasistencia implica el seguimiento remoto de pacientes/dependientes y la gestión de llamadas asistenciales a distancia. Aunque el catálogo curado contiene dos epígrafes relacionados con la comunicación: CNO 4424 (`occupation:cno11:4424` — "Teleoperadores") y CNO 4423 (`occupation:cno11:4423` — "Telefonistas"), ambos tienen ámbito comercial/transporte y no asistencial. CNO 4421 (`occupation:cno11:4421`, si existiera) no está en el catálogo curado actual. No se puede forzar la correspondencia hacia 4424 (teleoperadores de ventas) ni hacia 5710 ("Trabajadores de los cuidados personales a domicilio"), porque la teleasistencia es un perfil técnico sanitario que supervisa y gestiona la asistencia a distancia, no un cuidador que atiende al domicilio. Tampoco se extrapola hacia 5629 ("Trabajadores de los cuidados a las personas en servicios de salud no clasificados"), pues este epígrafe corresponde a asistencia presencial en centros. **No se fuerza emergencias ni teleoperación hacia cuidados genéricos**. La ocupación CNO específica para teleasistencia técnica-sanitaria no está en el catálogo curado. |

### 3.2. Transporte sanitario

| Campo                | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------──── |
| Resultado            | Sin correspondencia suficiente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Cita TodoFP          | `transporte sanitario`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Motivo del rechazo   | El transporte sanitario implica el traslado de pacientes asistidos (ambulancias, unidades de emergencia) con acompañamiento técnico-sanitario. La única ocupación del catálogo curado que podría parecer relacionada es CNO 4123 (`occupation:cno11:4123` — "Empleados de logística y transporte de pasajeros y mercancías"), pero este epígrafe se refiere a la gestión logística-administrativa del transporte (planificación de rutas, gestión de flotas), no al acompañamiento clínico durante el traslado. El técnico en emergencias sanitarias que realiza transporte sanitario ejerce funciones de soporte vital, estabilización y atención médica durante el transporte, que no están cubiertas por ningún epígrafe del catálogo: CNO 5611 (auxiliares de enfermería hospitalaria) corresponde a asistencia en centro hospitalario, no a asistencia durante el traslado; CNO 5629 (cuidados a las personas en servicios de salud no clasificados) corresponde a asistencia presencial en centros. No se fuerza la correspondencia de transporte sanitario hacia 4123 (logística de transporte) ni se extrapola hacia cuidados genéricos mediante 5710 o 5629, porque el núcleo del perfil es técnico-sanitario asistencial, no logístico ni de cuidados domiciliarios. |

### 3.3. Ocupaciones del catálogo curado no aplicables a SAN01M

Se listan las ocupaciones del catálogo curado que se evaluaron explícitamente y fueron rechazadas por ausencia de correlación domínca con el perfil de Técnico en Emergencias Sanitarias:

| occupationId | Etiqueta CNO | Motivo del rechazo |
|---|---|---|
| `occupation:cno11:5612` | Auxiliares de enfermería de atención primaria | Ámbito primario (centros de salud), no de urgencias hospitalarias ni externas. |
| `occupation:cno11:5629` | Trabajadores de los cuidados a las personas en servicios de salud | Asistencia presencial no especializada; no corresponde a emergencias ni transporte sanitario técnico. |
| `occupation:cno11:5710` | Trabajadores de los cuidados personales a domicilio | Cuidado domiciliario de personas dependientes; sin relación con urgencias ni emergencias. |
| `occupation:cno11:5621` | Técnicos auxiliares de farmacia | Ámbito farmacéutico (dispensación, laboratorio farmacéutico); no asistencial. |
| `occupation:cno11:3314` | Técnicos en laboratorio de diagnóstico clínico | Ámbito de laboratorio diagnóstico; no asistencia de emergencias. |
| `occupation:cno11:3713` | Profesionales de apoyo al trabajo y a la educación social | Ámbito educativo y social; sin correlación con perfiles sanitarios de urgencia. |
| `occupation:cno11:3811` | Técnicos en operaciones de sistemas informáticos | IT; aunque los centros de coordinación tienen componente técnico, la ocupación correspondiente es la de información al usuario (4411). |

---

## 4. Resumen estadístico

| Métrica                            | Valor |
| ---------------------------------- | ----- |
| Salidas listadas en TodoFP         | 4     |
| Con correspondencia propuesta      | 2     (cubriendo 2 occupationId diferentes) |
| Rechazadas / sin correspondencia   | 2     |
| Coincidencias exactas (literal)    | 0     (ninguna etiqueta de salida aparece textualmente en las etiquetas del catálogo CNO) |

| occupationId | CNO   | Salidas que absorbe                              |
|--------------|-------|--------------------------------------------------|
| `occupation:cno11:4411` | 4411 | Centros de coordinación (1 salida) |
| `occupation:cno11:5611` | 5611 | Emergencias sanitarias (1 salida)  |

---

## 5. Notas de validación

1. **No se ha modificado** `data/curated/occupations.json` ni ningún otro archivo salvo este `.md`.
2. **No se han inventado códigos CNO**: todas las correspondencias utilizan `occupationId` existentes en el catálogo curado.
3. **No se han forzado emergencias, transporte sanitario ni coordinación hacia cuidados genéricos ni teleoperación**: las salidas "teleasistencia" y "transporte sanitario" se han rechazado explícitamente cuando ninguna ocupación del catálogo curado las cubre sin ambigüedad.
4. La ocupación CNO específica para "Técnico en Emergencias Sanitarias" no existe en el catálogo curado actual. El epígrafe CNO-11 más cercano (si se ampliara el catálogo) sería un técnico de soporte vital/urgencias, probablemente en el subgrupo 31xx (técnicos de las ciencias físicas, químicas y de las ingenierías) o un nuevo epígrafe en el subgrupo 32xx (técnicos de la salud), pero ninguna de estas ampliaciones ha sido realizada en este lote.

---

_Gen el 2026-08-13 — Propuesta conservadora, sin inventar códigos ni ampliar el catálogo._