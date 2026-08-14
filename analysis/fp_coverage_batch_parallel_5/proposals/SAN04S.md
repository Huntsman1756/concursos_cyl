# SAN04S — Anatomía Patológica y Citodiagnóstico

**Official TodoFP title:** Técnico Superior en Anatomía Patológica y Citodiagnóstico
**Source:** <https://www.todofp.es/que-estudiar/familias-profesionales/sanidad/anatomia-patologica-citodiagnostico.html>
**Family:** Sanidad (SAN) — **Level:** higher (Técnico Superior)
**Catálogo usado:** `data/curated/occupations.json` (solo entradas `approved`)

---

## Función 1: Anatomía patológica

### Citación literal TodoFP

> "Técnica / técnico especialista en anatomía patológica y citología." _(SAN04S.txt, quote 7)_
> "Técnica / técnico superior en anatomía patológica y citología." _(SAN04S.txt, quote 8)_

### Candidato CNO-11

| Campo                  | Valor                                          |
| ---------------------- | ---------------------------------------------- |
| **occupationId**       | `occupation:cno11:3314`                        |
| **classificationCode** | 3314                                           |
| **preferredLabel**     | Técnicos en laboratorio de diagnóstico clínico |
| **reviewStatus**       | approved                                       |

**Justificación:** El técnico en anatomía patológica y citología realiza el procesamiento, corte, tinción y estudio de muestras tisulares y citológicas dentro del laboratorio de anatomía patológica, función nuclear de un laboratorio de diagnóstico clínico. CNO-11 3314 es la correspondencia funcional directa del técnico de laboratorio de diagnóstico clínico, única ocupación sanitaria de laboratorio `approved` en el catálogo.

**Riesgo:** La etiqueta 3314 es genérica de laboratorio clínico y no distingue anatomía patológica de otras ramas de laboratorio (bioquímica, hematología, microbiología). No existe en el catálogo `approved` un código CNO-11 específico de técnico en anatomía patológica; la correspondencia es funcional, no exacta.

---

## Función 2: Citodiagnóstico

### Citación literal TodoFP

> "Citotécnica / citotécnico." _(SAN04S.txt, quote 2)_
> "Técnica / técnico especialista en anatomía patológica y citología." _(SAN04S.txt, quote 7)_

### Candidato CNO-11

| Campo                  | Valor                                          |
| ---------------------- | ---------------------------------------------- |
| **occupationId**       | `occupation:cno11:3314`                        |
| **classificationCode** | 3314                                           |
| **preferredLabel**     | Técnicos en laboratorio de diagnóstico clínico |
| **reviewStatus**       | approved                                       |

**Justificación:** El citotécnico procesa y evalúa muestras citológicas (frotis, líquidos, aspirados) dentro del laboratorio de diagnóstico, actividad propia de la citología diagnóstica. La misma ocupación 3314 que cubre la función 1 cubre la función de citodiagnóstico, que es parte del laboratorio de diagnóstico clínico.

**Riesgo:** El candidato es compartido con la función de anatomía patológica (mismo profesional ejerce ambas). La etiqueta 3314 no menciona "citología" ni "citotécnico"; no hay código `approved` específico de citotécnico en el catálogo.

---

## Función 3: Histología

### Citación literal TodoFP

No existe una sourceQuote independiente para "histología". La función está cubierta por el título oficial del programa y por las citas de técnico en anatomía patológica:

> "Técnico Superior en Anatomía Patológica y Citodiagnóstico" _(SAN04S.txt, line 7)_
> "Técnica / técnico especialista en anatomía patológica y citología." _(SAN04S.txt, quote 7)_

### Candidato CNO-11

| Campo                  | Valor                                          |
| ---------------------- | ---------------------------------------------- |
| **occupationId**       | `occupation:cno11:3314`                        |
| **classificationCode** | 3314                                           |
| **preferredLabel**     | Técnicos en laboratorio de diagnóstico clínico |
| **reviewStatus**       | approved                                       |

**Justificación:** La histología (procesamiento, inclusión, microtomía y tinción de tejidos para diagnóstico) es una actividad técnica de laboratorio de diagnóstico clínico ejercida por el mismo técnico de anatomía patológica. El candidato es el mismo que para anatomía patológica (3314).

**Riesgo:** Ausencia de sourceQuote dedicada a histología. La etiqueta 3314 no la distingue de otras técnicas de laboratorio; el plan Frontier advierte expresamente contra la sustitución entre funciones de laboratorio, histología y citodiagnóstico, pero el catálogo `approved` no ofrece códigos separados.

---

## Función 4: Inmunohistoquímica

### Citación literal TodoFP

No existe sourceQuote independiente para "inmunohistoquímica". Función cubierta por el título oficial y las citas de técnico en anatomía patológica:

> "Técnico Superior en Anatomía Patológica y Citodiagnóstico" _(SAN04S.txt, line 7)_
> "Técnica / técnico superior en anatomía patológica y citología." _(SAN04S.txt, quote 8)_

### Candidato CNO-11

| Campo                  | Valor                                          |
| ---------------------- | ---------------------------------------------- |
| **occupationId**       | `occupation:cno11:3314`                        |
| **classificationCode** | 3314                                           |
| **preferredLabel**     | Técnicos en laboratorio de diagnóstico clínico |
| **reviewStatus**       | approved                                       |

**Justificación:** La inmunohistoquímica (marcaje antigénico de tejidos para diagnóstico anatomopatológico) se ejecuta en el laboratorio de anatomía patológica por el técnico especialista en anatomía patológica y citología. Candidato compartido (3314), única ocupación `approved` de laboratorio clínico disponible.

**Riesgo:** Función muy especializada sin cita literal propia ni código CNO-11 `approved` específico. La asignación a 3314 es funcional indirecta y puede no reflejar la especialización inmunohistoquímica.

---

## Función 5: Biopsia

### Citación literal TodoFP

No existe sourceQuote independiente para "biopsia". Función cubierta por el título oficial y las citas de técnico en anatomía patológica:

> "Técnico Superior en Anatomía Patológica y Citodiagnóstico" _(SAN04S.txt, line 7)_
> "Técnica / técnico especialista en anatomía patológica y citología." _(SAN04S.txt, quote 7)_

### Candidato CNO-11

| Campo                  | Valor                                          |
| ---------------------- | ---------------------------------------------- |
| **occupationId**       | `occupation:cno11:3314`                        |
| **classificationCode** | 3314                                           |
| **preferredLabel**     | Técnicos en laboratorio de diagnóstico clínico |
| **reviewStatus**       | approved                                       |

**Justificación:** El procesamiento de biopsias (recepción, inclusión, corte y tinción de muestras biópsicas para diagnóstico) es una tarea central del técnico de laboratorio de anatomía patológica. Candidato compartido (3314), única ocupación `approved` de laboratorio clínico en el catálogo.

**Riesgo:** Ausencia de cita literal dedicada a biopsia. La correspondencia con 3314 es funcional y no distingue el procesamiento de biopsias de otras muestras de laboratorio.

---

## Salidas sin candidato

| #   | Cita literal TodoFP (salida)                                     | Motivo                                                                                                                                                    |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Ayudante de forensía."                                          | No existe ocupación `approved` forense ni de apoyo a medicina legal en el catálogo. `occupation:cno11:3314` es laboratorio clínico, no forensía.          |
| 3   | "Colaborador / colaboradora y asistente de investigación."       | No existe ocupación `approved` de colaborador/asistente de investigación. 3314 es técnico de laboratorio diagnóstico, no asistente de investigación.      |
| 4   | "Colaborador / colaboradora y asistente en biología molecular."  | No existe ocupación `approved` de biología molecular ni asistencia en investigación biomolecular en el catálogo.                                          |
| 5   | "Prosector / prosectora de autopsias clínicas y médico-legales." | La prosección de autopsias es una función de disección, no de laboratorio de diagnóstico clínico; 3314 no la cubre y no hay código `approved` específico. |
| 6   | "Tanatopractor / tanatopractora"                                 | No existe ocupación `approved` de tanatopraxia (funeraria/embalsamamiento) en el catálogo.                                                                |

> La salida 2 (citotécnico) tiene candidato (3314, función 2). Las salidas 7 y 8 (técnico especialista/superior en anatomía patológica y citología) tienen candidato (3314, función 1).

---

## Exclusiones explícitas (por frontier plan)

| Rol descartado                                                     | Motivo                                                                                                                                        |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auxiliares de enfermería (5611, 5612)**                          | Cuidados directos al paciente; no son funciones de laboratorio de anatomía patológica. No se sustituyen.                                      |
| **Técnicos auxiliares de farmacia (5621)**                         | Función farmacéutica, ajena al laboratorio de diagnóstico clínico. No se sustituyen.                                                          |
| **Trabajadores de cuidados en servicios de salud n.c.o.p. (5629)** | Categoría residual de cuidados, no de técnica de laboratorio. No se sustituye.                                                                |
| **Otros técnicos de ciencias físicas/químicas (3129)**             | Ámbito de ciencias físicas, químicas, medioambientales e ingenierías; no cubre biología tisular ni citología diagnóstica. No se sustituye.    |
| **Candidatos no aprobados**                                        | Entradas con reviewStatus `rejected` o `draft` (3734, 4309, 5831, 5891, 3202, 7212, 7223) se excluyen conforme al criterio "solo `approved`". |

---

## Resumen de candidatos

| Función             | occupationId            | Código | Etiqueta exacta                                | Tipo de correspondencia                  |
| ------------------- | ----------------------- | ------ | ---------------------------------------------- | ---------------------------------------- |
| Anatomía patológica | `occupation:cno11:3314` | 3314   | Técnicos en laboratorio de diagnóstico clínico | Funcional directa                        |
| Citodiagnóstico     | `occupation:cno11:3314` | 3314   | Técnicos en laboratorio de diagnóstico clínico | Funcional directa                        |
| Histología          | `occupation:cno11:3314` | 3314   | Técnicos en laboratorio de diagnóstico clínico | Funcional directa (sin quote dedicada)   |
| Inmunohistoquímica  | `occupation:cno11:3314` | 3314   | Técnicos en laboratorio de diagnóstico clínico | Funcional indirecta (sin quote dedicada) |
| Biopsia             | `occupation:cno11:3314` | 3314   | Técnicos en laboratorio de diagnóstico clínico | Funcional directa (sin quote dedicada)   |

**Salidas sin candidato:** 5 de 8 (ayudante de forensía, colaborador de investigación, colaborador en biología molecular, prosector de autopsias, tanatopractor).

_No se ha modificado `data/curated/occupations.json` ni ningún otro archivo salvo este `.md`. Ninguna correspondencia se infiere por semejanza sectorial._
