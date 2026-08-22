# FP coverage priority wave 3

Reviewed on 2026-08-22. This packet freezes the nine queue bases selected for
the next official FP–CNO publication wave. It is the evidence boundary for the
curated source-data change; it does not use offer text to establish a relation,
does not create aliases, and does not reopen rejected CNO identities.

## Evidence boundary

Program-side evidence is copied as bounded excerpts from the official TodoFP
professional-profile records already registered in
`data/curated/professional-profiles.json`. Every accepted row preserves the
exact `sourceQuote` and `sourceUrl` from that record. Classification identity
and explanatory scope are taken from the registered official CNO-11 records in
`data/curated/official-occupations.json`, the [BOE CNO-11 decree](https://www.boe.es/eli/es/rd/2010/11/26/1591),
and the [INE CNO-11 explanatory notes](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf).

Job offers, sector-only similarity, aliases, and title-only inference are not
evidence for any row in this packet.

The packet's tightened boundaries are explicit: `FME01E|2482` uses the
official quote `Experto en diseño de producto para impresión 3D.`;
`EOC01B|7240` uses `Ayudante de solador / soladora.` and all six EOC01B
assistant/peon rows carry machine-readable `functionalBoundary` metadata; and
`EOC02M|7211` is deferred because the official INE artifact places
`Colocadores de prefabricados ligeros (pladur)` in 7199 while 7211 is
escayola, with no authoritative crosswalk.

## Exact accepted relation set

All 16 published rows use the conservative `reviewed_relationship` type. The output
quote is evidence for a reviewed functional relation, not an exhaustive
equivalence between a TodoFP output and an entire CNO group.

```text
IMS01S|2484
IMS01S|2713
AGA02S|6120
COM01E|2651
ELE01E|2729
EOC01B|7121
EOC01B|7191
EOC01B|7211
EOC01B|7231
EOC01B|7240
EOC01B|9602
EOC02M|7231
EOC02M|7240
FME01E|2482
IMA02S|7250
IMS04S|3831
```

The eight new approved occupation records are `2482`, `2484`, `2729`, `3831`,
`7191`, `7211`, `7231`, and `9602`. Their labels are copied from the official
occupation catalog; no alias is added.

## Explicit exclusions and state preservation

The packet rejects `EOC01B|7212`, `EOC02M|3202`, and `EOC02M|7212`, and defers
`EOC02M|7211` pending an authoritative crosswalk. CNO `3202` and `7212` remain
rejected in the curated catalog. `IMS03S` remains the one
existing `reviewed-no-publishable-match` outcome after revalidation against the
new occupation-catalogue hash. `IFC03E` remains pending because the current
outcome schema has no `insufficient` state; it is not added to the no-match
outcomes file.

## Expected derived deltas

The canonical generators must derive these values from the source data:

- approved links: `248 → 264`;
- approved/public occupations: `123 → 131`;
- curated occupation rows: `130 → 138`;
- aliases: unchanged at `21`;
- research queue bases: `104 reviewed / 35 pending / 15 no-match` →
  `113 / 26 / 15`;
- distinct reviewed modality keys: `121 → 130`;
- evidence matrix relations: `248 → 264`.

The pre-wave snapshot
`20260822074315030-a6fc9479d93c` is retained as a byte-identical evidence
artifact alongside the active replacement. The snapshot builder pins this ID
until release evidence references the replacement; ordinary two-snapshot
history cleanup must not rename or remove it.

No coverage freeze or submission document is regenerated in this source-data
commit.
