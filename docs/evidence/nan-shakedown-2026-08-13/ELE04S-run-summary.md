# ELE04S NAN run summary

This record summarizes the real NAN and frontier activity used for the ELE04S
coverage batch. It deliberately does not claim certified delegation: the final
patch was assembled from NAN candidates after independent Codex review and
small deterministic repairs.

## Research

Three real read-only research runs were retained outside the repository:

| Model                   | Tokens | Review outcome                                      |
| ----------------------- | -----: | --------------------------------------------------- |
| `nan/mimo-v2.5`         | 19,317 | Empty draft; not used as evidence.                  |
| `nan/gemma4`            | 25,401 | Candidate mapping; corrected after boundary review. |
| `nan/deepseek-v4-flash` | 82,228 | Boundary audit used by Codex.                       |

Research total: **126,946 NAN tokens**.

## Code attempts

The supervised code runs consumed **4,547,108 NAN tokens**. The attempts
exercised the evidence file, curated occupations, ELE04S relationships and
their deterministic tests. They exposed and repaired several real issues:

- UTF-8 mojibake on Windows;
- an invented output in an early evidence draft;
- a missing ELE04S program fixture;
- missing curated CNO records for the six new relationships;
- stale ordering and count expectations in the mapping test.

The supervisor recorded 18 frontier decisions: 6 `RETRY`, 11 `ESCALATE` and 1
`ACCEPT`. The independently reviewed `ACCEPT` candidate was not used because it
contained an invented non-ELE04S output. The final repository changes instead
derive from later escalated NAN candidates after Codex corrected the external
gate and the two deterministic test expectations. Therefore no ELE04S code
attempt is presented as an accepted signed delegation result.

## Auditable totals

- NAN: **4,674,054 tokens** (research plus code attempts).
- OpenAI frontier reviews: **1,373,342 auditable tokens** across 18 decisions
  (1,353,680 input, 14,871 output and 4,791 reasoning tokens).
- Cached OpenAI input: **919,296 tokens**, already included in input and not
  added again.
- NAN/OpenAI frontier ratio: **3.40x**.

These figures exclude the main interactive Codex conversation because it does
not expose an exact repository-auditable token counter. Raw telemetry and
frontier decisions remain outside the candidate worktree; this summary omits
local paths, free-form model output and credentials.
