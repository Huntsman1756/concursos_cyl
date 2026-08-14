# Revisión frontier del quinto lote FP

Fecha de revisión: `2026-08-14`  
Catálogo CNO-11 aprobado: `data/curated/occupations.json`  
SHA-256 del catálogo: `f77079a15d7246c04b44889c733fda7fc9bade892c9d78c79607fcb1c3e21e90`

## Criterio

Solo se publica una relación cuando una salida oficial de TodoFP coincide de
forma exacta o funcional directa con una ocupación aprobada. La pertenencia al
mismo sector, las categorías residuales y las rebajas de jefatura o supervisión
a puestos operativos no son evidencia suficiente.

## Decisiones

| Ciclo  | CNO-11 | Decisión             | Cita oficial que sustenta la decisión                                              | Motivo frontier                                                                                                                                                                     |
| ------ | -----: | -------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SAN04S |   3314 | Aceptar              | `Técnica / técnico especialista en anatomía patológica y citología.`               | El trabajo técnico de anatomía patológica y citología forma parte directa del laboratorio de diagnóstico clínico. La relación no se extiende a forensía, autopsias ni tanatopraxia. |
| AGA04M |   8321 | Aceptar              | `Tractorista.`                                                                     | Operar un tractor es una función directa de los operadores de maquinaria agrícola móvil.                                                                                            |
| AGA04M |   6120 | Aceptar              | `Viverista.`                                                                       | La etiqueta CNO incluye expresamente el trabajo cualificado en viveros.                                                                                                             |
| FME02S |   7314 | Aceptar              | `Montaje en construcciones metálicas.`                                             | Coincidencia funcional directa con montaje de estructuras metálicas.                                                                                                                |
| FME02S |   7312 | Rechazar             | `Fabricación en construcciones metálicas.`                                         | La salida no acredita soldadura u oxicorte como función propia.                                                                                                                     |
| FME02S |   7313 | Rechazar             | `Delineante proyectista de calderería y estructuras metálicas.`                    | Un delineante o diseñador de calderería no es un chapista o calderero operativo.                                                                                                    |
| FME02S |   7132 | Rechazar             | `Construcciones metálicas y montaje`                                               | No hay evidencia específica de cerramientos o carpintería metálica.                                                                                                                 |
| IMS05S |   2713 | Rechazar             | `Retocador fotográfico / retocadora fotográfica digital.`                          | Web y multimedia es una categoría adyacente; no representa de forma directa fotografía, cámara, iluminación ni retoque fotográfico profesional.                                     |
| SEA03S |   3129 | Aceptar              | `Técnica / técnico en gestión ambiental.`                                          | La etiqueta CNO incluye expresamente técnicos medioambientales y de las ingenierías.                                                                                                |
| SEA03S |   2640 | Aceptar              | `Comercial de información de productos biocidas y fitosanitarios`                  | Es una función directa de venta técnica no TIC.                                                                                                                                     |
| SEA03S |   3160 | Rechazar             | `Técnica / técnico de control sanitario (alimentos, aguas, atmósfera, residuos…).` | Control sanitario o ambiental no equivale por sí solo a control de calidad industrial.                                                                                              |
| SSC05S |   3713 | Aceptar              | `Mediador / mediadora social de la comunidad sorda.`                               | La mediación social especializada es una función directa de apoyo al trabajo y a la educación social.                                                                               |
| SSC05S |   2312 | Rechazar             | `Técnica / técnico en promoción, atención y formación a personas sordas.`          | La salida combina promoción, atención y formación; reducirla a educación especial solo cubre un componente parcial.                                                                 |
| TCP01M |   8209 | Rechazar             | `Cosedor-ensamblador / cosedora-ensambladora.`                                     | La categoría residual de montadores no preserva el oficio textil y produciría una equivalencia sectorial ambigua.                                                                   |
| TMV03E |   3405 | Aceptar              | `Perito tasador de vehículos.`                                                     | Correspondencia funcional directa con tasadores.                                                                                                                                    |
| TMV03E |   7521 | Rechazar             | `Jefe/a del área de mantenimiento de vehículos híbridos y eléctricos.`             | Equipos eléctricos es genérico y rebaja una jefatura de mantenimiento de vehículos a reparación operativa.                                                                          |
| TMV03E |   7531 | Rechazar             | `Jefe/a del área de recambios y equipos de diagnosis.`                             | Gestionar recambios y diagnosis no es reparar equipos electrónicos.                                                                                                                 |
| TMV03E |   3123 | Rechazar             | `Jefe/a del área de mantenimiento de vehículos híbridos y eléctricos.`             | Electricidad general no preserva ni el dominio de vehículo ni la responsabilidad de jefatura.                                                                                       |
| TMV03E |   3124 | Rechazar             | `Jefe/a del área de mantenimiento de vehículos híbridos y eléctricos.`             | Electrónica general no preserva ni el dominio de vehículo ni la responsabilidad de jefatura.                                                                                        |
| ELE05E |      — | Sin match publicable | `Programador de robots colaborativos.`                                             | El catálogo aprobado no contiene robótica, integración de robots ni programación industrial equivalente; no se sustituye por programación TI o automatización general.              |
| EOC02S |   3129 | Aceptar              | `Delineante de obra civil.`                                                        | Delineación de obra civil es una función técnica directa de ingeniería no cubierta por un epígrafe más específico del catálogo aprobado.                                            |

## Cierres sin relación publicable

- `IMS05S`: el catálogo no representa cámara, fotografía, iluminación o
  tratamiento fotográfico con una ocupación suficientemente específica.
- `TCP01M`: faltan oficios textiles aprobados; no se usa el epígrafe residual
  de ensambladores como sustituto.
- `ELE05E`: faltan ocupaciones aprobadas de robótica colaborativa, integración,
  programación y puesta en marcha de robots.

## Resultado

- 9 relaciones base aceptadas para 7 ciclos.
- 11 candidatos explícitos rechazados.
- 3 ciclos revisados sin relación publicable.
- `EOC02S` tiene la modalidad `EOC02SD`; al publicar la relación base se
  materializarán 10 filas curadas en total.
