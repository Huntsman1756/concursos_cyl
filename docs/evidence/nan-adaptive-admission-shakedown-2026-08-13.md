# NAN adaptive admission shakedown

Date: 2026-08-13

## Result

The revised worker completed a real, read-only NAN contract after acquiring the
new serialized provider admission slot.

| Field                 | Observed value                   |
| --------------------- | -------------------------------- |
| Simulated             | `false`                          |
| Status                | `awaiting-frontier-review`       |
| Model                 | `nan/deepseek-v4-flash`          |
| Agent                 | `nan-bulletin`                   |
| Session               | `ses_003843a31ffeo6M5oBskDOnSbz` |
| Admission profile     | `observed-serial`                |
| Admission capacity    | `1`                              |
| Queue wait            | `1 ms`                           |
| Execution elapsed     | `16.1 s`                         |
| Input tokens          | `4,396`                          |
| Output tokens         | `769`                            |
| Reasoning tokens      | `87`                             |
| Total observed tokens | `5,252`                          |
| Token budget          | `100,000` (`small`)              |
| Execution timeout     | `900 s`                          |

The input was the retained batch-2 summary and the objective requested a
source-faithful extraction of its concurrency, consumption, and frontier
findings. The worker changed no files and returned the expected bounded draft.

The local terminal telemetry had ID
`34a42388e74d4b21b331b34ed1e25232` and SHA-256
`062bf624f7e42cce5fa0ffbd1aba20077f866f78ef47df3a27895a260cda544a`.
The raw `.agent-runs` record remains intentionally unversioned because it
contains the full generated draft; the fields above are the sanitized evidence
needed to qualify routing, real token usage, and admission behavior.

## Scope of the evidence

This proves one real NAN request can pass through the new serialized admission
path and produce non-zero usage telemetry. It does not prove that provider-level
parallelism is reliable. The retained 2/4/8-session zero-token results remain
the authority for keeping capacity at one until a later controlled shakedown
demonstrates otherwise.
