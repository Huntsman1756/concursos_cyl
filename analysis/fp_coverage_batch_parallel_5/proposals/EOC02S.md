# Informe de cobertura CNO-11: EOC02S — Técnico Superior en Proyectos de Obra Civil

## Fuente

| Campo            | Valor                                       |
| ---------------- | ------------------------------------------- |
| Programa         | EOC02S                                      |
| Título oficial   | Técnico Superior en Proyectos de Obra Civil |
| Familia          | Edificación y Obra Civil (EOC)              |
| Nivel            | higher                                      |
| Catálogo destino | CNO-11 (solo `reviewStatus: approved`)      |

## Metodología

Se examinaron las 16 salidas profesionales de TodoFP y se buscaron correspondencias **exactas** (etiqueta idéntica) o **funcionales directas** (trabajo diario sustancialmente equivalente) en el catálogo CNO-11 aprobado. El foco es proyectos de obra civil, planificación de obras, dirección de obra y topografía aplicada. Se excluyen expresamente equivalencias con edificación residencial e instalaciones hidraulicas.

---

## Candidatos CNO-11 approved con correspondencia funcional directa

### 1. `occupation:cno11:3129` — Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías

| Campo                                | Valor                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **occupationId**                     | `occupation:cno11:3129`                                                                                     |
| **Código**                           | `3129`                                                                                                      |
| **Etiqueta exacta**                  | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías                     |
| **Citas literales TodoFP cubiertas** | Ver abajo                                                                                                   |
| **Riesgo**                           | MEDIO-ALTO: categoría genérica que aglutina perfiles heterogéneos; la especificidad de obra civil se diluye |

**Citas literales cubiertas (11 de 16):**

1. "Delineante de obra civil"
2. "Delineante de servicios urbanos"
3. "Delineante de topografía"
4. "Delineante proyectista de carreteras"
5. "Delineante proyectista de redes y sistemas de distribución de fluidos"
6. "Delineante proyectista de urbanización"
7. "Especialista en levantamiento de construcciones"
8. "Especialista en levantamiento de terrenos"
9. "Especialista en replanteos"
10. "Maquetista de construcción"
11. "Práctico en topografía"

**Justificación:**

Los delineantes (obra civil, servicios urbanos, topografía, carreteras, redes, urbanización) desempeñan funciones técnicas de diseño, dibujo y representación gráfica de proyectos de infraestructura civil. Los especialistas en levantamiento (construcciones, terrenos) y replanteos realizan trabajos de topografía aplicada: medición, nivelación y situacion en campo de estructuras e infraestructuras. El práctico en topografía aplica estas mismas técnicas de campo. El maquetista de construcción elabora modelos físicos o digitales de proyectos para estudio y presentación. Todos estos perfiles ejercen funciones de **técnicos de ingeniería** no subsumibles en categorías específicas del CNO-11 (electricidad, mecánica, química, etc.), por lo que la categoría 3129 ("Otros técnicos de las ingenierías") es la correspondencia funcional directa más adecuada en el catálogo aprobado.

**Notas de exclusión explícita:**

- "Delineante de servicios urbanos" y "Delineante proyectista de redes y sistemas de distribución de fluidos" corresponden a **infraestructura de redes urbanas** (obra civil), no a **instalaciones hidráulicas** en edificación. La distinción es funcional: las redes de abastecimiento y saneamiento son infraestructura civil; las instalaciones de fontanería interior son edificación.
- Ningún candidato de edificación residencial (albañilería, solados, cubiertas, impermeabilización) se ha considerado para estas salidas.

---

## Salidas sin candidato CNO-11 approved (5 de 16)

| #   | Cita literal TodoFP                                  | Motivo de ausencia                                                                                                                                                                                                                              |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Aparatista"                                         | Operador de maquinaria de obra civil (grúas, excavadoras, etc.). El catálogo CNO-11 aprobado no contiene un código para operadores de maquinaria de construcción; 8333 (carretillas elevadoras) y 8321 (maquinaria agrícola) son insuficientes. |
| 2   | "Ayudante de jefa / jefe de oficina técnica"         | Rol de apoyo administrativo en dirección de obra. Sin correspondencia funcional directa aprobada: 4309 (empleados administrativos) está en estado `draft`, no approved.                                                                         |
| 3   | "Ayudante de planificador / planificadora"           | Función de planificación de proyectos de obra civil. Sin código CNO-11 aprobado que cubra planificación de construcción; 3139 (control de procesos) se refiere a procesos industriales/manufactureros, no a gestión de proyectos.               |
| 4   | "Ayudante de técnica / técnico de control de costes" | Control de costes en proyectos de infraestructura. Sin correspondencia funcional directa aprobada; 4111 (contabilidad) y 3139 (control de procesos industriales) no son equivalentes funcionales.                                               |
| 5   | "Técnica / técnico de control documental"            | Gestión documental técnica en proyectos de ingeniería civil. Sin código CNO-11 aprobado equivalente; 4210 (bibliotecas y archivos) y 4301 (grabadores de datos) no cubren la función específica de control documental en ingeniería.            |

---

## Resumen cuantitativo

| Métrica                              | Valor      |
| ------------------------------------ | ---------- |
| Salidas TodoFP totales               | 16         |
| Con candidato CNO-11 approved        | 11 (68.8%) |
| Sin candidato CNO-11 approved        | 5 (31.3%)  |
| Candidatos CNO-11 approved distintos | 1 (`3129`) |

## Hallazgos y observaciones

1. **Un único candidato cubre la mayoría de salidas.** La categoría 3129 absorbe 11 de 16 perfiles porque el catálogo CNO-11 aprobado carece de códigos específicos para ingeniería civil, topografía o delineación de proyectos de infraestructura.

2. **Gaps estructurales en CNO-11 para obra civil.** No existe código aprobado para: delineantes de obra civil, topógrafos, planificadores de construcción, control de costes en infraestructura, control documental técnico ni operadores de maquinaria de obra civil.

3. **No se equipararon con edificación residencial.** Códigos aprobados como 7121 (albañiles), 7193 (impermeabilización de edificios), 7240 (soladores), 7291 (cubiertas) corresponden a edificación, no a obra civil. Se excluyeron deliberadamente.

4. **No se equipararon con instalaciones hidráulicas.** El código 7221 (fontaneros) y 7223 (conductos en obra pública, además rechazado) corresponden a instalaciones hidráulicas, no a proyectos de infraestructura civil. Se excluyeron.

5. **Riesgo principal del candidato 3129.** La etiqueta "Otros técnicos de las ingenierías" es un catch-all que incluye técnicos de múltiples ramas (eléctrica, mecánica, química, ambiental). La correspondencia funcional es real pero genérica: un reclutador o sistema de clasificación que use 3129 no distinguirá entre un delineante de carreteras y un técnico de laboratorio químico.

---

## Apéndice: Citas literales fuente verificadas (16 de 16)

Las siguientes son las dieciséis citas literales de `sources/EOC02S.txt` reproducidas **verbatim** (mismo texto, misma puntuación, misma ortografía). Corresponen exactamente al orden del archivo fuente (1-16).

| #   | Cita literal fuente (verbatim)                                           | Estado en propuesta                                    |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| 1   | `Aparatista.`                                                            | Ausente de candidato (sección "Sin candidato", fila 1) |
| 2   | `Ayudante de jefa / jefe de oficina técnica.`                            | Ausente de candidato (sección "Sin candidato", fila 2) |
| 3   | `Ayudante de planificador / planificadora.`                              | Ausente de candidato (sección "Sin candidato", fila 3) |
| 4   | `Ayudante de técnica / técnico de control de costes.`                    | Ausente de candidato (sección "Sin candidato", fila 4) |
| 5   | `Delineante de obra civil.`                                              | Candidato 3129 (sección "Citas cubiertas", fila 1)     |
| 6   | `Delineante de servicios urbanos.`                                       | Candidato 3129 (sección "Citas cubiertas", fila 2)     |
| 7   | `Delineante de topografía.`                                              | Candidato 3129 (sección "Citas cubiertas", fila 3)     |
| 8   | `Delineante proyectista de carreteras.`                                  | Candidato 3129 (sección "Citas cubiertas", fila 4)     |
| 9   | `Delineante proyectista de redes y sistemas de distribución de fluidos.` | Candidato 3129 (sección "Citas cubiertas", fila 5)     |
| 10  | `Delineante proyectista de urbanización.`                                | Candidato 3129 (sección "Citas cubiertas", fila 6)     |
| 11  | `Especialista en levantamiento de construcciones.`                       | Candidato 3129 (sección "Citas cubiertas", fila 7)     |
| 12  | `Especialista en levantamiento de terrenos.`                             | Candidato 3129 (sección "Citas cubiertas", fila 8)     |
| 13  | `Especialista en replanteos.`                                            | Candidato 3129 (sección "Citas cubiertas", fila 9)     |
| 14  | `Maquetista de construcción.`                                            | Candidato 3129 (sección "Citas cubiertas", fila 10)    |
| 15  | `Práctico en topografía.`                                                | Candidato 3129 (sección "Citas cubiertas", fila 11)    |
| 16  | `Técnica / técnico de control documental.`                               | Ausente de candidato (sección "Sin candidato", fila 5) |

**Cuenta:** 16 de 16 citas fuente presentes en la propuesta (11 en "Citas cubiertas" + 5 en "Sin candidato"). No se añade, ni elimina, ni altera ningún candidato ni decisión semántica. Esta tabla es una verificación de integridad de texto.
