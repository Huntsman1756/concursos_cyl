# Carril A — Auditoría de cobertura SAFE · SALIDA CyL

**Fecha:** 2026-08-27 · **Snapshot auditado:** `20260822085631889-7bbe69380f6d` (el vigente en `public/data/v1/manifest.json`)
**Método:** recomputación desde los datos actuales usando el matcher de producción (`matchOffersForProgram`, runtime-equivalente), cruce con el catálogo oficial CNO-11 (BOE RD 1591/2010, réplica `official-occupations.json`), nomenclatura y notas INE (`cno11_notas.pdf`), tabla oficial de correspondencias CNO-94→CNO-11 del INE (`cno11_correspcno94.xls`) y perfiles TodoFP. **Estándar: fail-closed. Sin fuzzy matching, sin embeddings, sin IA en runtime, sin similitud como equivalencia.** Ningún dataset de producción, alias, relación, snapshot ni frontend ha sido modificado.

---

## A. Executive verdict

> **LIMITED_SAFE_EXPANSION**

- Ofertas: **38 → 105** (3,59 % → 9,92 %). El salto es real pero **muy concentrado**: un único cluster ("ASISTENTES DOMICILIARIOS" → CNO 5710) aporta **59 de las 67** ofertas nuevas (88 %).
- Amplitud: **+3 programas (2→5)** y **+2 familias (2→4)**, con evidencia oficial limpia. Es una mejora clara pero no cambia la percepción global de utilidad del producto.
- **Cero candidatos SAFE de tipo B** (nueva relación FP↔CNO): todos los targets exactos restantes son profesiones universitarias (terapeutas ocupacionales, fisioterapeutas, enfermeros, médicos, veterinarios) o CNO sin programa FP que las incorpore en sus perfiles oficiales.
- Los títulos de mayor volumen fallan la auditoría por ambigüedad real o falta de concordancia oficial publicable: AUXILIARES DE ENFERMERÍA (42, unión 5611/5612), CUIDADORES…EN INSTITUCIONES (55), COCINEROS EN GENERAL (41), ALBAÑILES (19, rechazado por la propia auditoría one-word del proyecto), CAMAREROS (12).

---

## B. Baseline (recalculada; coincide exactamente con la referencia conocida)

| Métrica | Valor |
|---|---:|
| totalOffers | 1058 |
| matchedOffers | 38 (3,59 %) |
| approvedFpCnoRelations | 264 |
| relationsWithMatchedOffers | 3 (`SAN21\|5611`, `SAN21\|5612`, `EOC01M\|7111`) |
| totalPrograms | 187 |
| programsWithMatchedOffers | 2 (SAN21, EOC01M) |
| totalFamilies | 22 |
| familiesWithMatchedOffers | 2 (SAN, EOC) |
| approvedAliases | 21 |
| distinctCnoWithMatchedOffers | 3 (5611, 5612, 7111) |
| provincias con ofertas | 9 (todas CyL + "Otra" sin cubrir) |

Artefacto reproducible: `coverage-baseline.json` (script `scripts/analysis/carrilARecompute.ts`).

---

## C. Universo unmatched

```
unmatchedOffers:            1020
distinctRawTitles:          361
distinctNormalizedTitles:   361
clusters (fold léxico género/número): 361   ← cada título ECYL ya está canónico; no hay variantes morfológicas adicionales
clusters con >=2 ofertas:   81
clusters con >=5 ofertas:   10
```

Artefacto: `unmatched-title-clusters.json`. Solo se agruparon variantes léxicas/descriptivas (género, número, puntuación); **ninguna asignación de CNO por similitud**.

Dato estructural clave: los títulos de oferta provienen del listado canónico de ocupaciones del ECYL, en su mayoría etiquetas **de estilo CNO-96** ("X, en general"), no rubricas CNO-11 literales.

---

## D. SAFE

```
SAFE alias candidates (tipo A):        5
SAFE FP-CNO new-relation (tipo B):     0
SAFE offers unlocked:                  67 (38 -> 105)
```

Cada candidato con bloque de evidencia completo e ID estable en `coverage-safe.json`:

| ID | Alias oferta | CNO-11 | Vía evidencia | Ofertas |
|---|---|---|---|---:|
| SAFE-01-AD-5710 | asistentes domiciliarios | 5710 Trabajadores de los cuidados personales a domicilio | Correspondencia oficial INE CNO-94→11 **1:1** (5113→5710) + notas INE 5710 | 59 |
| SAFE-02-PC-9602 | peones de la construcción de edificios | 9602 (rúbrica idéntica) | BOE RD 1591/2010 identidad literal + INE 9602→9602 1:1 | 3 |
| SAFE-03-PF-9543 | peones forestales | 9543 Peones forestales y de la caza | INE 9440→9543 (origen 1:1; la otra entrada 9450 "pesca" incompatible con el título) | 3 |
| SAFE-04-PA-9530 | peones agropecuarios | 9530 (rúbrica idéntica) | BOE identidad literal + INE 9430→9530 1:1 | 1 |
| SAFE-05-ME-7191 | mantenedores de edificios | 7191 (rúbrica idéntica) | BOE identidad literal + notas INE excluyen 7191 de 7121 explícitamente | 1 |

Todos son **tipo A**: el FP↔CNO ya está aprobado (SSC01M→5710, EOC01B→9602/7191, AGA03B→9543/9530); solo falta el alias oferta→CNO. Simulación con el matcher de producción (`carrilAImpact.ts`): coincidencias = exactamente los clusters previstos, **cero sobre-coincidencias** en las 1058 ofertas.

### Por qué NO es SAFE lo demás (casos principales)

- **ALBAÑILES (19)** → 7121: rúbrica oficial idéntica, PERO la auditoría one-word del proyecto (`analysis/fp_one_word_publication_reviews.json`) rechazó su publicación (2/22 ofertas contradictorias/mixed-role, p. ej. técnico de mantenimiento de granja "albañilería y solados") y el alias monotoque-token exige tupla de auditoría por programa. **AMBIGUOUS**.
- **AUXILIARES DE ENFERMERÍA (42)** → 5611 vs 5612: unión de dos categorías oficiales; las notas INE separan hospitalaria/atención primaria. **AMBIGUOUS**.
- **COCINEROS/CAMAREROS/PINCHES/MECÁNICOS "en general"** → 5110/5120/9310/7401: la rúbrica CNO-11 oficial es distinta ("asalariados", "ayudantes", "ajustadores"); la equivalencia exigiría una concordancia oficial CNO-96→CNO-11 que **no existe públicamente** (INE solo publica CNO-94→CNO-11 y CNO-11→CIUO-08; verificadas ambas tablas). **NO_EVIDENCE**.
- **TERAPEUTAS OCUPACIONALES (71), FISIOTERAPEUTAS (56), ENFERMEROS (65+12), MÉDICOS (39), VETERINARIOS (2)**: rúbricas oficiales exactas CNO-11, pero son profesiones tituladas de universidad; ningún programa FP las incorpora → no desbloquean nada en el grafo FP. **REJECT para este carril**.
- **PEONES GANADEROS "en general" (9)** → 9520: única tras quitar el sufijo, pero 9520 no está en el catálogo revisado ni vinculado a FP, y ningún perfil TodoFP de AGA lo enuncia. **NO_EVIDENCE (tipo B)**.

---

## E. Ceiling

| Métrica | Baseline | SAFE aliases | SAFE total (=aliases) | Delta SAFE | Techo NO-SAFE* |
|---|---:|---:|---:|---:|---:|
| Ofertas | 38 | 105 | **105** | +67 | 290 |
| % ofertas | 3,59 % | 9,92 % | 9,92 % | +6,33 pp | 27,41 % |
| Relaciones con ofertas | 3 | 8 | 8 | +5 | ~14 |
| Programas con ofertas | 2 | 5 | 5 | +3 | 11 |
| Familias con ofertas | 2 | 4 | 4 | +2 | 6 |
| CNO representadas | 3 | 8 | 8 | +5 | ~13 |
| Provincias representadas | 9 | 9 | 9 | 0 | 9 |

\* *Informativo, NO recomendado*: aceptar los 8 clusters AMBIGUOUS/NO_EVIDENCE cuyo target ya está vinculado a FP (+185 ofertas). Detalle en `coverage-ambiguous.json`.

No hay SAFE tipo B, por lo que "SAFE aliases" y "SAFE total" coinciden.

---

## F. Top SAFE candidates

| Rank | Cluster | CNO | Tipo | Ofertas | Prog. nuevos | Familias nuevas | Evidencia | SAFE |
|---:|---|---|---|---:|---:|---:|---|---|
| 1 | ASISTENTES DOMICILIARIOS | 5710 | ALIAS | 59 | SSC01M | SSC | INE corr. 1:1 + notas INE | ✅ |
| 2 | PEONES DE LA CONSTRUCCIÓN DE EDIFICIOS | 9602 | ALIAS | 3 | EOC01B | — | BOE rúbrica idéntica + INE 1:1 | ✅ |
| 3 | PEONES FORESTALES | 9543 | ALIAS | 3 | AGA03B | AGA | INE corr. origen 1:1 | ✅ |
| 4 | PEONES AGROPECUARIOS | 9530 | ALIAS | 1 | — | — | BOE rúbrica idéntica + INE 1:1 | ✅ |
| 5 | MANTENEDORES DE EDIFICIOS | 7191 | ALIAS | 1 | — | — | BOE rúbrica idéntica + exclusión INE | ✅ |

El candidato #1 produce mucha cobertura con un solo alias (59 ofertas / 7 provincias / nueva familia sociosanitaria).

---

## G. Ambiguous / rejected

Clasificación completa de los 361 clusters en `coverage-candidates.json` (IDs estables `CAND:<foldKey>`): **5 SAFE · 6 AMBIGUOUS · 4 REJECT · 346 NO_EVIDENCE** (la inmensa mayoría: títulos sin ninguna rúbrica oficial identificable ni concordancia publicable). Principales rechazos con coste de oportunidad:

| Cluster | Ofertas | CNO posibles | Motivo | Qué faltaría para SAFE |
|---|---:|---|---|---|
| CUIDADORES…EN INSTITUCIONES | 55 | 5629/5611 | Notas INE envían cuidados institucionales supervisados a 5611/5629 sin discriminar | Subdivisión documental por oferta (centro vs domicilio) |
| AUXILIARES DE ENFERMERÍA | 42 | 5611/5612 | Unión de dos categorías oficiales | Homologado solo con campo CNO en origen (ECYL no lo publica) |
| COCINEROS, EN GENERAL | 41 | 5110 | Rúbrica oficial es "Cocineros asalariados"; etiqueta CNO-96 | Concordancia oficial CNO-96→CNO-11 (no publicada por INE) |
| ALBAÑILES | 19 | 7121 | Auditado uno a uno: 2/22 contradictorias; alias de un token | Mecanismo approved_single_token + re-auditoría por oferta |
| CAMAREROS, EN GENERAL | 12 | 5120 | Como cocineros | idem |
| PEONES AGRÍCOLAS, EN GENERAL | 6 | 9511/9512 | Partición oficial por huertas/viveros | idem |
| PINCHES DE COCINA | 5 | 9310 | Rúbrica oficial "Ayudantes de cocina" | idem |
| MECÁNICOS AUTOMOCIÓN, EN GENERAL | 5 | 7401 | Rúbrica oficial distinta | idem |

---

## H. Programas uncovered (§13)

```
totalUncoveredPrograms (sin relación FP↔CNO aprobada): 57
```

Escaneo de esta auditoría (`program-uncovered-scan.json`): los 57 tienen perfiles TodoFP capturados (494 salidas profesionales), **0 con identidad de rúbrica oficial CNO-11** hacia ninguna ocupación del catálogo. Clasificación:

- `EVIDENCE_FOUND`: **0**
- `AMBIGUOUS`: **0**
- `NO_EVIDENCE`: **57** (15 ya documentados como `reviewed-no-publishable-match` en olas previas — `fp_coverage_research_outcomes.json`; 42 escaneados ahora con el mismo resultado)
- `NOT_APPLICABLE`: 0 (todos tienen perfil oficial; simplemente no alcanza el estándar)

Conclusión: **no hay relaciones FP→CNO nuevas defendibles hoy**; el cuello de botella real es el lane A (alias), no el lane B.

---

## I. Evidence quality (sobre los 5 SAFE)

| Fuente | Nº SAFE soportados |
|---|---:|
| INE (tabla correspondencias + nomenclatura/notas CNO-11) | 5 |
| BOE (RD 1591/2010, rúbrica literal) | 3 |
| SEPE | 0 |
| JCyL / ECYL | 0 |
| TodoFP / INCUAL | 0 (solo contexto tipo B; ningún tipo B SAFE) |

URLs primarias citadas en `coverage-safe.json`: `ine.es/daco/daco42/clasificaciones/cno11_correspcno94.xls`, `cno11_notas.pdf`, `boe.es/eli/es/rd/2010-11-26/1591`. Nota de trazabilidad: la extracción local `official-occupations.json` (502 entradas, pipeline verificado del repo) coincide rúbrica a rúbrica con la nomenclatura INE descargada en vivo durante la auditoría.

---

## J. Adversarial review

Segunda pasada independiente (intento activo de refutación, incluyendo revisión de las descripciones de las 67 ofertas y búsqueda de colisiones de frase delimitada contra las 1058):

```
initial SAFE:   5   (albañiles y cuidadores-instituciones nunca entraron: caídos por reglas estrictas en primera pasada)
downgraded:     0
rejected:       0
final SAFE:     5
proposal: modelo principal (regla de identidad de rúbrica oficial + correspondencia INE 1:1)
review:   modelo independiente gemma4 (subagente nan-bulletin-reviewer, prompt-only) → ACCEPT_SAFE ×5 + revisión adversarial propia por oferta
final:    5 SAFE confirmados
```

La regla que sí cayó en la pasada adversarial fue **ALBAÑILES**: descartada antes de la fase final precisamente por la auditoría one-word preexistente del proyecto.

---

## K. Recommendation

> **OPEN_FEATURE_COVERAGE_EXPANSION**

Justificación cuantitativa (no por %):

- **+3 programas** pasan de 0 a evidencia laboral visible: SSC01M (59 ofertas), EOC01B (4), AGA03B (4) — y SAN21/EOC01M se consolidan.
- **+2 familias** (SSC Servicios Socioculturales, AGA Agraria) → 4/22.
- **+5 CNO** representadas (3→8) y **+5 relaciones** con ofertas (3→8), todas vía el mecanismo ya probado de `title_alias_exact/phrase` con matchPolicy `strict_multiword` (los 5 alias tienen ≥2 tokens: no requiere tocar el pipeline one-word).
- Diversidad territorial: 7 provincias cubiertas por el lane SAFE.
- Riesgo de falsos positivos: mínimo (identidad de rúbrica oficial o correspondencia 1:1 verificada a nivel de código; cero sobre-coincidencias empíricas).
- Coste: 5 filas de alias con evidencia — ínfimo comparado con el valor concurso (la familia sociosanitaria/SAAD, central en CyL, aparece por primera vez).

Matiz honesto: es una expansión **limitada y concentrada** (88 % de las ofertas nuevas en un alias). Si el criterio fuera solo amplitud de familias, quedaría lejos del ideal 3→9; aquí se abre por evidencia impecable y coste casi nulo, no por volumen.

---

## Pregunta final

> ¿La versión con exclusivamente los candidatos SAFE parecería claramente más útil y completa sin parecer menos rigurosa?

**YES**

Pasa de 2 a 5 programas y de 2 a 4 familias con evidencia laboral, y la familia sociosanitaria (atención a dependencia en el domicilio, eje estratégico de CyL) muestra oferta real por primera vez (59 puestos, 7 provincias). Nada de esto sacrifica rigor: los 5 aliases se defienden públicamente con rúbrica oficial idéntica o correspondencia INE 1:1, superan una segunda pasada adversarial independiente, y los casos voluminosos ambiguos (aux. enfermería, cocineros, albañiles) siguen explícitamente fuera, con constancia documentada del porqué. Un jurado vería más producto cubierto y la misma política fail-closed intacta.
