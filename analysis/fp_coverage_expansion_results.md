# FP coverage expansion reconciliation

Generated at: `2026-08-11T14:01:30.000Z`
Source cutoff: `2026-08-11T14:01:30.000Z`

## Coverage result

- Terminal attempts: 10 (4 completed, 6 deferred, 0 discarded).
- Truthful terminal distinct total: 9 (baseline 5 + 4 newly completed canonical bases).
- Target: 12; remaining gap: 3.
- Publication status: AGA03M and COM02M and FME02M and IMA02M are published in the current immutable snapshot; deferred attempts remain unpublished.
- Below-target reason: Evidence-backed completion covers AGA03M and COM02M and FME02M and IMA02M; 6 terminal attempts were deferred, 4 reserves remain unattempted, and no additional programme met the evidence threshold needed for 12 distinct qualifications.

## Attempt lanes

| Lane    | Rank | Program | Title                                         | Attempt     | State         | Active min | Wall min |
| ------- | ---: | ------- | --------------------------------------------- | ----------- | ------------- | ---------: | -------: |
| primary |    1 | COM02M  | Comercialización de Productos Alimentarios    | attempted   | completed     |         15 |    17.25 |
| primary |    2 | AGA03M  | Jardinería y Floristería                      | attempted   | completed     |         10 |    48.27 |
| primary |    3 | TMV02M  | Electromecánica de Vehículos Automóviles      | attempted   | deferred      |         13 |       13 |
| primary |    4 | ADG01M  | Gestión Administrativa                        | attempted   | deferred      |         22 |       20 |
| primary |    5 | ELE01M  | Instalaciones Eléctricas y Automáticas        | attempted   | deferred      |         55 |       60 |
| primary |    6 | IMA03M  | Mantenimiento Electromecánico                 | attempted   | deferred      |         19 |        0 |
| primary |    7 | FME01M  | Mecanizado                                    | attempted   | deferred      |         15 |       14 |
| reserve |    8 | MAM01M  | Carpintería y Mueble                          | attempted   | deferred      |         10 |     9.43 |
| reserve |    9 | ELE03S  | Mantenimiento Electrónico                     | unattempted | not_attempted |          0 |        — |
| reserve |   10 | IMA02M  | Instalaciones Frigoríficas y de Climatización | attempted   | completed     |         15 |     25.5 |
| reserve |   11 | AGA01M  | Producción Agroecológica                      | unattempted | not_attempted |          0 |        — |
| reserve |   12 | TMV01M  | Carrocería                                    | unattempted | not_attempted |          0 |        — |
| reserve |   13 | FME02M  | Soldadura y Calderería                        | attempted   | completed     |         18 |     27.5 |
| reserve |   14 | COM01B  | Servicios Comerciales                         | unattempted | not_attempted |          0 |        — |

## Offers and time

- Exact offer deltas by attempted program: `{"COM02M":[],"AGA03M":[],"TMV02M":[],"ADG01M":[],"ELE01M":[],"IMA03M":[],"FME01M":[],"MAM01M":[],"IMA02M":[],"FME02M":[]}`.
- Sorted offer union: none.
- Total modeled active minutes (research + implementation + test): 192.
- Total wall-clock minutes across attempt windows: 234.95.
- Recorded reviewer minutes: 18; these are excluded from active-work denominators.
- Reviewer time is explicitly excluded from modeled active minutes and remains excluded from all denominators.
- Attempt denominator: 7 primary + 3 reserve = 10 total attempted; 4 reserve candidates remain unattempted.

Deferred accepted audit relations are not counted as completed or public coverage. Checked attempts were validated against their stored terminal evidence, while matches, offer deltas, snapshot identity, output-derived relation keys, and the current manifest-addressed public relation set were independently recomputed; only relations matching the completed evidence are public.
