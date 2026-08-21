# Runtime and Release Efficiency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove avoidable manifest requests and deploy duplication while adding deterministic live Pages verification.

**Architecture:** Keep manifest caching scoped to one Home mount, stage only the active and terminal-evidence snapshots, and verify the deployed Pages artifact in a separate least-privilege job. Each change keeps the existing public data contract.

**Tech Stack:** React 19, TypeScript 5, Vitest, Node.js 24, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-21-parallel-continuation-wave-design.md`

## Global Constraints

- Keep `loadManifest()` at `{ cache: "no-store" }`.
- Never mutate files below `public/data` during release staging.
- Retain the active snapshot and every qualified terminal-evidence snapshot.
- Do not assume Caddy response headers on GitHub Pages.
- Prefix repository shell commands with `rtk`.

---

### Task 1: Coalesce the Home manifest request

**Files:**

- Modify: `src/features/home/HomePage.tsx`
- Modify: `src/features/home/HomePage.test.tsx`

**Interfaces:**

- Consumes: `loadManifest(): Promise<LoadableGeneratedManifest>`.
- Produces: one no-store manifest request per Home mount while preserving independent state failures.

- [ ] **Step 1: Add a request-count regression test**

Extend the main Home fixture test so its `fetch` mock records manifest requests and asserts:

```ts
expect(
  fetchMock.mock.calls.filter(([input]) =>
    String(input).endsWith("/data/v1/manifest.json"),
  ),
).toHaveLength(1);
```

- [ ] **Step 2: Run the Home suite red**

Run: `rtk npm test -- src/features/home/HomePage.test.tsx`

Expected: FAIL because the current two effects request the manifest twice.

- [ ] **Step 3: Share one mount-scoped manifest promise**

Create the promise once inside a single effect, derive freshness immediately, and start coverage and search resource promises independently. Keep separate `.catch()` branches so one resource family cannot erase another ready state. Preserve the `isActive` guard.

- [ ] **Step 4: Run focused validation green**

Run: `rtk npm test -- src/features/home/HomePage.test.tsx`

Run: `rtk npx eslint src/features/home/HomePage.tsx src/features/home/HomePage.test.tsx`

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
rtk git add src/features/home/HomePage.tsx src/features/home/HomePage.test.tsx
rtk git commit -m "perf(home): coalesce manifest loading"
```

### Task 2: Narrow runtime snapshot retention

**Files:**

- Modify: `scripts/release/prepareRuntimeData.ts`
- Modify: `scripts/release/prepareRuntimeData.test.ts`

**Interfaces:**

- Consumes: current manifest plus `docs/contest/coverage-freeze.json` and `docs/contest/release-evidence.json`.
- Produces: `prepareRuntimeData(options): Promise<PreparedRuntimeData>` with a closed snapshot allowlist.

- [ ] **Step 1: Add terminal-evidence fixture tests**

Add fixtures proving that the active snapshot, a coverage-freeze `resourcePath`, and a release-evidence `logicalResourcePath` are retained, while a bare ID in `analysis/research.md` is ignored. Add failure cases for a configured missing evidence file, a referenced unavailable snapshot, and an evidence path missing a resource filename.

- [ ] **Step 2: Run the staging suite red**

Run: `rtk npm test -- scripts/release/prepareRuntimeData.test.ts`

Expected: at least the bare-analysis-ID assertion fails under repository-wide scanning.

- [ ] **Step 3: Implement the closed evidence contract**

Replace `EVIDENCE_DIRECTORIES` traversal with these exact paths:

```ts
const TERMINAL_EVIDENCE_PATHS = [
  "docs/contest/coverage-freeze.json",
  "docs/contest/release-evidence.json",
] as const;
```

Extract snapshot IDs only from `/data/v1/snapshots/<id>/<resource>` paths or canonical absolute URLs containing that path. Require both files, verify every referenced snapshot exists, retain the active snapshot, and keep atomic target replacement and source immutability unchanged.

- [ ] **Step 4: Validate and measure**

Run: `rtk npm test -- scripts/release/prepareRuntimeData.test.ts`

Run: `rtk npm run build`

Run: `rtk npm run qa:distribution:check`

Expected: tests and build pass; staged snapshot count falls from nine to two for the current evidence state.

- [ ] **Step 5: Commit**

```bash
rtk git add scripts/release/prepareRuntimeData.ts scripts/release/prepareRuntimeData.test.ts
rtk git commit -m "perf(release): retain terminal evidence snapshots"
```

### Task 3: Verify the live Pages deployment

**Files:**

- Create: `scripts/release/verifyPagesDeployment.ts`
- Create: `scripts/release/verifyPagesDeployment.test.ts`
- Modify: `scripts/release/deployPagesWorkflow.test.ts`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `package.json`

**Interfaces:**

- Produces: `verifyPagesDeployment({ baseUrl, expectedCommit, fetchImpl, attempts, retryDelayMs }): Promise<void>`.
- Produces CLI: `npm run release:pages:verify -- <base-url> <sha>`.

- [ ] **Step 1: Add failing verifier tests**

Use injected `fetchImpl` fixtures for success and for wrong commit, invalid manifest, missing active resource, wrong root title, deep-link body without the app root, and recovery on a bounded retry.

- [ ] **Step 2: Run the verifier suite red**

Run: `rtk npm test -- scripts/release/verifyPagesDeployment.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the verifier**

Normalize the base URL with `new URL`, fetch root, `version.json`, `data/v1/manifest.json`, every `resourcePath`, and `comparar`. Accept HTTP 200 for normal resources and accept 404 for the deep link only when its body contains the application root/title. Retry the full check at most six times with ten seconds between attempts in the CLI; tests inject zero delay.

- [ ] **Step 4: Add failing workflow assertions**

Assert the workflow contains no explicit `- run: npm run release:runtime-data` after the build, exposes `page_url`, and defines a `verify-live` job with `needs: deploy`, `contents: read`, checkout/setup-node pins, `npm ci`, and the new verifier command using `${{ needs.deploy.outputs.page_url }}` and `${{ github.sha }}`.

- [ ] **Step 5: Update workflow and package script**

Keep Pages write/OIDC permissions only in `deploy`. Give `verify-live` only `contents: read`. Add:

```json
"release:pages:verify": "tsx scripts/release/verifyPagesDeployment.ts"
```

- [ ] **Step 6: Run focused validation and commit**

Run: `rtk npm test -- scripts/release/verifyPagesDeployment.test.ts scripts/release/deployPagesWorkflow.test.ts`

Run: `rtk npm run lint`

```bash
rtk git add .github/workflows/deploy-pages.yml package.json scripts/release/verifyPagesDeployment.ts scripts/release/verifyPagesDeployment.test.ts scripts/release/deployPagesWorkflow.test.ts
rtk git commit -m "feat(release): verify deployed Pages artifact"
```
