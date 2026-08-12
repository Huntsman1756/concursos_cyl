# FP coverage batch 5

Reviewed on 2026-08-12 from parallel Codex research against official TodoFP/BOE
professional outputs and the INE CNO-11 explanatory notes. The broad NAN research
contracts were not used as evidence: four bounded runs consumed approximately
1.255B tokens and produced no acceptable diff. NAN is therefore reserved for
small mechanical contracts after Codex has fixed the exact relation list.

## Accepted coverage

| Program          | CNO-11 codes                                         | Approved links |
| ---------------- | ---------------------------------------------------- | -------------: |
| ELE02M           | 3813, 7533                                           |              2 |
| IMP01B           | 5811, 5812                                           |              2 |
| TMV01S           | 3160, 3405, 4412                                     |              3 |
| AFD01S / AFD01SD | 3722, 3723, 3724, 5992                               |              8 |
| IMA03S           | 3126                                                 |              1 |
| SAN08S / SAN08SD | 2640, 3314                                           |              4 |
| IFC01B           | 7533, 8202                                           |              2 |
| COM01M           | 1432, 3510, 3522, 4424, 5300, 5420, 5492, 5500, 9820 |              9 |

Total: 31 new approved links. The published snapshot now contains 82 approved
occupations, 102 approved aliases and 131 approved training-occupation links.

## Evidence boundary

- Output evidence: the exact professional-output quote stored on each link,
  sourced from TodoFP or the title's BOE royal decree.
- Classification evidence: INE CNO-11 explanatory notes; the preferred occupation
  label also exists in the complete BOE CNO-11 catalog.
- Rejected examples remain unpublished: generic sales/warehouse outputs without a
  unique four-digit boundary, operational mechanics for TMV01S management roles,
  manufacturing supervisors for repair workshops, and unrelated health or
  teaching occupations.
- Single-word commercial aliases are intentionally omitted even when the link is
  accepted, because the matcher requires a separate false-positive audit for such
  broad tokens.

## COM01M supersession

The original pilot correctly recorded that its first review had insufficient
evidence and deferred COM01M. This batch does not rewrite that historical attempt.
It supersedes the current publication decision after an output-by-output review:
nine TodoFP labels now have exact four-digit CNO headings or examples, while 5220,
4121, 4123 and 5210 remain rejected as ambiguous. The migration promotes 3510,
3522, 4424 and 5420 from their old rejected placeholders and adds 1432 and 5300.

## Reproducibility

`node scripts/data/applyFpCoverageBatch5.mjs` applies the reviewed catalog delta
idempotently. `npm run data:build`, `npm run analysis:fp:research-queue` and
`npm run analysis:fp:alias-candidates` regenerate the derived artifacts.
