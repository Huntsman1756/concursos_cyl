# Prototype data integrity audit — SALIDA CyL

Fase: pre-implementación (sin React, sin tocar `src/`, `data/`, `public/data/`,
manifest ni freeze). Checkpoint de entrada:
**b62532d766020b4f80d0303c0169196499a150bc** —
`docs(design): reconcile complete SALIDA product prototype`.

Snapshot activo: `20260830120000000-8c6c79fbd2a1` · manifest `qualityStatus:
passed` · 22 recursos · verificación SHA-256 de recursos: **OK**.

Scripts reproducibles:

- `scripts/analysis/auditPrototypeData.mjs` → `analysis/prototype-data-audit.json`
- `scripts/analysis/auditCenterLinks.mjs` → `analysis/centers-link-audit.json` / `.md`

Deterministic checks: **14/14 PASS** (incluye aserciones estáticas sobre los
HTML corregidos).

---

## 1. GLOBAL OFFERS — reconciliación 1033 vs 1058 (BLOCKER, cerrado)

| Dato                                                 | Valor                                                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Valor del prototipo (`offers/global.html` L171/L430) | `1–12 de 1033 ofertas`                                                                                                                |
| **SOURCE_TRUTH (snapshot activo)**                   | **1058** (`job-offers.json` length 1058, sha256 `decd3bcf…` = manifest; `offer-evidence.json` records 1058, `counts.offerCount` 1058) |
| Causa                                                | **WRONG_RESOURCE**                                                                                                                    |
| Corregido                                            | Sí — prototipo y `screen-contracts.md` ahora dicen `1–12 de 1058 ofertas`                                                             |

### Demostración

| Fuente                                                                    | Registros | sha256                                                               |
| ------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------- |
| `public/data/v1/job-offers.json` (raíz legacy)                            | **1033**  | `5214fc9a…`                                                          |
| `public/data/v1/snapshots/20260830120000000-8c6c79fbd2a1/job-offers.json` | **1058**  | `decd3bcf…` (igual al manifest y a `20260822085631889-fc9bf2ba23f9`) |
| `manifest.json → resourceSnapshots.jobOffers.recordCount`                 | 1058      | —                                                                    |
| `offerEvidence.counts.offerCount`                                         | 1058      | —                                                                    |

- El fichero raíz `public/data/v1/job-offers.json` es un **remanente legacy** de
  una era de snapshot anterior (pre-2026-08-22). Su copia por registro lleva
  `recordCount: 1033` en su provenance.
- `scripts/release/prepareRuntimeData.ts:34-39` declara esos 4 ficheros raíz
  (`centers.json`, `job-offers.json`, `programs.json`,
  `training-offerings.json`) como `LEGACY_RUNTIME_ROOT_FILES` y **los excluye
  del runtime de producción**: el runtime solo sirve los recursos
  direccionados por el manifest (snapshots inmutables).
- Diferencia de contenido: 25 ofertas presentes solo en el snapshot activo
  (1058−1033).

### Clasificación de causas evaluadas

| Hipótesis                  | Veredicto                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **WRONG_RESOURCE**         | **CONFIRMADA** — el prototipo leyó el recurso raíz legacy (1033) en vez del recurso activo del manifest (1058) |
| ACCIDENTAL_FILTER          | Descartada — sin filtros el catálogo activo da 1058                                                            |
| WRONG_SNAPSHOT             | Descartada — el snapshot activo es único en el manifest                                                        |
| UNAUTHORIZED_DEDUPLICATION | Descartada — no hay deduplicación en el pipeline; 1058 offerIds únicos                                         |
| PARSE_ERROR                | Descartada — JSON válido y registros íntegros                                                                  |
| PROTOTYPE_EXTRACTION_BUG   | Factor contribuyente (el prototipo fijó a mano el número)                                                      |

### Búsqueda global `1033` / `1058` (clasificación de apariciones)

- `public/data/v1/job-offers.json` — 1033 (recurso legacy NO servido en
  runtime): **trampa documentada**, no dato contractual.
- `scripts/data/buildSnapshots.test.ts` (L424, L445, L467) — fixture de test
  que usa 1033/1293 como valores de una era anterior; no afecta a producción.
- `docs/contest/*` — 1058 (coverage-freeze, technical-evidence,
  release-evidence): **dato correcto del producto**.
- `docs/design/prototypes/product/offers/global.html` + `screen-contracts.md` —
  **1033 corregido a 1058** en esta fase.
- Otras apariciones de dígitos (fixtures educabase/provincial-contracts) —
  no relacionadas (10332 €, latitudes, ids).

Contrato de paginación resultante: 12/página → **89 páginas**; última página
`1057–1058 de 1058`.

---

## 2. REVIEWED OFFER SEMANTICS (recalculado desde bytes)

| Métrica                                             | Valor    | Unidad                                   |
| --------------------------------------------------- | -------- | ---------------------------------------- |
| TOTAL_OFFERS                                        | **1058** | oferta única (`offerId`)                 |
| UNIQUE_REVIEWED_FP_RELATED_OFFERS                   | **138**  | oferta única con ≥1 relación FP revisada |
| OFFER_FP_RELATION_COUNT                             | **196**  | relaciones oferta→(ciclo, ocupación)     |
| UNIQUE_PROGRAM_OCCUPATION_KEYS_WITH_REVIEWED_OFFERS | **139**  | par `programKey                          | occupationId` distinto con ≥1 oferta revisada |
| PROGRAM_KEYS_WITH_REVIEWED_OFFERS                   | 92       | ciclo                                    |
| OCCUPATION_IDS_WITH_REVIEWED_OFFERS                 | 105      | ocupación                                |

Concepto ciudadano principal: **"ofertas con relación FP revisada"** =
OFERTAS ÚNICAS (138). El número de **relaciones** (196) se documenta por
separado y nunca se muestra como si fueran ofertas. Distribución de relaciones
por oferta: 116 ofertas ×1, 13 ×2, 3 ×4, 2 ×5, 4 ×8 = 196.

Sidecar `offerEvidence.counts` consistente al 100% con el recálculo.

---

## 3. CENTER AGGREGATION

RAW 1294 → RESOLVED 1294 (0 sin resolver) → **UNIQUE 1293** → COLLAPSED **1**.
Detalle completo en `analysis/catalog-filter-semantics.md` §2 (RÍO DUERO
`47011115` × `AFD02M`: dos raw records que solo difieren en teachingType
concerted/private → una fila con titularidad multivalor).

---

## 4. FACET COUNTS (UNIT explícita)

Ver `analysis/catalog-filter-semantics.md` §4. Resumen: provincias 1293 filas /
229 centros; modalidad on_site 1204 · distance 89; titularidad public 915 ·
concerted 257 · private 122 (Σ1294, 1 fila multivalor); nivel basic 202 ·
intermediate 465 · higher 582 · specialization 44; ownership education 888 ·
private 378 · agriculture 22 · municipality 5.

---

## 5. PROTOTYPE DATA AUDIT (pantalla a pantalla)

Estado global: **PASS** (0 failures tras correcciones; las cifras se
recalcularon desde bytes, no se confiaron al prototipo).

| SCREEN                                                                               | Cifra prototipo                                  | Verdad snapshot                                                                                                                                     | Estado                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| HOME · ciclos oficiales                                                              | 187                                              | 187 programas                                                                                                                                       | OK                                               |
| HOME · ofertas con relación FP revisada                                              | 138                                              | 138 ofertas únicas                                                                                                                                  | OK                                               |
| HOME · centros                                                                       | 229                                              | 229 centros                                                                                                                                         | OK                                               |
| HOME · ejemplo ADG02S: 45 centros, 9 provincias (Valladolid 10 · León 9 · Burgos 7…) | 45/9/10/9/7                                      | 45 filas; Ávila 4 · Burgos 7 · León 9 · Palencia 3 · Salamanca 7 · Segovia 2 · Soria 1 · Valladolid 10 · Zamora 2                                   | OK                                               |
| FP DETAIL ADG02S · profesiones                                                       | 4 (CNO 4111/4113/4123/4223)                      | 4 relaciones `official_output`                                                                                                                      | OK                                               |
| FP DETAIL ADG02S · ofertas revisadas                                                 | 2                                                | 2 (`1285665634571` Zamora 23/07 · `1285672565954` Palencia 20/08)                                                                                   | OK                                               |
| FP DETAIL ADG02S · centros                                                           | 45                                               | 45 filas                                                                                                                                            | OK                                               |
| OCCUPATION CNO 5611 · FP relacionada                                                 | 1 (SAN21)                                        | 1 (SAN21)                                                                                                                                           | OK                                               |
| OCCUPATION CNO 5611 · ofertas revisadas                                              | 34                                               | 34                                                                                                                                                  | OK                                               |
| OCCUPATION CNO 5611 · centros                                                        | 34                                               | 34 filas SAN21                                                                                                                                      | OK                                               |
| ZERO STATE CNO 3820 · FP revisadas                                                   | 2 (DAM presencial + distancia)                   | 2 × `reviewed_relationship`                                                                                                                         | OK                                               |
| ZERO STATE CNO 3820 · ofertas                                                        | 0                                                | 0                                                                                                                                                   | OK                                               |
| GLOBAL OFFERS · total                                                                | ~~1033~~                                         | **1058**                                                                                                                                            | **CORREGIDO**                                    |
| GLOBAL OFFERS · con FP relacionada                                                   | 138                                              | 138                                                                                                                                                 | OK                                               |
| GLOBAL OFFERS · primera página                                                       | 12 ofertas del 20/08/2026                        | coincide con el orden runtime (publishedAt desc, title, offerId)                                                                                    | OK                                               |
| CONTEXTUAL OFFERS ADG02S                                                             | 1–2 de 2                                         | 2                                                                                                                                                   | OK                                               |
| CENTERS GLOBAL · opciones formativas                                                 | 1293                                             | 1293 filas agregadas                                                                                                                                | OK                                               |
| CENTERS GLOBAL · centros                                                             | 229                                              | 229                                                                                                                                                 | OK                                               |
| CENTERS CONTEXTUAL ADG02S · provincias                                               | 4/7/9/3/7/2/1/10/2                               | idéntico                                                                                                                                            | OK                                               |
| CENTERS GLOBAL · 10 filas de ejemplo                                                 | CIFP San Gabriel…Río Duero                       | todas reales; **3 enlaces `AGL01M` → ciclo inexistente**                                                                                            | **CORREGIDO** (INA02M)                           |
| COMPARE · España IFC03S 2019-20 · año 4                                              | 25.423 / 18.872 / 22.000 / 25.537 / 31.400 €     | idéntico (famprof_3_08)                                                                                                                             | OK                                               |
| COMPARE · Castilla y León "grado superior"                                           | ~~21.069 / 16.614 / 18.968 / 21.467 / 24.934 €~~ | **22.414 / 16.405 / 19.574 / 23.035 / 28.771 €** (ccaa_3_07)                                                                                        | **CORREGIDO** (era Grado Medio, tabla ccaa_2_07) |
| MORE TRAINING · cursos ECYL                                                          | 791                                              | 791                                                                                                                                                 | OK                                               |
| MORE TRAINING · certificados                                                         | 583                                              | 583                                                                                                                                                 | OK                                               |
| MORE TRAINING · convocatorias abiertas                                               | 4                                                | 4 (accessType=open ∧ deadline ≥ copia 22/08: ATS/DUE 18 plazas · AT Laboratorio 8 · Farmacéuticos 50 · ITOP 4 — todas Valladolid, plazo 24/08/2026) | OK                                               |
| OPEN DATA · recursos                                                                 | 22                                               | 22 claves del manifest                                                                                                                              | OK                                               |
| OPEN DATA · relaciones FP↔ocupación                                                  | 264                                              | 264 filas del grafo                                                                                                                                 | OK                                               |
| OPEN DATA · SHA-256 CSV                                                              | `88f7b737…`                                      | idéntico (verificado)                                                                                                                               | OK                                               |
| METHODOLOGY · recursos/SEPE                                                          | no visible                                       | 22 recursos · 116 registros SEPE (referencia)                                                                                                       | n/a                                              |

---

## 6. EXAMPLE AUDIT

| Ejemplo                                                                                                                                                       | Pantalla                      | Clasificación                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------- |
| ADG02S ↔ CNO 4111 (official_output, revisada 12/08/2026) + 45 centros                                                                                         | HOME                          | **REVIEWED_RELATION_CONFIRMED**                |
| Oferta `1285665634571` (Zamora, 23/07/2026, "Empleados administrativos de contabilidad, en general")                                                          | HOME · FP · Offers contextual | **REVIEWED_RELATION_CONFIRMED**                |
| Oferta `1285672565954` (Palencia, 20/08/2026)                                                                                                                 | FP · Offers contextual        | **REVIEWED_RELATION_CONFIRMED**                |
| CNO 5611 ↔ SAN21 + 34 ofertas + 34 centros (incl. `1285619684957` Noceda del Bierzo 17/03 · `1285637783304` Valderas 09/05 · `1285641461864` Briviesca 21/05) | OCCUPATION                    | **REVIEWED_RELATION_CONFIRMED**                |
| 12 ofertas página 1 global (todas reales del orden runtime; 3 con relación revisada)                                                                          | GLOBAL OFFERS                 | REAL_SOURCE_RECORD_CONFIRMED                   |
| 10 filas del explorador (modalidad/titularidad/ownership verificados por fila)                                                                                | CENTERS                       | REAL_SOURCE_RECORD_CONFIRMED                   |
| 7 centros contextuales ADG02S                                                                                                                                 | CENTERS CONTEXTUAL            | REAL_SOURCE_RECORD_CONFIRMED                   |
| Cursos ECYL `1285672303296` (20 plazas, 60 h) y `1285563516870` (30 plazas)                                                                                   | MORE TRAINING                 | REAL_SOURCE_RECORD_CONFIRMED                   |
| Certificados `ADGD0108` (N3 · 630 h) y `IFCD0110` (N2 · 560 h)                                                                                                | MORE TRAINING                 | REAL_SOURCE_RECORD_CONFIRMED                   |
| Convocatorias `1285666453332` (18) · `1285666480084` (8) · `1285666447460` (50) · `1285666500281` (4)                                                         | MORE TRAINING                 | REAL_SOURCE_RECORD_CONFIRMED                   |
| Valores EDUCAbase IFC03S (España verificados; CyL corregido)                                                                                                  | COMPARE                       | REAL_SOURCE_RECORD_CONFIRMED (tras corrección) |
| "40 primeros de 791" · "60 primeros de 583" · cortes 20/40/60/80 % · "+3 profesiones más"                                                                     | varías                        | PRESENTATION_ONLY                              |

**APPROVED_EXAMPLE_IDS** (contrato para tests de la futura implementación):

```json
[
  "home:example-adg02s",
  "offer:1285665634571",
  "offer:1285672565954",
  "occupation:cno11:5611↔SAN21"
]
```

Ningún ejemplo del prototipo muestra una relación FP↔ocupación sin relación
aprobada/publicada. Estado: **PASS**.

---

## 7. CENTER LINK AUDIT (resumen — detalle en centers-link-audit.md)

Auditado: 2026-09-02 (hora en `analysis/centers-link-audit.json`) · 227 URLs
únicas (228 centros con web · 1 sin web) · 1 petición inicial por URL + sonda
HTTPS para http:// · timeout 15 s · 0 reintentos · sin crawling/bypass.

| Clasificación               | Centros |
| --------------------------- | ------- |
| SOURCE_PUBLISHED_LIVE       | 26      |
| SOURCE_PUBLISHED_REDIRECTED | 175     |
| SOURCE_PUBLISHED_HTTP_ONLY  | 0       |
| BROKEN_HTTP                 | 11      |
| DNS_FAILURE                 | 11      |
| TLS_FAILURE                 | 2       |
| TIMEOUT                     | 0       |
| DOMAIN_PARKED               | 0       |
| CONTENT_MISMATCH            | 3       |
| UNVERIFIED                  | 0       |

| Identidad              | Centros |
| ---------------------- | ------- |
| IDENTITY_CONFIRMED     | 172     |
| IDENTITY_PLAUSIBLE     | 21      |
| IDENTITY_NOT_CONFIRMED | 32      |
| IDENTITY_MISMATCH      | 3       |

**CENTERS_WITH_SAFE_WEBSITE_CTA = 201** (193 «Web del centro» + 8 «Web
publicada en la fuente»). Sin CTA: 27.

Incidencias destacables: 3 dominios publicados en la fuente han sido tomados
por terceros (IES FRANCISCO SALINAS → casino; IES RIBERA DE CASTILLA → spam;
IES VÍA DE LA PLATA-LEÓN → casino); 1 URL fuente malformada en el dataset
(`http://www..fpmilani.com/`, doble punto); HTTPS disponible en el 100 % de las
URLs http:// vivas (HTTP_ONLY = 0).

---

## 8. Correcciones aplicadas a prototipos (solo docs/design)

1. `offers/global.html`: `1–12 de 1033` → `1–12 de 1058` (2 sitios).
2. `centers/explorer.html`: `/formacion/AGL01M` → `/formacion/INA02M`
   (3 tabla + 1 rcard móvil; `AGL01M` no existe en programs.json — enlace
   roto garantizado).
3. `compare/index.html`: panel CyL reetiquetado como grado superior pero con
   valores de Grado Medio (ccaa_2_07) → reemplazados por los valores reales de
   Grado Superior (ccaa_3_07) en lista y tabla técnica, con anchos de barra
   reescalados (71/52/62/73/92 % sobre máx. compartido 31.400 €).
4. `docs/design/screen-contracts.md`: totals, unidad estadística, semántica de
   filtros, política de CTA web y política de ejemplos aprobados.
