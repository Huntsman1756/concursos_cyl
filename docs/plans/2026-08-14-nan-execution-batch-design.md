# NAN execution batch design

Date: 2026-08-14

## Objective

Move bounded implementation work from the ChatGPT/Codex subscription to NAN
without treating token volume as success and without weakening independent
review. Codex remains the planner and reviewer. OpenCode with NAN produces
candidate patches only.

## Operating modes

1. `Invoke-FrontierSupervisedNanWorker.ps1` remains the single-story path when
   every attempt needs an immediate frontier decision.
2. `Invoke-NanWorkerBatch.ps1` is the preferred path for two or more independent
   implementation stories. It executes one fresh NAN context per story and
   emits a review bundle. It does not call Codex, accept a patch, commit or
   publish. Codex reviews the whole wave once.

## Batch contract

The input is a UTF-8 JSON file outside the source repository:

```json
{
  "schemaVersion": 1,
  "baseSha": "optional exact 40-character commit",
  "stories": [
    {
      "id": "stable-kebab-case-id",
      "objective": "One verifiable implementation result",
      "allowedPaths": ["src/feature/file.ts"],
      "validationCommands": ["npm test -- src/feature/file.test.ts"],
      "frontierPlan": "Exact implementation instructions",
      "acceptanceCriteria": ["Focused test passes"],
      "modelProfile": "mechanical",
      "budgetProfile": "small",
      "maxExecutionSeconds": 900
    }
  ]
}
```

Requirements:

- one to twenty stories;
- unique IDs matching `^[a-z0-9][a-z0-9-]{0,63}$`;
- non-empty objective, allowed paths, validation commands, frontier plan and
  acceptance criteria;
- allowed paths from different stories must not overlap by exact path or parent
  prefix, so candidates can be reviewed and applied independently;
- `baseSha`, when present, must equal the current repository `HEAD`;
- state and temporary worktrees stay outside the source repository;
- concurrency is one to five and defaults to five;
- each story gets one worker attempt, no automatic fallback and a fresh
  OpenCode state directory;
- `glm5.2` is never accepted.

## Model routing

Routing is explicit contract data, not a keyword guess:

| Profile        | NAN model           | Intended work                                                                                |
| -------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| `mechanical`   | `qwen3.6`           | Local code, tests, fixtures, formatting and deterministic transformations                    |
| `reasoning`    | `deepseek-v4-flash` | Bounded debugging, algorithms and difficult implementation after Codex diagnoses the problem |
| `long-context` | `mimo-v2.5`         | Large supplied context, multimodal input or a deliberately broad but bounded story           |

`gemma4` remains the read-only bulletin/extraction route. The batch code runner
does not silently substitute one model for another. A failed story returns to
Codex for a new contract or an explicit retry.

## Execution and evidence

For each story the host:

1. creates a detached worktree at the frozen base SHA;
2. invokes `Invoke-NanWorker.ps1` through a JSON-contract adapter;
3. preserves worker telemetry and a binary Git patch outside the repository;
4. records provider-attributed token usage, response-ID set hash, selected
   model, changed paths, validation result and termination reason;
5. removes the detached worktree and temporary OpenCode state;
6. writes one immutable `batch-result.json` only after all children finish.

A story is `awaiting-frontier-review` only when the existing worker reports the
same status, provider evidence is verified, validation passed and a non-empty
bounded patch exists. Other results remain evidence, never accepted work.

The batch result reports provider tokens only from
`providerEvidence.providerReportedTokens`. OpenCode client counters remain
separate and cannot be presented as NAN account usage.

## Review packet

Codex receives only the original contracts, bounded patches, changed paths,
validation summaries and provider attribution metadata. It does not receive
the workers' full conversations. Accepted patches are applied by the host only
after review and are validated again on the combined tree.

## NAN limits

The host-wide named semaphore retains NAN's five-request maximum. A batch never
starts more than five workers, and other Castilla y Leon batches share the same
admission primitive. Contracts should remain small enough to respect the
1.5-million-token-per-minute model limit; more tokens are not a quality KPI.

## Trust boundary

This remains `BOUNDED_LOCAL` host-observed evidence. It does not claim signed V4
delegation provenance, protected storage or automatic publication. Enabling
`REQUIRED` remains a separate host deployment and CI qualification task.
