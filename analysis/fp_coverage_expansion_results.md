# FP coverage expansion reconciliation

Generated at: `2026-08-11T17:27:42.000Z`
Source cutoff: `2026-08-11T17:27:42.000Z`

## Coverage result

- Terminal attempts: 14 (10 completed, 4 deferred, 0 discarded).
- Truthful terminal distinct total: 15 (baseline 5 + 10 newly completed canonical bases).
- Target: 12; remaining gap: 0.
- Publication status: AGA01M and AGA03M and COM01B and COM02M and ELE03S and FME01M and FME02M and IMA02M and MAM01M and TMV01M are published in the current immutable snapshot; deferred attempts remain unpublished.
- Coverage rationale: The evidence-backed total exceeds the target by 3; completion covers AGA01M and AGA03M and COM01B and COM02M and ELE03S and FME01M and FME02M and IMA02M and MAM01M and TMV01M, while 4 terminal attempts remain deferred and unpublished.

## Attempt lanes

| Lane    | Rank | Program | Title                                         | Attempt   | State     | Active min | Wall min |
| ------- | ---: | ------- | --------------------------------------------- | --------- | --------- | ---------: | -------: |
| primary |    1 | COM02M  | Comercialización de Productos Alimentarios    | attempted | completed |         15 |    17.25 |
| primary |    2 | AGA03M  | Jardinería y Floristería                      | attempted | completed |         10 |    48.27 |
| primary |    3 | TMV02M  | Electromecánica de Vehículos Automóviles      | attempted | deferred  |         13 |       13 |
| primary |    4 | ADG01M  | Gestión Administrativa                        | attempted | deferred  |         22 |       20 |
| primary |    5 | ELE01M  | Instalaciones Eléctricas y Automáticas        | attempted | deferred  |         55 |       60 |
| primary |    6 | IMA03M  | Mantenimiento Electromecánico                 | attempted | deferred  |         19 |        0 |
| primary |    7 | FME01M  | Mecanizado                                    | attempted | completed |         19 |       13 |
| reserve |    8 | MAM01M  | Carpintería y Mueble                          | attempted | completed |         10 |     9.43 |
| reserve |    9 | ELE03S  | Mantenimiento Electrónico                     | attempted | completed |         11 |       30 |
| reserve |   10 | IMA02M  | Instalaciones Frigoríficas y de Climatización | attempted | completed |         15 |     25.5 |
| reserve |   11 | AGA01M  | Producción Agroecológica                      | attempted | completed |         17 |       30 |
| reserve |   12 | TMV01M  | Carrocería                                    | attempted | completed |         14 |     97.7 |
| reserve |   13 | FME02M  | Soldadura y Calderería                        | attempted | completed |         18 |     27.5 |
| reserve |   14 | COM01B  | Servicios Comerciales                         | attempted | completed |         21 |       30 |

## Offers and time

- Exact offer deltas by attempted program: `{"COM02M":[],"AGA03M":[],"TMV02M":[],"ADG01M":[],"ELE01M":[],"IMA03M":[],"FME01M":[],"MAM01M":[],"ELE03S":[],"IMA02M":[],"AGA01M":[],"TMV01M":[],"FME02M":[],"COM01B":[]}`.
- Sorted offer union: none.
- Total modeled active minutes (research + implementation + test): 259.
- Total wall-clock minutes across attempt windows: 421.65.
- Recorded reviewer minutes: 18; these are excluded from active-work denominators.
- Reviewer time is explicitly excluded from modeled active minutes and remains excluded from all denominators.
- Attempt denominator: 7 primary + 7 reserve = 14 total attempted; 0 reserve candidates remain unattempted.

Deferred accepted audit relations are not counted as completed or public coverage. Checked attempts were validated against their stored terminal evidence, while matches, offer deltas, snapshot identity, output-derived relation keys, and the current manifest-addressed public relation set were independently recomputed; only relations matching the completed evidence are public.
