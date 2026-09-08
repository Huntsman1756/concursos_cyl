# Comprobación de fuentes y despliegue: 8 de septiembre de 2026

## Estado público observado al iniciar la revisión

- VPS: `version.json` respondió HTTP 200 con commit `02d6805e5cb661f3289ade47ad2364b26fd346f8`, correcciones del 6 de septiembre.
- Verificador existente `release:caddy:verify`: superado contra ese commit desde este equipo. Comprueba cabeceras, rutas y recursos; no sustituye una inspección visual ni una segunda red.
- GitHub Pages: `/concursos_cyl/version.json` respondió HTTP 404. No se presenta el respaldo como verificado.
- La rama documental de partida certificaba candidate.10, un producto anterior. Se conserva ese registro como `release-evidence-candidate10-historical.json`. El registro del nuevo candidato permanece pendiente hasta ejecutar sus comprobaciones.

## Fechas de los datos activos

El manifiesto activo identifica `20260830120000000-8c6c79fbd2a1`. Su procedencia muestra que reutiliza el conjunto base descargado el 22 de agosto de 2026, y añade el recurso derivado `offerEvidence`, generado el 30 de agosto. No es una descarga integral de fuentes del día 30.

Para ofertas, `sourceUpdatedAt` indica 20 de agosto; en este constructor se calcula a partir de fechas de publicación de registros. No debe interpretarse como fecha de actualización del catálogo del editor. El resto de fuentes puede declarar fecha desconocida. No se sustituye una fecha desconocida por la fecha de generación.

El inventario y la comprobación actual de metadatos se registran en `source-freshness-20260908.json`. La actualización se prepara fuera de la instantánea activa y solo se puede promover tras validar esquemas, relaciones, licencias, cobertura, recursos derivados y recorridos.

## Alcance

Revisión realizada por el asistente con comprobaciones secuenciales. No equivale a revisión independiente por subagentes ni a una prueba desde datos móviles. Los informes locales previos sin seguimiento se preservaron.
