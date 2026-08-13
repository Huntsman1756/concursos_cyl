# NAN parallel FP batch 2

Date: 2026-08-13

## Outcome

- Eight priority programs were researched as one frontier-reviewed batch.
- Five programs gained approved partial occupation coverage.
- `SAN06S`, `COM01S`, and `SAN01M` remain pending because the current curated
  catalog has no sufficiently equivalent approved occupation.
- Reviewed base qualifications increased from 49 to 54.
- Pending base qualifications decreased from 105 to 100.
- The immutable snapshot `20260813171226999-2d8bfc777753` publishes 178
  training–occupation relations.

## Real NAN execution

| Model                   | Contracts | Observed tokens |
| ----------------------- | --------: | --------------: |
| `nan/gemma4`            |         8 |               0 |
| `nan/qwen3.6`           |        13 |       1,587,921 |
| `nan/deepseek-v4-flash` |        26 |       2,678,230 |
| **Total**               |    **47** |   **4,266,151** |

All contracts were real (`simulated: false`). Eight contracts completed
successfully and nine produced a bounded changed-path candidate; the ninth was
the mechanical incorporation contract, which exceeded its token budget and
therefore required independent frontier correction before acceptance.

## Concurrency finding

The first fan-out attempts used eight, then four, then two simultaneous NAN
sessions. Every concurrent session ended with zero observed tokens and no
changes. A single isolated DeepSeek probe immediately observed 65,074 tokens,
and isolated workers then completed all eight proposals. The effective runtime
for this account/environment is therefore serialized even though the
orchestrator can launch several processes. Future waves should keep research
worktrees parallel but admit only one active NAN request until provider-side
concurrency is verified again.

## Frontier decisions

Eleven relationships were accepted for `HOT01S`, `ADG01S`, `IMP01M`, `HOT03S`,
and `AGA01B`. Relationships based on adjacent sectors, different occupational
levels, draft or rejected catalog entries, or generic care/information roles
were rejected. The detailed accepted and rejected set is recorded in
`analysis/fp_coverage_batch_parallel_2/frontier-review.md`.

The mechanical Qwen incorporation preserved exactly the requested two paths
and eleven rows, but several generated URLs, quotes, and test titles were not
source-faithful. Codex corrected them against the bounded TodoFP sources and
independently validated JSON integrity, approved occupation status, the
specific mapping test, formatting, and lint before snapshot generation.
