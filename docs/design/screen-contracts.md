# SALIDA CyL — screen contracts (producto completo)

Contrato único de implementación por ruta. Hereda TODO de `SALIDA-DESIGN.md`,
`tokens-proposal.css` y `home-screen-contract.md` (header, navegación,
tipografía, color, spacing, botones, links, evidencia, footer). El prototipo
Home es la referencia visual principal; los prototipos de
`prototypes/product/` extienden el mismo sistema. Nada de esta página puede
inventar dirección nueva.

Convenciones globales:

- NAV = global en todas las pantallas (Explorar / Ofertas / Dónde estudiar +
  secundarios). El CONTEXTO se expresa con breadcrumb + banner de página, nunca
  cambiando el menú.
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
  inventado) → result-meta SIEMPRE visible (“1–12 de 1033 ofertas · 138 con
  FP relacionada”) → lista (puesto, localidad · fuente · fecha, badge solo si
  relación comprobada; sin badge = sin afirmación) → paginación (12/página) →
  caption fail-closed.
- **Data**: offer-evidence completo; page size 12 (contrato actual).
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
  (`trainingOfferings.modality`) · Titularidad (`teachingType`) · “Más
  filtros” (Nivel · Familia · Tipo de centro=`centerOwnership`) → result count
  visible “1–50 de 1293 opciones formativas · 229 centros representados” +
  chips activos + Quitar filtros → tabla desktop (Centro[+tipo de centro como
  sub-línea] · Localidad · Ciclo·Nivel · Modalidad · Titularidad · Acciones:
  Ver ciclo / Cómo llegar / Web del centro si existe) → ResultCards móvil
  (CENTRO / Localidad / CICLO+nivel / MODALIDAD / TITULARIDAD / acciones) →
  paginación 50/página → caption de URLs pendientes de auditoría y modalidad
  no publicada.
- **Data**: offerings (1293) join centers (229) + programs; snapshot trae
  teachingType/centerOwnership.
- **UNKNOWN modality**: en resultados “Modalidad no publicada”; opción de
  filtro “Sin modalidad publicada” solo si existe en la copia (hoy 0 —
  omitida).
- **Center links**: “Web del centro” (si dataset publica URL) y “Cómo llegar”
  (mapa). PROHIBIDO “Web oficial verificada” hasta auditoría.
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
  si cabe en una página; URLs pendientes de auditoría).
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

## Contact sheet

`screenshots/PRODUCT-CONTACT-SHEET.png` — HOME + 7 pantallas juntas como
prueba de producto único (header, grid, tipo, color, spacing, botones,
densidad).
