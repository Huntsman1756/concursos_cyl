# NAN execution summary — parallel batch 3

Batch ID: `6beb8535578a4a08aa9dfc2984b759e8`

Launch commit: `40c9b1b8c9adb924b6b4404501fac8f9116d7842`

Seven of eight isolated stories completed as `awaiting-frontier-review`. Their
provider evidence reports 1,675,904 total tokens and records the selected NAN
models (`qwen3.6`, `deepseek-v4-flash`, and `mimo-v2.5`). Each accepted research
artifact has a retained candidate patch and worker telemetry in the external
batch state directory.

`QUI02M` did not complete. Its DeepSeek provider log observed 240,873 tokens,
but the worker did not emit terminal telemetry or a candidate patch after its
audit proxy became orphaned. Those tokens are intentionally excluded from the
verified completed total, and no result from that execution is treated as
delegated evidence.

The batch finished as `partial-awaiting-frontier-review`: seven verified
candidates, one explicit failure. The frontier review independently accepted
only `FME01S→3126` for incorporation.
