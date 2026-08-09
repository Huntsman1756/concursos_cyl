# Home Option 2 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the SALIDA CyL home and shell to match the selected option 2 visual direction while preserving truthful reviewed coverage, accessibility, and all existing product behavior.

**Architecture:** Keep the existing React Router routes and generated-data clients. Replace the passive home entry cards with two equal task panels, add a live coverage aside driven by the validated manifest, and introduce a compact responsive shell/footer. Reuse existing domain and search flows; do not add new data, mappings, or unaudited search claims.

**Tech Stack:** React 19, TypeScript, React Router, CSS custom properties, Vitest, Testing Library, Playwright. Open-source dependencies only; add no dependency unless strictly necessary.

## Global Constraints

- Match the selected source visual at `C:\Users\rome_\.codex\generated_images\019fc784-a718-76d2-a3ef-729b698367e2\exec-2636e55d-f1e0-4421-b5bc-ab305630e50a.png` in composition, hierarchy, green/terracotta palette, compact density, and two equal entry panels.
- Correct the mock's unsafe content: never present uncovered cycles as quick choices and never attribute the project to the Junta de Castilla y León.
- Only describe current reviewed production coverage: Desarrollo de Aplicaciones Web in presencial and distancia delivery, plus one approved CNO occupation/relationship.
- Keep full-cycle discovery on `/desde-fp`; the home may expose only reviewed quick starts. Do not change generated data, curated mappings, schemas, matching, action-engine, privacy, or results contracts.
- The home must make partial coverage visible before a user starts a search.
- Use concise Spanish product copy. Avoid decorative icon clutter, fake statistics, gradients, emoji, new raster assets, and official-government branding.
- Preserve keyboard access, visible focus, skip link, semantic headings, live freshness state, and no horizontal overflow at 360 px.
- Do not persist search/profile state and do not add analytics, cookies, localStorage, sessionStorage, or AI-provider calls.
- Follow strict RED → GREEN → REFACTOR. Production edits require an observed failing test first.
- Every shell command begins with `rtk`; edit files with `apply_patch`.

---

### Task 1: Implement the selected option 2 home and responsive shell

**Files:**

- Modify: `src/features/home/HomePage.tsx`
- Modify: `src/features/home/HomePage.test.tsx`
- Modify: `src/components/EntryCard.tsx`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify if required for real navigation only: `tests/e2e/home.spec.ts`
- Create: `design-qa.md`

**Interfaces:**

- Consumes: `loadManifest(): Promise<GeneratedManifest>`, existing routes `/desde-fp`, `/desde-fp/IFC03S`, `/desde-fp/IFC03SD`, `/desde-ocupacion`, `/comparar`, and `/metodologia`.
- Produces: a home with `home-workspace`, two `entry-panel` task regions, `coverage-panel`, `information-strip`, compact `site-header`, and independent `site-footer` presentation classes.

- [ ] **Step 1: Write focused failing home and shell tests**

Add behavior assertions that require:

```tsx
expect(
  screen.getByRole("heading", {
    level: 1,
    name: "Elige tu camino y actúa con información oficial",
  }),
).toBeVisible();
expect(
  screen.getByRole("region", { name: "Disponible ahora" }),
).toHaveTextContent("Desarrollo de Aplicaciones Web");
expect(
  screen.getByRole("region", { name: "Disponible ahora" }),
).toHaveTextContent("1 ocupación CNO revisada");
expect(screen.queryByText(/Cuidados Auxiliares/i)).not.toBeInTheDocument();
expect(screen.queryByText(/Junta de Castilla y León/i)).not.toBeInTheDocument();
expect(
  screen.getByRole("link", { name: "Explorar salidas laborales" }),
).toHaveAttribute("href", "/desde-fp");
expect(
  screen.getByRole("link", { name: "Buscar ciclos que te preparan" }),
).toHaveAttribute("href", "/desde-ocupacion");
```

Add shell assertions for the compact product descriptor, exact nav labels `Inicio`, `Comparar`, `Metodología`, an independent-project footer statement, and a methodology/data link in the information strip. Preserve the existing asynchronous freshness assertions.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
rtk npm test -- --run src/features/home/HomePage.test.tsx src/app/App.test.tsx
```

Expected: FAIL because the selected option 2 heading, coverage region, compact labels, footer, and task-panel links do not exist yet.

- [ ] **Step 3: Implement the semantic option 2 structure**

Implement a concise structure equivalent to:

```tsx
<section className="home-intro" aria-labelledby="home-heading">
  <p className="home-intro__eyebrow">Formación Profesional y empleo en Castilla y León</p>
  <h1 id="home-heading">Elige tu camino y actúa con información oficial</h1>
</section>
<div className="home-workspace">
  <section className="entry-panels" aria-label="Elige tu punto de partida">
    {/* two equal EntryCard panels */}
  </section>
  <aside className="coverage-panel" aria-label="Disponible ahora">
    {/* partial coverage, reviewed DAW delivery modes, one CNO occupation, freshness */}
  </aside>
</div>
<section className="information-strip" aria-label="Sobre la cobertura">
  {/* concise progressive-coverage statement + methodology link */}
</section>
```

Each `EntryCard` must show a compact title band, one-line outcome, a non-editable example field or truthful reviewed quick start, three concise outcome lines, and one full-width CTA. Keep CTA destination behavior unchanged. Do not imply uncovered values are actionable. Prefer text-only check rows or the existing audited icon component; do not add visual clutter.

Update `AppShell` to include `SALIDA CyL`, descriptor `Decide tu siguiente paso`, compact nav labels, and an independent-project footer. Use `NavLink` if needed for an active state, with `aria-current` supplied by React Router.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
rtk npm test -- --run src/features/home/HomePage.test.tsx src/app/App.test.tsx
```

Expected: all focused tests PASS without warnings.

- [ ] **Step 5: Rebuild the tokens and responsive layout**

Use the selected visual's measured direction:

```css
:root {
  --color-primary: #07583f;
  --color-primary-strong: #064632;
  --color-action: #c94b2d;
  --color-surface-warm: #fbfaf6;
  --color-border: #bdcdc7;
  --content-max: 92rem;
}
```

Desktop: full-width deep-green 5rem header, intro around 2.25rem top spacing, `home-workspace` grid near `minmax(0, 2.2fr) minmax(18rem, 0.95fr)`, two equal entry columns, thin borders, modest radii, no heavy shadows, and a slim information strip/footer. Mobile at 360 px: one-line product row, compact horizontally scrollable nav or similarly accessible compact treatment, all workspace columns stacked, buttons unwrapped and full width, no absolute-position overlap, and no horizontal overflow.

- [ ] **Step 6: Run all automated gates**

Run:

```powershell
rtk npm run lint
rtk npm run build
rtk npm test -- --run
rtk npm run test:e2e
rtk npm run validate:data
rtk npm run check:licenses
rtk npx prettier --check src/features/home/HomePage.tsx src/features/home/HomePage.test.tsx src/components/EntryCard.tsx src/app/AppShell.tsx src/app/App.test.tsx src/styles/tokens.css src/styles/global.css
rtk git diff --check
```

Expected: every command exits 0. If the repo exposes different exact scripts, inspect `package.json` and run the equivalent existing non-mutating gates.

- [ ] **Step 7: Perform browser and visual QA**

Open the running app in the in-app browser at `http://127.0.0.1:54564/`. Capture desktop at the source image's 1488 × 1026 ratio and mobile at 360 × 800. Verify primary CTAs, active navigation, keyboard order, focus visibility, console errors, and horizontal overflow. Put the reference and desktop capture into one side-by-side comparison artifact. Write `design-qa.md` with paths, dimensions, state, required fidelity surfaces, comparison history, and `final result: passed`. Fix every P0/P1/P2 through RED → GREEN before handoff.

- [ ] **Step 8: Commit the reviewed increment**

```powershell
rtk git add src/features/home/HomePage.tsx src/features/home/HomePage.test.tsx src/components/EntryCard.tsx src/app/AppShell.tsx src/app/App.test.tsx src/styles/tokens.css src/styles/global.css tests/e2e/home.spec.ts design-qa.md
rtk git commit -m "feat: redesign the truthful entry workspace"
```
