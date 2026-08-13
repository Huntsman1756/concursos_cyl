# HOT03S — Cruce TodoFP ↔ Occupations

- **Fuente**: TodoFP (Ministerio de Educación, Formación Profesional y Deportes)
- **FPU**: HOT03S — Técnico Superior en Guía, Información y Asistencias Turísticas
- **URL**: <https://www.todofp.es/que-estudiar/familias-profesionales/hosteleria-turismo/guia-informacion-asistencias-turisticas.html>
- **Consulta**: 2026-08-13
- **Código ocupacional de referencia**: `HOT03S`
- **Ocupaciones candidatas en catálogo**: 100 (CNO-11)
- **Salidas profesionales TodoFP**: 13

---

## Códigos candidatos

| # | Salida TodoFP | Categoría CNO-11 | occupationId | Etiqueta exacta (CNO-11) | Confianza |
|---|---------------|------------------|--------------|--------------------------|-----------|
| 1 | guía acompañante | guía | `occupation:cno11:4411` | Empleados de información al usuario | media |
| 2 | guía local | guía | `occupation:cno11:4411` | Empleados de información al usuario | media |
| 3 | guía en emplazamientos de bienes de interés cultural | guía | `occupation:cno11:4411` | Empleados de información al usuario | baja |
| 4 | informador turístico o informadora turística | información | `occupation:cno11:4411` | Empleados de información al usuario | alta |
| 5 | jefe o jefa de oficinas de información | información | `occupation:cno11:4411` | Empleados de información al usuario | alta |
| 6 | asistente en terminales | terminales | `occupation:cno11:4123` | Empleados de logística y transporte de pasajeros y mercancías | media |
| 7 | encargado o encargada de facturación en terminales de transporte | terminales | `occupation:cno11:4123` | Empleados de logística y transporte de pasajeros y mercancías | baja |
| 8 | promotor turístico o promotora turística | promoción | `occupation:cno11:5492` | Promotores de venta | media |

### Notas de asignación

- **guía acompañante** → CNO-11 4411: El acompañante transmite información al viajero en recorrido; hay similitud funcional en orientación, pero no cubre el desplazamiento ni la logística del transporte.
- **guía local** → CNO-11 4411: Similar al acompañante pero limitado a un emplazamiento; la función de informar al público es el único punto de contacto con 4411.
- **guía en bienes de interés cultural** → CNO-11 4411: A diferencia de un guía de museo (CNO-11 3713 no existe en catálogo), la única ruta viable es 4411 para la faceta informativa, aunque el valor histórico no está contemplado.
- **informador turístico** → CNO-11 4411: Emparejamiento más directo; el informador recibe al público, resuelve consultas y difunde información, tal como define 4411.
- **jefe de oficinas de información** → CNO-11 4411: Supervisa una oficina de información al público; aunque no hay supervisor específico de información en el catálogo, 4411 es el anchor funcional.
- **asistente en terminales** → CNO-11 4123: 4123 cubre el área general de transporte, pero no distingue asistencia presencial al viajero de gestión logística de mercancías.
- **encargado de facturación en terminales** → CNO-11 4123: La facturación en terminal tiene un carácter más administrativo; no existe `4111` (`Empleados de contabilidad`) como supervisión de sección ni `4113` como financiera de transporte, por lo que 4123 es el menos peor.
- **promotor turístico** → CNO-11 5492: El promotor turístico promociona destinos y servicios, mientras que 5492 se centra en promoción directa de productos y ventas; hay superposición en la técnica promocional pero no en el objeto de venta.

---

## Candidatos rechazados

| # | Salida TodoFP | Categoría | occupationId | Etiqueta exacta (CNO-11) | Confianza | Motivo del rechazo |
|---|---------------|-----------|--------------|--------------------------|-----------|---------------------|
| 1 | agente de desarrollo turístico local | promoción | `occupation:cno11:3405` | Tasadores | — | Sin relación temática; el desarrollo turístico es estratégico, la tasación es valoración económica. |
| 2 | agente de desarrollo turístico local | promoción | `occupation:cno11:5492` | Promotores de venta | — | Promoción comercial frente a promoción territorial; no hay vínculo funcional. |
| 3 | agente de desarrollo turístico local | promoción | `occupation:cno11:2640` | Profesionales de ventas técnicas y médicas (excepto las TIC) | — | Ámbito comercial/tecnológico, no turístico ni territorial. |
| 4 | asistente en ferias, congresos y convenciones | eventos | `occupation:cno11:4412` | Recepcionistas (excepto de hoteles) | — | Recepción general no cubre la coordinación logística de eventos. |
| 5 | asistente en ferias, congresos y convenciones | eventos | `occupation:cno11:5210` | Jefes de sección de tiendas y almacenes | — | Contexto comercial minorista, no de eventos ni congresos. |
| 6 | asistente en medios de transporte terrestre o marítimo | terminales | `occupation:cno11:4309` | Empleados administrativos sin tareas de atención al público | — | Excluido por nota de revisión; además el asistente en transporte sí atiende al público. |
| 7 | encargado o encargada de servicios en eventos | eventos | `occupation:cno11:5831` | Supervisores de mantenimiento y limpieza en oficinas, hoteles y otros establecimientos | — | Supervisión de limpieza, no de servicios de eventos. |
| 8 | encargado o encargada de servicios en eventos | eventos | `occupation:cno11:5210` | Jefes de sección de tiendas y almacenes | — | Ámbito retail; no aplica a hostelería de eventos. |
| 9 | técnico o técnica de empresa de consultoría turística | guía | `occupation:cno11:3405` | Tasadores | — | Sin relación; consultoría turística vs tasación económica. |
| 10 | técnico o técnica de empresa de consultoría turística | guía | `occupation:cno11:2640` | Profesionales de ventas técnicas y médicas (excepto las TIC) | — | Ventas técnicas, no consultoría de negocio turístico. |
| 11 | técnico o técnica de empresa de consultoría turística | guía | `occupation:cno11:2722` | Administradores de sistemas y redes | — | TI puro, sin relación con consultoría turística. |
| 12 | técnico o técnica de empresa de consultoría turística | guía | `occupation:cno11:3820` | Programadores informáticos | — | Puro desarrollo software. |
| 13 | técnico o técnica de empresa de consultoría turística | guía | `occupation:cno11:3510` | Agentes y representantes comerciales | — | Representación comercial, no consultoría estratégica. |
| 14 | técnico o técnica de empresa de consultoría turística | guía | `occupation:cno11:3522` | Agentes de compras | — | Compras/logística interna, no consultoría. |

---

## Resumen por categoría

| Categoría | Salidas TodoFP | Códigos candidato | Candidatos rechazados | Observación |
|-----------|---------------|-------------------|----------------------|-------------|
| guía | acompañante, local, bienes culturales (×3) | 4411 (×3) | 0 | 3× 4411 con confianza media/baja; no hay supervisor de guías ni guía de museo en el catálogo. |
| información | informador, jefe oficinas (×2) | 4411 (×2) | 0 | 2× 4411 con confianza alta; mejor emparejamiento de la familia HOT03S. |
| terminales | asistente, facturación (×2) | 4123 (×2) | 0 | 4123 de logística y transporte es el ancla; el subdominio transporte de pasajeros lo permite. |
| eventos | asistente ferias/congresos, enc. servicios (×2) | 0 | 2 (5210, 4412) | Sin código candidato válido; no hay código de coordinación de eventos en el catálogo de 100. |
| promoción | promotor turístico, agente desarrollo (×2) | 5492 (×1) | 4 (3405, 5492, 2640) | El promotor turística→5492 es candidato media confianza; el agente desarrollo turístico no tiene anclaje. |
| consultoría | técnico consultoría turística (×1) | 0 | 6 (3405, 2640, 2722, 3820, 3510, 3522) | Sin código candidato; consultoría de negocio turístico no es per se una profesión CNO-11 individual. |

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Salidas TodoFP | 13 |
| Códigos candidatos | 6 (4× 4411, 2× 4123, 1× 5492) |
| Códigos rechazados por candidato | 0 |
| Candidatos rechazados (sin matching) | 14 |
| Coberturas cubiertas | guía (parcial), información (alta), terminales (parcial), promoción (parcial) |
| Coberturas no cubiertas | eventos (0/2), consultoría (0/1) |

---

## Procedencia

- TodoFP: [Guía, Información y Asistencias Turísticas](https://www.todofp.es/que-estudiar/familias-profesionales/hosteleria-turismo/guia-informacion-asistencias-turisticas.html), consulta 2026-08-13
- Occupations CNO-11: [`data/curated/occupations.json`](../data/curated/occupations.json), 100 registros
- Categoría HOT03S: hostelería y turismo