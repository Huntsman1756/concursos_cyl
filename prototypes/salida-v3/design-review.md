# SALIDA CyL · revisión de diseño v3

`VISUAL_DIRECTION: APPROVE_WITH_CHANGES`  
`PROTOTYPE_DATA_INTEGRITY: PASS`  
`READY_TO_IMPLEMENT: NO`

Esta v3 conserva **Ruta clara · service-first** y corrige la iteración anterior con datos trazables, una sola interacción contextual en portada y acciones que terminan en fuentes reales. Sigue siendo un prototipo aislado: no modifica React, CSS ni componentes de producción.

## DATA_INTEGRITY

La vista de `Aceites de Oliva y Vinos` usa exclusivamente la copia existente:

- `public/data/v1/snapshots/20260830120000000-8c6c79fbd2a1/offer-evidence.json`, generada el 30-08-2026.
- La relación `programKey = INA02M` devuelve exactamente **4 ofertas**: todas `AGENTES COMERCIALES`, fuente `ECYL`, en Benavente/Zamora (23 jul), Soria (1 ago), Palencia (17 ago) y Aranda de Duero/Burgos (18 ago).
- `public/data/v1/training-offerings.json`, filtrado por `INA02M`, devuelve exactamente **3 centros publicados**: CIFP SAN GABRIEL, LA INMACULADA y CIFP SAN RAFAEL DE LA SANTA ESPINA; todos presenciales.
- `public/data/v1/centers.json` aporta las direcciones, webs y códigos de centro usados en la tabla.
- `1.058` se utiliza solo como población global de ofertas de la copia. `133`, `9` y `42` ya no aparecen en la ficha: no se usan como cobertura de esta FP.

No se presenta ningún dato de demostración como evidencia. La interfaz conserva la etiqueta de copia/fecha y diferencia contexto global de resultados relacionados.

## CAMBIOS_DESDE_V2

- El H1 deja de estrechar el producto a “desde tu FP”: **Explora formación, profesiones y oportunidades en Castilla y León.**
- Desaparece el panel derecho: cada intención abre su formulario justo debajo de la fila elegida.
- La home conserva solo dos indicadores útiles: `187 ciclos` y `1.058 ofertas` en la copia actual.
- “Señales del mercado” pasa a **Ofertas relacionadas**.
- La ficha usa **Salidas relacionadas** y prioriza **Ver esta profesión**; la evidencia queda en el subtítulo y en el método.
- Las ofertas muestran `ECYL` y la fecha de publicación, además de la formación relacionada como enlace secundario.
- Los centros terminan en **Web del centro** y **Cómo llegar**, con enlaces construidos desde sus datos reales.
- El CTA principal de Ofertas/Centros pasa de amarillo a teal; el amarillo queda reservado a foco/acento.

## BENCHMARK_REFERENCES

1. [GOV.UK Service Manual](https://www.gov.uk/service-manual/design/scoping-your-service) — una tarea por vez; aplicar a las tres intenciones de SALIDA.
2. [GOV.UK Design System](https://design-system.service.gov.uk/components/) — filas, tablas, inputs, detalles y estados accesibles.
3. [National Careers Service](https://nationalcareers.service.gov.uk/explore-careers) — buscar por profesión o explorar por categoría.
4. [France Travail](https://candidat.francetravail.fr/rechercheoffre/emploi) — ocupación y ubicación como filtros visibles.
5. [O*NET OnLine](https://www.onetonline.org/) — taxonomía y búsqueda por código sin copiar la densidad legacy.
6. [TodoFP](https://www.todofp.es/que-estudiar.html) — familia/ciclo como vocabulario educativo principal.
7. [Datos.gob.es](https://datos.gob.es/es/catalogo/conjuntos-datos?is_hvd=true) — estado de consulta, filtros, recuentos y descarga.
8. [ESCO](https://esco.ec.europa.eu/en/search) — conexión semántica entre ocupaciones y cualificaciones.

## PROPOSED_INFORMATION_ARCHITECTURE

Modelo mental: `partir de algo → relacionar → comprobar → decidir`.

- `PRIMARY`: Explorar, Ofertas, Dónde estudiar.
- `SECONDARY`: Salidas, Ofertas relacionadas, Dónde estudiar, Datos y método.
- `UTILITY`: accesibilidad, fuentes, copia y fecha.
- `HOME`: tres intenciones; una única interacción visible, contextual y equivalente en desktop/mobile.
- `FP`: salidas relacionadas → ofertas relacionadas → centros → método.
- `OFFERS`: búsqueda → filtros → filas comparables → oferta oficial/formación relacionada.
- `CENTERS`: búsqueda → tabla → web del centro/cómo llegar.

## DESIGN_SYSTEM_FOUNDATION

- Sans del sistema; H1 funcional, no editorial.
- Canvas `#F5F7FA`, superficie `#FFFFFF`, tinta `#102A43`, texto `#52606D`, teal `#0B7285`, foco `#E9B949`, verificado `#2F855A`.
- Max-width 1240 px; grid 8/4 cuando aporta valor; filas y tablas; spacing 4/8/12/16/24/32/48; radio máximo 6 px.
- Estados visibles: foco, selección, error, filtro abierto, fuente externa y copia de datos.

## PROTOTYPE_FILES

- [index.html](./index.html)
- [prototype.css](./prototype.css)
- [prototype.js](./prototype.js)
- [revisión v2](../salida-v2/design-review.md)

## SCREENSHOTS

- `home-desktop-1440.png`
- `home-mobile-390.png`
- `fp-detail-desktop.png`
- `offers-desktop.png`
- `centers-desktop.png`

## VALIDATION

- Cinco rutas cargadas en navegador local.
- Selección de cada intención y formulario contextual comprobados.
- Estado vacío del formulario comprobado.
- Filtros responsive y menú mobile comprobados.
- Enlaces de ofertas y centros apuntan a URLs externas reales de ECYL, webs de centro o mapas.
- Cero errores de consola.

La revisión visual se capturó en `F:\CodexHome\visualizations\2026\08\31\01a0585e-d8e4-7793-917f-cfd24b1fba23\design-review-v3\`.
