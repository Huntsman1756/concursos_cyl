# Informe de correspondencia ENA03S → CNO-11 approved

**Fuente:** TodoFP – Técnico Superior en Energías Renovables (Energía y Agua)  
**Fecha:** 2026-08-14  
**Criterio:** solo ocupaciones `approved` del catálogo CNO-11 curado

---

## Candidatos con correspondencia funcional

### 1. Montadores-instaladores de placas de energía solar (CNO-11 7294)

| Campo                   | Valor                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupationId`          | `occupation:cno11:7294`                                                                                                                                                                                 |
| `codigo`                | `7294`                                                                                                                                                                                                  |
| `etiqueta exacta`       | Montadores-instaladores de placas de energía solar                                                                                                                                                      |
| `cita literal` (fuente) | `Montador-operador / montadora-operadora de instalaciones solares fotovoltaicas.`                                                                                                                       |
| `justificacion`         | Correspondencia funcional directa con la actividad de montaje de instalaciones solares fotovoltaicas. El código CNO-11 7294 cubre la faceta de "montador-instalador", que es el núcleo de la fuente #5. |
| `riesgo`                | No cubre la vertiente "operador" (puesta en marcha y operación continua), que puede requerir competencias adicionales de gestión y control de sistemas fotovoltaicos.                                   |

| Campo                   | Valor                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `occupationId`          | `occupation:cno11:7294`                                                                                                                   |
| `codigo`                | `7294`                                                                                                                                    |
| `etiqueta exacta`       | Montadores-instaladores de placas de energía solar                                                                                        |
| `cita literal` (fuente) | `Responsable de montaje y mantenimiento de instalaciones solares fotovoltaicas.`                                                          |
| `justificacion`         | Correspondencia funcional con la faceta de montaje cubierta por 7294.                                                                     |
| `riesgo`                | La fuente incluye "mantenimiento" y el rango "responsable", que escapa del profilo del montador-instalador de placas (nivel CNO-11 7294). |

### 2. Técnicos en electricidad (CNO-11 3123)

| Campo                   | Valor                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `occupationId`          | `occupation:cno11:3123`                                                                                                                                                                    |
| `codigo`                | `3123`                                                                                                                                                                                     |
| `etiqueta exacta`       | Técnicos en electricidad                                                                                                                                                                   |
| `cita literal` (fuente) | `Encargada / encargado de mantenimiento de subestaciones eléctricas de instalaciones eólicas y fotovoltaicas.`                                                                             |
| `justificacion`         | El mantenimiento de subestaciones eléctricas requiere competencias técnicas de electricidad de nivel superior al electricista básico. Este es el candidato aprobado más cercano.           |
| `riesgo`                | 1) La cita especifica "encargado/a" (supervisión/responsabilidad), un nivel jerárquico superior. 2) Es específico de subestaciones eólicas y fotovoltaicas, mientras que 3123 es genérico. |

| Campo                   | Valor                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `occupationId`          | `occupation:cno11:3123`                                                                                                                                                              |
| `codigo`                | `3123`                                                                                                                                                                               |
| `etiqueta exacta`       | Técnicos en electricidad                                                                                                                                                             |
| `cita literal` (fuente) | `Operador-mantenedor / operadora-mantenedora de subestaciones eléctricas de instalaciones eólicas y fotovoltaicas.`                                                                  |
| `justificacion`         | La operación y mantenimiento de subestaciones eléctricas se apoya en conocimientos de electricidad. Este es el candidato más próximo.                                                |
| `riesgo`                | "Operador-mantenedor" de subestaciones implica funciones de control eléctrico especializadas (protecciones, maniobras) que superan el ambito de un técnico genérico en electricidad. |

### 3. Mecánicos y reparadores de equipos eléctricos (CNO-11 7521)

| Campo                   | Valor                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `occupationId`          | `occupation:cno11:7521`                                                                                                                                                                                |
| `codigo`                | `7521`                                                                                                                                                                                                 |
| `etiqueta exacta`       | Mecánicos y reparadores de equipos eléctricos                                                                                                                                                          |
| `cita literal` (fuente) | `Especialista montador de aerogeneradores.`                                                                                                                                                            |
| `justificacion`         | Los aerogeneradores son equipos eléctricos de generación y su montaje/reparación se relaciona con el mantenimiento de equipos eléctricos. Corresponde a la faceta "mecánico-reparador" de CNO-11 7521. |
| `riesgo`                | La especialización en aerogeneradores (alturas, palas, sistemas de frenado, convertidores de potencia) supera ampliamente el perfil genérico de reparador de equipos eléctricos de CNO-11 7521.        |

---

## Salidas sin candidato aprobado

Las siguientes citas literales no hallan correspondencia en el catálogo CNO-11 "approved". Se excluyen por carecer de ocupación aprobada equivalente:

| #   | Cita literal                                                                                             | Justificación de exclusión                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Encargada / encargado de montaje de subestaciones eléctricas de instalaciones eólicas y fotovoltaicas.` | No hay aprobado para montaje específico de subestaciones eólicas/fotovoltaicas. Los candidatos genéricos (7314, 8209, 3123) no cubren la especialidad de subestación.                                                               |
| 2   | `Especialista en mantenimiento de parques eólicos.`                                                      | No existe ningún approved para mantenimiento especializado de parques eólicos. No se infiere por semejanza sectorial.                                                                                                               |
| 3   | `Promotor / promotora de instalaciones solares.`                                                         | 5492 (Promotores de venta) se refiere a promoción comercial de productos, no a promoción/desarrollo de instalaciones como proyecto técnico. 3510 (Agentes comerciales) tampoco cubre el perfil técnico-comercial de promotor solar. |
| 4   | `Proyectista de instalaciones solares fotovoltaicas.`                                                    | No hay aprobado para diseñadores/proyectistas de instalaciones solares. CNO-11 no tiene un código approved para proyectistas eléctricos/solares.                                                                                    |
| 5   | `Responsable de explotación y mantenimiento de pequeñas centrales solares fotovoltaicas.`                | No hay aprobado para explotación de centrales solares. 3209 y 3139 son genéricos y no cubren la especialidad de centrales fotovoltaicas.                                                                                            |
| 6   | `Responsable de montaje de aerogeneradores.`                                                             | No hay aprobado para responsabilidad en montaje de aerogeneradores. 7314 (Montadores de estructuras) y 8209 (Montadores/no clasificados) son genéricos sin especialización eólica.                                                  |
| 7   | `Responsable de montaje de parques eólicos.`                                                             | No hay aprobado para gestión/monitoreo de montaje de parques eólicos. No se infiere por semejanza con otros montadores.                                                                                                             |
| 8   | `Técnica / técnico de gestión de operación y mantenimiento en instalaciones eólicas.`                    | No hay aprobado para gestión técnica de operación y mantenimiento eólico. 3811 y 3139 son genéricos sin especialización eólica.                                                                                                     |

---

## Resumen

| Métrica                                     | Valor                |
| ------------------------------------------- | -------------------- |
| Citas de fuente (TodoFP ENA03S)             | 13                   |
| Candidatos CNO-11 approved vinculados       | 3 (7294, 3123, 7521) |
| Citas con enlace a 7294                     | 2                    |
| Citas con enlace a 3123                     | 2                    |
| Citas con enlace a 7521                     | 1                    |
| Salidas sin candidato aprobado              | 8                    |
| Ocupaciones approved del catálogo revisadas | 93                   |
