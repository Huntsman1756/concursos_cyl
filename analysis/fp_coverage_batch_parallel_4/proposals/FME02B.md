# Informe FME02B — Carpintería Metálica y Afines (CNO-11)

**Fuente:** TodoFP — FP Básico en Fabricación de Elementos Metálicos (Fabricación Mecánica)
**Datos cruzados:** `data/curated/occupations.json` (CNO-11, solo `approved`)
**Fecha del análisis:** 2026-08-14

---

## 1. Candidatos con correspondencia directa o funcional

### 1.1 Carpintería metálica

**Quote FME02B:** `Auxiliar de carpintera / carpintero metálico.` / `Auxiliar de carpintero / carpintera metálico.`

| Campo            | Valor                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupationId`   | `occupation:cno11:7132`                                                                                                                                                                                                                                                                                                                                                       |
| `codigo`         | `7132`                                                                                                                                                                                                                                                                                                                                                                        |
| `etiqueta`       | `Instaladores de cerramientos metálicos y carpinteros metálicos`                                                                                                                                                                                                                                                                                                              |
| **Cita literal** | «Auxiliar de carpintera / carpintero metálico»                                                                                                                                                                                                                                                                                                                                |
| Justificación    | Mapeo funcional directo. El certificado de competencia de FME02B forma en trabajo de carpintería metálica (fabricación, montado y montaje de elementos metálicos). El código CNO-11 7132 «carpinteros metálicos» cubre exactamente esta categoría. El calificativo «auxiliar» del FP básico refleja un nivel inicial pero no implica descalificación hacia peonaría.          |
| **Riesgo**       | **Bajo.** El nivel FME02B es básico; el rol CNO-11 se refiere a instaladores con competencia plena. En la práctica hay un desfase de nivel de cualificación que el sistema de clasificación no refleja (no existe una entrada «auxiliar/peón de carpintería metálica»). No se debe confundir: el certificado es válido en el sector, pero corresponde al subnivel de entrada. |

---

### 1.2 Corte y oxicorte de metales

**Quote FME02B (oxicorte):** `Auxiliar de oxicortador / oxicortadora a mano.`

| Campo            | Valor                                                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `occupationId`   | `occupation:cno11:7312`                                                                                                                                                                                                                                |
| `codigo`         | `7312`                                                                                                                                                                                                                                                 |
| `etiqueta`       | `Soldadores y oxicortadores`                                                                                                                                                                                                                           |
| **Cita literal** | «Auxiliar de oxicortador / oxicortadora a mano»                                                                                                                                                                                                        |
| Justificación    | Coincidencia literal parcial. La etiqueta CNO-11 incluye explícitamente «oxicortadores» junto con «soldadores», mapeando directamente la función de oxicorte manual.                                                                                   |
| **Riesgo**       | **Bajo.** El código agrupa dos funciones distintas (soldadura y oxicorte). Si se consulta el detalle del código CNO-11, habría que verificar que no exige un nivel superior al básico. El calificativo «auxiliar» del FME02B no debe reducirse a peon. |

**Quote FME02B (plasma):** `Auxiliar de cortador / cortador de metales por plasma, a mano.` / `Auxiliar de cortador / cortadora de metales por plasma, a mano.`

| Campo            | Valor                                                                                                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupationId`   | `occupation:cno11:7312`                                                                                                                                                                                                       |
| `codigo`         | `7312`                                                                                                                                                                                                                        |
| `etiqueta`       | `Soldadores y oxicortadores`                                                                                                                                                                                                  |
| **Cita literal** | `«Auxiliar de cortador / cortadora de metales por plasma, a mano»`                                                                                                                                                            |
| Justificación    | No existe una entrada específica para «corte por plasma» en el catálogo. El código 7312 engloba procesos de corte térmico; el plasma es una variante del corte por oxicorte/soplado. Es una correspondencia funcional amplia. |
| **Riesgo**       | **Medio.** No hay una cita literal que mencione el plasma. Se mapea por categoría genérica de corte térmico dentro de «oxicortadores». Si el CNO-11 distingue entre tipos de corte, esta entrada podría ser insuficiente.     |

---

### 1.3 Soldadura

**Quote FME02B:** `Auxiliar de soldador / soldadora de estructuras metálicas pesadas, ligeras y tubería.` / `Auxiliar soldador / soldadora de materiales de acero al carbono por arco eléctrico con electrodo revestido de rutilo.`

| Campo            | Valor                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupationId`   | `occupation:cno11:7312`                                                                                                                                                                                                                                                                                                                                                       |
| `codigo`         | `7312`                                                                                                                                                                                                                                                                                                                                                                        |
| `etiqueta`       | `Soldadores y oxicortadores`                                                                                                                                                                                                                                                                                                                                                  |
| **Cita literal** | «Auxiliar de soldador / soldadora de estructuras metálicas...» / «Auxiliar soldador / soldadora de materiales de acero al carbono por arco eléctrico...»                                                                                                                                                                                                                      |
| Justificación    | Coincidencia literal «soldador/soldadora». El CNO-11 7312 cubre soldadores en general; el FME02B especifica procedimientos (arco eléctrico con electrodo rutilo, estructuras y tubería). La correspondencia es funcional directa.                                                                                                                                             |
| **Riesgo**       | **Medio-Alto.** El grado de FP básico es cualificación de nivel 2 (según marco europeo: EQF/NQF). Los «soldadores» CNO-11 7313 se esperan a nivel intermedio/avanzado, donde se realizan trabajos de soldadura autónomos y con certificación. Reducir «soldador de estructuras y tubería» a peon **no está justificado** y viola el criterio de preservar el nivel funcional. |

---

### 1.4 Montaje de estructuras metálicas

**Quote FME02B:** `Auxiliar de montador / montadora de estructuras metálicas.`

| Campo            | Valor                                                                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupationId`   | `occupation:cno11:7314`                                                                                                                                                                                                      |
| `codigo`         | `7314`                                                                                                                                                                                                                       |
| `etiqueta`       | `Montadores de estructuras metálicas`                                                                                                                                                                                        |
| **Cita literal** | «Auxiliar de montador / montadora de estructuras metálicas.»                                                                                                                                                                 |
| Justificación    | Coincidencia literal y semántica exacta. CNO-11 7314 es específicamente «montadores de estructuras metálicas». El «auxiliar» refleja el nivel de entrada del FP básico pero no debe mapearse a categoría genérica de peones. |
| **Riesgo**       | **Bajo.** Aunque el nivel es básico, la correspondencia es exacta en función. El mismo riesgo de nivel descrito en 1.3 aplica: no hay entrada «auxiliar/montador» en CNO-11, lo cual es una limitación de la clasificación.  |

---

### 1.5 Ensamblado de componentes electrónicos y procesos automatizados

**Quote FME02B:** `Montador / montadora de componentes en placas de circuito impreso.` / `Operador / operadora de ensamblado de equipos eléctricos y electrónicos.` / `Auxiliares de procesos automatizados.`

| Campo            | Valor                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `occupationId`   | `occupation:cno11:8202`                                                                                                                                                                                                                                      |
| `codigo`         | `8202`                                                                                                                                                                                                                                                       |
| `etiqueta`       | `Ensambladores de equipos eléctricos y electrónicos`                                                                                                                                                                                                         |
| **Cita literal** | «Montador / montadora de componentes en placas de circuito impreso.» / «Operador / operadora de ensamblado de equipos eléctricos y electrónicos.»                                                                                                            |
| Justificación    | El CNO-11 8202 cubre ensambladores de equipos eléctricos y electrónicos. Las placas de circuito impreso entran dentro de este epígrafe, ya que se trata de componentes electrónicos. «Operador de ensamblado» se corresponde directamente con «ensamblador». |
| **Riesgo**       | **Bajo.** Correspondencia funcional clara. El nivel CNO-11 puede ser superior al básico, pero la función (ensamblaje) coincide.                                                                                                                              |

**Quote FME02B:** `Auxiliares de procesos automatizados.`

| Campo            | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `occupationId`   | `occupation:cno11:9700`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `codigo`         | `9700`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `etiqueta`       | `Peones de las industrias manufactureras`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Cita literal** | «Auxiliares de procesos automatizados.»                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Justificación    | No existe en el catálogo ninguna entrada específica para «operadores de procesos automatizados» o «técnicos de automatización». Esta es la única categoría disponible que se refiere general a la industria manufacturera a nivel de apoyo.                                                                                                                                                                                                                         |
| **Riesgo**       | **Alto.** Esta es una correspondencia de emergencia/indirecta. «Auxiliares de procesos automatizados» sugiere funciones operativas sobre equipos automatizados (plc, robot control, hmi), que no se reducen a peonería general. Mapear a CNO-11 9700 «Peones de las industrias manufactureras» **puede subestimar el nivel** de las funciones implicadas. Debería rastrearse si el catálogo CNO-11 completo (no solo approved) contiene una entrada más específica. |

---

## 2. Funciones sin candidato approved en el catálogo

| Quote FME02B                                                                                                                                                      | Razón de ausencia                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Ayudante de montador / montadora de antenas receptoras/ televisión satélite.` / `Ayudante/a de montador / montadora de antenas receptoras/ televisión satélite.` | No hay entrada CNO-11 para montaje de antenas. Podría solaparse con 7132 (cerramientos/carpería metálica) o 7533 (telecomunicaciones) si la antena se considera instalación de telecomunicaciones, pero no es coincidencia exacta. |
| `Operaria / operario de instalaciones eléctricas de baja tensión.`                                                                                                | CNO-11 3123 «Técnicos en electricidad» y 7510 «Electricistas de la construcción» son niveles técnicos (EQF 4+), no adecuados como mapeo de nivel básico. CNO-11 9700 es demasiado genérico.                                        |
| `Probador-ajustador / probadora-ajustadora de placas y equipos eléctricos y electrónicos.`                                                                        | CNO-11 8202 (Ensambladores) cubre montaje, no pruebas/ajuste. CNO-11 7531 y 3124 cubren reparación y electrónica a nivel técnico. No hay entrada CNO-11 para «probadore/ajustador» a nivel básico.                                 |
| `Peones y auxiliares de industrias metalúrgicas, de fabricación de productos metálicos y manufactureras.`                                                         | Mapea a CNO-11 9700 «Peones de las industrias manufactureras» — sí tiene candidato, ver 1.5.                                                                                                                                       |

---

## 3. Resumen de mapeos

| Función FME02B                             | CNO-11 Code | Etiqueta                                                       | Tipo de correspondencia        | Riesgo   |
| ------------------------------------------ | ----------- | -------------------------------------------------------------- | ------------------------------ | -------- |
| Carpintería metálica                       | 7132        | Instaladores de cerramientos metálicos y carpinteros metálicos | Directa (literal)              | Bajo     |
| Oxicorte (manual)                          | 7312        | Soldadores y oxicortadores                                     | Directa (literal)              | Bajo     |
| Corte por plasma                           | 7312        | Soldadores y oxicortadores                                     | Funcional amplia               | Medio    |
| Soldadura (estructuras/tubería/arco)       | 7312        | Soldadores y oxicortadores                                     | Directa (literal)              | Med-Alto |
| Montaje de estructuras metálicas           | 7314        | Montadores de estructuras metálicas                            | Directa (literal)              | Bajo     |
| Montaje componentes PCB                    | 8202        | Ensambladores de equipos eléctricos y electrónicos             | Directa (literal)              | Bajo     |
| Ensamblado equipos eléctricos/electrónicos | 8202        | Ensambladores de equipos eléctricos y electrónicos             | Directa (literal)              | Bajo     |
| Procesos automatizados                     | 9700        | Peones de las industrias manufactureras                        | Indirecta/emergencia           | Alto     |
| Montaje antenas satelitales                | —           | —                                                              | Ausente                        | —        |
| Instalaciones eléctricas BT                | —           | —                                                              | Ausente (niveles no coinciden) | —        |
| Probador-ajustador PCB/equipos             | —           | —                                                              | Ausente                        | —        |

---

## 4. Observaciones críticas

1. **No se debe reducir funciones de soldadura, montaje de estructuras ni carpintería metálica a peonería general.** A pesar de que el certificado básico tiene nivel EQF 2, las funciones calificadas (soldador, oxicortador, montador de estructuras, carpintero metálico) tienen correspondencia literal en CNO-11 7312 y 7314. Mapearlas a CNO-11 9700 (**«Peones de las industrias manufactureras»**) sería una descalificación incorrecta que no respeta la clasificación del sistema de referencia.

2. **CNO-11 no distingue niveles de cualificación por entrada.** No existen epígrafes «auxiliar/montador» o «soldador básico» en el catálogo approved. Esto es una limitación estructural del sistema CNO-11, no un motivo para agrupar funciones cualificadas bajo peonería.

3. **Falta específica para automatización industrial.** «Auxiliares de procesos automatizados» no tiene mapeo directo en el catálogo approved. El mapeo a peonería (9700) es la única opción disponible pero conlleva riesgo de subestimar el perfil profesional.

4. **Catálogo de 114 ocupaciones approved insuficiente para cobertira completa de oficios metalúrgicos.** Es probable que el catálogo completo CNO-11 (no solo las entry approved) contenga entradas adicionales para los roles ausentes. Se recomienda validar contra la clasificación completa.

---

_Fin del informe._
