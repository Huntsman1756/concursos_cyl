# Prototipo Home SALIDA — notas de producción

## Preflight (resultado)

- **PUBLIC_SANS_FILES**: no existían (`public/fonts/` inexistente). Obtenidas
  para el prototipo desde la release oficial
  `uswds/public-sans v2.001` (GitHub), ficheros
  `fonts/webfonts/PublicSans-{Regular,SemiBold,Bold}.woff2` renombrados a
  `public-sans-latin-{400,600,700}.woff2` en `fonts/` local del prototipo.
- **PUBLIC_SANS_WEIGHTS**: 400 · 600 · 700 (los únicos del contrato).
- **LICENSE_SOURCE**: `fonts/OFL.txt` (SIL Open Font License 1.1, incluida
  junto a los ficheros, requisito de redistribución OFL). Procedencia
  registrada: https://github.com/uswds/public-sans/releases/tag/v2.001
- **TOTAL_FONT_BYTES**: 100.912 B (33.612 + 33.636 + 33.664).
- **FONT_FACE_PATHS**: `fonts/public-sans-latin-400.woff2`,
  `-600.woff2`, `-700.woff2` (declarados en `prototype.css`, que sobrescribe
  temporalmente las rutas `/fonts/…` aún no existentes de
  `tokens-proposal.css`).
- **PROTOTYPE_FONT_SUBSTITUTION**: NO — el prototipo renderiza Public Sans
  real (verificado vía `document.fonts.ready` en las capturas).
- **IMAGE_ASSETS_STATUS**: ✓ 34 variantes en `public/images/editorial/`
  (1.568.030 B). El prototipo referencia solo AVIF/WebP optimizados con
  srcSet; ningún PNG original.
- **TOKEN_CONTRACT_STATUS**: ✓ sin contradicciones bloqueantes entre
  `SALIDA-DESIGN.md` y `tokens-proposal.css`. Matiz resuelto en la capa de
  prototipo: `--stack-section` tiene un único valor (64px) en tokens; el doc
  define 64/48 responsive → el ajuste móvil se hace por media query aquí y
  debe promoverse a tokens en implementación. Igual con `--control-height`
  (44px, definida en DESIGN.md pero ausente de tokens) y el gutter 16→24 en
  tablet. Tres adiciones documentadas, ninguna contradicción de dirección.

## Decisiones registradas

1. **Orden móvil del hero**: la misión de esta fase define
   eyebrow→H1→texto→selector→buscador→CTA→imagen; `SALIDA-DESIGN.md` §10
   decía "Texto→foto→acción". Manda la misión (refinamiento posterior). El
   contrato de pantalla (`home-screen-contract.md`) queda actualizado.
2. **Selector = tabs ARIA** (no tabs visuales genéricos): tablist con roving
   tabindex, un único panel de búsqueda. Default "Tengo una FP".
3. **RUNTIME_DERIVED_IN_IMPLEMENTATION**: 187 ciclos, 138 ofertas con relación
   FP revisada y 229 centros son valores REALES del snapshot
   `20260830120000000-8c6c79fbd2a1` (contados de `programs.json`,
   `offer-evidence.json` — `evidenceStatus: reviewed_fp_relationship` — y
   `centers.json`). En implementación se calculan del runtime, nunca fijados.
4. **PROPOSED_FILTERS**: el teaser de centros marca en un chip punteado que
   los filtros ampliados (provincia, modalidad, titularidad, nivel, familia)
   son propuesta del rediseño (hoy solo existen provincia + búsqueda).
5. **Ejemplo real verificado** (no inventado): ADG02S Administración y
   Finanzas ↔ CNO-11 4111 Empleados de contabilidad, `official_output`,
   `reviewed_title_alias_exact`, revisada 12/08/2026, fuente TodoFP con quote
   "Administrativa / administrativo contable."; oferta real ECYL
   "Empleados administrativos de contabilidad, en general" (Zamora, copia
   23/07/2026, offerId 1285665634571); 45 centros publican el ciclo en 9
   provincias (Valladolid 10, León 9, Burgos 7, Salamanca 7, Ávila 4,
   Palencia 3, Segovia 2, Zamora 2, Soria 1).
6. **Iconos**: SVG inline trazados de Lucide (graduation-cap, briefcase,
   map-pin, building-2, info, arrow-right, menu) — misma familia icónica del
   contrato, sin dependencia de React en el prototipo estático.

## Iteraciones durante la fase (log)

1. Rutas relativas de imágenes corregidas (4 niveles hasta `public/`).
2. Selector: `button` hace shrink-to-fit → `width: 100%` en `.task-tab`;
   marcado validado (`ul[role=tablist] > li[role=presentation]`).
3. Re-codificación UTF-8 de los HTML tras una edición intermedia (mojibake
   detectado y revertido; verificado: sin `Ã`/`Â` residuales).

## Cómo regenerar las capturas

```
npm run preview -- --port 4173 --strictPort   # terminal 1 (baseline actual)
node docs/design/prototypes/home/capture.mjs  # terminal 2, con BASELINE_URL=http://localhost:4173/
```

Requiere Chromium de Playwright ya instalado (`npx playwright install
chromium` si falta).

## Pendientes para implementación (no de este prototipo)

- Promover a tokens: `--control-height`, gutter 16→24, `--stack-section`
  responsive, y sustituir las rutas de `@font-face` de
  `tokens-proposal.css` por los ficheros reales en `public/fonts/`
  (subconjunto latin 400/600/700, OFL ya registrada).
- Wire real de los valores del proof rail y del ejemplo desde el runtime.
