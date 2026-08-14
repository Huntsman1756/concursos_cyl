# TodoFP — Ranks 1-10

Queue priorities for batch-parallel coverage analysis, ordered 1→10 by hash-bound completed outcomes.

## Queue order

| #   | Key    | Program title                                         | Level          |
| --- | ------ | ----------------------------------------------------- | -------------- |
| 1   | QUI01S | Laboratorio de Análisis y Control de Calidad          | higher         |
| 2   | SAN09S | Radioterapia y Dosimetría                             | higher         |
| 3   | AGA03S | Ganadería y Asistencia en Sanidad Animal              | higher         |
| 4   | ENA03S | Energías Renovables                                   | higher         |
| 5   | HOT05S | Dirección de Servicios de Restauración                | higher         |
| 6   | IMS02S | Realización de Proyectos Audiovisuales y Espectáculos | higher         |
| 7   | INA02S | Procesos y Calidad en la Industria Alimentaria        | higher         |
| 8   | MSP34  | Prevención de Riesgos Profesionales                   | higher         |
| 9   | FME02B | Fabricación de Elementos Metálicos                    | basic          |
| 10  | IFC01E | Ciberseguridad en entornos de las TI                  | specialization |

## Contents

This batch materialises source material for the ten queues:

- `sources/<KEY>.txt` — one UTF-8 text file per key containing:
  - official TodoFP provenance (system + URL)
  - exact official title
  - every distinct `sourceQuote`, deduplicated to first-seen order

- `batch-contract.json` — schema v1 contract with ten independent research stories.

These artefacts are **input-only** for proposal generation; no proposals,
mappings, or public/curated edits are created by this batch.
