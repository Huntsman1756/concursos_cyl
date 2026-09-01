# Editorial imagery — visual redesign base

Phase 1 of `feature/competition-visual-redesign` (branched from
`9a4820875b2eac78698704c335e011166f2b82f4`, tag `v2026.09.01-candidate.7`).

This document defines the editorial image system: normalized runtime assets,
responsive variants, crop and focal-point rules, the `EditorialImage`
component contract, alt texts and the AI disclosure. No product component
consumes these assets yet; this is a reversible design-system base. The
candidate baseline remains untouched and releasable.

## Source images and normalization

Five AI-generated editorial illustrations were produced for SALIDA CyL. They
do not depict real centers, companies, offers or people from the catalog. The
original descriptive PNG filenames (spaces, em dashes, guillemets) are not
runtime-safe; the pipeline normalizes them into slugs under
`public/images/editorial/`.

The originals live in `assets-src/editorial/`, outside the Vite `public/`
root, so they can never reach the runtime bundle by construction.

Original sources (~9.98 MB total) are kept out of the runtime bundle; only the
generated AVIF/WebP variants are deployable. The generator is
`scripts/assets/generate-editorial-images.mjs` driven by
`scripts/assets/editorial-assets.config.json` (single source of truth for
sources, widths, focal points, alt texts and byte budgets). Outputs are
committed, not built at deploy time; regenerate with:

```
node scripts/assets/generate-editorial-images.mjs          # regenerate all
node scripts/assets/generate-editorial-images.mjs --check  # verify outputs + budgets
```

Requires ImageMagick 7 on PATH. The generator refuses upscaling and fails if a
format variant of any asset's largest width exceeds its byte budget.

## Runtime inventory

| Slug                          | Role      | Aspect          | Widths (px)             | Largest AVIF | Largest WebP |
| ----------------------------- | --------- | --------------- | ----------------------- | ------------ | ------------ |
| `hero-career-guidance`        | hero      | 3:2 (1536×1024) | 640 · 960 · 1280 · 1536 | 63 668 B     | 62 290 B     |
| `path-training`               | card      | 4:3 (1448×1086) | 640 · 960 · 1280        | 53 460 B     | 54 880 B     |
| `path-occupation`             | card      | 4:3 (1448×1086) | 640 · 960 · 1280        | 91 228 B     | 95 796 B     |
| `path-offer`                  | card      | 4:3 (1448×1086) | 640 · 960 · 1280        | 53 035 B     | 57 290 B     |
| `centers-vocational-training` | wide-card | 16:9 (1672×941) | 640 · 960 · 1280 · 1600 | 72 371 B     | 78 472 B     |

34 files, 1 568 030 B total (AVIF set 755 216 B, WebP set 812 814 B).
Original sources (in `assets-src/editorial/`): 9 981 228 B → compression
ratio 6.4×.

Byte-budget targets: hero ≤ 250 KB, cards ≤ 200 KB, centers ≤ 200 KB — all
satisfied with wide margin.

## Responsive and crop rules

- `srcSet` lists every width per format; `sizes` is declared per composition
  at implementation time (see contract below).
- Each asset declares a `focalPoint` (fraction of frame) and
  `objectPosition` default in the config. Compositions may override
  `objectPosition`, never the safe crop.
- Desktop keeps the full frame. Mobile/portrait crops stay inside the
  per-asset `mobileCrop` band defined in the config; faces are never cropped
  (all faces sit in the protected band; see `cropNotes` per asset).
- The hero keeps the left ~55% of the frame (bright, low-detail window light)
  as negative space for headline overlay. Do not place text over faces.
- Never embed text inside the images; all copy is real DOM text.

## `EditorialImage` component contract (conceptual — not yet implemented)

```ts
type EditorialImageProps = {
  slug: (typeof editorialSlugs)[number]; // keyof editorial asset manifest
  sizes: string; // required, per composition
  aspectRatio?: string; // defaults to asset aspectRatio; reserves space
  objectPosition?: string; // defaults to asset objectPosition
  className?: string;
  alt?: string; // defaults to config alt; "" only if decorative
  caption?: ReactNode; // optional disclosure/figure caption
  priority?: boolean; // hero only: eager + fetchpriority="high"
};
```

Rendering rules:

- One `<img>` per composition with a `<picture>` wrapper only when the
  composition must force a specific format fallback chain:
  `<picture><source type="image/avif" srcSet…><source type="image/webp" srcSet…><img …></picture>`.
- Hero (role `hero`): `loading="eager"`, `decoding="async"`,
  `fetchPriority="high"`; everything else: `loading="lazy"`,
  `decoding="async"`, no `fetchPriority`.
- `width`/`height` are always emitted from the manifest (CLS-free); CSS uses
  `aspect-ratio` + `object-fit: cover` + `object-position` for crops.
- Decorative usage passes `alt=""`; informational usage uses the config alt
  text verbatim (see below). No `aria-label` on images.
- Optional `caption` renders as `<figcaption>` inside a `<figure>`; use it for
  the disclosure line when the composition requires local disclosure.

### Hero usage sketch

```tsx
<EditorialImage
  slug="hero-career-guidance"
  priority
  sizes="(min-width: 1280px) 1280px, 100vw"
  aspectRatio="3/2"
/>
```

## Alt texts (informational; from config)

| Slug                          | alt                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `hero-career-guidance`        | Joven explorando opciones de formación profesional en un taller técnico.                          |
| `path-training`               | Estudiante de FP consultando su plan de formación en una tableta dentro de un taller.             |
| `path-occupation`             | Dos estudiantes conversando con un formador sobre su futura profesión en un taller de mecanizado. |
| `path-offer`                  | Persona anotando los requisitos de una oferta de empleo junto a su portátil.                      |
| `centers-vocational-training` | Estudiantes de un ciclo de FP montando un prototipo electrónico en un aula-taller.                |

Rule: no "Imagen de…" prefixes; if a composition already states the exact same
message in adjacent text, the image may be used decoratively with `alt=""`.
Decide per composition during implementation; default to the alt above.

## AI disclosure (global, not per-image)

No badge is placed on top of the photographs. A single discreet note lives in
the **Metodología / Acerca de** surface (exact placement decided during
implementation):

> Las imágenes editoriales son ilustraciones generadas mediante IA y no
> representan centros, empresas, ofertas ni personas reales.

Never present an editorial illustration as a photograph of a catalog center,
company, offer or person.

## Asset-budget status (Phase 1 boundary)

- Official `qa:assets:check` (dist inventory: `assets/`, `robots.txt`,
  `salida-cyl-icon.png`, `salida-cyl-social.png`): **unchanged and green** —
  1 745 748 / 1 800 000 B; image category 1 032 395 / 1 150 000 B.
- The staged editorial variants live in `dist/images/editorial/` (copied from
  `public/` by Vite) and are **not** yet part of the official inventory, so
  the candidate.7 budget gates stay green and the redesign remains reversible.
- Transparent projection for the implementation phase: if `images/` joins the
  inventory, the dual-format set adds 1 568 030 B (image category would read
  2 600 425 B vs. the 1 150 000 B cap). Realistic per-page AVIF delivery
  (one width per image: hero-1536 + three card-1280 + centers-1600) is
  333 762 B ≈ 326 KB. Budget evolution (cap raise, format selection, or a
  dedicated editorial sub-budget) is an explicit implementation-phase
  decision — deliberately not taken here, per the "no budget raise" rule.
