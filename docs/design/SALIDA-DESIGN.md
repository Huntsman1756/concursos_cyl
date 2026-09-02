# SALIDA CyL — Sistema de Diseño (contrato definitivo pre-implementación)

Fase: dirección visual y design system de `feature/competition-visual-redesign`.
Baseline: `v2026.09.01-candidate.7` (SHA `9a48208`) — no modificado.
Commit de assets editoriales: `6bc47f2`. Este documento y
`tokens-proposal.css` son el contrato ejecutable para OpenDesign/implementación.
**Nada de `src/` está modificado en esta fase.**

---

## 0. Tesis de producto (regla de los 5 segundos)

> "Puedo partir de mi FP, de una profesión o de una oferta y descubrir
> relaciones comprobadas entre formación, empleo y centros de Castilla y León."

El diseño debe hacer visible la relación:

```
FP oficial  ↔  ocupación CNO revisada  ↔  ofertas reales (copia fechada)
                        ↔  centros donde estudiar
```

Implicaciones de diseño:

- Las tres **rutas de entrada** (formación / profesión / oferta) son la
  estructura primaria de navegación, igual que el triage por situación del
  National Careers Service.
- La **evidencia** (procedencia, snapshot, revisión) está jerarquizada, no
  escondida.
- La fotografía aporta humanidad; **los datos y las decisiones son los
  protagonistas**.

Personalidad: moderno · humano · útil · público · creíble · editorial ·
optimista · sobrio. Explícitamente NO: SaaS dashboard, landing de startup,
fintech, glassmorphism, web "generada por IA", backoffice, burocracia
anticuada, exceso de gris, exceso de cajas.

---

## 1. Tipografía (PRIORIDAD ALTA)

### 1.1 Diagnóstico del sistema actual (evidencia, no opinión)

1. `global.css` y `visualRefresh.css` declaran `font-family: Inter, …` pero
   **Inter no está distribuida**: sin `@font-face`, sin paquete, sin enlace.
   Solo la ven usuarios que la tienen instalada; el resto cae a system-ui.
2. El CSS actual usa **13 valores de peso distintos**, 9 de ellos arbitrarios
   (750 ×65 usos, 735, 760, 720, 680, 650, 560, 520, 800). Afinados para una
   fuente variable que nunca carga.
3. Un título suelto usa Georgia — segunda familia sin rol definido.

### 1.2 Decisión: **Public Sans, autohospedada**

| Candidata       | Veredicto   | Razón                                                                                                                                                                                                                                                                                  |
| --------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public Sans** | **ELEGIDA** | Diseñada para interfaces de gobierno (USWDS); neutra, legible, sin aire "startup"; SIL OFL; woff2 por peso ~40–45 KB; se subconjunta bien al español                                                                                                                                   |
| Inter           | Descartada  | Buena fuente, pero era el "look por defecto" (IA/SaaS) que se quiere evitar; además el frontend anterior la declaraba en `font-family` sin `@font-face` ni paquete que garantizase su uso, por lo que podía caer a `system-ui`. La descarta el rediseño por identidad, no por licencia |
| System UI       | Reserva     | Solo como fallback del stack; inconsistente entre plataformas                                                                                                                                                                                                                          |

Contrato de distribución:

- Ficheros: `public/fonts/public-sans-latin-{400,600,700}.woff2` (subconjunto
  latin: cubre á é í ó ú ñ ü ¿ ¡).
- `font-display: swap` obligatorio. Sin CDN. Sin Google Fonts en runtime.
- Fallback: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- Coste estimado: ~120–135 KB los 3 pesos (~45 KB/peso medir en implementación;
  ver §Presupuestos). Compartida por TODO: body, botones, inputs, selects,
  textareas, menús.
- **Pesos permitidos: únicamente 400 / 600 / 700.** Los pesos arbitrarios
  actuales (750, 735, 720, 760, 680, 650, 560, 520) se eliminan en la fase de
  implementación; 750→700, 735/720→700, 760→700, 680/650→600, 560/520→500→400.

### 1.3 Niveles tipográficos (los únicos diez)

| Nivel      | Tamaño         | Peso | Interlínea | Tracking | Uso                                      |
| ---------- | -------------- | ---- | ---------- | -------- | ---------------------------------------- |
| DISPLAY    | clamp(36→48px) | 700  | 1.10       | -0.02em  | Promesa del hero                         |
| H1         | clamp(28→32px) | 700  | 1.15       | -0.015em | Título de página                         |
| H2         | clamp(22→24px) | 700  | 1.25       | -0.01em  | Título de sección                        |
| H3         | 19px           | 600  | 1.35       | 0        | Título de card, subsección               |
| BODY LARGE | 18px           | 400  | 1.55       | 0        | Entreview, párrafos de intro             |
| BODY       | 16px           | 400  | 1.55       | 0        | Texto por defecto                        |
| SMALL      | 14px           | 400  | 1.45       | 0        | Metadatos, hechos secundarios            |
| LABEL      | 14px           | 600  | 1.30       | +0.01em  | Etiquetas de formulario, chips, eyebrows |
| CAPTION    | 12px           | 400  | 1.35       | 0        | Procedencia, notas legales, pie de foto  |
| BUTTON     | 16px           | 600  | 1.00       | +0.01em  | Botones (nunca <16px)                    |

Reglas: ningún texto por debajo de 12px; BODY es el mínimo para contenido
legal; SMALL nunca para acciones; un solo nivel DISPLAY por página.

---

## 2. Color

Identidad propia de SALIDA — **no** copia de la Junta ni de ningún referente.
Metáfora cromática: **Azul Duero** (confianza pública, agua fría, serio) +
**Trigo** (campos castellanos, optimismo, calidez humana). Se evoluciona el
teal actual hacia un azul más profundo y serio, y se sustituye el gris frío
SaaS por papel cálido.

### 2.1 Roles (todos los hex viven en tokens; prohibido inventar hex por componente)

| Token          | Hex                           | Función                                              | Contraste                                 |
| -------------- | ----------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| PRIMARY        | `#0E4E63`                     | Acción primaria, enlaces, identidad                  | 9.2:1 s/blanco; texto blanco encima 9.2:1 |
| PRIMARY_STRONG | `#083A4A`                     | Hover/active del primario                            | 12.3:1 s/blanco                           |
| PRIMARY_SOFT   | `#E4EEF1`                     | Fondos de tinte (chips info, destacados)             | TEXT encima 13.9:1                        |
| ACCENT         | `#8A6A1C`                     | Trigo: eyebrows, marcas "relación revisada", ruta FP | 5.1:1 s/blanco                            |
| ACCENT_WARM    | `#A14E12`                     | Terracota: SOLO ruta "He visto una oferta"           | 5.8:1 s/blanco                            |
| TEXT           | `#1C2B31`                     | Texto principal                                      | 14.6:1 s/blanco                           |
| TEXT_MUTED     | `#56666D`                     | Texto secundario                                     | 6.0:1 s/blanco                            |
| SURFACE        | `#FFFFFF`                     | Lienzo principal                                     | —                                         |
| SURFACE_ALT    | `#F7F5F1`                     | Papel cálido: bandas alternas, page bg               | TEXT 13.4:1                               |
| BORDER         | `#DCD8D0`                     | Hairlines decorativas                                | —                                         |
| BORDER_STRONG  | `#8F887E`                     | Borde de controles interactivos                      | 3.5:1 (≥3:1 no-texto)                     |
| SUCCESS        | `#1E6B3C` + surface `#E7F2EA` | Confirmaciones, datos verificados                    | 6.5:1 / 5.7:1                             |
| WARNING        | `#7E4E00` + surface `#FBEFD9` | Avisos (p. ej. copia fechada antigua)                | 7.1:1 / 6.2:1                             |
| ERROR          | `#B3261E` + surface `#FAEBEA` | Errores de formulario y sistema                      | 6.5:1 / 5.7:1                             |
| FOCUS          | `#8A5B0E`                     | Anillo de foco (oro bronce)                          | 5.9:1 s/blanco                            |

### 2.2 Reglas de color

- **Sin SECONDARY**: no aporta ninguna función que ACCENT no cubra; decidido,
  no olvidado.
- Máximo **dos acentos dominantes por pantalla**: Azul Duero + uno de
  {Trigo, Terracota}. Terracota aparece solo en la ruta de ofertas.
- Estados de chip/eyebrow: texto ACCENT sobre blanco, o TEXT sobre
  `ACCENT_SOFT`; nunca ACCENT sobre `ACCENT_SOFT` (4.25:1 — insuficiente en
  texto pequeño).
- Prohibidos: gradientes decorativos, glassmorphism, duotonos sobre foto,
  azul genérico `#3B82F6`, indigo SaaS.

---

## 3. Grid y breakpoints

| Breakpoint | Rango   | Columnas | Gutter | Content max                               |
| ---------- | ------- | -------- | ------ | ----------------------------------------- |
| mobile     | 320–767 | 4        | 16px   | 100% − 32px                               |
| tablet     | ≥768    | 12       | 24px   | 100% − 48px                               |
| desktop    | ≥1080   | 12       | 24px   | 1240px centrado                           |
| wide       | ≥1440   | 12       | 24px   | 1240px centrado (canvas fijo, NO estirar) |

- Medida de lectura (prosa, fichas método): máx **704px** (`--reading-max`).
- Altura de header: 64px desktop / 56px mobile.
- Validación mental obligatoria en implementación: **320 · 390 · 768 · 1024 ·
  1280 · 1440**. 320px es requisito de entrada, no caso raro.

---

## 4. Spacing (escala cerrada)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 80 · 96` (tokens `--space-1…10`).
Prohibido cualquier padding/margin/gap literal fuera de la escala. Alias
semánticos: `--inset-card` (24), `--inset-control` (12×16), `--stack-related`
(8), `--stack-block` (16), `--stack-section` (64 desktop / 48 mobile),
`--grid-gutter` (16/24).

Ritmo vertical de página: secciones separadas por `--stack-section`; dentro de
sección, bloques por `--stack-block`; título↔contenido por `--stack-related`.
El espacio en blanco es un material de diseño: mejor una sección aireada que
tres cajas apretadas.

---

## 5. Radius, sombra y elevación

- `--radius-small` 6px: inputs, botones, chips, media pequeño.
- `--radius-medium` 10px: cards, imágenes editoriales, paneles.
- Nada más redondeado (sin pills genéricos; el chip de filtro activo usa
  `--radius-small`).
- **Una sola sombra**: `--shadow-popover`, reservada a popover/overlay
  (InfoButton, panel de filtros móvil, tooltips). **Las cards no flotan.**
  Separación visual por superficie (SURFACE vs SURFACE_ALT) y hairlines.

---

## 6. Vocabulario de componentes (cerrado para esta fase)

Contrato anatómico y de comportamiento. Implementación posterior en React;
aquí se define el qué, no el código.

### 6.1 Estructura global

**GlobalHeader** — 64/56px, superficie blanca, hairline inferior. Anatomía:
identidad SALIDA (wordmark + "Castilla y León", enlace a Home) · navegación
principal (desktop) · acción de accesibilidad/buscador (opcional) · menú móvil.
Sin mega-menús; el nav primario son las cuatro rutas de tarea: Explorar,
Ofertas, Dónde estudiar, Comparar estudios; los secundarios (Más formación,
Datos abiertos, Metodología, Accesibilidad) viven en la fila superior del
header. Mobile expone todos. Etiqueta ≠ ruta: los labels evolucionan, las
URLs no (ROUTE_COMPATIBILITY_CONTRACT en `screen-contracts.md`).

**GlobalNav** — desktop: horizontal bajo el header, LABEL/600; ítem activo:
subrayado de 3px PRIMARY (no color de fondo). Mobile: botón "Menú" → panel a
pantalla completa con foco atrapado, Esc cierra, devuelve foco al trigger.

**Breadcrumbs** — bajo el header, CAPTION, separador "/". Refleja ruta
real (Home / Dónde estudiar / …). Colapsa a "…" en >3 niveles en mobile.

**Footer** — 3 zonas: (1) identidad + tesis en una línea; (2) enlaces
Método/Accesibilidad/Fuentes/Acerca de; (3) CAPTION con procedencia de datos
(JCyL, SEPE, BOE…) + fecha de copia + línea discreta de disclosure IA
("Imágenes editoriales generadas mediante IA."; el texto completo vive en
Metodología). Fondo SURFACE_ALT, sin columnas excesivas.

### 6.2 Home y rutas

**Hero** — DISPLAY + 1 párrafo BODY_LARGE + acción primaria + imagen editorial
(§10). Desktop: texto en la banda de espacio negativo izquierdo de la foto,
NUNCA sobre las caras. Mobile: texto arriba, foto 4:3 debajo. Altura ≤60vh.

**TaskCard** — las tres rutas. Anatomía fija: eyebrow (LABEL, color de ruta) →
título H3 → descripción 2 líneas (crece) → acciones (pegadas abajo,
§8). Imagen 4:3 superior con `--radius-medium`. Toda la card clicable con
título como enlace real; foco visible; target completo.

**SearchField** — input con label visible ("Busca ciclos, centros u
ocupaciones…"), botón de búsqueda integrado, icono lupa 20px. Placeholder como
ejemplo, nunca como única instrucción. Ancho mínimo 280px, crece en desktop.

### 6.3 Exploración

**FilterBar** (desktop ≥1080) — fila única: selects + buscador + contador de
resultados + "Quitar filtros". Hairline inferior. Colapsa a botón en mobile.

**FilterSelect** — select nativo estilizado (máxima accesibilidad, cero JS de
combobox salvo necesidad probada): label visible encima, BORDER_STRONG, radio
small, altura 44px, estado de foco con anillo, disabled gris + cursor.

**ActiveFilterChip** — LABEL, fondo PRIMARY_SOFT, texto TEXT, botón × con
target 40px, `aria-label="Quitar filtro: Provincia — León"`. Se renderizan
encima de resultados, nunca dentro de la FilterBar.

**ResultList** — contenedor semántico (tabla en desktop / lista de cards en
mobile, §12). Header con contador + ordenación (cuando exista).

**ResultCard** — versión mobile del resultado. Anatomía: meta (CAPTION,
localidad+provincia) → título H3 (centro/ciclo/puesto) → 1–2 líneas de
atributos clave (SMALL, separadas por "·") → fila de acciones. Misma anatomía
para centros y ofertas con variante de metadatos.

**DataStat** — métrica compacta de confianza: cifra (H2, tabular) + label
(SMALL) + SourceLink. Prohibida la inflación dashboard: máx. 3–4 DataStats
agrupados, sin gráficos decorativos.

### 6.4 Confianza

**EvidenceCallout** — banda PRIMARY_SOFT (o WARNING_SURFACE si la copia es
antigua) con icono 16px + texto SMALL + SourceLink. Explica de dónde sale lo
que se ve ("Relaciones revisadas · snapshot 30/08/2026"). Tertiary level de §11.

**SourceLink** — enlace externo con icono 12px "sale" y `rel="noopener"`.
Etiqueta = nombre de la fuente ("BOE", "SEPE", "Datos JCyL"), nunca "aquí".

**Pagination** — "Anterior/Siguiente" + resumen de rango ("51–100 de 342"),
botones ≥44px, estado disabled sin color solo (outline + aria-disabled).

### 6.5 Editorial y ayuda

**EditorialImage** — contrato completo en `docs/design/editorial-assets.md`
(srcSet/sizes/width/height/loading/decoding/fetchpriority/object-position/alt).
Hero: eager + high; resto: lazy. aspect-ratio reservado siempre.

**InfoButton** — §9.

**EmptyState** — cuando un filtro/búsqueda no devuelve nada: título H3 neutro
("Sin resultados para estos filtros"), 1 línea explicativa, acciones
("Quitar filtros", "Explorar todas las provincias"). Jamás un hueco en blanco;
jamás un emoji.

**Regla de ampliación**: cualquier componente nuevo debe justificar por escrito
por qué no se resuelve con composición de los anteriores. Ejemplo permitido
futuro: `ComparisonTable` (comparar ciclos) porque excede la anatomía de
ResultList.

---

## 7. Sistema de alineamiento (problema real del frontend actual)

Reglas estrictas:

1. **Baseline 4px**: todo alto de control, padding y margen cae en la retícula
   de 4px. Inputs, botones y selects: altura exacta **44px** (touch + alineado).
2. **Cabeceras**: GlobalHeader 64/56px; títulos de página H1 alineados al
   mismo margen izquierdo que el contenido (`--grid-gutter`), nunca centrados.
3. **Anatomía de card equivalente** (TaskCard y ResultCard comparten
   contrato):
   ```
   CARD (radius-medium, sin sombra)
     eyebrow/meta     — altura fija 20px, truncado con ellipsis
     title            — área de 2 líneas reservada (min-height tipográfica,
                        NO min-height mágica: se reserva con line-clamp visual
                        y el bloque NO crece)
     description      — ZONA QUE CRECE (flex-grow)
     supporting meta  — altura fija por línea (SMALL)
     spacer           — margin-top:auto
     actions          — fila de 44px alineada al borde inferior
   ```
4. Lo que **crece**: description. Lo que **no crece nunca**: eyebrow, fila de
   acciones, alturas de controles. Así dos cards lado a lado alinean eyebrow,
   título y acciones aunque el contenido varíe.
5. **Acciones/CTA**: siempre al borde inferior de la card o del bloque;
   primaria a la izquierda; una sola acción primaria por superficie.
6. **Metadatos**: fila de 24px con icono 16px + texto SMALL, `align-items:
center`; icono y texto comparten línea base óptica (gap 8px).
7. **Iconos**: 16px dentro de filas de texto, 20px en controles, 24px solo en
   EmptyState/hero chips. Alineación al centro vertical del texto, nunca "a
   ojo".
8. **Padding interno de secciones**: `--stack-section` vertical, gutter
   horizontal; sin excepciones "solo en esta página".

---

## 8. Patrón InfoButton (el icono "i" actual se reduce)

- **Glifo visible**: lucide `Info` 16px (máx 18), color PRIMARY, dentro de un
  botón de **40×40px mínimo** (44×44 en touch sin pointer fino) con área
  transparente.
- **Activación**: click/tap/Enter/Space. **Nunca hover-only** (hover puede
  añadir preview, no es el disparador).
- **Contenido**: popover con `role` de tooltip/dialog según contenido,
  superficie blanca, `--radius-small`, `--shadow-popover`, max-width 320px,
  texto SMALL.
- **Cierre**: Esc, click fuera, botón × (si lleva). **El foco vuelve al
  trigger.** `aria-expanded` + `aria-controls` en el trigger.
- Uso: explicar siglas, metodología puntual, por qué aparece una relación.
  No más de uno por fila de metadatos.

---

## 9. Iconografía

- Familia única: **Lucide** (ya en dependencias). Prohibido mezclar familias.
- Tamaños visuales: **16 · 20 · 24**. Stroke por defecto de Lucide (2px a
  24px; escala nativa).
- Los iconos acompañan texto; **nunca sustituyen jerarquía tipográfica** ni
  funcionan como "hero icons" gigantes. Los tres servicios del referente NCS
  se resuelven aquí con TaskCards fotográficas, no con iconos 48px.

---

## 10. Sistema fotográfico (los 5 assets existentes)

Reglas comunes: `--radius-medium`; caption opcional CAPTION; **sin badges
sobre la imagen**; disclosure global en Método/Footer (texto del inventario
editorial); sin texto sobre caras ni sobre zonas complejas (usar el espacio
negativo documentado por asset); nunca representan un centro/empresa/oferta
real.

| Composición           | Asset                       | Ratio desktop                                                             | Ratio mobile                 | object-position | Colocación mobile          |
| --------------------- | --------------------------- | ------------------------------------------------------------------------- | ---------------------------- | --------------- | -------------------------- |
| HOME HERO             | hero-career-guidance        | 3:2 (stage derecho ~45% o banda completa con texto en negativo izquierdo) | 4:3 bajo el texto            | 67% 22%         | Texto → foto → acción      |
| TASK CARD (FP)        | path-training               | 4:3                                                                       | 4:3 (más pequeño)            | 57% 35%         | Igual que desktop, apilado |
| TASK CARD (profesión) | path-occupation             | 4:3                                                                       | 4:3                          | 47% 25%         | Ídem                       |
| TASK CARD (oferta)    | path-offer                  | 4:3                                                                       | 4:3                          | 48% 38%         | Ídem                       |
| CENTERS INTRO         | centers-vocational-training | 16:9 banda ancha bajo el H1                                               | 4:3 recorte (object 66% 36%) | 66% 36%         | Entre intro y filtros      |

Prohibiciones: una imagen por resultado de búsqueda; foto como cabecera de
ficha de centro real; foto en cada sección; galerías. La presencia fotográfica
máxima por página: 1 hero/intro + 3 task cards (solo Home) o 1 intro.

---

## 11. Evidencia y procedencia (progressive disclosure)

- **PRIMARIO — qué significa para mí**: titular, relación expuesta
  ("Este ciclo habilita para esta ocupación"), acción.
- **SECUNDARIO — datos para decidir**: atributos estructurados (nivel,
  familia, modalidad, titularidad, localidad, nº de ofertas relacionadas).
- **TERCIARIO — fuente/método/evidencia**: EvidenceCallout compacto en la
  superficie + SourceLink; detalle completo en ficha y en Método. **Nunca se
  oculta**: se jerarquiza. Todo dato clave es rastreable a su fuente en ≤2
  interacciones.

---

## 12. Patrón de filtros (crítico en Dónde estudiar)

Datos verificados en esta fase (esquemas `public/data/v1` + snapshot
activo): `centers.province` ✓ · `trainingOfferings.modality`
(Presencial/A distancia/Mixta/No publicada) ✓ ·
`trainingOfferings.teachingType` (Pública/Concertada/Privada) ✓ ·
`centers.centerOwnership` (Centro educativo/municipal/agrario/privado) ✓ ·
`programs.level` ✓ · `programs.familyName/familyCode` ✓.
Hoy solo están implementados provincia+busca; **el diseño prevé los cinco**,
pero su implementación real queda condicionada a los datos de cada página.

**Semántica obligatoria (dos conceptos distintos, nunca mezclar):**

- **"Titularidad"** = `teachingType` → Pública / Concertada / Privada.
  Es la condición del centro como proveedor de la enseñanza.
- **"Tipo de centro"** = `centerOwnership` → Centro educativo / municipal /
  agrario / privado. Es la naturaleza del centro. Si se expone, va como
  filtro adicional o metadata secundaria bajo el nombre del centro —
  **nunca** con la etiqueta "Titularidad".

**Desktop (≥1080) — FilterBar horizontal:**

```
[Busca centro o ciclo___] [Provincia ▾] [Modalidad ▾] [Titularidad ▾]
[Nivel ▾] [Familia ▾]        · 342 ciclos · Quitar filtros
```

Debajo: ActiveFilterChips (solo los activos). El contador SIEMPRE visible.

**Mobile — sheet bajo demanda:** botón "Filtros (2)" (LABEL + contador) →
panel inferior ≤70vh, scroll interno, "Aplicar" (primario) + "Quitar todo".
**Nada de filtros permanentes ocupando media pantalla.** Los chips activos
persisten sobre los resultados.

Comprender siempre: qué estoy filtrando (chips etiquetados), cuántos quedan
(contador con sustantivo real: "ciclos"/"centros"), cómo quitar (× en chip +
"Quitar filtros"). Estado vacío: EmptyState con acción de limpieza.

---

## 13. Patrón de resultados

**Desktop — ResultList tabla/lista semántica** (no una tabla comprimida):
columnas centro: Centro · Localidad · Ciclo · Modalidad · Titularidad
(teachingType: Pública/Concertada/Privada) · Acciones. Sin columna propia de
"Tipo de centro": `centerOwnership` aparece como metadata secundaria bajo el
nombre del centro (p. ej. "CIFP X · Centro educativo"). Hairlines entre filas
(sin cebra), header LABEL/600 con fondo SURFACE_ALT. Enlaces en el nombre;
acciones: "Ver ciclo" + "Web del centro" (solo si existe) + "Cómo llegar".

**Mobile — ResultCard apilada**: meta CAPTION (Localidad · Provincia) →
título H3 (centro/ciclo) → SMALL atributos "Presencial · Pública · Grado
Superior" → acciones.

**Ofertas**, prioridad: Puesto (H3) → Localidad → relación relevante
("Requiere… / Relacionada con…") → siguiente acción única. La relación FP es
el diferenciador: se muestra como texto con marca de revisión, no como badge
ruidoso.

320px: nunca scroll horizontal; columnas colapsan a la card. 342 filas sin
paginar no existen: Pagination siempre.

---

## 14. Formularios (contrato)

Campos: **label visible** encima (LABEL), hint opcional (CAPTION, cuando
aporta), error bajo el campo (SMALL, ERROR + icono 16 + `aria-describedby`),
focus con anillo, disabled con BORDER + texto muted (sin adivinar por color).
Placeholder = ejemplo, jamás única indicación. Altura 44px, radio small,
BORDER_STRONG. Combobox solo si un select nativo no resuelve el volumen
(familia profesional: ~26 valores → select nativo OK). Botones: primario
(relleno PRIMARY), secundario (outline BORDER_STRONG + texto PRIMARY),
terciario/enlace. Un primario por superficie.

---

## 15. Accesibilidad

Objetivo WCAG 2.1 AA (sin declarar certificación profesional):

- Contrastes medidos (tabla §2). Foco siempre visible: anillo doble
  (`--focus-ring`), nunca `outline: none` a secas.
- Skip-link (ya existe, mantener), heading jerárquico sin saltos, landmarks,
  `lang="es"`.
- Targets ≥44×44 (40 mínimo con puntero fino); zoom 200% usable; 320px sin
  scroll horizontal.
- `prefers-reduced-motion` desactiva transiciones (token ya definido).
- Formularios con label+error asociados; InfoButton/Popovers con foco
  gestionado; imágenes con alt del inventario editorial (o `alt=""`
  decorativas).
- Validación manual en implementación: teclado puro en Home, explorador de
  centros, ficha de ciclo, filtros, paginación.

---

## 16. Motion

- Microinteracciones: hover/focus/transiciones de panel.
  Duración `--motion-fast` 140ms / `--motion-mid` 200ms, `--ease-out`.
- Propiedades permitidas: color, background, opacity, transform.
- **Prohibido**: animaciones de entrada de página, parallax, gradientes
  animados, contadores animados, scroll-jacking. `prefers-reduced-motion`
  respeta todo lo anterior automáticamente (bloque en tokens).

---

## 17. Presupuestos de assets editoriales (política A/B)

El asset budget global (1.800.000 B) **no se toca en esta fase**. La política
para implementación separa dos conceptos que hoy se confunden:

**A. DISTRIBUTION INVENTORY** — todo lo desplegado en disco:

- Token: `EDITORIAL_IMAGE_DISTRIBUTION_BUDGET = 1.600.000 B`
- Medido hoy: 34 ficheros en `dist/images/editorial/` = 1.568.030 B
  (margen 31.970 B). Responde a "cuánto ocupa el catálogo completo de
  variantes", no a lo que descarga un usuario.

**B. EXPECTED PAGE TRANSFER** — bytes reales de una composición típica:

- Token: `EDITORIAL_IMAGE_INITIAL_PAGE_TRANSFER_BUDGET = 350.000 B`
- Medido hoy (hero-1536 + 3 cards-1280 + centers-1600, AVIF): 333.762 B
  (margen 16.238 B). Reglas: hero eager/high; **todo lo demás lazy**; QA de
  implementación medirá transfer con traza de red (Chromium, cache off) y
  ambos presupuestos se añadirán como checks propios junto al asset budget
  existente (ficheros nuevos, sin ampliar el cap global sin decisión explícita
  y documentada).

**Fuentes (nuevo):** `FONT_DISTRIBUTION_BUDGET = 150.000 B` (3 woff2 Public
Sans ≈ 120–135 KB). Nota honesta: si las fuentes entran en el inventario del
`assetBudget.ts`, el cap total de 1.800.000 B quedará excedido (~54 KB de
margen actual); la implementación deberá elevarlo de forma deliberada y
documentada o registrar las fuentes en un presupuesto propio — **decisión
explícita, no automática**, igual que las imágenes.

---

## 18. Home — composición contractual (sin prototipar)

Orden y contenido máximo (página corta; sin scroll infinito):

1. **HEADER** (GlobalHeader + GlobalNav).
2. **HERO**: promesa DISPLAY (≤2 líneas) + 1 párrafo BODY_LARGE + CTA primario
   ("Explorar desde mi situación" → ancla a las tres rutas) + foto editorial.
3. **THREE PATHS**: TaskCard ×3 (formación / profesión / oferta) — la tesis
   hecha navegación.
4. **PROOF/TRUST**: 3–4 DataStats compactos (ej. nº ciclos, ocupaciones
   enlazadas, ofertas en copia fechada, centros) + EvidenceCallout de
   procedencia. Sin dashboard.
5. **REAL EXAMPLE**: UNA relación revisada de ejemplo (FP ↔ ocupación ↔
   oferta) en una fila ilustrativa enlazada a su ficha. Solo relaciones del
   snapshot, nunca inventadas.
6. **CENTERS TEASER**: banda 16:9 + 2 líneas + CTA secundario a Dónde estudiar.
7. **METHOD/TRUST**: 3 líneas BODY + SourceLink a Metodología + disclosure IA.
8. **FOOTER**.

Regla de longitud: todo lo anterior cabe en ~2.5–3 pantallas de 1440px.

---

## 19. DO / DON'T

**DO**

- Tipografía grande y legible: BODY 16, metadatos nunca <14, DISPLAY real.
- Blanco generoso: secciones aireadas, una idea por bloque.
- Color controlado: Azul Duero + un acento; el color señala acción y estado.
- Fotografía humana (los 5 assets) con espacio negativo real para texto.
- Jerarquía orientada a la acción: verbo primero ("Explora", "Compara",
  "Busca").
- Evidencia visible pero silenciosa: SourceLink y EvidenceCallout cerca del
  dato que respaldan.
- Cards con anatomía idéntica y acciones alineadas.
- Estados vacíos útiles; contadores honestos; procedencia fechada.

**DON'T**

- Grids de cards idénticas sin razón; "every section a box".
- Emoji como iconografía; lucide gigante como decoración.
- Gradientes "IA", glassmorphism, sombras flotantes en cards.
- Texto gris chiquito (SMALL para todo), CAPTION para contenido real.
- Pesos tipográficos arbitrarios (750, 680…); tres fuentes; Georgia suelto.
- CTA desalineados, botones de 36px, targets de 24px.
- KPIs decorativos que no responden a "¿qué hago ahora?".
- Foto en cada resultado o como representación de un centro real.
- Filtros permanentes ocupando media pantalla en mobile.

---

## 20. Compatibilidad OpenDesign

OpenDesign ejecuta este contrato sin inventar dirección:

- **Tokens**: `tokens-proposal.css` es la fuente única (nombres, valores,
  escalas). Prohibido introducir valores fuera de él.
- **Componentes**: §6 define anatomía, estados y comportamientos; la
  implementación es 1:1 con esos nombres.
- **Aceptación** (checklist ejecutable): (1) cero hex/px fuera de tokens;
  (2) pesos ∈ {400,600,700}; (3) contraste AA en todos los pares usados;
  (4) keyboard completo en flujos críticos; (5) 320/390/768/1024/1280/1440 sin
  roturas; (6) presupuestos A/B de §17 verificados con traza de red;
  (7) disclosure IA en Método/Footer; (8) ninguna imagen nueva fuera de las
  cinco familias aprobadas.
- Cualquier desviación = propuesta de cambio de contrato, no decisión local.

---

## 21. PageMasthead — lenguaje estructural compartido (Home ↔ interiores)

Las páginas interiores no son "otro diseño": comparten con la Home el mismo
esqueleto estructural y lo que cambia es la **densidad**, nunca el lenguaje.
Esto es "mismo producto, distinta densidad", no "todas las páginas
idénticas".

### Anatomía compartida (todas las rutas)

```
GlobalHeader + GlobalNav          ← idénticos en todas las páginas
Breadcrumbs                       ← CAPTION, "/", aria-current
┴ hairline (implícita por el ritmo)
EYEBROW (LABEL, uppercase, trigo) ← mismo tratamiento en todas las páginas
H1                                 ← clamp 28→32, 700; code-chip cuando exista
subcopy (BODY_LARGE, muted)        ← 1–2 frases, max-width 40rem
actions                            ← 1 primaria + secundarias, 44px, gap 12
[DataStat band]                    ← cuando exista: proof-rail sobre SURFACE_ALT
...secciones (SectionHeader: H2 + lede)...
Footer                             ← idéntico + línea discreta de IA
```

- **Mismo grid**: `container` 1240px, gutter 16/24; sin excepciones por
  página.
- **Mismas superficies cálidas**: SURFACE (blanco) y SURFACE_ALT (papel
  cálido) alternando por sección; las bandas DataStat viven siempre sobre
  SURFACE_ALT.
- **Mismo SectionHeader**: `section-head` = H2 + lede opcional; las secciones
  densas (tablas/listas) pueden usar lede en BODY (no BODY_LARGE).
- **Mismo ritmo vertical**: secciones separadas por `--stack-section`; título
  ↔ contenido por `--stack-related`; el heading de sección nunca se pega al
  contenido.

### Relación H1 / subcopy / actions (contrato)

El H1 responde a la pregunta de la página; la subcopy declara alcance (qué es
y qué no es); las acciones apuntan a la siguiente tarea real. Ese orden
(eyebrow → H1 → subcopy → actions) es fijo: ninguna página lo reordena. La
Home usa la variante DISPLAY del mismo patrón (promesa en vez de título de
tarea); FP/Occupation/Offers/Comparar/Más formación usan H1.

### Densidad (regla)

- **Home**: extremo aéreo — hero editorial, task cards, máx. 1 imagen intro
  por página interior cuando aplique.
- **FP, Occupation, Offers** (y Comparar/Más formación): MÁS densos — filas,
  tablas, previews, filtros y contadores por viewport. Su densidad crece con
  **unidades de contenido**, no con fotografía.
- **Prohibido**: añadir imágenes a fichas para "igualar" la Home; reducir el
  ritmo vertical de Home para "igualar" las fichas. La fotografía en
  interiores sigue el contrato de §10 (máx. 1 intro; nunca por resultado).
