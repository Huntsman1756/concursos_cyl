# Parallel FP occupation-coverage batch

This batch replaces the former one-program-at-a-time research loop with an
isolated fan-out/fan-in workflow.

## Batch 1

The first research wave covers the eight highest-ranked unreviewed base
programs in `analysis/fp_coverage_research_queue.json`:

1. `SAN07S`
2. `HOT04S`
3. `ELE01S`
4. `SAN06S`
5. `COM02S`
6. `AFD02M`
7. `IFC02B`
8. `COM01S`

Each file under `sources/` is a bounded local transcription of the official
TodoFP page consulted on 2026-08-13. NAN bulletin workers read these inputs in
parallel and cannot modify repository files. Their output is research evidence,
not an approved CNO mapping. Codex must independently verify every CNO-11
classification and reject unsupported semantic expansions before publication.

Mechanical edits will be performed in isolated worktrees after the frontier
review, then integrated into one batch snapshot and one pull request.
