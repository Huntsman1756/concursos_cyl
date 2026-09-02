# Catálogo de centros (/donde-estudiar) — semántica contractual de filtros

Estado: **CERRADO contractualmente** · Fase de pre-implementación (sin React).
Snapshot activo: `20260830120000000-8c6c79fbd2a1` (`qualityStatus: passed`).
Unidad contractual de la UI: **fila única `centerCode:programKey`** ("opción formativa").

Evidencia reproducible: `scripts/analysis/auditPrototypeData.mjs` →
`analysis/prototype-data-audit.json`.

---

## 1. Pipeline contractual (unidad estadística)

```
1294 raw trainingOfferings           (trainingOfferings.json, recordCount 1294)
  → resolver center   (centers.json por centerCode)          → 229 centros
  → resolver program  (programs.json por programKey)         → 187 programas
  → agregar por centerCode:programKey                        → 1293 filas únicas
  → por fila: modalities[] (unión), teachingTypes[] (unión)
  → filtros sobre el universo de 1293 filas
  → paginación (50/página global; contextual sin paginación si cabe)
```

| Métrica | Valor | Unidad |
| --- | --- | --- |
| RAW_TRAINING_OFFERINGS | 1294 | registro raw de la fuente JCyL |
| VALID_RESOLVED_OFFERINGS | 1294 | offering con centro y programa resueltos (0 sin resolver) |
| UNIQUE_CENTER_PROGRAM_ROWS | 1293 | fila única `centerCode:programKey` |
| COLLAPSED_RECORD_COUNT | 1 | par de registros raw colapsados en una fila |

Identidad oficial más fina (`trainingOfferingIdentity =
programKey:centerCode:modality:teachingType:centerOwnership`) existe a nivel de
schema, pero el producto presenta deliberadamente `centerCode:programKey`
(coalescencia del explorador, igual que hace la implementación de producción en
`src/features/centers/CentersExplorerPage.tsx`).

## 2. Colapso identificado (único caso)

| Campo | Valor |
| --- | --- |
| centerCode | `47011115` |
| centerName | RÍO DUERO |
| province / locality | Valladolid / Valladolid |
| programKey | `AFD02M` |
| programTitle | Guía en el medio natural y de tiempo libre |

| | registro 1 | registro 2 |
| --- | --- | --- |
| offeringId | `AFD02M:47011115:on_site:concerted:private` | `AFD02M:47011115:on_site:private:private` |
| modality | on_site | on_site |
| teachingType | **concerted** | **private** |
| centerOwnership | private | private |
| level | intermediate | intermediate |

**Por qué la UI muestra una única opción**: es el mismo centro (mismo
`centerCode`, misma dirección/localidad), el mismo ciclo (`programKey`) y la
misma modalidad; solo difiere el régimen de titularidad publicado en la fuente.
Presentar dos filas duplicaría visualmente la misma plaza formativa y
contaminaría los contadores. La fila agregada muestra titularidad
"Concertada · Privada" (multivalor) y el conteo de faceta Titularidad suma esta
fila **una vez en cada faceta** (es el único caso multivalor del snapshot; por
eso Σ facetas titularidad = 1294 > 1293 filas).

## 3. Semántica de filtros (contrato por filtro)

Reglas globales: UNIT de todo conteo = **filas centerCode:programKey**;
FACET_COUNT_RULE = "número de filas del universo agregado que hacen match tras
aplicar el resto de filtros activos"; los valores sin dato en la fuente nunca se
inventan y las opciones de filtro solo se muestran si existen en la copia.

| DISPLAY_NAME | SOURCE_FIELD | SOURCE_RESOURCE | UNIT_OF_ANALYSIS | MATCH_RULE | FACET_COUNT_RULE |
| --- | --- | --- | --- | --- | --- |
| Buscar | `center.centerName`, `center.locality`, `center.province`, `center.address`, `program.programTitle`, `program.programKey`, `program.familyName`, `program.familyCode` | centers + programs (join por filas) | fila centerCode:programKey | substring normalizada (NFD sin diacríticos, lowercase, puntuación→espacio) sobre los campos concatenados | filas que hacen match (conteo dinámico) |
| Provincia | `center.province` | centers | fila | igualdad exacta con `center.province` | filas por provincia |
| Modalidad | `offering.modality` agregado en `modalities[]` | trainingOfferings | fila | `filter ∈ row.modalities[]` | filas cuyo `modalities[]` contiene el valor |
| Titularidad | `offering.teachingType` agregado en `teachingTypes[]` | trainingOfferings | fila | `filter ∈ row.teachingTypes[]`; valores public/concerted/private | filas cuyo `teachingTypes[]` contiene el valor (multivalor) |
| Nivel | `program.level` | programs | fila | igualdad exacta (basic / intermediate / higher / specialization) | filas por nivel del programa |
| Familia profesional | `program.familyCode` (+`familyName`) | programs | fila | igualdad exacta de `familyCode` | filas por familia del programa |
| Tipo de centro | `center.centerOwnership` | centers | fila | igualdad exacta (education / municipality / agriculture / private) | filas por ownership del centro |

Prohibiciones: no mezclar `teachingType` (Titularidad) con `centerOwnership`
(Tipo de centro); no presentar `centerOwnership` como titularidad ni
viceversa; no crear opciones de filtro sin filas reales que las respalden.

## 4. Facet counts del snapshot activo (UNIT explícita)

### ROWS_BY_PROVINCE — UNIT: fila centerCode:programKey

| Provincia | Filas | Centros únicos |
| --- | --- | --- |
| Ávila | 85 | 20 |
| Burgos | 202 | 25 |
| León | 222 | 40 |
| Palencia | 88 | 15 |
| Salamanca | 178 | 38 |
| Segovia | 78 | 14 |
| Soria | 55 | 13 |
| Valladolid | 298 | 49 |
| Zamora | 87 | 15 |
| **Total** | **1293** | **229** |

La columna "Centros únicos" (UNIT: centro `centerCode`) existe para NO mezclar
opciones formativas con centros (1293 filas ≠ 229 centros).

### ROWS_BY_MODALITY — UNIT: fila centerCode:programKey (multivalor)

| Modalidad | Filas |
| --- | --- |
| on_site (Presencial) | 1204 |
| distance (A distancia) | 89 |
| mixed | 0 (no existe en la copia) |
| unknown ("Sin modalidad publicada") | 0 (no existe en la copia) |

Suma 1293 (cada fila tiene exactamente una modalidad publicada en esta copia).

### ROWS_BY_TEACHING_TYPE (Titularidad) — UNIT: fila centerCode:programKey (multivalor)

| Titularidad | Filas |
| --- | --- |
| public (Pública) | 915 |
| concerted (Concertada) | 257 |
| private (Privada) | 122 |
| **Suma** | **1294** (1 fila doble: RÍO DUERO AFD02M) |

### ROWS_BY_LEVEL — UNIT: fila centerCode:programKey

| Nivel | Filas | Etiqueta ciudadana |
| --- | --- | --- |
| basic | 202 | Grado Básico |
| intermediate | 465 | Grado Medio |
| higher | 582 | Grado Superior |
| specialization | 44 | Curso de especialización |

### ROWS_BY_FAMILY — UNIT: fila centerCode:programKey

22 familias; principales: SAN 138 · ADG 157 · ELE 137 · IFC 133 · COM 81 ·
HOT 91 · TMV 91 · SSC 86 · FME 58 · IMP 59 · AFD 43 · IMA 52 · AGA 37 ·
IMS 28 · INA 23 · EOC 18 · QUI 18 · MAM 17 · ENA 8 · SEA 7 · TCP 7 · ARG 4
(suma 1293).

### ROWS_BY_CENTER_OWNERSHIP — UNIT: fila centerCode:programKey

| Tipo de centro | Filas | Centros únicos |
| --- | --- | --- |
| education (Centro educativo) | 888 | 138 |
| private (Centro privado) | 378 | 82 |
| agriculture (Centro de formación agraria) | 22 | 8 |
| municipality (Centro municipal) | 5 | 1 |

### Regla multivalor (E)

Una fila puede pertenecer a **varias facetas simultáneamente** (aquí: la fila
RÍO DUERO × AFD02M tiene `teachingTypes=[concerted, private]`). Por tanto:

- NO se exige `sum(facet counts) == total rows`.
- Cada conteo representa **filas center-program únicas** que hacen match.
- `filter modality=distance` = nº de filas cuyo `modalities[]` contiene
  `distance` (89) — NO nº de offerings raw con `distance`.

## 5. UNKNOWN / NULL (G)

| Campo | Valores en la copia | Política UI |
| --- | --- | --- |
| modality | on_site 1204 filas · distance 89 · mixed 0 · unknown 0 | `unknown==0` → NO se muestra como opción de filtro visible. Soporte futuro: resultado "Modalidad no publicada"; filtro futuro "Sin modalidad publicada". Prohibido "Desconocida". |
| teachingType | 0 filas sin dato (1294 raw todos con teachingType) | Sin opción "Sin titularidad publicada" hoy; misma regla si apareciera. |
| modality "mixed" | 0 | Si apareciera: etiqueta "Mixta". |
| offer.locality null | 91 ofertas | Mostrar solo provincia; sin localidad inventada ni placeholder llamativo. |
| center.website | 1 centro sin web (IES FUENTESNUEVAS 24016584) | Sin CTA web para ese centro (solo "Cómo llegar"). |

## 6. Presentación de conteos en pantalla

- Global: "1–50 de 1293 opciones formativas · 229 centros representados"
  (UNIT fila + UNIT centro, en ese orden, separadas).
- Contextual por ciclo: "1–45 de 45 opciones formativas · 45 centros · 9
  provincias" (para ADG02S, valores reales del snapshot).
- Prohibido contar centros cuando la unidad es la opción formativa y
  viceversa; cada número lleva su unidad implícita por redacción contractual.
