# Propuesta de mapeo AGA02M → CNO-11

## Cabecera

| Campo                               | Valor                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Source Key**                      | `AGA02M`                                                                                       |
| **Source Title**                    | Producción Agropecuaria                                                                        |
| **Family Code**                     | `AGA` — Agraria                                                                                |
| **Source System**                   | TodoFP                                                                                         |
| **Source URL**                      | https://www.todofp.es/que-estudiar/familias-profesionales/agraria/produccion-agropecuaria.html |
| **Level**                           | intermediate                                                                                   |
| **Total de ocupaciones TodoFP**     | 10                                                                                             |
| **Con candidato CNO-11 approved**   | 5                                                                                              |
| **Sin candidato CNO-11 approved**   | 5                                                                                              |
| **Total de citas literales TodoFP** | 10                                                                                             |
| **Citas cubiertas**                 | 10/10                                                                                          |

## Resumen de mapeo

| #   | Ocupación TodoFP                                       | occupationId CNO-11     | Código CNO-11 | Etiqueta CNO-11                                                                                           | Estado                                      |
| --- | ------------------------------------------------------ | ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | Agricultor / agricultora                               | `occupation:cno11:6110` | 6110          | Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines) | Directa con exclusión                       |
| 2   | Apicultor / apicultora                                 | `occupation:cno11:6204` | 6204          | Trabajadores cualificados en apicultura y sericicultura                                                   | Directa (exacta)                            |
| 3   | Avicultor / avicultora                                 | `occupation:cno11:6205` | 6205          | Trabajadores cualificados en la avicultura y la cunicultura                                               | Directa (exacta)                            |
| 4   | Criador / criadora de ganado                           | —                       | —             | —                                                                                                         | Sin candidato                               |
| 5   | Floricultor / floricultora                             | —                       | —             | —                                                                                                         | Sin candidato                               |
| 6   | Fruticultor / fruticultora                             | —                       | —             | —                                                                                                         | Sin candidato                               |
| 7   | Horticultor / horticultora                             | `occupation:cno11:6120` | 6120          | Trabajadores cualificados en huertas, invernaderos, viveros y jardines                                    | Directa (exacta)                            |
| 8   | Operador / operadora de maquinaria agrícola y ganadera | `occupation:cno11:8321` | 8321          | Operadores de maquinaria agrícola móvil                                                                   | Funcional con riesgo (parcialidad ganadera) |
| 9   | Productor / productora de huevos                       | —                       | —             | —                                                                                                         | Sin candidato                               |
| 10  | Productor / productora de leche                        | —                       | —             | —                                                                                                         | Sin candidato                               |

---

## Detalle por ocupación TodoFP (TodoFP literal: «Program Title: Producción Agropecuaria»)

### 1 — Agricultor / agricultora

- **occupationId:** `occupation:cno11:6110`
- **Código CNO-11:** 6110
- **Etiqueta exacta CNO-11:** «Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines)»
- **Cita literal TodoFP (Source Quote):** «1. Agricultor / agricultora.»
- **Justificación:** «Agricultor / agricultora» es el vocábulo genérico de producción vegetal de campo abierto y seena directamente al código 6110, que cubre «actividades agrícolas». El texto de 6110 excluye huertas/invernaderos/viveros/jardines — subcategorías ya cubiertas por el código 6120 — pero el agricultor de gran cultivo sí entra en 6110. Se preserva la especialidad productiva (agricultor frente a peón) porque ambos son «qualifiés», no clasificados en épigrajes de peonaje.
- **Riesgo:** El término «agricultor» en TodoFP es un productor especializado (titular o gestor de la explotación vegetal), no un peón. El código CNO-11 6110 usa «Trabajadores qualifiés», que puede incluir tanto productores como empleados cualificados. Debe validarse que no se equipare indirectamente con roles de peonaje. Se preserva la distinción de jerarquía: no es un «Empleado» ni un «Peón».

### 2 — Apicultor / apicultora

- **occupationId:** `occupation:cno11:6204`
- **Código CNO-11:** 6204
- **Etiqueta exacta CNO-11:** «Trabajadores qualifiés en apicultura y sericiculture»
- **Cita literal TodoFP (Source Quote):** «2. Apicultor / apicultora.»
- **Justificación:** «Apicultura» en TodoFP coincide literalmente con el epígrafe «apiculture» del CNO-11 6204. Coincidencia exacta de dominio.
- **Riesgo:** El código 6204 también incluya «sericulture» (cría de seda / morera), que no está presente en TodoFP AGA02M. Es un riesgo de sobre-inclusión del CNO-11 pero no de sub-inclusión; toda apicultura se cubre. Se preserva la especialidad: se preserva la especialidad: no se sub-por un peón general.

### 3 — Avicultor / avicultora

- **occupationId:** `occupation:cno11:6205`
- **Código CNO-11:** 6205
- **Etiqueta exacta CNO-11:** «Trabajadores qualifiés en la aviculture et la cuniculture»
- **Cita literal TodoFP (Source Quote):** «3. Avicultor / avicultora.»
- **Justificación:** «Avicultura» coincide directamente con «aviature» del CNO-11 6205. Coincidencia exacta de dominio.
- **Riesgo:** 6205 también incluye «cuniculture» (cría de conejos), no presente en AGA02M. Riesgo de sobre-inclusión del código CNO-11, no de sub-inclusión. Se preserva jerarquía: es «qualifié», no «peón».

### 4 — Criador / criadora de ganado

- **occupationId:** —
- **Código CNO-11:** —
- **Etiqueta exacta CNO-11:** —
- **Cita literal TodoFP (Source Quote):** «4. Criador / criadora de ganado.»
- **Justificación:** No hay ningún código CNO-11 «approved» que cubra la ganadería general. Los únicos epígrafes ganaderos/cinocultores existentes son 6204 (apicultura) y 6205 (avicultura/cunicultura), que son específicos de especies particulares. No existe un epígrafe genérico de ganadería. 6110 excluye actividades ganaderas (solo actividades agrícolas, i.e., vegetal). El código 8321 cubre solo operadores de maquinaria, no productores ganaderos.
- **Riesgo:** Alto riesgo de intentar forzar 6110 por error (6110 solo cubre actividades agrícolas / vegetal, no ganaderas). Se preserva la separación: «criador de ganado» es un productor especializado de animales domésticos, no un operario agrícola vegetal ni un peón general.

### 5 — Floricultor / floricultora

- **occupationId:** —
- **Código CNO-11:** —
- **Etiqueta exacta CNO-11:** —
- **Cita literal TodoFP (Source Quote):** «5. Floricultor / floricultora.»
- **Justificación:** «Floricultura» es la cultivo de flores y plantas ornamentales. No hay epígrafe CNO-11 que la cubra: no en 6120 (huertas, invernaderos, viveros y jardins — que no incluye explícitamente floricultura), ni en 6110 (que excluye explícitamente invernaderos y viveros). El catálogo aprobado no contiene candidato para floricultura como actividad autónoma.
- **Riesgo:** Riesgo de intentar empujar por 6120: pero 6120 es «huertas, invernaderos, viveros et jardins» — la floricultura se encaja en "jardins" o "viveros", pero el nivel de producción agraria (campo abierto, cultivo de flores para venta) no es equivalent. No se debe sustituir por «peón de jardinería» (no existe en catalog approved).

### 6 — Fruticultor / fruticultora

- **occupationId:** —
- **Código CNO-11:** —
- **Etiqueta exacta CNO-11:** —
- **Cita literal TodoFP (Source Quote):** «6. Fruticultor / fruticultora.»
- **Justificación:** «Fruticultura» es el cultivo de árboles frutales. No hay epígrafe dedicado en el catálogo: no en 6110 (excluye viveros), y no en 6120 (huerta, invernadero, jardín; un frutal a campo abierto no es «jardín» ni «vivero»). El catálogo no aprobado incluye candidato para fruticultura.
- **Riesgo:** Riesgo de forzar 6110: un árbol frutal es un cultivo vegetal de larga duración, similar a una actividad «agricole», pero no es lo mismo que un cultivo anual de cereales. La fruticultura implica manejo técnico de podas, injertos, cosecha selectiva — nivel técnico de un «qualifié» específico, no de un peón genérico.

### 7 — Horticultor / horticultora

- **occupationId:** `occupation:cno11:6120`
- **Código CNO-11:** 6120
- **Etiqueta exacta CNO-11:** «Trabajadores qualifiés en huertas, invernaderos, viveros et jardins»
- **Cita literal TodoFP (Source Quote):** «7. Horticultor / horticultora.»
- **Justificación:** «Horticultura» engloba el cultivo de hortalizas, y en TodoFP AGA02M se considera actividad diferenciada de la agricultura convencional. El CNO-11 6120 cubre «huertas» directamente, por lo que corresponde a la actividad hortícola. Corresponde al epígrafe específico.
- **Riesgo:** El código 6120 incluye además «viveros et jardins», que no están en TodoFP AGA02M. Pero no se debe confundir con 6110 (agricultura general) porque la horticultura usa técnicas distintas (parcelas de menor superficie, riegos, rotaciones intensivas, a menudo bajo protección). Se preserva especialidad: es un «qualifié» hortícola, no un «peón» de campo abierto.

### 8 — Operador / operadora de maquinaria agrícola y ganadera

- **occupationId:** `occupation:cno11:8321`
- **Código CNO-11:** 8321
- **Etiqueta exacta CNO-11:** «Operadores de maquinaria agrícola móvil»
- **Cita literal TodoFP (Source Quote):** «8. Operador / operadora de maquinaria agrícola y ganadera.»
- **Justificación:** TodoFP AGA02M define la actividad de operar maquinaria tanto agrícola como ganadera. El CNO-11 8321 cubre específicamente los «operadores de maquinaria agrícola móvil», que incluye tractores, cosechadoras, rastras, arados, etc. Es la correspondencia funcional más cercana para la parte agrícola de la actividad del operador.
- **Riesgo (ALTO — Parcialidad ganadera):** El código 8321 está restringido a «maquinaria agrícola», mientras que TodoFP también incluye «maquinaria ganadera» (alimentadoras, ordeñadoras móviles, sistemas de carga de estiércol, etc.). No existe en catálogo ningún código CNO-11 «approved» para «operadores de maquinaria ganadera» o «operadores de equipamiento de granja animal». Esto significa que la parte ganadera de la ocupación TodoFP queda sin candidato directo. Se debe documentar esta brecha y no forzar 8321 para cubrir la actividad ganadera. Se preserva la jerarquía: es un «Operador» de maquinaria (nivel técnico/calificado), no un peón de granja ni un criador.

### 9 — Productor / productora de huevos

- **occupationId:** —
- **Código CNO-11:** —
- **Etiqueta exacta CNO-11:** —
- **Cita literal TodoFP (Source Quote):** «9. Productor / productora de huevos.»
- **Justificación:** «Productor de huevos» es quien gestiona y dirige la producción de huevos de gallinas. El código 6205 cubre «avicultores», que son especialistas en cría y reproducción de aves, pero un «productor de huevos» se enfoca en la producción primaria (ovoposición controlada, manejo de pollas ponedoras) y no necesariamente en la reproducción/engorde de las aves. Son roles distintos que pueden coincidir en la práctica pero son técnicamente diferentes: el productor de huevos gestiona la producción del huevo como producto final, mientras que el avicultor se enfoca en la cría de las aves. No hay código CNO-11 para «productor de huevos» ni «trabajador especializado en producción de huevos».
- **Riesgo (ALTO): forzar 6205 (avicultor): el 6205 es para reproducción/engorde avícola, no para ovoposición comercial (huevos de consumo). No se debe sustituir "productor de huevos" por un "avicultor". Tampoco se debe usar 6110 (agricultura vegetal) ni 6204 (apicultura). No hay equivalencia directa aprobada. Se debe marcar como ausencia explícita.

### 10 — Productor / productora de leche

- **occupationId:** —
- **Código CNO-11:** —
- **Etiqueta exacta CNO-11:** —
- **Cita literal TodoFP (Source Quote):** «10. Productor / productora de leche.»
- **Justificación:** «Productor de leche» es quien gestiona y dirige la producción de leche, generalmente con vacas de ordeño, aunque puede incluir ovejas/cabra. No hay ningún código CNO-11 «approved» que cubra la producción de leche ni los «operadores de equipo de ordeño» ni «trabajadores especiali-zados en producción de leche». Los códigos de ganadería disponibles se limitan a apicultura (6204) y avicultura/cunicultura (6205). No existe un epígrafe genérico de «ganadería» ni de «producción de lácteos».
- **Riesgo (ALTO) — forzar 6110: El 6110 es para actividades agrícolas (vegetales), no ganaderas. La producción de leche es actividad ganadera/animal, no agrícola en el sentido de cultivo vegetal. No se debe sustituir por 6110. Se debe marcar como ausencia explícita.

---

## Ausencias explícitas (sin candidato CNO-11 approved)

| #           | Ocupación TodoFP                 | Causa de ausencia                                                                                                                                         |
| ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4           | Criador / criadora de ganado     | No existe epígrafe CNO-11 genérico de ganadería. Los únicos epígrafes ganjeros son 6204 (apicultura) y 6205 (avicultura), que son específicos de especies |
| 5           | Floricultor / floricultora       | No existe epígrafe «floricultura». 6120 es huertas/invernaderos/viveros/jardín, que no cubre campo abierto de flores ornamentales para venta              |
| 6           | Fruticultor / fruticultora       | No existe epígrafe «fruticultura». 6110 excluye viveros; «jardín» no equivale a huerto frutal a campo abierto                                             |
| 8 (parcial) | Operador de maquinaria ganadera  | 8321 solo cubre «maquinaria agrícola»; falta epígrafe de «maquinaria ganadera»                                                                            |
| 9           | Productor / productora de huevos | No existe epígrafe para producción de huevos ni de «empleados de producción de huevos». 6205 es reproducción avícola, no producción de huevos de consumo  |
| 10          | Productor / productora de leche  | No existe epígrafe de ganadería lechera ni de «producción de leche».                                                                                      |

---

## Criterios de no sustitución

- **No se sustituye «productor» por «peón»**: Los productores (4, 9, 10) son gestores/dirigentes de explotaciones productivas. No son peones ni empleados de servicio. Si no hay candidato, se marca ausencia; no se empuja un candidato de baja categoría.
- **No se sustituye «criador» por «operador»**: El criador (ganadero) gestiona un rebaño/manada; el operador maneja maquinaria. Son roles cualificados distintos.
- **No se sustituye «operador de maquinaria» por un «trabajador agrícola»**: El operario de maquinaria tiene competencia técnica en máquinas, no en cultivo/producción animal. Se asigna solo a 8321 para la parte agrícola y se marca ausencia para la parte ganadera.
- **No se mixta 6110 (agricultura general) con 6120 (horticultura)**: 6110 excluye huertas/invernaderos/viveros; 6120 los cubre. Se respeta la exclusión mutua.

---

_Documento generado para mapeo AGA02M (TodoFP) → CNO-11 (approved)._
