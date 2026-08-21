# FP coverage priority wave 2

Reviewed on 2026-08-21. This evidence packet freezes the five queue bases that
the second priority wave may publish. It is an input to curated publication;
it does not modify `data/curated`, generated data, or any snapshot.

## Evidence boundary

Program-side evidence is copied from the TodoFP professional-profile records
already registered in `data/curated/professional-profiles.json`. Each source
note retains the exact output quote and its official TodoFP URL. Classification
identity is checked against the registered official CNO-11 catalog in
`data/curated/official-occupations.json`, the BOE CNO-11 decree, and the INE
CNO-11 explanatory notes. No publication decision uses a job offer, a sector
label, a generic synonym, or an inferred alias.

Primary classification sources:

- [BOE CNO-11](https://www.boe.es/eli/es/rd/2010/11/26/1591)
- [INE CNO-11 explanatory notes](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf)

## Seven new occupation records required by publication

| CNO-11 | Preferred label in the registered official catalog            |
| -----: | ------------------------------------------------------------- |
|   3141 | Técnicos en ciencias biológicas (excepto en áreas sanitarias) |
|   3316 | Técnicos en prótesis dentales                                 |
|   3317 | Técnicos en audioprótesis                                     |
|   5931 | Bomberos (excepto forestales)                                 |
|   5932 | Bomberos forestales                                           |
|   5993 | Agentes forestales y medioambientales                         |
|   7403 | Mecánicos y ajustadores de maquinaria agrícola e industrial   |

`2640` is already curated and is used only by the accepted dental technical
sales relation; it is not one of the seven new occupation records.

## Exact accepted relation set

The shorthand key is `programKey|CNO-11 code`. `SAN02S|3316` is the only
relationship classified as a direct official output in this wave. The other
rows are conservative reviewed relationships.

```text
QUI01E|3141
SAN01S|3317
SAN01SD|3317
SAN02S|3316
SAN02S|2640
SEA01M|5931
SEA01MD|5931
SEA01M|5932
SEA01MD|5932
SEA01M|5993
SEA01MD|5993
TMV03M|7403
```

No alias is accepted in this wave. Management, military-emergency, generic
commercial, and generic machinery alternatives remain rejected in the
Frontier record. The exact rejected alternatives are recorded in each
proposal and in `frontier-review.md`.

## Expected data boundary after Task 2 and regeneration

- 240 approved relation rows;
- 91 reviewed base qualifications;
- 109 reviewed modality keys;
- 47 pending bases, 16 reviewed no-match bases, and 21 aliases after the
  subsequent queue/freeze task;
- immutable snapshot `20260821162954121-087e3c5155c6` remains unchanged.

The red expectations in `scripts/data/validateCuratedMappings.test.ts` are
intentionally ahead of the curated publication: they fail until Task 2 adds
the seven occupations and twelve relations.
