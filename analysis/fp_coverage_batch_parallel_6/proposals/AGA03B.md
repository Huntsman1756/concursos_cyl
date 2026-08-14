# AGA03B — Aprovechamientos Forestales (Título Profesional Básico)

**Fuente:** TodoFP · `family: AGA` · `level: basic`  
**Categoría:** Agraria

---

## Citas literales TodoFP y candidatos CNO-11 approved

---

### 1. Aplicador / aplicadora de nivel básico de plaguicidas de uso fitosanitario.

| Criterio          | Valor |
| ----------------- | ----- |
| **SIN CANDIDATO** |       |

**Justificación:**  
El tratamiento y aplicación de plaguicidas fitosanitarios es una especialización técnica que no se corresponde con ninguna de las categorías genéricas de trabajadores agrícolas (6110), de jardinería/viveros (6120), de apicultura (6204) o de avicultura/cunicultura (6205). El código CNO-11 6204 cubre exclusivamente apicultura y sericicultura, no la aplicación general de fitosanitarios en cualquier cultivo. No hay en el catálogo aprobado ninguna ocupación CNO-11 que incluya explícitamente aplicadores de plaguicidas ni profesionales de manejo integrado de plagas.

**Riesgo:** Alto. El peonaje forestal incluye aplicador de plaguicidas como ocupación básica. Al no existir candidato CNO-11 approved, esta función quedaría sin mapeo. Se requeriría un nuevo registro en `occupations.json` bajo `reviewStatus: "draft"` con evidencia oficial del INE/CNO-11 que incluya aplicadores de fitosanitarios, o bien redefinir el alcance de 6110 o 6120.

---

### 2. Peón agropecuario.

| Campo               | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:6110`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Código**          | `6110`                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Etiqueta exacta** | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                                                                                                                                                       |
| **Cita literal**    | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                                                                                                                                                       |
| **Justificación**   | Corresponde a la categoría de base del sector primario de producción agrícola (campo, cultivos leñosos y herbáceos). TodoFP lo sitúa como peón agropecuario en contexto genérico de producción. CNO-11 6110 engloba trabajadores cualificados en actividades de campo — cultivos, siembra, cosecha — que incluyen peones agrícolas rurales no especializados en huerta/jardín/vivero. Peón agropecuario es el nivel básico de entrada de esta categoría.                          |
| **Riesgo**          | Medio. La etiqueta de CNO-11 dice "cualificados" y la fuente TodoFP dice "peón" (nivel básico). Se debe documentar la equivalencia funcional: el nivel básico TodoFP opera dentro de las funciones de 6110, sin ascenso jerárquico. No se trata de un técnico agrícola, sino de un trabajador de campo del sector primario. El término "cualificados" en CNO-11 no implica formación de grado superior; incluye peones con cualidad de desempeño en tareas de producción agraria. |

---

### 3. Peón de jardinería.

| Campo               | Valor                                                                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:6120`                                                                                                                                                                                                                      |
| **Código**          | `6120`                                                                                                                                                                                                                                       |
| **Etiqueta exacta** | `Trabajadores cualificados en huertas, invernaderos, viveros y jardines`                                                                                                                                                                     |
| **Cita literal**    | `Trabajadores cualificados en huertas, invernaderos, viveros y jardines`                                                                                                                                                                     |
| **Justificación**   | Coincidencia exacta: el campo de jardines está explícitamente nombrado. Peón de jardinería opera las funciones de cuidado, mantenimiento y trabajo base del jardín (corte, riego, limpieza, poda ligera) como nivel básico derivado de 6120. |
| **Riesgo**          | Bajo. La relación es directa y no implica ascenso jerárquico. El "peón" es el nivel de operativa básica dentro del ámbito de 6120.                                                                                                           |

---

### 4. Peón de vivero.

| Campo               | Valor                                                                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:6120`                                                                                                                                                                                                                |
| **Código**          | `6120`                                                                                                                                                                                                                                 |
| **Etiqueta exacta** | `Trabajadores cualificados en huertas, invernaderos, viveros y jardines`                                                                                                                                                               |
| **Cita literal**    | `Trabajadores cualificados en huertas, invernaderos, viveros y jardines`                                                                                                                                                               |
| **Justificación**   | Coincidencia exacta: el campo de viveros está explícitamente nombrado. Peón de vivero realiza tareas de producción y cuidado de plántulas, macetas y materiales de propagación vegetal dentro de un vivero, como nivel básico de 6120. |
| **Riesgo**          | Bajo. Relación directa, sin ascenso jerárquico.                                                                                                                                                                                        |

---

### 5. Peón en cultivos herbáceos.

| Campo               | Valor                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:6110`                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Código**          | `6110`                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Etiqueta exacta** | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                                                                                                       |
| **Cita literal**    | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                                                                                                       |
| **Justificación**   | Los cultivos herbáceos (cereales, leguminosas, forrajeras) son la categoría genérica de producción agrícola en campo abierto. TodoFP lo sitúa como "en cultivos herbáceos", lo que excluye huertas e invernaderos. CNO-11 6110 excluye explícitamente huertas, invernaderos, viveros y jardines, dejando a su cargo todos los demás cultivos agrarios, incluyendo herbáceos. Corresponde a una correspondencia funcional directa. |
| **Riesgo**          | Medio. El nivel "peón" de TodoFP se mapea a "trabajadores cualificados" de CNO-11. Se debe precisar que el trabajo herbáceo es el núcleo de 6110. Sin ascenso: el peón produce, siembra, cosecha bajo supervisión básica.                                                                                                                                                                                                         |

---

### 6. Peón en empresas de aprovechamientos forestales.

| Campo               | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:6110`                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Código**          | `6110`                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Etiqueta exacta** | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                                                                                                                             |
| **Cita literal**    | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                                                                                                                             |
| **Justificación**   | El aprovechamiento forestal (tales, saca de maderas, explotación de productos leñosos) se encuadra funcionalmente en la producción primaria del sector primario. CNO-11 no dispone de una categoría específica de "trabajadores del bosque". 6110 se aplica como categoría genérica de actividades no cubiertas por 6120 (huertas, viveros, jardines). Peón forestal en aprovechamientos es el nivel básico de operativa en monte para aprovechamiento. |
| **Riesgo**          | Medio-Alto. CNO-11 no tiene una categoría exclusiva de "forestal". Se recurre a 6110 por el principio de subsumidor genérico. Esto no eleva el nivel: el "aprovechamiento forestal" es producción primaria, no gestión técnica ni ingeniería forestal. Se documenta la justificación de uso de subsumidor genérico para conservar el nivel básico.                                                                                                      |

---

### 7. Peón en empresas de implantaciones forestales.

| Campo               | Valor                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:6110`                                                                                                                                                                                                                                                                                                                                                                             |
| **Código**          | `6110`                                                                                                                                                                                                                                                                                                                                                                                              |
| **Etiqueta exacta** | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                                                                         |
| **Cita literal**    | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                                                                         |
| **Justificación**   | Implantaciones forestales (preparación de suelo, plantación de árboles y arbustos forestales, establecimiento de masas) se sitúa funcionalmente en actividades de producción primaria no cubiertas por huertas/jardines/viveros. Se aplica 6110 como correspondencia funcional directa. El peón de implantación ejecuta tareas de plantación y preparación, nivel básico dentro del ámbito de 6110. |
| **Riesgo**          | Medio-Alto. Igual que el aprovechamiento forestal: subsumidor genérico por no existir categoría "forestal" en CNO-11. Sin ascenso: implantación y plantación son trabajo de campo, no diseño ni ingeniería forestal.                                                                                                                                                                                |

---

### 8. Peón en empresas de mantenimiento de jardines.

| Campo               | Valor                                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **occupationId**    | `occupation:cno11:6120`                                                                                                                                                                                                                                |
| **Código**          | `6120`                                                                                                                                                                                                                                                 |
| **Etiqueta exacta** | `Trabajadores cualificados en huertas, invernaderos, viveros y jardines`                                                                                                                                                                               |
| **Cita literal**    | `Trabajadores cualificados en huertas, invernaderos, viveros y jardines`                                                                                                                                                                               |
| **Justificación**   | El mantenimiento de jardines (corte de césped, limpieza, poda básica, riego, tratamientos preventivos menores) es directamente la categoría de jardines de 6120. Corresponde a la misma etiqueta que el candidato de la cita 3 ("Peón de jardinería"). |
| **Riesgo**          | Bajo. Igual que cita 3. Relación exacta.                                                                                                                                                                                                               |

**⚠️ Variante casi duplicada:**  
Esta cita (8) y la cita 3 ("Peón de jardinería") comparten el mismo candidato CNO-11: `6120`. Son equivalentes funcionales: "peón de jardinería" es la denominación genérica y "peón en empresas de mantenimiento de jardines" es el contexto empresarial del mismo trabajo. Se trata como una correspondencia única mapeada a 6120 con dos citas fuente.

---

### 9. Peón en empresas de tratamientos selvícolas.

| Campo               | Valor                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:6110`                                                                                                                                                                                                                                                                                                                                  |
| **Código**          | `6110`                                                                                                                                                                                                                                                                                                                                                   |
| **Etiqueta exacta** | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                              |
| **Cita literal**    | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                              |
| **Justificación**   | Los tratamientos selvícolas (desbroce, limpias, aclareos, podas formativas menores) son operaciones de mantenimiento de masas forestales ejecutadas a nivel básico. Se encuadran en producción primaria del sector primario, equivalente funcional a actividades agrícolas no cubiertas por 6120. Se aplica 6110 como correspondencia funcional directa. |
| **Riesgo**          | Medio-Alto. Subsumidor genérico (no hay categoría forestal específica). Sin ascenso: peón selvícola no es técnico forestal ni ingeniero. Son tareas de campo, no planificación ni gestión de masas forestales.                                                                                                                                           |

---

### 10. Peón en explotaciones forestales.

| Campo               | Valor                                                                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:6110`                                                                                                                                                                                                                                                         |
| **Código**          | `6110`                                                                                                                                                                                                                                                                          |
| **Etiqueta exacta** | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                     |
| **Cita literal**    | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                     |
| **Justificación**   | Explotaciones forestales (producción de madera, leña, corcho, resinas, frutos silvestres) se corresponde funcionalmente con actividades de producción primaria del sector primario. Sin categoría forestal específica en CNO-11, se aplica 6110 como correspondencia funcional. |
| **Riesgo**          | Medio. Subsumidor genérico. Sin ascenso jerárquico. Peón forestal que produce y extrae, no técnico que planifica.                                                                                                                                                               |

**⚠️ Variante casi duplicada:**  
Esta cita (10) y la cita 11 ("Peón forestal") comparten el mismo candidato CNO-11: `6110`. "Peón en explotaciones forestales" describe el contexto empresarial (explotación) mientras que "Peón forestal" es la denominación genérica. Ambas se mapean a 6110 como una correspondencia única con dos citas fuente.

---

### 11. Peón forestal.

| Campo               | Valor                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:6110`                                                                                                                                                                                                                                                                                                                       |
| **Código**          | `6110`                                                                                                                                                                                                                                                                                                                                        |
| **Etiqueta exacta** | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                   |
| **Cita literal**    | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)`                                                                                                                                                                                                                                   |
| **Justificación**   | "Peón forestal" es la denominación general del sector forestal. Se aplica 6110 como correspondencia funcional directa, por no existir categoría específica de "forestal" en CNO-11. El peón forestal ejecuta tareas de campo (recolección, extracción, preparaciones sencillas) dentro del ámbito de producción primaria del sector primario. |
| **Riesgo**          | Medio. Igual que citas 6, 7, 9 y 10: subsumidor genérico por carencia de categoría forestal específica en CNO-11. Sin ascenso: nivel de base.                                                                                                                                                                                                 |

---

## Resumen de mapeo

| CNO-11   | Ocupación CNO-11                                                                                            | Citas TodoFP cubiertas          |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **6110** | `Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)` | 2, 5, 6, 7, 9, 10, 11 (7 citas) |
| **6120** | `Trabajadores cualificados en huertas, invernaderos, viveros y jardines`                                    | 3, 4, 8 (3 citas)               |
| —        | **SIN CANDIDATO**                                                                                           | 1 (1 cita)                      |

**Total de citas TodoFP:** 11  
**Citas con candidato approved:** 10 (dos grupos de variantes casi duplicadas tratados como mapeos únicos a sus respectivos candidatos)  
**Citas SIN candidato approved:** 1

- `Aplicador / aplicadora de nivel básico de plaguicidas de uso fitosanitario.`

---

## Grupos de variantes casi duplicadas

### Grupo A (6120)

- `3. Peón de jardinería.` → `6120`
- `8. Peón en empresas de mantenimiento de jardines.` → `6120`

Mismo candidato porque jardinería y mantenimiento de jardines son la misma actividad profesional con distinta etiqueta contextual ("de jardinería" vs "en empresas de mantenimiento de jardines"). Mapeo único a 6120.

### Grupo B (6110)

- `10. Peón en explotaciones forestales.` → `6110`
- `11. Peón forestal.` → `6110`

Mismo candidato porque explotar un monte y ser "peón forestal" describen la misma función productiva desde perspectivas ligeramente distintas. Mapeo único a 6110.

---

## No eleva jerarquía — Justificación general

En ningún caso se eleva un peón básico a técnico forestal, ingeniero de montes, o encargado/jefe de equipo. Todos los mapping son a ocupaciones de CNO-11 que corresponden a trabajadores operativos del sector primario (trabajadores cualificados como categoría de base, no técnicos superiores). "Cualificado" en CNO-11 no significa "ingeniero técnico" ni "técnico superior"; alude a trabajadores con habilidad profesional, que incluyen peones con cualidad de desempeño. Las únicas ocupaciones elevadas serían técnicas forestales (no en el catálogo approved) o puestos de supervisión (37xx), los cuales no aparecen en ninguna de las ocupaciones candidatas.

---

## Citas sin candidato CNO-11 approved

| Nº TodoFP | Cita literal                                                                  | Razón                                                                                                                                                                                                                                                                                                                                           |
| --------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | `Aplicador / aplicadora de nivel básico de plaguicidas de uso fitosanitario.` | No existe categoría en CNO-11 para aplicadores de productos fitosanitarios ni para manejo de plagas. Las categorías approved de CNO-11 cubren producción (6110), huerta/jardín/vivero (6120), apicultura (6204), avicultura/cunicultura (6205) y maquinaria (8321), ninguna de las cuales incluye explícitamente aplicadores de fitosanitarios. |

**Recomendación:** Se necesitaría introducir `occupation:cno11:xxxx` con `reviewStatus: "draft"` referenciando la nota del INE sobre CNO-11 que incluya "Aplicadores de productos de tratamiento fitosanitario" o categoría equivalente en el grupo 31 (técnicos de ciencias físicas/químicas/medioambientales) como 3129, o bien proponer una nueva entrada CNO-11 para aplicadores de fitosanitarios de nivel básico.
