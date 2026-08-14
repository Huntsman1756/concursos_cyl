# Contratos de fuentes

## Fuentes publicadas

| ID | Fuente | URL | Uso | Refresco | Salida |
| --- | --- | --- | --- | --- | --- |
| `jcyl-vocational-training-offer` | Oferta de formación profesional | El enlace `sources.training.sourceUrl` del manifiesto | Programas, centros y oferta formativa | Construcción manual/versionada del snapshot | `programs.json`, `centers.json`, `training-offerings.json` |
| `jcyl-employment-offers` | Ofertas de empleo | El enlace `sources.offers.sourceUrl` del manifiesto | Ofertas, texto, ubicación y fechas | Construcción manual/versionada del snapshot | `job-offers.json` |
| `educabase-outcomes` | EDUCAbase, inserción laboral de FP | El enlace `sources.outcomes.sourceUrl` cuando existe | Indicadores compatibles de empleo e ingresos observados | PC-Axis en build; si falta una extracción, el estado es `stale` | `outcome-indicators.json` |

Cada snapshot declara `sourceId`, URL, fecha de captura, versión de esquema, número de registros, hash SHA-256 y estado de calidad en `public/data/v1/manifest.json`.

## Alcance

Los datos de JCyL son la base regional de programas, centros y ofertas. EDUCAbase es una fuente complementaria ministerial: sus ámbitos nacional y regional no se mezclan en una cifra nueva. Las relaciones con ocupaciones son curadas y versionadas, no inferidas en tiempo de ejecución.

## Reproducción

```powershell
rtk npm run data:build
rtk npm test -- scripts/data/generatedSnapshots.test.ts
```

El generador reemplaza el directorio publicado de forma atómica después de validar el contrato y los gates de calidad.
