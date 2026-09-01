# SALIDA CyL · contrato de rutas de producción v3

Este contrato separa la exploración global de los resultados derivados de una
entidad concreta. Las rutas conservan los parámetros de búsqueda y filtros en
la URL cuando forman parte del estado de la vista.

| Ruta                                     | Alcance                                  | Datos que puede cargar                                                                                         | Siguiente contexto permitido                                         |
| ---------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `/`                                      | Inicio / tres intenciones                | Manifest, catálogo de FP y relaciones aprobadas para los buscadores; el contador de ofertas viene del snapshot | FP, profesión u ofertas globales según la intención                  |
| `/desde-fp`                              | Buscador global de FP                    | Catálogo oficial de ciclos y cobertura de relaciones                                                           | `/desde-fp/:programKey`                                              |
| `/desde-fp/:programKey`                  | Ficha de un ciclo                        | Ciclo, relaciones ocupacionales aprobadas, ofertas relacionadas, oferta formativa de centros y fuentes         | Profesión, ofertas relacionadas o centros de ese ciclo               |
| `/desde-fp/:programKey/ofertas`          | Ofertas contextuales de un ciclo         | Ofertas publicadas + relaciones aprobadas que documenten el ciclo                                              | Oferta oficial; vuelta a la ficha del ciclo                          |
| `/donde-estudiar`                        | Centros globales                         | Centros y oferta formativa publicada                                                                           | Ciclo asociado cuando existe                                         |
| `/donde-estudiar/:programKey`            | Centros contextuales de un ciclo         | Centros y oferta formativa filtrada por ese `programKey`                                                       | Ficha del ciclo o Web del centro                                     |
| `/formacion/:programKey`                 | Alias compatible de centros contextuales | Mismo contrato que `/donde-estudiar/:programKey`                                                               | Mismo contrato; evita romper enlaces públicos existentes             |
| `/desde-ocupacion`                       | Buscador global de profesiones           | Ocupaciones oficiales, alias y relaciones aprobadas                                                            | `/desde-ocupacion/:occupationId`                                     |
| `/desde-ocupacion/:occupationId`         | Ficha de profesión                       | Profesión, FP relacionada y ofertas documentadas para esa profesión                                            | FP relacionada u ofertas relacionadas                                |
| `/desde-ocupacion/:occupationId/ofertas` | Ofertas contextuales de una profesión    | Ofertas publicadas + relaciones aprobadas con el `occupationId`                                                | Oferta oficial; vuelta a la ficha de profesión                       |
| `/desde-oferta`                          | Ofertas globales                         | Snapshot global de ofertas y evidencia de requisitos; no carga un contexto FP implícito                        | Oferta oficial y, solo si está documentado, FP/profesión relacionada |

## Reglas de estado y datos

- `query`, `province`, `status`, `level`, `family` y `page` se serializan en la
  URL solo en las vistas que los soportan. Recargar, compartir, Atrás y
  Adelante deben reconstruir la misma vista.
- Un resultado contextual solo aparece si existe una relación aprobada en los
  datos publicados. La ausencia de relación produce estado vacío o no
  disponible; no se inventan conexiones por título, provincia o similitud.
- `/desde-oferta` es siempre global. No hereda `INA02M`, una profesión ni otro
  contexto de la sesión o del prototipo.
- Los CTA externos apuntan a `originalUrl`, `website` o a una búsqueda de Maps
  construida desde la dirección publicada. No hay detalle interno inventado de
  una oferta o centro.
- Los alias de compatibilidad son deliberados y no crean un segundo sistema de
  componentes: la implementación canónica de centros vive en
  `CentersExplorerPage`.

## Migración desde el prototipo

La entrada única `#offers` se sustituye por los tres alcances explícitos del
explorador de ofertas. La entrada `#home` se mantiene como Home de producción,
pero las tres intenciones navegan a sus dominios y no comparten un formulario
ambiguo. Los datos, fechas, contadores, títulos, relaciones y enlaces se
resuelven desde el manifest y los snapshots generados; no se trasladan valores
de demostración al runtime.
