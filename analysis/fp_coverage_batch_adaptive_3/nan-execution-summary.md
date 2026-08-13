# NAN execution summary — adaptive batch 3

All eight contracts were real (`simulated: false`), used
`nan/deepseek-v4-flash`, acquired the `observed-serial` admission slot and
finished as `awaiting-frontier-review`. Total observed usage was 240,323 tokens.

| Program  | Session                          | Tokens | Queue wait (ms) | Raw telemetry SHA-256                                              |
| -------- | -------------------------------- | -----: | --------------: | ------------------------------------------------------------------ |
| `ELE02S` | `ses_0035da6dfffe91KjYb7fy4g0d3` | 70,360 |          94,562 | `44a59279384436e009180ed59ea5c4214addaa41c3866a3592b06b8daeadc65f` |
| `EOC01S` | `ses_0035f1646ffeZy6lWN18ZMtPrC` | 24,275 |               3 | `504a171c9b2542d7eac39386fcdab680d056e1b9d4257c43d9e3b38fccf34fb6` |
| `IMP01S` | `ses_0035b8c86ffe5V8XNMDNCHLb7F` | 24,234 |         232,207 | `dd46d25e75d9b4334dc740def3bbc1f5544ed3548261805dadf06dfe538c6b63` |
| `HOT02M` | `ses_0035ca555ffeTVVbJnHjlzL1Ip` | 22,338 |         160,329 | `f7f4ea541a8b76aedd08683cf66cb00c45ad30b3805da80261781c7ac3bb2835` |
| `MAM01B` | `ses_0035adc8effeWpLRMo7n5Yh9vD` | 24,862 |         277,503 | `71d51ad6e25a5e48cf713b4f128d865aeac84fadd0e0b5d2d5986d81d64d6d70` |
| `COM03S` | `ses_0035e5903ffeOzsm46jVxaKnmC` | 24,372 |          49,131 | `01dbd5cd3dfc3b0c1591caf38414c0be3dea7b6397e12b85ea7bf6e60dafebe1` |
| `SAN32`  | `ses_0035a1f74ffecNRQqKhrSVoj86` | 25,837 |         325,355 | `fc11f0ec33cc1d2a0acf0ea9fa1f54371ee7533c1f578eea0172de0927d5a271` |
| `INA01M` | `ses_0035c3989ffeBjpNE1RYb0Sd7b` | 24,045 |         187,968 | `222ae3102a6dc9fb128420c5fd066947e4b2c018a23c5935fffc9f66fd22ec46` |

The raw `.agent-runs` files remain intentionally unversioned because they retain
the full generated drafts. Their hashes and session IDs above bind this review
to the local terminal evidence without publishing model output as authority.

## Mechanical incorporation

Qwen 3.6 generated the bounded two-file incorporation candidate in session
`ses_00356e76bffejuew7hydFLM3Z0`. The broker observed 534,263 tokens and
correctly blocked the attempt because it exceeded the 500,000-token `batch`
budget. The candidate respected both allowed paths, but Frontier found invented
TodoFP URLs, paraphrased quotes and incorrect fixture titles. Frontier corrected
all 13 entries against `professional-profiles.json`, independently confirmed
that every occupation is `approved`, and ran the focused mapping test. The
blocked worker result is therefore evidence of mechanical delegation, not
acceptance authority.
