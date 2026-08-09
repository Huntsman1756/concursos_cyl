# FP coverage expansion reconciliation

Generated at: `2026-08-09T17:34:00Z`
Source cutoff: `2026-08-09T17:34:00Z`

## Coverage result

- Terminal attempts: 8 (1 completed, 7 deferred, 0 discarded).
- Truthful terminal distinct total: 6 (baseline 5 + 1 newly completed canonical bases).
- Target: 12; remaining gap: 6.
- Publication status: terminal evidence is supported for completed attempts; public snapshot publication remains pending Task A2.12.
- Below-target reason: Only COM02M completed; seven terminal attempts were deferred, six reserves remain unattempted, and completion/publication stopped before evidence supported 12 distinct qualifications.

## Attempt lanes

| Lane    | Rank | Program | Title                                         | Attempt     | State         | Active min | Wall min |
| ------- | ---: | ------- | --------------------------------------------- | ----------- | ------------- | ---------: | -------: |
| primary |    1 | COM02M  | Comercialización de Productos Alimentarios    | attempted   | completed     |         15 |    17.25 |
| primary |    2 | AGA03M  | Jardinería y Floristería                      | attempted   | deferred      |         10 |    48.27 |
| primary |    3 | TMV02M  | Electromecánica de Vehículos Automóviles      | attempted   | deferred      |         13 |       13 |
| primary |    4 | ADG01M  | Gestión Administrativa                        | attempted   | deferred      |         22 |       20 |
| primary |    5 | ELE01M  | Instalaciones Eléctricas y Automáticas        | attempted   | deferred      |         55 |       60 |
| primary |    6 | IMA03M  | Mantenimiento Electromecánico                 | attempted   | deferred      |         19 |        0 |
| primary |    7 | FME01M  | Mecanizado                                    | attempted   | deferred      |         15 |       14 |
| reserve |    8 | MAM01M  | Carpintería y Mueble                          | attempted   | deferred      |         10 |     9.43 |
| reserve |    9 | ELE03S  | Mantenimiento Electrónico                     | unattempted | not_attempted |          0 |        — |
| reserve |   10 | IMA02M  | Instalaciones Frigoríficas y de Climatización | unattempted | not_attempted |          0 |        — |
| reserve |   11 | AGA01M  | Producción Agroecológica                      | unattempted | not_attempted |          0 |        — |
| reserve |   12 | TMV01M  | Carrocería                                    | unattempted | not_attempted |          0 |        — |
| reserve |   13 | FME02M  | Soldadura y Calderería                        | unattempted | not_attempted |          0 |        — |
| reserve |   14 | COM01B  | Servicios Comerciales                         | unattempted | not_attempted |          0 |        — |

## Offers and time

- Exact offer deltas by attempted program: `{"COM02M":[],"AGA03M":[],"TMV02M":[],"ADG01M":[],"ELE01M":[],"IMA03M":[],"FME01M":[],"MAM01M":[]}`.
- Sorted offer union: none.
- Total modeled active minutes (research + implementation + test): 159.
- Total wall-clock minutes across attempt windows: 181.95.
- Recorded reviewer minutes: 0; these are excluded from active-work denominators.
- Reviewer time is explicitly excluded from modeled active minutes and remains excluded from all denominators.
- Attempt denominator: 7 primary + 1 reserve = 8 total attempted; 6 reserve candidates remain unattempted.

Deferred accepted audit relations are not counted as completed or public coverage. Checked attempts were validated against their stored terminal evidence, while matches, offer deltas, snapshot identity, output-derived relation keys, and the current manifest-addressed public relation set were independently recomputed; no public snapshot rebuild was performed.
