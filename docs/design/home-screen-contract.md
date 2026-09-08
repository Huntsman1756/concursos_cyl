# Home — screen contract (rediseño SALIDA CyL)

Contrato ejecutable de la nueva Home. Fuentes de verdad: `SALIDA-DESIGN.md`,
`tokens-proposal.css`, `editorial-assets.md`. Prototipo de referencia:
`prototypes/home/index.html` + capturas en `prototypes/home/screenshots/`.

## 1. Orden exacto de secciones

| #   | Sección                                           | Fondo       |
| --- | ------------------------------------------------- | ----------- |
| 0   | Skip link (invisible hasta foco)                  | —           |
| 1   | GlobalHeader (wordmark + secundarios) + GlobalNav | SURFACE     |
| 2   | Hero 55/45                                        | SURFACE     |
| 3   | Three Paths ("Empieza desde donde estás")         | SURFACE     |
| 4   | Proof rail                                        | SURFACE_ALT |
| 5   | Real Example ("Comprueba cómo funciona")          | SURFACE     |
| 6   | Centers Teaser                                    | SURFACE_ALT |
| 7   | Method / Trust + disclosure IA                    | SURFACE     |
| 8   | Footer (3 grupos)                                 | SURFACE_ALT |

Ritmo alternado blanco/papel cálido; sin cajas anidadas.

## 2. Anatomía por componente

- **Header 64px** (56 mobile): wordmark `SALIDA CyL` (700, 20px, "CyL" en
  PRIMARY) · secundarios derecha (SMALL, muted): Más formación · Datos
  abiertos · Metodología · Accesibilidad. Mobile: botón "Menú" (44px) → panel
  con foco gestionado, Esc cierra y devuelve foco. **GlobalNav** fila bajo
  header: Explorar · Ofertas · Dónde estudiar · Comparar estudios; LABEL/600,
  targets 44px; activo = subrayado 3px PRIMARY; en Home ningún ítem lleva
  `aria-current`. Mobile expone TODOS los ítems (4 primarios + 4
  secundarios). Labels y rutas: label ≠ ruta — `/comparar` se llama
  "Comparar estudios" y `/recursos` "Más formación", pero ninguna URL cambia
  (ROUTE_COMPATIBILITY_CONTRACT en `screen-contracts.md`).
- **Hero desktop**: grid 55/45. Izquierda: eyebrow trigo (LABEL uppercase) →
  DISPLAY (≤3 líneas) → párrafo único BODY_LARGE → trust line (SMALL muted,
  separadores trigo) → task selector (tablist 3 opciones, 44px, seleccionada =
  fondo PRIMARY texto blanco) → panel de búsqueda ÚNICO (label visible + input
  44px + botón primario + hint CAPTION). Derecha: `hero-career-guidance`
  object-position 67% 22%, altura = contenido izquierdo, sin caja que envuelva
  el hero. Hero móvil: eyebrow → H1 → texto → selector (3 filas apiladas) →
  buscador → CTA → imagen 4:3 (nunca ocupa el primer viewport).
- **TaskCard (paths)**: imagen 4:3 `--radius-medium` → número (LABEL trigo) →
  título H3 (2 líneas reservadas) → descripción SMALL muted (zona que crece) →
  acciones 44px pegadas abajo (`margin-top:auto`). Sin caja/card surface:
  bloque editorial sobre el lienzo. Copy exacta:
  - 01 Tengo una FP — "Descubre profesiones, ofertas y centros relacionados
    con tu ciclo." — CTA "Ver salidas de mi FP" → `/desde-fp`
  - 02 Quiero dedicarme a una profesión — "Comprueba qué ciclos tienen una
    relación revisada con esa ocupación." — CTA "Buscar una profesión" →
    `/desde-ocupacion`
  - 03 He visto una oferta — "Entiende sus requisitos y comprueba si aparece
    relacionada con una FP." — CTA "Analizar una oferta" → `/desde-oferta`
- **Proof rail**: banda SURFACE_ALT; 3 stats (valor H2 tabular + label SMALL)
  separados por hairline + bloque "Fuentes públicas y trazabilidad" con
  InfoButton (glifo 16, target 44, popover SMALL, Esc/fuera cierra, foco
  retorna). Valores 187/138/229 → **RUNTIME_DERIVED_IN_IMPLEMENTATION**
  (prototipo: valores reales del snapshot 30/08/2026; nada hardcodeado en la
  implementación final: se calculan del runtime).
- **Real Example**: flujo vertical de 4 pasos con iconos Lucide 20px y kind
  eyebrow trigo: FP → profesiones relacionadas → oferta actual → dónde
  estudiarla. Solo relaciones revisadas del snapshot (ver §6). CTA secundario
  "Ver el ejemplo completo" → ficha del ciclo (`/desde-fp/ADG02S` en el
  prototipo).
- **Centers Teaser**: grid 42/58 desktop (imagen 16:9 `centers-vocational-
training`, position 66% 36%) / apilado mobile (imagen 4:3→16:9). H2 + lede +
  CTA primario "Buscar dónde estudiar" → `/donde-estudiar`. Chip punteado
  CAPTION: "Propuesta de rediseño · … · PROPOSED_FILTERS" — obligatorio
  mientras los filtros (provincia, modalidad, titularidad —teachingType:
  pública/concertada/privada—, nivel, familia) no
  existan en producción.
- **Method/Trust**: H2 "Sabes de dónde sale cada relación." + 1 párrafo +
  acciones (secundario "Ver metodología" → `/metodologia`; acción de texto
  "Explorar los datos abiertos" → `/datos-abiertos`) + disclosure IA en
  CAPTION con el texto completo ("Las imágenes editoriales son generadas
  mediante IA y no representan personas, empresas, ofertas ni centros
  reales."), sin jerarquía superior a la del contenido.
- **Footer**: SURFACE_ALT, 3 grupos (Explorar / Datos y método / Información;
  en "Datos y método": Metodología · Datos abiertos · Comparar estudios ·
  Más formación) — barra inferior CAPTION con identidad, estado del prototipo
  y la línea discreta **"Imágenes editoriales generadas mediante IA."**.

## 3. Interacción

- Task selector: patrón tabs ARIA (roving tabindex, flechas ←/→, un solo
  panel). Default "Tengo una FP". Cada opción = label + placeholder + hint +
  CTA propios (FP: "Buscar tu ciclo" / "Ver mis salidas"; profesión: "Buscar
  una profesión" / "Ver ciclos relacionados"; oferta: "Pega el título de la
  oferta" / "Analizar la oferta"). Los formularios hacen GET a rutas reales
  (`/desde-fp?query=…`).
- Estados: default/hover/focus-visible/active/disabled documentados en
  `states.html` + captura `interaction-states.png`. Foco = anillo bronce
  (`--focus-ring`) visible en todos los interactivos.
- Motion: solo transiciones de color 140ms y flecha CTA 2px. Reduced-motion
  heredado de tokens.

## 4. Responsive

| Viewport | Hero                         | Paths               | Proof            | Teaser  |
| -------- | ---------------------------- | ------------------- | ---------------- | ------- |
| 1440     | 55/45, imagen ~560px alto    | 3 columnas          | 4 columnas       | 42/58   |
| 768      | apilado, imagen 4:3 bajo CTA | 3 columnas (gap 24) | 4 columnas       | apilado |
| 390      | apilado, selector en 3 filas | 1 columna           | 1 columna + nota | apilado |
| 320      | ídem, sin scroll horizontal  | 1 columna           | 1 columna        | apilado |

## 5. Imágenes (contrato editorial)

Solo las 5 familias aprobadas; AVIF con fallback WebP vía `<picture>`;
srcSet 640–1536 (hero) / 640–1280 (cards) / 640–1600 (centers); hero
`loading=eager fetchpriority=high`, resto lazy; `width/height` siempre;
alt del inventario editorial. Prohibido: foto por resultado, foto como centro
real, badges sobre imagen.

## 6. Datos y revisión (requisitos duros)

- Números del proof rail y del ejemplo SIEMPRE derivados del snapshot activo;
  prohibido fijarlos a mano.
- El ejemplo real debe cumplir las 4 condiciones (programa real, relación
  APPROVED/REVIEWED, ≥1 oferta relacionada, centros publicados). Caso validado
  del prototipo: ADG02S "Administración y Finanzas" ↔ CNO-11 4111 "Empleados
  de contabilidad" (official_output, revisada 12/08/2026, TodoFP, quote
  "Administrativa / administrativo contable."); oferta ECYL "Empleados
  administrativos de contabilidad, en general" (Zamora, copia 23/07/2026);
  45 centros en 9 provincias. Si un día la relación deja de existir, la
  sección debe cambiar de ejemplo o vaciarse — nunca maquillarse.
- Disclosure IA visible en Method/Footer. Nada de branding institucional ajeno.
