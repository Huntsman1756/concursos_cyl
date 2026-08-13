# NAN parallel FP batch 1

Date: 2026-08-13

## Outcome

- Eight priority programs were researched concurrently.
- Six programs gained approved occupation coverage in one publication build.
- Reviewed base qualifications increased from 43 to 49.
- Pending base qualifications decreased from 111 to 105.
- The immutable snapshot now publishes 167 training–occupation relations.
- `SAN06S` and `COM01S` remain pending because the available candidates did
  not meet the evidence threshold.

## Real NAN execution

| Stage                          | Contracts | Result                                                     | Observed tokens |
| ------------------------------ | --------: | ---------------------------------------------------------- | --------------: |
| TodoFP extraction with Gemma   |         8 | 7 completed; `SAN06S` timed out with no usable output      |          27,982 |
| Isolated CNO proposals         |         8 | 8 completed; one used MiMo after Qwen produced no change   |       1,835,033 |
| Mechanical batch incorporation |         1 | Token budget exceeded; no repository changes were produced |         426,525 |
| **Total**                      |    **17** | All executions were real (`simulated: false`)              |   **2,289,540** |

The successful proposal contracts ran in eight independent Git worktrees. Each
worker could modify only its own Markdown proposal and could not commit, push,
publish, or edit curated/public data.

## Frontier decisions

Codex independently reviewed every proposal. Eleven base-program decisions
were accepted and expanded to 16 rows after explicit modality replication.
Sector-only, nearest-neighbour, and hierarchy-changing mappings were rejected.
The failed mechanical incorporation contract left no patch, so Codex applied
the already closed 16-row decision set deterministically and validated it.

Validation completed with 850/850 tests, formatting, lint, and production build
passing. Worker telemetry remains local under each isolated `.agent-runs`
directory; this document records the aggregate without treating failed or
rejected output as accepted delegation.
