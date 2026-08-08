# Design QA — Home option 2

**Artifacts**

- Source visual truth: `C:\Users\rome_\.codex\generated_images\019fc784-a718-76d2-a3ef-729b698367e2\exec-2636e55d-f1e0-4421-b5bc-ab305630e50a.png`
- Desktop implementation: `C:\Users\rome_\.codex\visualizations\2026\08\03\019fc784-a718-76d2-a3ef-729b698367e2\home-option2-qa\home-option2-desktop-1488x1026.png`
- Mobile implementation: `C:\Users\rome_\.codex\visualizations\2026\08\03\019fc784-a718-76d2-a3ef-729b698367e2\home-option2-qa\home-option2-mobile-360x800.png`
- Side-by-side comparison: `C:\Users\rome_\.codex\visualizations\2026\08\03\019fc784-a718-76d2-a3ef-729b698367e2\home-option2-qa\home-option2-reference-vs-implementation.png`
- Local route: `http://127.0.0.1:54564/`

**Capture normalization**

- State: home route, current validated manifest loaded, light theme, no open overlays.
- Source pixels: 1488 × 1026.
- Implementation pixels: 1488 × 1026 at a 1488 × 1026 CSS viewport and device scale factor 1.
- Mobile pixels: 360 × 800 at a 360 × 800 CSS viewport and device scale factor 1.
- Comparison pixels: 2976 × 1026, with the source at left and implementation at right, appended without resampling.

**Findings**

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the implementation uses the existing Inter/system stack and matches the source's compact sans-serif hierarchy, weight contrast, wrapping, and readable line height. The desktop heading remains one line; the 360 px heading wraps without clipping.
- Spacing and layout rhythm: the five-rem header, intro offset, two equal entry columns, coverage aside, slim information strip, and footer follow the source composition. The final desktop cards measure 476.70 px and 476.72 px wide at the same y position. Mobile cards and the coverage panel stack in document order with no overlap.
- Colors and visual tokens: deep green `#07583f`, stronger green `#064632`, warm surface `#fbfaf6`, border `#bdcdc7`, and filled terracotta `#c94b2d` match the selected direction. Text terracotta uses the darker accessible companion `#a83a23`; Axe found no remaining contrast violations.
- Image quality and asset fidelity: the target contains no raster imagery, illustration, logo asset, or non-standard icon that needs reproduction. No placeholder or generated image was introduced. The existing audited arrow icon is used only inside primary CTAs.
- Copy and content: unsafe uncovered chips were intentionally removed. Only Desarrollo de Aplicaciones Web, presencial/distancia delivery, and one reviewed CNO relationship are named. The footer intentionally replaces the mock's government attribution with the required independent-project statement.
- Accessibility and responsiveness: semantic headings/regions, skip link, `aria-current`, live manifest freshness, visible focus, full-width mobile CTAs, and zero horizontal overflow are present. Automated Axe checks pass on desktop and mobile.

**Interaction evidence**

- `Explorar salidas laborales` navigated to `/desde-fp` and rendered `Encuentra ofertas relacionadas con tu FP`.
- `Buscar ciclos que te preparan` navigated to `/desde-ocupacion` and rendered `Descubre qué FP conduce a un trabajo concreto`.
- Active navigation on the home was `Inicio`.
- Keyboard order begins with the skip link, product link, navigation, primary CTAs, coverage links, and footer link. The focused skip link exposed a visible 3 px focus ring; the end-to-end skip-link test confirmed focus moves to `main#main-content`.
- In-app console warning/error log: empty.
- Horizontal overflow: 0 px at both 1488 × 1026 and 360 × 800.
- Platform note: the in-app browser ran all background inspection and captures, but subagent threads cannot make that surface visible. The controller owns the visible preview handoff.

**Focused-region comparison evidence**

- A separate crop was not needed: the native side-by-side artifact preserves both complete 1488 × 1026 captures without resampling, and the source and implementation were also opened individually at original resolution. The header, cards, coverage panel, information strip, and footer remained readable for direct comparison.

**Comparison history**

1. Pre-style layout RED: desktop panels were vertically offset by 382.8 px and the mobile cards had no separation/full-width CTA treatment. The responsive workspace grid, equal entry columns, mobile stack, and CTA sizing fixed both failures; the focused Playwright layout gate then passed in both projects.
2. Automated accessibility RED before the final capture: terracotta foreground text measured 4.25–4.46:1 on warm/subtle surfaces. Filled actions retained `#c94b2d`; text links and eyebrow copy moved to `#a83a23`. The complete 32-test browser suite then passed on desktop and mobile.
3. Final native side-by-side comparison: no actionable P0/P1/P2 mismatch. The absent unsafe chips, expanded DAW name, omitted decorative information icon, and independent-project footer are required product-safety deviations rather than design drift.

**Open Questions**

- None.

**Implementation Checklist**

- [x] Match option 2 hierarchy, palette, density, and equal task panels.
- [x] Preserve truthful partial coverage and manifest-derived freshness.
- [x] Preserve approved route behavior and independent-project identity.
- [x] Pass desktop/mobile layout, accessibility, console, focus, navigation, and overflow checks.
- [x] Preserve privacy and generated-data contracts.

**Follow-up Polish**

- None required for handoff.

final result: passed
