# Parallel Wave Integration and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the three approved tracks, pass the complete release matrix, and synchronize GitHub Pages and the canonical VPS on one commit.

**Architecture:** Review and verify each disjoint track before combining generated data boundaries. Publish only an ancestor-safe `main`, observe both deployments, and record facts without changing human submission approval.

**Tech Stack:** Git, Node.js 24, Vitest, Playwright, GitHub Actions, Caddy, OpenSSH.

**Spec:** `docs/superpowers/specs/2026-08-21-parallel-continuation-wave-design.md`

## Global Constraints

- Do not submit the contest entry or change any human approval flag to true.
- Do not report synchronization until local, GitHub, Pages, and VPS SHAs match.
- Do not trust agent reports without independent diff review and tests.
- Preserve immutable historical snapshot bytes.
- Prefix repository shell commands with `rtk`.

---

### Task 1: Review and integrate track commits

**Files:**

- Review all files changed by the VPS, runtime/release, Home, and FP plans.

**Interfaces:**

- Consumes independently tested track commits.
- Produces one clean integration branch with no overlapping unresolved edits.

- [ ] Inspect `rtk git diff origin/main...HEAD --stat`, `rtk git diff --check origin/main...HEAD`, and every changed production file.
- [ ] Confirm each track stayed inside its plan paths and no private material entered Git history.
- [ ] Run every focused test named in the three subsystem plans.
- [ ] Resolve only verified defects with a new failing regression test and a separate commit.

### Task 2: Run the complete local release matrix

**Files:**

- No planned edits; failures create a scoped corrective commit.

**Interfaces:**

- Produces fresh local evidence for the exact integration HEAD.

- [ ] Run `rtk npm run license:check`.
- [ ] Run `rtk npm run format:check`.
- [ ] Run `rtk npm run lint`.
- [ ] Run `rtk npm run contest:submission:check`.
- [ ] Run `rtk npm run test:release -- --testTimeout=60000`.
- [ ] Run `rtk npm run build` and record staged snapshots, bytes, duplicate bytes, and asset budget.
- [ ] Run the repository's Chromium E2E command through the already approved browser path.
- [ ] Require `rtk git status --short` to be empty.

### Task 3: Publish GitHub and verify Pages

**Files:**

- No repository edits during publication.

**Interfaces:**

- Produces `origin/main`, branch backup, and Pages at the exact integration SHA.

- [ ] Fetch origin and require `origin/main` to be an ancestor of HEAD.
- [ ] Push the feature branch, then fast-forward `HEAD:main`.
- [ ] Watch the Pages workflow through `verify-live`; require all jobs green.
- [ ] Compare GitHub API `main` and Pages `version.json` with local HEAD.

### Task 4: Deploy and verify the VPS

**Files:**

- No repository edits during publication.

**Interfaces:**

- Consumes the authorized `salida-cyl-vps` SSH alias and final main SHA.
- Produces VPS `current` at the same SHA.

- [ ] Run the read-only SSH preflight.
- [ ] Run `rtk ./scripts/release/deployVps.sh salida-cyl-vps`.
- [ ] Compare public and remote `version.json` with local HEAD and GitHub main.
- [ ] If access remains externally blocked, report the exact authentication failure and do not mark the release synchronized.

### Task 5: Record observed handoff state

**Files:**

- Modify: `docs/contest/NEXT_SESSION.md`
- Modify only from observed facts: `docs/contest/release-evidence.json`
- Modify generated contest documents if their renderer consumes release evidence.

**Interfaces:**

- Produces current counts, snapshot, CI run, Pages/VPS observations, remaining 47-base queue, and explicit human blockers.

- [ ] Add failing evidence-validation expectations for the new product SHA, snapshot, counts, and run before editing evidence.
- [ ] Record Pages and VPS separately; preserve `finalApplicationTextApproved: false`, `rootUrlApproved: false`, and `submissionAuthorized: false`.
- [ ] Regenerate rendered documents and run evidence, freeze, and submission validators.
- [ ] Commit evidence-only changes after the product deployments, clearly identifying the product SHA they verify.
