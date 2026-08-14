# FME03S — Propuesta de correspondencia CNO-11

## Datos de partida

- **Program Key:** FME03S
- **Program Title:** Diseño en Fabricación Mecánica
- **Family Code:** FME / Fabricación Mecánica
- **Official Title:** Técnico Superior en Diseño en Fabricación Mecánica
- **Nivel:** higher (Técnico Superior, EQF 5/6)
- **Source System:** TodoFP
- **Source URL:** https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/diseno-fabricacion-mecanica.html

## Catálogo CNO-11 revisado

Se examinaron **todas las ocupaciones CNO-11 con `reviewStatus: "approved"`** del catálogo `data/curated/occupations.json`.

Se excluyeron expresamente (`reviewStatus != "approved" o "draft"`):

| CNO-11 | Etiqueta                                         | Estado   |
| ------ | ------------------------------------------------ | -------- |
| 3734   | Chefs                                            | rejected |
| 3202   | Supervisores de la construcción de edificios     | rejected |
| 5831   | Supervisores de mantenimiento y limpieza…        | rejected |
| 5891   | Asistentes personales o personas de compañía     | rejected |
| 7212   | Aplicadores de revestimientos de pasta y mortero | rejected |
| 7223   | Instaladores de conductos en obra pública        | rejected |
| 4309   | Empleados administrativos…                       | draft    |

## Criterios de valoración

- Solo ocupaciones CNO-11 con `reviewStatus: "approved"`.
- Se exige **correspondencia exacta o funcional directa** para delineación proyectista, CAD, desarrollo de productos, moldes, matrices y utillajes.
- Se preserva el nivel técnico: el FME03S es un Técnico Superior (higher, EQF 5/6).
- Se separa explícitamente el diseño/técnica del desarrollo de la operación/fabricación de máquinas.
- No se aceptan coincidencias por sector genérico ni se rebajan funciones de diseño a operadores de fabricación.

---

## Candidatos approved

### 3126 — Técnicos en mecánica

| Campo                       | Valor                   |
| --------------------------- | ----------------------- |
| `occupationId`              | `occupation:cno11:3126` |
| Código CNO-11               | 3126                    |
| Etiqueta (`preferredLabel`) | Técnicos en mecánica    |
| `reviewStatus`              | approved                |
| `confirmationLabel`         | Técnicos en mecánica    |

**Correspondencia con las 7 citas de FME03S (funcional directa):**

| #   | Cita literal TodoFP                                   | ¿Cubre? | Justificación                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Delineante proyectista.                               | ✅ Sí   | El delineante proyectista de nivel superior elabora planos técnicos, modelos y documentación gráfica para fabricación mecánica. Un "Técnico en mecánica" (CNO 3126, nivel profissional técnico) realiza exactamente este trabajo de representación técnica y proyección de piezas dentro del ámbito de la ingeniería mecánica. |
| 2   | Técnica / técnico de desarrollo de productos y moldes | ✅ Sí   | El desarrollo de productos y moldes es una actividad de diseño y desarrollo técnico en mecánica. Un técnico en mecánica de nivel superior diseña y desarrolla productos y sus moldes correspondientes; es un subconjunto funcional dentro del perfiles de Maj31 3126.                                                          |
| 3   | Técnica / técnico en CAD.                             | ✅ Sí   | CAD es la herramienta profesional del diseñador técnico mecánico. Un "Técnico en mecánica" domina las herramientas CAD/CAM como parte esencial de su actividad de diseño, modelado y generación de planos. Corresponde funcionalmente.                                                                                         |
| 4   | Técnica / técnico en desarrollo de matrices.          | ✅ Sí   | Las matrices (estampación) son herramientas de conformado de chapa. Su diseño y desarrollo (geometría, corte, vaciado) son tareas de ingeniería mecánica realizadas por técnicos en mecánica a nivel superior. Funcional directa.                                                                                              |
| 5   | Técnica / técnico en desarrollo de moldes.            | ✅ Sí   | El desarrollo de moldes (inyección, fundición, conformado) es diseño técnico de herramientas mecánicas. Corresponde funcionalmente al ámbito de técnicos en mecánica (fabricación de herramientas de diseño).                                                                                                                  |
| 6   | Técnica / técnico en desarrollo de productos.         | ✅ Sí   | El desarrollo de productos mecánicos (dimensionado, materiales, tolerancias, documentación) es la esencia del Técnico en mecánica a nivel superior. Funcional directa.                                                                                                                                                         |
| 7   | Técnica / técnico en desarrollo de utillajes.         | ✅ Sí   | Los utillajes (herramientas de sujeción, guiado y apoyo en fabricación) son diseño mecánico de herramientas auxiliares. Corresponde al ámbito de técnicos en mecánica.                                                                                                                                                         |

**Justificación general de la correspondencia**:

El programa FME03S forma un "Técnico Superior en Diseño en Fabricación Mecánica" (nivel higher, EQF 5/6). La ocupación CNO-11 3126 "Técnicos en mecánica" agrupa a profesionales técnicos de la ingeniería mecánica al mismo nivel de cualificación. Las 7 salidas profesionales de TodoFP son especializaciones funcionales dentro del perfiles general de un técnico en mecánica: delineación proyectista, CAD, desarrollo de productos, moldes, matrices y utillajes son actividades de diseño técnico que un técnico en mecánica realiza en el ámbito de la fabricación.

**Riesgos:**

- **Amplitud del código 3126:** CNO-11 3126 es un código general que abarca todas las actividades de técnico en mecánica (mantenimiento, análisis, diagnóstico, operación técnica), no solo el diseño. No existe un código CNO-11 aprobado más específico para "diseñador mecánico industrial" o "técnico superior en diseño de fabricación mecánica".
- **Sin correspondencia exacta:** No hay un código CNO-11 aprobado que coincida literalmente con ninguna de las 7 citas. La correspondencia es funcional (ambos describen técnicos de nivel superior trabajando en mecánica), pero no exacta/specifica.
- **Ausencia de código de "delineante" o "diseñador industrial":** Las categorías de delineante proyectista, diseñador CAD industrial y diseñador de productos/moldes/tooling no aparecen como códigos propios en el catálogo CNO-11 approved. Estas funciones se engloban en el rol más amplio de "técnico en mecánica".

---

## Rechazos explícitos y por qué no son candidatos

### 7322 — Trabajadores de la fabricación de herramientas, mecánico-ajustadores, modelistas, matriceros y afines

| Campo          | Valor                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `occupationId` | `occupation:cno11:7322`                                                                               |
| Código CNO-11  | 7322                                                                                                  |
| Etiqueta       | Trabajadores de la fabricación de herramientas, mecánico-ajustadores, modelistas, matriceros y afines |
| `reviewStatus` | approved                                                                                              |

**Motivo del rechazo:** El código 7322 corresponde a **operarios de fabricación** (Maj8, nivel operacional), no a técnicos de diseño. Los términos "matriceros" y "modelistas" pueden parecer cercanos a "desarrollo de matrices" y "desarrollo de moldes" del FME03S, pero la distinción es fundamental:

- El FME03S forma **Técnicos Superiores en diseño** (EQF 5/6): planifican, calculan, dimensionan y diseñan las matrices, moldes y utillajes.
- El 7322 forma **fabricantes / operarios** (EQF 3/4): construyen, fabrican y ajustan las matrices, moldes y utillajes según planos y especificaciones de los diseñadores.

**"No rebajes funciones técnicas de diseño a operadores de fabricación"**. El desarrollador de matrices/moldes (diseñador, nivel superior) y el matricero/modelista (fabricante, nivel operativo) son roles distintos en el nivel de cualificación y las funciones técnicas. Esta ocupación se descarta expresamente.

### 2713 — Analistas, programadores y diseñadores web y multimedia

| Campo          | Valor                                                   |
| -------------- | ------------------------------------------------------- |
| `occupationId` | `occupation:cno11:2713`                                 |
| Código CNO-11  | 2713                                                    |
| Etiqueta       | Analistas, programadores y diseñadores web y multimedia |
| `reviewStatus` | approved                                                |

**Motivo del rechazo:** Aunque contiene la palabra "diseñadores", se refiere exclusivamente a **diseño web y multimedia** (dominio digital), no a diseño mecánico, industrial o de fabricación. No hay correspondencia funcional con ninguna de las 7 citas del FME03S (delineación proyectista mecánica,CAD industrial, moldes, matrices, utillajes). Coincidencia solo lexical ("diseñador"), no funcional.

### 7323 — Ajustadores y operadores de máquinas-herramienta

| Campo          | Valor                                            |
| -------------- | ------------------------------------------------ |
| `occupationId` | `occupation:cno11:7323`                          |
| Código CNO-11  | 7323                                             |
| Etiqueta       | Ajustadores y operadores de máquinas-herramienta |
| `reviewStatus` | approved                                         |

**Motivo del rechazo:** Operarios que manejan máquinas-herramienta (torno, fresadora, etc.). Es fabricacion/operación, no diseño técnico. Descartado por rebajar función de diseño a operador de fabricación.

### 7312 — Soldadores y oxicortadores

**Motivo del rechazo:** Operaciones de soldadura y corte térmico (fabricación). No es diseño.

### 7313 — Chapistas y caldereros

**Motivo del rechazo:** Conformado de chapa manual/meccana (fabricación). No es diseño.

### 7314 — Montadores de estructuras metálicas

**Motivo del rechazo:** Montaje en obra (fabricación/asamblea). No es diseño.

### 7531 — Mecánicos y reparadores de equipos electrónicos

**Motivo del rechazo:** Mantenimiento y reparación de electrónica. No es diseño mecánico industrial.

### 7250 — Mecánicos-instaladores de refrigeración y climatización

**Motivo del rechazo:** Instalación de sistemas. No es diseño.

### 7401 — Mecánicos y ajustadores de vehículos de motor

**Motivo del rechazo:** Reparación de vehículos. No es diseño mecánico industrial.

### 3160 — Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías

**Motivo del rechazo:** Control de calidad industrial, no diseño de productos/moldes/utillajes.

### 3129 — Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías

**Motivo del rechazo:** Este es un código de "cajón de sastre" para técnicos de ingeniería no clasificados en otros sub-códigos específicos. Dado que 3126 ("Técnicos en mecánica") ya cubre específicamente a los mecanicos, el 3129 no resulta aplicable a perfiles de diseño en fabricación mecánica. Sería un ajuste forzado sin correspondencia funcional directa.

### 3209 — Supervisores de otras industrias manufactureras

**Motivo del rechazo:** Supervisión y gestión de producción. No es diseño.

### 9700 — Peones de las industrias manufactureras

**Motivo del rechazo:** Operarios no cualificados de planta. Nivel muy inferior al Técnico Superior del FME03S.

### 8209 — Montadores y ensambladores no clasificados en otros epígrafes

**Motivo del rechazo:** Ensamblaje/fabricación. No es diseño.

### 8202 — Ensambladores de equipos eléctricos y electrónicos

**Motivo del rechazo:** Ensamblaje electrónico. No es diseño mecánico.

### 3123 — Técnicos en electricidad / 3124 — Técnicos en electrónica

**Motivo del rechazo:** Diferente dominio técnico (eléctrica/electrónica). No corresponde a diseño de fabricación mecánica.

### Todas las restantes aprobadas

Se descartan por no guardar relación alguna con diseño mecánico/CAD/fabricación: roles en salud (51xx, 56xx, 57xx), hostelería (5110-5120, 5300), educación y formación (2252, 3722-3724), agraria (61xx, 62xx), construcción (71xx, 72xx aparto de 73xx), IT (38xx, 2721-2722, 2713), administración y logística (41xx, 42xx, 43xx, 44xx, 54xx), comercio (35xx, 52xx), seguridad y limpieza (5831, 5891), transporte (83xx), y otros (9xxx).

---

## Resumen de resultado

| Salida TodoFP FME03S                                     | Candidato CNO-11            | Tipo de relación                            |
| -------------------------------------------------------- | --------------------------- | ------------------------------------------- |
| 1. Delineante proyectista.                               | 3126 — Técnicos en mecánica | Funcional directa (riesgo: código genérico) |
| 2. Técnica / técnico de desarrollo de productos y moldes | 3126 — Técnicos en mecánica | Funcional directa (riesgo: código genérico) |
| 3. Técnica / técnico en CAD.                             | 3126 — Técnicos en mecánica | Funcional directa (riesgo: código genérico) |
| 4. Técnica / técnico en desarrollo de matrices.          | 3126 — Técnicos en mecánica | Funcional directa (riesgo: código genérico) |
| 5. Técnica / técnico en desarrollo de moldes.            | 3126 — Técnicos en mecánica | Funcional directa (riesgo: código genérico) |
| 6. Técnica / técnico en desarrollo de productos.         | 3126 — Técnicos en mecánica | Funcional directa (riesgo: código genérico) |
| 7. Técnica / técnico en desarrollo de utillajes.         | 3126 — Técnicos en mecánica | Funcional directa (riesgo: código genérico) |

**Candidato approved único:** `occupation:cno11:3126` — "Técnicos en mecánica".

**No existe ninguna correspondencia exacta (literal).** La correspondencia es funcional: el perfil de Técnico Superior en Diseño en Fabricación Mecánica es una especialización del rol general de "Técnico en mecánica".

**Las 7 citas están cubiertas** mediante esta correspondencia funcional directa sobre el único candidato approved. No hay salidas sin candidato.

## Archivo de datos modificado

Ninguno. `data/curated/occupations.json` no se ha modificado (criterio de aceptación cumplido).
