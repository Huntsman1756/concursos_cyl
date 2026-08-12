# FP coverage batch 6

Reviewed on 2026-08-12 under the output-by-output policy. Historical seed labels
are not treated as publication gates: each official BOE output is assessed
independently against one bounded CNO-11 group.

## Accepted coverage

| Program          | CNO-11 | Output evidence                 | Approved links |
| ---------------- | ------ | ------------------------------- | -------------: |
| ADG01M / ADG01MD | 4113   | Empleado de tesorería.          |              2 |
| TMV02M           | 7401   | Mecánico de automóviles.        |              1 |
| IMA03M           | 8202   | Montador de equipos eléctricos. |              1 |

Total: 4 approved links. No occupation or alias is added: all three CNO-11
groups already exist in the reviewed catalog.

## Evidence boundary

- ADG01M uses article 7 of
  [Real Decreto 1631/2009](https://www.boe.es/eli/es/rd/2009/10/30/1631).
- TMV02M uses article 7 of
  [Real Decreto 453/2010](https://www.boe.es/eli/es/rd/2010/03/19/453).
- IMA03M uses article 7 of
  [Real Decreto 1589/2011](https://www.boe.es/eli/es/rd/2011/11/04/1589).
- Classification boundaries are checked against the
  [INE CNO-11 explanatory notes](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf).

Broad or mixed outputs remain unpublished. In particular, IMA03M to CNO-11
7403 is deferred: “Mecánico de mantenimiento” does not by itself establish the
agricultural-or-industrial machinery boundary. Electrical/electronic, ITV,
accessory, manufacturing and sales outputs in TMV02M also remain rejected when
the cited evidence does not identify one four-digit group.

## Reproducibility

`node scripts/data/applyFpCoverageBatch6.mjs` applies the reviewed links
idempotently. Codex then runs the normal data build, queue regeneration and
validation workflow before publication.
