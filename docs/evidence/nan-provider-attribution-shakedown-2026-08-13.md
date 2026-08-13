# NAN provider-attribution shakedown

Date: 2026-08-13

## Result

Five OpenCode workers ran concurrently with independent XDG data, state and
cache directories. Every worker received a successful response observed at
`api.nan.builders`, with the expected `deepseek-v4-flash` model, positive
provider usage, a response ID and the fingerprint of the configured account
key. Temporary credential and SQLite directories were removed after execution.

Run ID: `83532e6ad399492797c99aa3389f063e`

| Worker | Status                     | Provider tokens | Queue ms | Telemetry SHA-256                                                  | Provider evidence SHA-256                                          | Response-ID set SHA-256                                            |
| -----: | -------------------------- | --------------: | -------: | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
|      1 | `awaiting-frontier-review` |           5,267 |        2 | `846f2c41fb3e95df6f4ccebf8f126bd33a641f42f7094ae84bca5bac18624e77` | `966ece7b455f98187acee460ee80a2e2db5affeb5c508bc8151efd42f8bb00c3` | `79b3e6965b9bb81f4d586037f5f1894e228c5f8037dbe626b646a3ac5c2bd450` |
|      2 | `awaiting-frontier-review` |           5,531 |        2 | `4a27d429d5aa36813a41f0078640bbfddf061b72809d7ef85e3696fa0b7f2b51` | `4db2bf4ffc868b18e4d136411d9140b88edeec1655b752f854c3879fd148a296` | `defc7a0ebb2f6eea384945958c29f175f3c6c78faba0829406ac0e9a1f66fe41` |
|      3 | `awaiting-frontier-review` |           5,150 |        2 | `6a723cf8a809b3985d06df80e9734cb7fa7483d31091d7872e78acfca0c26f19` | `fca253adce341e5c932812e417213299586df17b1894b7da51cb655134451876` | `f37648a240ed39d01558d723299d4b9428bbea3b66872355e8ec82bcd16ba90a` |
|      4 | `awaiting-frontier-review` |           5,455 |        2 | `f7581800f1974cbc0074d8c6b0f6c9a3b32979526198d13c639f62456695adc0` | `5b243859756e75edf02cdc7abaf1d509dd75bf73f0a165e54ec9ffd966b39030` | `b53017f893e93aeea04b743fd441b062219936738158a2344019816d597131ca` |
|      5 | `awaiting-frontier-review` |           4,855 |        2 | `7963bda6fcc6d823ccb1774e305b980f8f6a3a85df4d92fd215ee253b84c6c61` | `0a3e1ea256ba4f2e3c1787ff34d3bef8b542d9101c5130f93d8d76c2a025d913` | `bc16f150619c6441b60c3ed8b1d7361601b1a0780f2a2018c9e98aa4fc0471f6` |

Total provider-reported usage: **26,258 tokens**.

## Evidence boundary

The raw files remain ignored under `.agent-runs`. They contain no prompt,
response or plaintext credential; only request/response hashes and attribution
metadata. This is host-observed provider evidence, not signed V4 provenance.
Publication enforcement therefore remains `DISABLED` until the protected host
signer and CI verifier are deployed.
