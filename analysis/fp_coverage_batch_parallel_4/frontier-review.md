# Revisión frontier del cuarto lote FP–ocupación

Fecha de revisión: 2026-08-14.

Alcance: diez ciclos, 99 salidas TodoFP distintas y el catálogo
`data/curated/occupations.json` con SHA-256
`f77079a15d7246c04b44889c733fda7fc9bade892c9d78c79607fcb1c3e21e90`.
Las propuestas NAN son material de investigación; esta revisión decide qué
relaciones tienen evidencia suficiente para publicación.

## Decisiones

| Ciclo    | Relaciones aceptadas                   | Candidatos rechazados  | Resultado                                                                                                                                                                                                                                                |
| -------- | -------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QUI01S` | `3160`, `3129`                         | —                      | Cobertura parcial publicable. `3160` cubre control de calidad y ensayos; `3129` cubre directamente laboratorio químico, química industrial y análisis de materiales. No se extiende a microbiología o análisis alimentario por mera afinidad científica. |
| `SAN09S` | `2640`                                 | `5629`, `3129`, `3510` | `2640` corresponde a la venta técnica/médica de equipos de radioelectrología. `5629` es trabajo de cuidados, no radioterapia técnica; `3129` no identifica protección radiológica sanitaria; `3510` es una alternativa comercial genérica redundante.    |
| `AGA03S` | `2640`                                 | —                      | Cobertura parcial publicable para «Visitador / visitadora de productos de veterinaria». No se publican relaciones para gestión ganadera, asistencia veterinaria o cuidados equinos porque no existen ocupaciones aprobadas directas.                     |
| `ENA03S` | `7294`, `3123`                         | `7521`                 | `7294` cubre literalmente montaje de instalaciones solares y `3123` la operación/mantenimiento eléctrico de subestaciones. Montar aerogeneradores no equivale a reparar equipos eléctricos, por lo que se rechaza `7521`.                                |
| `HOT05S` | `3522`                                 | `4121`                 | «Responsable de compra de bebidas» corresponde directamente a agentes de compras. No se rebaja «Encargado de economato y bodega» a empleado de inventario.                                                                                               |
| `IMS02S` | —                                      | —                      | Sin coincidencia publicable en el catálogo aprobado actual para realización audiovisual, dirección o regiduría.                                                                                                                                          |
| `INA02S` | `3160`, `3209`, `3510`                 | `4121`                 | Cobertura publicable para calidad/laboratorio, supervisión de fabricación y función comercial. «Encargado de aprovisionamientos» no se rebaja a empleado de inventario.                                                                                  |
| `MSP34`  | —                                      | —                      | Sin coincidencia publicable en el catálogo aprobado actual para prevención de riesgos, coordinación preventiva o seguridad y salud laboral.                                                                                                              |
| `FME02B` | `7132`, `7312`, `7314`, `8202`, `9700` | —                      | Correspondencias directas para carpintería metálica, soldadura/oxicorte, montaje de estructuras, ensamblaje eléctrico/electrónico y la salida literal de peones/auxiliares manufactureros. `9700` no cubre «procesos automatizados».                     |
| `IFC01E` | —                                      | —                      | Sin ocupación aprobada específica para auditoría, consultoría, análisis o pruebas de ciberseguridad. No se sustituyen por administración de sistemas, redes o desarrollo web.                                                                            |

## Resumen de publicación

- Relaciones aceptadas: 15.
- Ciclos con cobertura parcial publicable: 7.
- Ciclos investigados sin coincidencia publicable: 3 (`IMS02S`, `MSP34`,
  `IFC01E`).
- Candidatos rechazados explícitamente: 8.
- No se aceptan relaciones por semejanza sectorial, por categoría residual sin
  función directa ni por descenso de jerarquía profesional.

Las 99 citas de las propuestas se validaron de forma exacta contra
`data/curated/professional-profiles.json` después de normalizar el transporte a
UTF-8. Esta revisión no modifica por sí sola el catálogo ni la cobertura
pública.
