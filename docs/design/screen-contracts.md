# SALIDA CyL — screen contracts (producto completo)

Contrato único de implementación por ruta. Hereda TODO de `SALIDA-DESIGN.md`,
`tokens-proposal.css` y `home-screen-contract.md` (header, navegación,
tipografía, color, spacing, botones, links, evidencia, footer). El prototipo
Home es la referencia visual principal; los prototipos de
`prototypes/product/` extienden el mismo sistema. Nada de esta página puede
inventar dirección nueva.

Convenciones globales:

- NAV = global en todas las pantallas. Primario (desktop): **Explorar ·
  Ofertas · Dónde estudiar · Comparar estudios**. Secundarios (fila superior):
  **Más formación · Datos abiertos · Metodología · Accesibilidad**. Mobile
  expone TODOS (4 primarios + 4 secundarios) en el panel de menú. El CONTEXTO
  se expresa con breadcrumb + masthead de página, nunca cambiando el menú.
  **Etiqueta ≠ ruta**: los labels pueden evolucionar ("Comparar ingresos" →
  "Comparar estudios", "Formación complementaria" → "Más formación"); las
  rutas NO cambian (ver ROUTE_COMPATIBILITY_CONTRACT).
- **PageMasthead compartido (Home ↔ interiores)**: mismo lenguaje estructural
  en todas las páginas — breadcrumb (CAPTION, separador "/", `aria-current`)
  → eyebrow (LABEL uppercase trigo) → H1 → subcopy BODY_LARGE muted →
  acciones (1 primaria + secundarias, 44px) → banda DataStat cuando exista
  (fila `proof-rail` con superficie SURFACE_ALT). Mismo grid (`container`
  1240px), mismas superficies cálidas (SURFACE / SURFACE_ALT), mismo
  SectionHeader (H2 + lede en `section-head`), mismo ritmo vertical
  (`--stack-section` entre secciones). **"Mismo producto, distinta densidad"**:
  FP, Occupation y Offers son MÁS densos que Home (filas/tablas/preview por
  viewport); Home es el extremo aéreo (hero editorial + task cards). Nunca se
  añade fotografía a las fichas para "igualar" la Home: la densidad crece con
  unidades de contenido, no con imágenes.
- Semántica de centros: **Titularidad** = `teachingType`
  (Pública/Concertada/Privada) · **Tipo de centro** = `centerOwnership`
  (Centro educativo/municipal/agrario/privado, solo metadata secundaria o
  filtro adicional). Nunca se intercambian.
- Estados de relación en lenguaje ciudadano: “Salida oficial del título”
  (`official_output`) y “Relación revisada” (`reviewed_relationship`). Los
  códigos técnicos (`reviewed_title_alias_exact`, mapping v1.0.0…) solo en
  disclosure terciario.
- Fail-closed: nunca se afirma “sin FP posible” o “sin ofertas”; se dice
  “sin relación comprobada en esta copia”.
- Todos los contadores y números provienen del snapshot activo
  (RUNTIME_DERIVED_IN_IMPLEMENTATION); prohibido fijarlos a mano.
- **Disclosure IA**: texto completo solo en Metodología ("Las imágenes
  editoriales son generadas mediante IA y no representan personas, empresas,
  ofertas ni centros reales."); el Footer lleva la línea discreta "Imágenes
  editoriales generadas mediante IA." en todas las páginas. Prohibido badges
  sobre imágenes y captions duplicados por página.

---

## 1. `/desde-fp/:programKey` — FP DETAIL

- **Purpose**: convertir una FP concreta en acciones concretas.
- **Primary question**: “¿Qué puedo hacer con esta FP?”
- **Section order**: breadcrumbs → page header (eyebrow nivel·familia, H1
  nombre + code-chip, subcopy 1 frase) → action row (1 primaria “Ver ofertas
  relacionadas” · secundaria “Dónde estudiarla” · link “Ver profesiones
  relacionadas”) → stat band (profesiones / ofertas con relación revisada /
  centros) → Profesiones relacionadas (lista de filas: badge ciudadano +
  ocupación + CNO + evidencia con cita y fecha + acción “Ver ofertas” +
  InfoButton técnico) → Ofertas (preview ≤3 filas: puesto, localidad·fuente·
  fecha, badge relación, CTA real a la fuente) + CTA “Ver todas las ofertas
  relacionadas” → Dónde estudiarla (preview tabla ≤5 filas: centro + tipo de
  centro como sub-línea, localidad, modalidad, titularidad) + CTA “Ver todos
  los centros” → EvidenceCallout (fuentes + fechas) → disclosure IA.
- **Components**: Breadcrumbs, PageHeader, DataStat band, relation-list,
  offer-row, result-table (preview), EvidenceCallout, InfoButton, details
  terciario.
- **Data**: graph (relaciones por programKey), offer-evidence (ofertas con
  relación a sus ocupaciones), offerings+centers (centros, modality,
  teachingType, ownership).
- **Responsive**: 1440: filas de relación con acción a la derecha; 390: todo
  apilado, acciones bajo el contenido; stat band en columna.
- **Empty state**: si 0 relaciones → “Todavía no hemos podido comprobar
  profesiones relacionadas en esta copia” + acciones (explorar centros,
  metodología). Si 0 ofertas → bloque fail-closed del patrón §7.
- **Provenance**: cita+fecha junto a cada relación (secundario); bloque
  Evidencia al final (terciario).

## 2. `/desde-ocupacion/:occupationId` — OCCUPATION DETAIL

- **Purpose**: desde una profesión, llevar a la FP que conduce a ella.
- **Primary question**: “¿Qué FP me lleva a esta profesión?”
- **Section order**: breadcrumbs → header (eyebrow “Profesión · CNO-11
  XXXX”, H1 nombre oficial, subcopy) → actions (primaria “Ver ofertas de la
  profesión” · secundaria “Ver la FP relacionada” · link metodología) → stat
  band (FP relacionadas / ofertas / centros) → “FP que lleva a esta profesión”
  (filas ligeras: badge + ciclo + nivel·familia·código + nº centros + evidencia
  - acción “Ver N ofertas” / “Ver la ficha”) → Ofertas recientes (preview) →
    Contexto y fuentes.
- **Data**: graph inverso por occupationId, occupations.json (labels CNO-11),
  offer-evidence, offerings.
- **Responsive**: igual que FP detail.
- **Empty state**: 0 FP → estado cero §7 adaptado (“no hemos podido comprobar
  formación relacionada”) + acción a explorador de centros.
- **Provenance**: igual que FP detail; detalle técnico (occupationId,
  mappingVersion) en `<details>`.

## 3. `/desde-fp/:programKey/ofertas` y `/desde-ocupacion/:occupationId/ofertas` — CONTEXTUAL OFFERS

- **Purpose**: ofertas DE ESTE contexto, sin confundirse con el catálogo
  global.
- **Primary question**: “¿Qué ofertas se relacionan con mi FP/profesión?”
- **Section order**: breadcrumbs (incluye el contexto) → ctx-banner “ESTÁS
  VIENDO · ofertas relacionadas con X” + volver → subcopy con fecha de copia →
  filtros ligeros (buscar + provincia cuando aplique) → result count → lista
  de ofertas (puesto H3, meta localidad·fuente·fecha, badge “Con FP
  relacionada” + “por qué aparece” en lenguaje ciudadano, acción “Ver oferta
  oficial” a la fuente original, InfoButton de evidencia) → caption fail-
  closed.
- **Data**: offer-evidence filtrado por programa/ocupación; URLs originales
  reales.
- **Responsive**: filas apiladas en móvil; acciones full-width.
- **Empty state**: patrón §7.
- **Provenance**: “por qué aparece” visible por fila (secundario);
  quote+regla técnica en InfoButton (terciario).

## 4. `/desde-oferta` — GLOBAL OFFERS

- **Purpose**: explorar la copia actual de ofertas desde la orientación, no
  como buscador comercial.
- **Primary question**: “¿Qué ofertas hay ahora y cuáles conectan con FP?”
- **Section order**: breadcrumbs → header (eyebrow copia fechada, H1 Ofertas,
  subcopy con declaración de no-agencia) → filtros: Buscar + Provincia +
  Relación FP (solo opciones con dato real: “Solo con FP relacionada”; nada
  inventado) → result-meta SIEMPRE visible (“1–12 de 1058 ofertas · 138 con
  FP relacionada”; UNIDAD: oferta única `offerId`) → lista (puesto, localidad ·
  fuente · fecha, badge solo si relación comprobada; sin badge = sin
  afirmación) → paginación (12/página → 89 páginas; última “1057–1058 de
  1058”) → caption fail-closed.
- **Data**: offer-evidence completo (1058 registros = manifest
  `jobOffers.recordCount`); page size 12 (contrato actual). PROHIBIDO usar el
  recurso raíz legacy `/data/v1/job-offers.json` (1033, excluido del runtime
  por `LEGACY_RUNTIME_ROOT_FILES`); el total se lee del snapshot activo
  direccionado por el manifest.
- **Responsive**: misma lista; filtros en sheet móvil.
- **Empty state**: búsqueda sin resultados → EmptyState estándar (“Sin
  resultados para estos filtros” + quitar filtros).
- **Provenance**: fuente y fecha por fila; criterio fail-closed explicado al
  pie.

## 5. `/donde-estudiar` — CENTERS EXPLORER (PRIORIDAD ALTA)

- **Purpose**: encontrar dónde se imparte cada ciclo publicado.
- **Primary question**: “¿Dónde puedo estudiar este ciclo?”
- **Section order**: header con imagen `centers-vocational-training` SOLO en
  intro (16:9 desktop / 4:3 móvil; nunca entre resultados) → H1 “Dónde
  estudiar” + una frase (oferta publicada en la copia actual; sin promesas de
  matrícula/plazas) → filtros: Buscar · Provincia · Modalidad
  (`trainingOfferings.modality` agregado en `modalities[]`) · Titularidad
  (`teachingType` agregado en `teachingTypes[]`) · “Más filtros” (Nivel =
  `program.level` · Familia = `program.familyCode` · Tipo de centro =
  `centerOwnership`) → result count visible “1–50 de 1293 opciones formativas ·
  229 centros representados” + chips activos + Quitar filtros → tabla desktop
  (Centro[+tipo de centro como sub-línea] · Localidad · Ciclo·Nivel ·
  Modalidad · Titularidad · Acciones: Ver ciclo / Cómo llegar / Web del centro
  si existe) → ResultCards móvil (CENTRO / Localidad / CICLO+nivel /
  MODALIDAD / TITULARIDAD / acciones) → paginación 50/página → caption de
  procedencia de URLs y modalidad no publicada.
- **Data**: 1294 raw offerings (1293 únicos tras join centers (229) +
  programs (187)); **UNIDAD contractual = fila única
  `centerCode:programKey` (“opción formativa”)**. Semántica completa de
  filtros y facet counts: `analysis/catalog-filter-semantics.md` (vinculante).
- **FACET multivalor**: una fila puede pertenecer a varias facetas
  (modalities[] / teachingTypes[]); se cuenta filas, no offerings raw; la suma
  de facetas no tiene por qué igualar el total de filas.
- **UNKNOWN modality**: en resultados “Modalidad no publicada”; opción de
  filtro “Sin modalidad publicada” solo si existe en la copia (hoy 0 —
  omitida). Prohibido “Desconocida”.
- **Center links (política CTA, resultado de auditoría
  `analysis/centers-link-audit.md`, 02/09/2026)**:
  - LIVE/REDIRECTED/HTTP_ONLY + identidad CONFIRMED o PLAUSIBLE → “Web del
    centro” (href tal como lo publica la fuente; `rel="noopener"`).
  - LIVE/REDIRECTED + identidad NOT_CONFIRMED → “Web publicada en la fuente”.
  - BROKEN_HTTP / DNS_FAILURE / TLS_FAILURE / TIMEOUT / DOMAIN_PARKED /
    CONTENT_MISMATCH / IDENTITY_MISMATCH → SIN CTA web (201 de 228 centros con
    web tienen CTA seguro; 27 sin CTA; 3 dominios secuestrados excluidos).
  - HTTP-only: mostrar la URL tal cual la publica la fuente; PROHIBIDO elevar
    a https silenciosamente.
  - “Cómo llegar” se mantiene siempre (nombre + localidad/provincia
    publicados, sin datos inventados).
  - PROHIBIDO “Web oficial verificada”. La verificación es evidencia de
    auditoría fechada, no garantía continua.
- **Responsive**: 1440 tabla; <768 rcards (nunca tabla comprimida); filtros en
  sheet ≤70vh con Aplicar/Quitar; count fuera del sheet.
- **Empty state**: EmptyState + “Quitar filtros”.

## 6. `/donde-estudiar/:programKey` y `/formacion/:programKey` — CONTEXTUAL CENTERS

- **Purpose**: centros de UN ciclo; continuación natural de la ficha FP.
- **Primary question**: “¿Qué centros publican este ciclo?”
- **Section order**: breadcrumbs con ciclo → ctx-banner → H1 “Dónde estudiar
  [ciclo]” + subcopy (nº centros/provincias, sin matrícula) → filtros
  contextuales SOLO (Provincia · Modalidad · Titularidad; nunca
  familia/ciclo) → count “1–45 de 45” → tabla/rcards → nota (sin paginación
  si cabe en una página; misma política de CTA web que §5).
- **Data**: offerings filtrados por programKey.
- **Responsive/Empty/Provenance**: como explorer.

## 7. ZERO / FAIL-CLOSED (aplicable a cualquier lista vacía por revisión)

- **Purpose**: demostrar honestidad: un vacío revisado es una respuesta
  válida.
- **Reference**: `/desde-ocupacion/occupation:cno11:3820/ofertas` (CNO-11
  3820 Programadores informáticos: 2 FP revisadas, 0 ofertas comprobadas).
- **Section order**: ctx-banner → título “Todavía no hemos podido comprobar
  ofertas relacionadas en esta copia.” → 3 bloques (Qué significa / Qué NO
  significa / Qué puedes hacer) → acciones (primaria “Ver formación
  relacionada” [si existen FP revisadas] · secundaria “Explorar todas las
  ofertas” · link “Consultar metodología”) → `<details>` con el dato exacto
  de la copia.
- **Prohibido**: “¡Ups!”, iconos tristes, ilustraciones decorativas, “no
  existen ofertas”.
- **Data**: conteos reales del snapshot (3820: 2 relaciones
  `reviewed_relationship`, 0 ofertas).

## 8. `/datos-abiertos` — OPEN DATA

- **Purpose**: descarga y verificación de todo lo publicado.
- **Primary question**: “¿Qué puedo descargar y con qué licencia?”
- **Section order**: header (eyebrow Transparencia) → Snapshot actual (banda
  de stats: fecha copia · nº recursos · nº relaciones · licencia) → Qué puedes
  descargar (resource rows reales: grafo CSV con CC BY 4.0 + catálogos base +
  ofertas/evidencia; botones de descarga reales) → Cómo se construyen los
  derivados (resumen + link metodología) → Hashes/provenance en `<details>`
  terciario (snapshot id, manifest SHA-256, sha del CSV). NO empezar por el
  hash.
- **Data**: open-data-catalog.json + manifest v1 (reales).

## 9. `/metodologia` — METHODOLOGY

- **Purpose**: explicar el criterio de revisión en lenguaje ciudadano.
- **Primary question**: “¿Cómo decide SALIDA que una FP y una profesión están
  relacionadas?”
- **Section order**: header → 5 pasos numerados (fuentes oficiales →
  normalización → revisión → publicación de aprobadas → conservación de
  evidencia) → Límites (“lo que SALIDA no es”: no bolsa de empleo, no
  matrícula/plazas, fail-closed, URLs de centros sin auditar) → Snapshots
  (copias fechadas; copia activa 30/08/2026) → Matching (tipos de relación y
  reglas, sin tecnicismos) → Descargas técnicas → Disclosure IA + fuentes.
- **Density**: lectura (reading-max 704px en prosa).
- **Provenance**: la página ES provenance; enlaces a datos abiertos.

---

## Alineación (auditoría por grupo)

Todos los grupos equivalentes comparten anatomía exacta: filas de relación y
oferta (badge→título→meta→evidencia + acción 44px a la derecha), tablas (misma
altura de fila por contenido, padding 12/16), rcards (campos en el mismo
orden), stat bands (números H2 tabulares en la misma línea base), botones 44px
en todas las páginas. Lo único que crece es la zona de descripción/evidencia.

## 10. `/comparar` — COMPARE STUDIES (prototipada: `prototypes/product/compare/`)

- **Purpose**: comparar ingresos observados publicados (EDUCAbase) entre
  ciclos/grupos, conservando todos los avisos del producto existente. La ruta
  y el comportamiento existen en producción; solo cambia el label de
  navegación ("Comparar estudios") y la piel visual.
- **Primary question**: "¿Qué ingresos observados publicados tiene este ciclo
  frente a otros, con la misma cohorte y el mismo año?"
- **Preserved semantics (NO negociable)**:
  - datos de **EDUCAbase** (`outcome-indicators`, sourceUrl
    `estadisticas.educacion.gob.es/EducaJaxiPx/`) con fecha de copia y
    `qualityStatus`;
  - **percentiles/cortes existentes**: media + cortes del 20/40/60/80 %
    (`quintile_*_lower_boundary`), mostrados como importes y con explicación
    "Cómo leer los cortes"; si los cortes no superan la comprobación de
    coherencia, solo se muestra la media;
  - **avisos de agregación**: "Datos agregados… no es un salario individual";
  - **no salario individual**; **no predicción** ("No es una predicción
    salarial personal.");
  - referencia España (ciclo/grupo) separada de la referencia Castilla y León
    (nivel de titulación) + limitación explicada;
  - estado en la URL (`level`, `group`, `cohort`, `year`).
- **Section order**: breadcrumbs → PageMasthead (eyebrow "Comparar estudios",
  H1 "Ingresos observados", subcopy, link metodología) → notice warning de
  agregación → formulario (Nivel · Ciclo/grupo · Cohorte · Año) → summary de
  selección → "Cómo leer los cortes" (EvidenceCallout) → dos paneles de
  evidencia (España / Castilla y León) con cut-rows (media + cortes, barras
  tabulares) → `<details>` con tabla técnica → limitación → fuente EDUCAbase
  - fecha de copia.
- **Density**: media (entre ficha y Home). Sin fotografía.
- **Empty/unavailable**: "Los datos de comparación no están disponibles en
  esta versión." + link metodología.

## 11. `/recursos` — MORE TRAINING (prototipada: `prototypes/product/resources/`)

- **Purpose**: formación complementaria (cursos ECYL, certificados de
  profesionalidad) y empleo público abierto, conservando datos y
  comportamiento existentes. Label de navegación: "Más formación".
- **Primary question**: "¿Qué formación complementaria y convocatorias
  públicas hay ahora, con su fuente oficial?"
- **Preserved semantics (NO negociable)**:
  - tres bloques: **Empleo público abierto ahora** (solo plazo abierto en la
    copia), **Cursos del ECYL** (page size 40 + "Mostrar más") y
    **Certificados de profesionalidad** (page size 60 + "Mostrar más");
  - búsqueda por nombre/localidad/código + filtro familia profesional
    (catálogo oficial);
  - metadatos faltantes como "No publicado en la ficha" / "Datos no
    publicados: …" (nunca inventados);
  - certificados: "La familia y el nivel proceden del catálogo oficial. No
    atribuimos equivalencias con títulos de FP.";
  - enlaces a `officialUrl` / `programUrl` reales; fuente + fecha de copia.
- **Section order**: breadcrumbs → PageMasthead (eyebrow "Recursos de
  Castilla y León", H1 "Más formación") → banda DataStat (cursos /
  certificados / convocatorias abiertas de la copia) → FilterBar (buscar +
  familia) → Empleo público abierto ahora (offer-rows con badge de tipo de
  acceso, plazo) → Cursos del ECYL (resource-rows con `<details>` de metadatos
  completos) → Certificados de profesionalidad → EvidenceCallout de fuentes.
- **Density**: alta (listas densas), como Offers/Centers. Sin fotografía.

---

## ROUTE_COMPATIBILITY_CONTRACT

**Las rutas productivas existentes permanecen idénticas.** El rediseño cambia
labels, jerarquía y presentación; **nunca URLs**. Cambiar el label de
navegación NO autoriza cambiar una URL. Cualquier nueva URL se añade a esta
tabla; ninguna URL se elimina ni renombra.

Rutas productivas congeladas (fuente: `src/app/routes.tsx` +
`docs/contest/production-v3-route-contract.md`):

| Ruta                                     | Página                                   | Notas                                                    |
| ---------------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `/`                                      | Home                                     |                                                          |
| `/desde-fp`                              | Buscador de FP                           |                                                          |
| `/desde-fp/:programKey`                  | Ficha FP                                 | `programKey` con formato actual (`ADG02S`, `SAN21`…)     |
| `/desde-fp/:programKey/ofertas`          | Ofertas contextuales de un ciclo         |                                                          |
| `/desde-ocupacion`                       | Buscador de profesiones                  |                                                          |
| `/desde-ocupacion/:occupationId`         | Ficha de profesión                       | `occupationId` = `occupation:cno11:XXXX` (ver auditoría) |
| `/desde-ocupacion/:occupationId/ofertas` | Ofertas contextuales de una profesión    |                                                          |
| `/desde-oferta`                          | Ofertas globales                         |                                                          |
| `/donde-estudiar`                        | Explorador de centros                    |                                                          |
| `/donde-estudiar/:programKey`            | Centros contextuales de un ciclo         |                                                          |
| `/comparar`                              | Comparar estudios (ingresos observados)  | Label nuevo; URL intacta                                 |
| `/recursos`                              | Más formación (recursos ECYL)            | Label nuevo; URL intacta                                 |
| `/datos-abiertos`                        | Datos abiertos                           |                                                          |
| `/metodologia`                           | Metodología                              |                                                          |
| `/accesibilidad`                         | Accesibilidad                            |                                                          |
| `/para-organizaciones`                   | Para organizaciones                      |                                                          |
| `/formacion/:programKey`                 | Alias compatible de centros contextuales | Congelado por enlaces públicos existentes                |

Reglas derivadas:

1. Los estados de vista serializables (`query`, `province`, `status`,
   `level`, `family`, `page` y en `/comparar` `level/group/cohort/year/program`)
   se mantienen en la URL y sobreviven a recarga/atrás/adelante.
2. Un cambio de label en navegación/footer/breadcrumbs debe reflejarse en E2E
   como aserción de URL, no de texto.
3. Queda prohibido introducir rutas paralelas ("rediseño" vs "legacy").

## JURY_MEMO_URL_AUDIT

URLs exactas presentes en `docs/contest/jury-memo.md` (auditoría 02/09/2026).
Esta lista es la base contractual de los futuros E2E de compatibilidad de
rutas; cada fila debe convertirse en un test E2E que navegue la URL y
compruebe contenido estable:

| #   | URL exacta del memo                          | Tipo    | Debe seguir respondiendo con                              |
| --- | -------------------------------------------- | ------- | --------------------------------------------------------- |
| 1   | `/desde-fp/SAN21`                            | interna | Ficha del ciclo SAN21 con relaciones revisadas y ofertas  |
| 2   | `/desde-ocupacion/occupation%3Acno11%3A5611` | interna | Ficha de la profesión 5611 (recorrido inverso)            |
| 3   | `/desde-ocupacion/occupation%3Acno11%3A7111` | interna | Ficha 7111 con sus ofertas revisadas (cobertura positiva) |
| 4   | `/desde-ocupacion/occupation%3Acno11%3A3820` | interna | Ficha 3820 en fail-closed (sin ofertas inventadas)        |
| 5   | `/desde-oferta`                              | interna | Explorador global de ofertas                              |
| 6   | `/datos-abiertos`                            | interna | Catálogo de descarga + manifest                           |

Notas contractuales:

- El memo codifica `occupationId` con **percent-encoding** (`%3A` por `:`).
  Los E2E deben usar la forma codificada exacta del memo: un cambio de
  codificación rompe enlaces públicos.
- La URL externa del concurso
  (`https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html`)
  es referencia externa del memo, no una ruta del producto: queda fuera del
  contrato de rutas, pero se registra aquí por completitud.
- Estado: **PENDIENTE E2E**. Ningún E2E de rutas existe todavía; esta lista
  debe materializarse como spec E2E antes del release.

## ACCESSIBILITY_EVIDENCE_POLICY

**La evidencia Axe/keyboard de candidate.7 NO demuestra la accesibilidad del
rediseño.** Los informes de accesibilidad previos (gate local de candidate.7,
capturas de auditoría anteriores) quedan invalidados como prueba del nuevo
producto: describen otro DOM. No se reutilizarán resultados anteriores como
evidencia del rediseño, ni total ni parcialmente.

El producto rediseñado deberá ejecutar de nuevo, desde cero, sobre el DOM
real de implementación:

1. **Axe** (0 violations objetivo documentado por página/ruta).
2. **Keyboard** (recorrido completo por teclado en cada flujo crítico).
3. **Focus** (anillo visible, orden de tabulación lógico, foco retornado tras
   cerrar overlays).
4. **Menu** (panel móvil: apertura, foco atrapado, Esc cierra y devuelve el
   foco al trigger).
5. **Task selector** (tabs ARIA de la Home: roving tabindex, flechas
   ←/→, un solo panel visible).
6. **Dialogs/sheets** (paneles de filtros móviles y modales: Semántica,
   foco, cierre).
7. **InfoButton** (glifo 16 / target 44, Esc/click-fuera, retorno de foco).
8. **Filters** (chips activos, quitar filtros, contadores accesibles).
9. **Responsive 320** (sin scroll horizontal en todas las rutas).
10. **Zoom** (200 % usable en las rutas críticas).
11. **Reduced motion** (`prefers-reduced-motion` desactiva transiciones).

Estado actual: **NO EJECUTADA para el rediseño** (los prototipos estáticos son
evidencia de diseño, no de accesibilidad). Ningún gate de accesibilidad del
rediseño puede marcarse verde hasta completar esta lista.

## Contact sheet

`screenshots/PRODUCT-CONTACT-SHEET.png` — HOME + 9 familias de pantallas
juntas como prueba de "mismo producto, distinta densidad" (header, grid,
PageMasthead, tipo, color, spacing, botones compartidos; FP / Occupation /
Offers más densas que Home). Regenerada tras la congelación de navegación y
con las pantallas nuevas `/comparar` y `/recursos`.

---

## DATA_INTEGRITY_CONTRACT (auditoría pre-implementación 02/09/2026)

Fuente vinculante: `analysis/prototype-data-integrity.md` +
`analysis/catalog-filter-semantics.md` + `analysis/centers-link-audit.md`
(scripts reproducibles en `scripts/analysis/`). Snapshot activo
`20260830120000000-8c6c79fbd2a1`.

Totales correctos por recurso (UNIDAD explícita):

| Dato                                         | Valor                                                         | Unidad                                                                      |
| -------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Ofertas globales `/desde-oferta`             | **1058** (12/página → 89 páginas; última “1057–1058 de 1058”) | oferta única `offerId`                                                      |
| Ofertas con relación FP revisada             | **138**                                                       | oferta única con ≥1 relación revisada                                       |
| Relaciones oferta↔FP (documentación interna) | **196**                                                       | relación oferta→(ciclo, ocupación); NUNCA se muestra como número de ofertas |
| Opciones formativas `/donde-estudiar`        | **1293**                                                      | fila única `centerCode:programKey`                                          |
| Centros representados                        | **229**                                                       | centro `centerCode`                                                         |
| Raw offerings (nivel recurso)                | 1294                                                          | registro fuente JCyL                                                        |
| Ciclos                                       | **187**                                                       | `programKey`                                                                |
| Relaciones FP↔ocupación (grafo)              | **264**                                                       | relación `programKey↔occupationId`                                          |
| Cursos ECYL / certificados                   | **791 / 583**                                                 | curso / certificado                                                         |
| Convocatorias abiertas (copia 22/08)         | **4**                                                         | convocatoria                                                                |
| Recursos publicados (open data)              | **22**                                                        | recurso del manifest                                                        |

Errores de prototipo corregidos en esta fase (lección contractual):

1. `1033` ofertas — lectura del recurso raíz legacy (`/data/v1/job-offers.json`,
   excluido del runtime); prohibido usar ficheros raíz legacy como fuente.
2. Enlaces `/formacion/AGL01M` — ciclo inexistente; todo `programKey` de un
   enlace debe existir en `programs.json`.
3. Panel CyL de `/comparar` con valores de Grado Medio bajo título de grado
   superior — cada panel declara su nivel/tabla fuente y no se mezclan.

APPROVED_EXAMPLES_POLICY: los ejemplos editoriales que demuestren una relación
FP↔ocupación deben usar exclusivamente relaciones aprobadas/publicadas.
Lista contractual para tests de implementación (`APPROVED_EXAMPLE_IDS`):

- `home:example-adg02s` — ADG02S ↔ CNO 4111 (official_output, revisada
  12/08/2026) + 45 centros en 9 provincias.
- `offer:1285665634571` — oferta real Zamora 23/07/2026 con relación revisada.
- `offer:1285672565954` — oferta real Palencia 20/08/2026 con relación revisada.
- `occupation:cno11:5611↔SAN21` — 34 ofertas y 34 centros reales.

Cualquier otro ejemplo numérico debe verificar contra snapshot antes de
publicarse (RUNTIME_DERIVED_IN_IMPLEMENTATION) y no puede aparentar una
relación revisada que no exista.

---
