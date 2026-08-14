# Propuesta de cobertura CNO-11 para QUI01S

**Familia:** Química (QUI)
**Título oficial:** Técnico Superior en Laboratorio de Análisis y de Control de Calidad
**Fuentes:** `analysis/fp_coverage_batch_parallel_4/sources/QUI01S.txt` + `data/curated/occupations.json`
**Fecha:** 2026-08-14

## Metodología

Se revisaron las 14 salidas (`sourceQuotes`) de TodoFP contra la totalidad del catálogo CNO-11 aprobado en `occupations.json`. Solo se incluyen candidatos con `reviewStatus: "approved"` y correspondencia **exacta o funcional directa** (misma función nuclear, no mera semejanza sectorial). Se verificó que cada candidato existe en el catálogo curado.

---

## Candidatos CNO-11 aprobados

### Candidato 1 — Control de calidad (manufacturas diversas)

| Campo                   | Valor                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**        | `occupation:cno11:3160`                                                                                                                                                                                                                                                                                                                                          |
| **Código**              | `3160`                                                                                                                                                                                                                                                                                                                                                           |
| **Etiqueta exacta**     | Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías                                                                                                                                                                                                                                                                            |
| **Cita literal TodoFP** | "Técnica / técnico en control de calidad en industrias de manufacturas diversas."                                                                                                                                                                                                                                                                                |
| **Justificación**       | Correspondencia funcional directa: ambas descripciones enumeran técnicos de **control de calidad** en contextos industriales. El CNO-11 3160 declara explícitamente "control de calidad" como función nuclear, y su ámbito "ciencias físicas, químicas y de las ingenierías" subsume "industrias de manufacturas diversas". No se requiere inferencia sectorial. |
| **Riesgo**              | BAJO — Coincidencia léxica directa en "control de calidad" y solapamiento funcional claro.                                                                                                                                                                                                                                                                       |

### Candidato 2 — Ensayos de productos de fabricación mecánica

| Campo                   | Valor                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**        | `occupation:cno11:3160`                                                                                                                                                                                                                                                                                                                                             |
| **Código**              | `3160`                                                                                                                                                                                                                                                                                                                                                              |
| **Etiqueta exacta**     | Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías                                                                                                                                                                                                                                                                               |
| **Cita literal TodoFP** | "Técnica / técnico de ensayos de productos de fabricación mecánica."                                                                                                                                                                                                                                                                                                |
| **Justificación**       | Correspondencia funcional directa: "ensayos de productos" es una actividad de aseguramiento/control de calidad. El CNO-11 3160 agrupa a técnicos de control de calidad en ciencias físicas e ingenierías, lo que incluye la verificación de productos de fabricación mecánica. La función nuclear es la misma: comprobar conformidad de productos mediante ensayos. |
| **Riesgo**              | MEDIO — "Ensayos de productos" implica verificación física, que es subconjunto de control de calidad; la cobertura es correcta pero el mapeo no es idéntico léxicamente.                                                                                                                                                                                            |

### Candidato 3 — Analista de laboratorio químico

| Campo                   | Valor                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**        | `occupation:cno11:3129`                                                                                                                                                                                                                                                                                                               |
| **Código**              | `3129`                                                                                                                                                                                                                                                                                                                                |
| **Etiqueta exacta**     | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías                                                                                                                                                                                                                                               |
| **Cita literal TodoFP** | "Analista de laboratorio químico."                                                                                                                                                                                                                                                                                                    |
| **Justificación**       | Correspondencia funcional directa: un analista de laboratorio químico es, por definición funcional, un técnico de las ciencias químicas. El CNO-11 3129 es la categoría residual que agrupa técnicos de ciencias químicas no clasificados en otro epígrafe específico. La función nuclear (análisis químico de laboratorio) coincide. |
| **Riesgo**              | BAJO — La función "química de laboratorio" está cubierta explícitamente por el ámbito de 3129.                                                                                                                                                                                                                                        |

### Candidato 4 — Técnico de laboratorio de química industrial

| Campo                   | Valor                                                                                                                                                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**        | `occupation:cno11:3129`                                                                                                                                                                                                                                                                                  |
| **Código**              | `3129`                                                                                                                                                                                                                                                                                                   |
| **Etiqueta exacta**     | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías                                                                                                                                                                                                                  |
| **Cita literal TodoFP** | "Técnica / técnico de laboratorio de química industrial."                                                                                                                                                                                                                                                |
| **Justificación**       | Correspondencia funcional directa: química industrial es una disciplina de las ciencias químicas. Un técnico de laboratorio en este ámbito ejerce la misma función nuclear que describe 3129: técnicos de ciencias químicas. La palabra "industrial" es un contexto sectorial, no una función diferente. |
| **Riesgo**              | BAJO — Función nuclear idéntica (química de laboratorio); "industrial" es contexto, no categoría funcional distinta.                                                                                                                                                                                     |

### Candidato 5 — Analista de laboratorio de materiales

| Campo                   | Valor                                                                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**        | `occupation:cno11:3129`                                                                                                                                                                                                                                                            |
| **Código**              | `3129`                                                                                                                                                                                                                                                                             |
| **Etiqueta exacta**     | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías                                                                                                                                                                                            |
| **Cita literal TodoFP** | "Analista de laboratorio de materiales."                                                                                                                                                                                                                                           |
| **Justificación**       | Correspondencia funcional directa: el análisis de materiales es una actividad de las ciencias físicas (ciencia de materiales). El CNO-11 3129 incluye "ciencias físicas" como ámbito, y un analista de laboratorio de materiales ejerce la función de técnico en dicha disciplina. |
| **Riesgo**              | MEDIO — "Materiales" encaja en "ciencias físicas" pero el catálogo 3129 es residual y no menciona "materiales" explícitamente; la correspondencia es funcional pero no léxica.                                                                                                     |

### Candidato 6 — Técnico de ensayos de materiales de construcción

| Campo                   | Valor                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**        | `occupation:cno11:3129`                                                                                                                                                                                                                                                                                                                                                     |
| **Código**              | `3129`                                                                                                                                                                                                                                                                                                                                                                      |
| **Etiqueta exacta**     | Otros técnicos de las ciencias físicas, químicas, medioambientales y de las ingenierías                                                                                                                                                                                                                                                                                     |
| **Cita literal TodoFP** | "Técnica / técnico de ensayos de materiales de construcción."                                                                                                                                                                                                                                                                                                               |
| **Justificación**       | Correspondencia funcional directa: los ensayos de materiales son una función de las ciencias físicas/ingeniería de materiales. El CNO-11 3129 abarca técnicos de ciencias físicas e ingenierías no clasificados en otro epígrafe. La función nuclear (ensayo y caracterización de materiales) coincide. La referencia a "construcción" es sectorial y no altera la función. |
| **Riesgo**              | MEDIO — Mapeo funcional correcto (ensayo de materiales = ciencias físicas), pero el contexto "construcción" podría sugerir otros epígrafes del grupo 71xx; se descartan porque son oficios de obra, no de laboratorio/ensayo.                                                                                                                                               |

---

## Salidas sin candidato CNO-11 aprobado

Las siguientes salidas de TodoFP **no tienen correspondencia exacta ni funcional directa** con ningún `occupationId` aprobado en `occupations.json`:

| #   | Cita literal TodoFP                                                                                          | Razón de ausencia                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Analista de centros de formación, investigación y desarrollo."                                              | Rol de I+D en centros formativos; no existe epígrafe CNO-11 aprobado para "analista de I+D" ni para personal de centros de formación.                                                                                                                                                    |
| 2   | "Analista de control microbiológico de la Industria Farmacéutica."                                           | Control microbiológico industrial: no hay epígrafe CNO-11 aprobado para técnicos de microbiología industrial/farmacéutica. El 3314 (laboratorio de diagnóstico clínico) es clínico-hospitalario, no industrial.                                                                          |
| 3   | "Analista de laboratorio de industrias agroalimentarias."                                                    | Análisis de laboratorio en sector agroalimentario: no hay epígrafe CNO-11 aprobado que cubra específicamente técnicos de laboratorio del sector alimentario.                                                                                                                             |
| 4   | "Analista de laboratorio de industrias transformadoras."                                                     | Análisis de laboratorio en industrias transformadoras (manufactura): demasiado genérico para mapear a un epígrafe funcional específico; 3129/3160 cubren subconjuntos, pero "industrias transformadoras" como categoría no tiene correspondencia directa unívoca.                        |
| 6   | "Analista de laboratorio microbiológico."                                                                    | Microbiología de laboratorio: no hay epígrafe CNO-11 aprobado para técnicos de microbiología. El closest (3314) es diagnóstico clínico, no microbiología general.                                                                                                                        |
| 8   | "Analista de materias primas y acabados."                                                                    | Análisis de materias primas y acabados: no hay epígrafe CNO-11 aprobado que cubra esta función específica. Podría derivar de 3160 (control de calidad) o 3129, pero la función descrita (caracterización de materia prima y acabados) no tiene mapeo directo verificable sin inferencia. |
| 9   | "Analista microbiológico de aguas potables y residuales."                                                    | Microbiología ambiental (aguas): no hay epígrafe CNO-11 aprobado para técnicos de microbiología ambiental.                                                                                                                                                                               |
| 10  | "Analista microbiológico de industrias alimentarias, empresas medioambientales, industrias biotecnológicas." | Microbiología en sectores alimentario, ambiental y biotecnológico: no hay epígrafe CNO-11 aprobado para técnicos de microbiología aplicada.                                                                                                                                              |

**Total sin candidato: 8 de 14 salidas.**

---

## Resumen de cobertura

| Métrica                               | Valor              |
| ------------------------------------- | ------------------ |
| Salidas TodoFP totales                | 14                 |
| Salidas con candidato CNO-11 aprobado | 6                  |
| Salidas sin candidato                 | 8                  |
| Candidatos CNO-11 únicos aprobados    | 2 (`3160`, `3129`) |
| Cobertura por categoría solicitada    |                    |

### Cobertura por categoría funcional

| Categoría                                                  | Salidas TodoFP     | Candidato      | Estado            |
| ---------------------------------------------------------- | ------------------ | -------------- | ----------------- |
| **Control de calidad**                                     | Quote 14           | `3160`         | CUBIERTO          |
| **Ensayos de materiales**                                  | Quote 11, Quote 12 | `3129`, `3160` | CUBIERTO          |
| **Analista de laboratorio (química)**                      | Quote 7            | `3129`         | CUBIERTO          |
| **Química industrial**                                     | Quote 13           | `3129`         | CUBIERTO          |
| **Analista de laboratorio (materiales)**                   | Quote 5            | `3129`         | CUBIERTO          |
| **Control microbiológico**                                 | Quotes 2, 6, 9, 10 | —              | **SIN CANDIDATO** |
| **Analista de laboratorio (general/agroalim./transform.)** | Quotes 1, 3, 4, 8  | —              | **SIN CANDIDATO** |

---

## Observaciones

1. **El control microbiológico no tiene cobertura CNO-11 aprobada.** Las 4 salidas relacionadas con microbiología (Quotes 2, 6, 9, 10) quedan sin candidato. El epígrafe 3314 ("Técnicos en laboratorio de diagnóstico clínico") está aprobado pero es clínico-hospitalario, no industrial; incluirlo sería una inferencia por semejanza sectorial, prohibida por contrato.

2. **El catálogo CNO-11 aprobado carece de un epígrafe específico para "técnico de microbiología" o "técnico de laboratorio microbiológico".** Esto es una laguna estructural del catálogo curado, no una limitación del análisis.

3. **No se modificaron datos curados.** El archivo `occupations.json` no fue alterado.

4. **Los dos candidatos únicos (`3160` y `3129`) están verificados como `approved`** en `occupations.json`.
