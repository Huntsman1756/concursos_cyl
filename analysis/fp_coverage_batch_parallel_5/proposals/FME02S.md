# FME02S — Informe de correspondencia CNO-11

## Datos del programa

| Campo          | Valor                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Program Key    | FME02S                                                                                                         |
| Family Code    | FME                                                                                                            |
| Family Name    | Fabricación Mecánica                                                                                           |
| Official Title | Técnico Superior en Construcciones Metálicas                                                                   |
| Level          | higher                                                                                                         |
| Source System  | TodoFP                                                                                                         |
| Source URL     | <https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/construcciones-metalicas.html> |

## Candidatos CNO-11 approved

### 1. CNO-11 7312 — Soldadores y oxicortadores

| Campo                | Valor                      |
| -------------------- | -------------------------- |
| `occupationId`       | `occupation:cno11:7312`    |
| `classificationCode` | 7312                       |
| `preferredLabel`     | Soldadores y oxicortadores |
| `confirmationLabel`  | Soldadura y oxicorte       |
| `reviewStatus`       | **approved**               |
| `confirmedAt`        | 2026-08-11                 |

**Citas del fuente que activan la correspondencia:**

- Quote 7: _"Fabricación en construcciones metálicas."_
  - Justificación: La fabricación en construcciones metálicas implica soldadura y oxicorte como funciones técnicas esenciales y cualificadas de primer nivel. El CNO-11 7312 define explícitamente a los profesionales dedicados a estas operaciones de unión y corte de metales por procedimientos térmicos.
  - Riesgo: medio. Aunque la soldadura y el oxicorte son centrales en la fabricación de estructuras, el título FME02S no detalla el nivel de especialización (TIG, MIG/MAG, electrodo, oxiacete). Se debe verificar si el programa abarca procesos de soldadura especializada o solo procesos básicos.

- Quote 2: _"Construcciones metálicas y montaje"_
  - Justificación: El montaje de construcciones metálicas requiere operaciones de soldadura _in situ_ (cordones de soldadura, empalmes). El 7312 cubre soldadores que ejecutan uniones en obra.
  - Riesgo: bajo. La soldadura en montaje de estructuras es una actividad estándar del perfil 7312.

**Citas del fuente no cubiertas por este candidato:**

- 1, 3, 4, 5, 6, 8, 9, 10: No corresponden directamente a soldadura/oxycorte de 7312 (ver separador de salidas sin candidato más abajo).

---

### 2. CNO-11 7313 — Chapistas y caldereros

| Campo                | Valor                    |
| -------------------- | ------------------------ |
| `occupationId`       | `occupation:cno11:7313`  |
| `classificationCode` | 7313                     |
| `preferredLabel`     | Chapistas y caldereros   |
| `confirmationLabel`  | Chapistería y calderería |
| `reviewStatus`       | **approved**             |
| `confirmedAt`        | 2026-08-11               |

**Citas del fuente que activan la correspondencia:**

- Quote 3: _"Delineante proyectista de calderería y estructuras metálicas."_
  - Justificación: Aunque la parte "delineante proyectista" es diseño técnico (ver quote 6), la calderería es el oficio por definición del 7313 (chapas y recipientes a presión / calderería industrial). La mención explícita a "calderería" activa la correspondencia funcional con el 7313.
  - Riesgo: medio. La función de "delineante proyectista" (dibujo técnico, diseño) no la cubre el 7313, que es fabricación. El mismo quote mezcla diseño + calderería. El 7313 solo cubre la faceta de calderero (fabricación).

- Quote 5: _"Diseño asistido por ordenador (CAD) de calderería y estructuras metálicas."_
  - Justificación: La mención de "calderería" activa parcialmente la correspondencia con 7313; sin embargo, la función descrita es CAD (diseño asistido), no la ejecución de chapistería.
  - Riesgo: alto. El CAD de calderería es una función de diseño técnico, no de ejecución de chapistería/calderería. El 7313 no cubre diseño; solo cobertura parcial por vocabulario compartido.

- Quote 6: _"Diseño técnico de calderería y estructuras."_
  - Justificación: Mismo razonamiento que quote 5. Presencia de "calderería" activa correspondencia parcial.
  - Riesgo: alto. El diseño técnico no es función de chapista/calderero; es función de proyectista/ingeniero. Solo la referencia léxica a calderería justifica mencionarlo como candidato parcial.

**Citas del fuente no cubiertas por este candidato:**

- 1, 2, 4, 7, 8, 9, 10: No hacen referencia a calderería ni chapistería.

---

### 3. CNO-11 7314 — Montadores de estructuras metálicas

| Campo                | Valor                               |
| -------------------- | ----------------------------------- |
| `occupationId`       | `occupation:cno11:7314`             |
| `classificationCode` | 7314                                |
| `preferredLabel`     | Montadores de estructuras metálicas |
| `confirmationLabel`  | Montaje de estructuras metálicas    |
| `reviewStatus`       | **approved**                        |
| `confirmedAt`        | 2026-08-11                          |

**Citas del fuente que activan la correspondencia:**

- Quote 2: _"Construcciones metálicas y montaje"_
  - Justificación: Corresponde literalmente al título del 7314 ("Montadores de estructuras metálicas"). "Construcciones metálicas y montaje" describe exactamente la actividad del montador de estructuras.
  - Riesgo: bajo. Correspondencia directa y exacta. El dominio de aplicación de 7314 (montaje de estructuras metálicas) es idéntico a la descripción del programa FME02S.

- Quote 8: _"Montaje en construcciones metálicas."_
  - Justificación: El título del 7314 ("Montadores de estructuras metálicas") es la clasificación CNO-11 más cercana y funcionalmente equivalente a "montaje en construcciones metálicas". Equivalencia exacta en la función principal del programa.
  - Riesgo: bajo. Correspondencia literal de la actividad principal: montaje de estructuras metálicas.

- Quote 7: _"Fabricación en construcciones metálicas."_
  - Justificación: Puede incluir actividad de montaje (fabricación de piezas in situ y ensamblaje de la estructura). El 7314 cubre el ensamblaje final de la estructura.
  - Riesgo: medio. "Fabricación" puede aludir a la fabricación de piezas en taller (7312/7313) antes del montaje. El 7314 cubre la fase de montaje pero no la fabricación de componentes.

**Citas del fuente no cubiertas por este candidato:**

- 1, 3, 4, 5, 6, 9, 10: No se refieren al montaje como actividad principal.

---

### 4. CNO-11 7132 — Instaladores de cerramientos metálicos y carpinteros metálicos

| Campo                | Valor                                                          |
| -------------------- | -------------------------------------------------------------- |
| `occupationId`       | `occupation:cno11:7132`                                        |
| `classificationCode` | 7132                                                           |
| `preferredLabel`     | Instaladores de cerramientos metálicos y carpinteros metálicos |
| `confirmationLabel`  | Carpintería metálica                                           |
| `reviewStatus`       | **approved**                                                   |
| `confirmedAt`        | 2026-08-11                                                     |

**Citas del fuente que activan la correspondencia:**

- Quote 2: _"Construcciones metálicas y montaje"_
  - Justificación: Los cerramientos metálicos (fachadas, cubiertas, muros) son parte de las "construcciones metálicas". La carpintería metálica (ventanas, puertas, cerramientos) forma parte del espectro de trabajo del programa FME02S.
  - Riesgo: medio-alto. El 7132 se orienta a cerramientos y carpintería de instalaciones (ventanas, puertas), mientras que FME02S se centra en estructuras portantes (vigas, pilares armaduras). Hay intersección pero no correspondencia total en el dominio.

**Citas del fuente no cubiertas por este candidato:**

- 1, 3, 4, 5, 6, 7, 8, 9, 10: Cerramientos y carpintería no son la actividad central del programa. El foco de FME02S es la estructura portante, no la carpintería de cierre.

---

## Salidas sin candidato CNO-11

Las siguientes citas no tienen correspondencia directa ni funcional con los aprobados del catálogo:

| #   | Cita                                                                | Razón de la exclusion / ausencia de candidato                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _"Construcción mecánica."_                                          | Genérico. FME02S es "Construcciones Metálicas", no construcción mecánica general. Los candidados 7312, 7313 y 7314 cubren el ámbito metálico pero la cita suelta no permite vinculación específica.                                                                                    |
| 4   | _"Desarrollo de tuberías."_                                         | Corresponde a tuberías industriales, no a estructuras metálicas portantes. No existe en el catálogo un CNO-11 específico para "montajes de tuberías". El 7250 es "Mecánicos-instaladores de refrigeración y climatización", pero no cubre tuberías generales de proceso. **Excluido**. |
| 9   | _"Programación de la producción en fabricación mecánica."_          | Función administrativa de programación (planificación, organización de la producción), no fabricación técnica de metales. No existe candidato CNO-11 de gestión/planificación en el catálogo approved. **Excluido**.                                                                   |
| 10  | _"Programación de sistemas automatizados en fabricación mecánica."_ | Función de automatización/control numérico industrial. No existe candidato CNO-11 para programadores de automatización industrial en el catálogo approved. **Excluido**.                                                                                                               |

## Salidas parciales (correspondencia funcional incompleta)

| #   | Cita                                                                           | Candidato(s) parcial(es)       | Explicación del alcance parcial                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | _"Delineante proyectista de calderería y estructuras metálicas."_              | 7313 (parcial), 7314 (parcial) | La faceta de "proyectista" (diseño técnico) no está cubierta. La faceta de "estructuras metálicas" coincide con 7314 para el ensamblaje; "calderería" con 7313 para la fabricación. El diseño técnico queda sin cubrir. |
| 5   | _"Diseño asistido por ordenador (CAD) de calderería y estructuras metálicas."_ | 7313 (parcial), 7314 (parcial) | CAD de calderería → solo vocabulario compartido con 7313, no cubre diseño. CAD de estructuras → solo vocabulario compartido con 7314, no cubre diseño.                                                                  |
| 6   | _"Diseño técnico de calderería y estructuras."_                                | 7313 (parcial), 7314 (parcial) | Mismo caso: función de diseño técnico no cubierta por el catálogo. Solo mención de "calderería" y "estructuras" activa los códigos 7313 y 7314.                                                                         |

## Exclusiones explícitas

| CNO-11 | preferredLabel                                                                                        | reviewStatus | Por qué se excluye                                                                                                                                                                                                                                                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3202   | Supervisores de la construcción de edificios                                                          | **rejected** | Es supervisores de obra de construcción (edificios), no montaje de estructuras metálicas. Además está rechazado.                                                                                                                                                                                                                                                  |
| 7111   | Encofradores y operarios de puesta en obra de hormigón                                                | approved     | Domínio hormigón, no metales.                                                                                                                                                                                                                                                                                                                                     |
| 7121   | Albañiles                                                                                             | approved     | Domínio albañilería, no metales.                                                                                                                                                                                                                                                                                                                                  |
| 7193   | Instaladores de sistemas de impermeabilización en edificios                                           | approved     | Domínio impermeabilización, no metales.                                                                                                                                                                                                                                                                                                                           |
| 7223   | Instaladores de conductos en obra pública                                                             | rejected     | Domínio obras públicas, no estructuras metálicas.                                                                                                                                                                                                                                                                                                                 |
| 8209   | Montadores y ensambladores no clasificados en otros epígrafes                                         | approved     | **Se excluye específicamente según criterio del contrato**: no se deben rebajar funciones de montaje de estructuras metálicas, soldadura y carpintería metálica a "peonaria" o ensamblaje no clasificado (genérico). El 7314 es específico y apropiado para montaje de estructuras; usar 8209 sería degradar la especialización profesional del técnico superior. |
| 9700   | Peones de las industrias manufactureras                                                               | approved     | **Se excluye específicamente según criterio del contrato**: FME02S es título de nivel superior (Técnico Superior). El 9700 es peón no cualificado. Reducir soldadores, montadores y carpinteros metálicos a peones de industria es una degradación funcional no justificada.                                                                                      |
| 7294   | Montadores-instaladores de placas de energía solar                                                    | approved     | Domínio paneles solares, no estructuras metálicas.                                                                                                                                                                                                                                                                                                                |
| 7510   | Electricistas de la construcción y afines                                                             | approved     | Domínio eléctrico, no estructuras metálicas.                                                                                                                                                                                                                                                                                                                      |
| 7291   | Montadores de cubiertas                                                                               | approved     | Cubiertas de techo (solar, teja, etc.), no estructuras metálicas portantes.                                                                                                                                                                                                                                                                                       |
| 7322   | Trabajadores de la fabricación de herramientas, mecánico-ajustadores, modelistas, matriceros y afines | approved     | Herramientas y ajuste mecánico, no construcción de estructuras metálicas.                                                                                                                                                                                                                                                                                         |
| 7323   | Ajustadores y operadores de máquinas-herramienta                                                      | approved     | Operación de máquinas-herramienta (torneado, fresado), no ensamblaje ni soldadura de estructuras.                                                                                                                                                                                                                                                                 |
| 7324   | Pulidores de metales y afiladores de herramientas                                                     | approved     | Acabado de metales, no estructura.                                                                                                                                                                                                                                                                                                                                |
| 7521   | Mecánicos y reparadores de equipos eléctricos                                                         | approved     | Equipos eléctricos, no metálicos estructurales.                                                                                                                                                                                                                                                                                                                   |
| 7531   | Mecánicos y reparadores de equipos electrónicos                                                       | approved     | Electrónica, no metales estructurales.                                                                                                                                                                                                                                                                                                                            |

## Resumen de correspondencia

| #   | Quote                                                                      | Categoría CNO-11                  | Candidato principal | Candidato(s) parcial(es) | Sin candidato  |
| --- | -------------------------------------------------------------------------- | --------------------------------- | ------------------- | ------------------------ | -------------- |
| 1   | Construcción mecánica.                                                     | General genérico                  | —                   | —                        | ✓              |
| 2   | Construcciones metálicas y montaje                                         | Estructuras metálicas             | 7314                | 7132                     |                |
| 3   | Delineante proyectista de calderería y estructuras metálicas.              | Calderería + estructuras + diseño | —                   | 7313, 7314 (parciales)   | ✓ (por diseño) |
| 4   | Desarrollo de tuberías.                                                    | Tuberías industriales             | —                   | —                        | ✓              |
| 5   | Diseño asistido por ordenador (CAD) de calderería y estructuras metálicas. | CAD + calderería + estructuras    | —                   | 7313, 7314 (parciales)   | ✓ (por CAD)    |
| 6   | Diseño técnico de calderería y estructuras.                                | Diseño técnico                    | —                   | 7313, 7314 (parciales)   | ✓ (por diseño) |
| 7   | Fabricación en construcciones metálicas.                                   | Fabricación estructural           | 7312, 7313          | 7314                     |                |
| 8   | Montaje en construcciones metálicas.                                       | Estructuras metálicas             | 7314                | —                        |                |
| 9   | Programación de la producción en fabricación mecánica.                     | Gestión de producción             | —                   | —                        | ✓              |
| 10  | Programación de sistemas automatizados en fabricación mecánica.            | Automatización industrial         | —                   | —                        | ✓              |

**Total de candidatos CNO-11 approved con correspondencia directa o funcional:** 4 (7132, 7312, 7313, 7314)

**Total de salidas sin candidato (citas sin cobertura):** 4 (quotes 1, 3, 4, 5, 6, 9, 10 — note que 3, 5, 6 son parciales: tienen coincidencia léxica con 7313/7314 pero la función de diseño no está cubierta)

**Total de salidas con cobertura parcial:** 3 (quotes 3, 5, 6 — contienen función de diseño no cubierta por ningún aprobado del catálogo)

### Nota sobre el riesgo de degradación

Se ha aplicado estrictamente el criterio del contrato de **no rebajar funciones de montaje y soldadura a peonaria general sin cualificación**:

- El **montaje de estructuras metálicas** se asigna preferentemente al CNO-11 **7314** (específico), nunca al 8209 (genérico) ni al 9700 (peón).
- La **soldadura y oxicorte** se asigna al CNO-11 **7312** (específico), nunca al 9700.
- La **carpintería y cerramientos metálicos** se asigna al CNO-11 **7132** (específico), nunca al 9700.
