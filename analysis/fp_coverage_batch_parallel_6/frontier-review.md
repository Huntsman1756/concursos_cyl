# Revisión frontier del sexto lote FP

Fecha de revisión: `2026-08-14`

Catálogo revisado: `data/curated/occupations.json`

SHA-256 del catálogo: `f77079a15d7246c04b44889c733fda7fc9bade892c9d78c79607fcb1c3e21e90`

## Criterio

Solo se aceptan relaciones `official_output` cuando una cita TodoFP literal
apoya una ocupación CNO-11 `approved` de forma exacta o funcional directa. No
se aceptan proximidad sectorial, coincidencia léxica, cobertura parcial de una
cita compuesta ni cambios de jerarquía laboral.

## Relaciones base aceptadas

| Programa base | occupationId            | Código | Etiqueta exacta                                                                                           | Cita TodoFP literal                                                         | Decisión                                                                                             |
| ------------- | ----------------------- | -----: | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| FME03S        | `occupation:cno11:3126` |   3126 | Técnicos en mecánica                                                                                      | Técnica / técnico de desarrollo de productos y moldes                       | Diseño y desarrollo mecánico de nivel técnico directo.                                               |
| HOT02S        | `occupation:cno11:3510` |   3510 | Agentes y representantes comerciales                                                                      | Agente de viajes.                                                           | Intermediación comercial turística directa; existe precedente sectorial en HOT01S.                   |
| HOT02S        | `occupation:cno11:4411` |   4411 | Empleados de información al usuario                                                                       | Consultor / consultora de viajes.                                           | Función principal de información y orientación al viajero.                                           |
| HOT02S        | `occupation:cno11:4123` |   4123 | Empleados de logística y transporte de pasajeros y mercancías                                             | Empleada / empleado del departamento de «booking» o reservas.               | Gestión de reservas vinculada al transporte de pasajeros.                                            |
| HOT02S        | `occupation:cno11:5492` |   5492 | Promotores de venta                                                                                       | Promotor / promotora comercial de viajes y servicios turísticos.            | Promoción de venta casi literal.                                                                     |
| SSC02S        | `occupation:cno11:3724` |   3724 | Monitores de actividades recreativas y de entretenimiento                                                 | Animador / animadora de veladas y espectáculos.                             | Animación recreativa y de entretenimiento directa.                                                   |
| SSC02S        | `occupation:cno11:3713` |   3713 | Profesionales de apoyo al trabajo y a la educación social                                                 | Dinamizador / dinamizadora comunitario.                                     | Dinamización comunitaria dentro del apoyo social y educativo.                                        |
| SSC02S        | `occupation:cno11:4411` |   4411 | Empleados de información al usuario                                                                       | Informador / informadora juvenil.                                           | Información especializada a usuarios jóvenes.                                                        |
| INA01S        | `occupation:cno11:3160` |   3160 | Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías                     | Analista sensorial.                                                         | Análisis sensorial como control técnico de calidad del producto.                                     |
| INA01S        | `occupation:cno11:3209` |   3209 | Supervisores de otras industrias manufactureras                                                           | Supervisor / supervisora de columnas de destilación y concentración.        | Supervisión directa de proceso manufacturero.                                                        |
| AGA02M        | `occupation:cno11:6110` |   6110 | Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines) | Agricultor / agricultora.                                                   | Agricultura general directa, respetando exclusiones del código.                                      |
| AGA02M        | `occupation:cno11:6204` |   6204 | Trabajadores cualificados en apicultura y sericicultura                                                   | Apicultor / apicultora.                                                     | Coincidencia funcional exacta en apicultura.                                                         |
| AGA02M        | `occupation:cno11:6205` |   6205 | Trabajadores cualificados en la avicultura y la cunicultura                                               | Avicultor / avicultora.                                                     | Coincidencia funcional exacta en avicultura.                                                         |
| AGA02M        | `occupation:cno11:6120` |   6120 | Trabajadores cualificados en huertas, invernaderos, viveros y jardines                                    | Horticultor / horticultora.                                                 | Coincidencia directa con huertas e invernaderos.                                                     |
| AGA03B        | `occupation:cno11:6110` |   6110 | Trabajadores cualificados en actividades agrícolas (excepto en huertas, invernaderos, viveros y jardines) | Peón en cultivos herbáceos.                                                 | La cita de cultivos herbáceos apoya el ámbito agrícola abierto; no se usa para funciones forestales. |
| AGA03B        | `occupation:cno11:6120` |   6120 | Trabajadores cualificados en huertas, invernaderos, viveros y jardines                                    | Peón de vivero.                                                             | Correspondencia directa con viveros; no se extiende al peonaje forestal.                             |
| ELE02B        | `occupation:cno11:7533` |   7533 | Instaladores y reparadores en tecnologías de la información y las comunicaciones                          | Ayudante de instalador / instaladora de equipos y sistemas de comunicación. | Correspondencia TIC directa y respaldada por precedentes ELE01B e IFC01B.                            |
| ELE02B        | `occupation:cno11:9700` |   9700 | Peones de las industrias manufactureras                                                                   | Peón de industrias manufactureras.                                          | Coincidencia literal.                                                                                |
| IMA01M        | `occupation:cno11:7221` |   7221 | Fontaneros                                                                                                | Instalador-mantenedor / instaladora-mantenedora de instalaciones de agua.   | Instalación y mantenimiento de agua como función nuclear de fontanería.                              |

## Expansión a modalidades

Las relaciones de `HOT02S` se duplican para `HOT02SD` y las de `INA01S` para
`INA01SD`, conservando exactamente occupationId, tipo, estado, URL, cita,
fecha y versión. El lote publica por tanto 25 filas: 19 base, 4 adicionales
para HOT02SD y 2 adicionales para INA01SD.

## No-match aprobados

| Programa base | Motivo                                                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IMS03S        | El catálogo approved no contiene ocupaciones de producción audiovisual, radio, cine, televisión, multimedia o espectáculos. No se sustituyen por realización, cámara, sonido, interpretación o gerencia genérica.                                                   |
| COM02E        | El catálogo approved no contiene marketing digital, growth marketing, inbound marketing, content management, community management ni copywriting. `1432` se rechaza porque dirección minorista no equivale a dirección de comercio electrónico o marketing digital. |

## Rechazos frontier relevantes

- FME03S: `7322`, `7323` y otros oficios de fabricación se rechazan por
  rebajar diseño técnico a operación; `2713` es diseño web, no mecánico.
- HOT02S: `5210`, `1432` y `5220` se rechazan por trasladar servicios de
  agencia a tienda o almacén; `3724` no equivale a organización de eventos.
- SSC02S: `2252` solo cubre la parte infantil de una cita compuesta y `4210`
  solo bibliotecas/archivos, no servicios culturales completos.
- INA01S: `6110` se rechaza para «Vitivinícola» por rebaja jerárquica. `3209`
  se acepta únicamente con la cita explícita de supervisión industrial.
- AGA02M: `8321` se rechaza porque la cita combina maquinaria agrícola y
  ganadera y el código solo cubre la primera. No se fuerzan ganadería,
  floricultura, fruticultura, producción de huevos ni leche.
- AGA03B: `6110` no se usa como categoría forestal genérica; su única base es
  la cita literal de cultivos herbáceos. Las funciones forestales sin código
  específico quedan sin cobertura.
- ELE02B: `8202` no demuestra que «procesos automatizados» sea ensamblaje;
  `8209` es un cajón de sastre; `3123` elevaría operario a técnico y `7510` no
  se usa sin evidencia explícita del ámbito de construcción.
- IMA01M: `7250` no equivale a producción de calor, `7294` es fotovoltaica y
  no solar térmica, y `7221` solo se acepta para la cita explícita de agua.

## Resultado

- Programas base revisados: 10.
- Relaciones base aceptadas: 19.
- Filas curadas a incorporar: 25.
- No-match base: 2.
- Candidatos no autorizados por proximidad o cobertura parcial: rechazados.
