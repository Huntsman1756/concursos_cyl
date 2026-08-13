# Propuesta de correspondencias AFD02M → CNO-11

## Fuente

- **Título:** Técnico en Guía en el Medio Natural y de Tiempo Libre
- **Fuente oficial:** TodoFP, Ministerio de Educación, Formación Profesional y Deportes
- **URL:** https://todofp.es/que-estudiar/familias-profesionales/actividades-fisicas-deportivas/guia-medio-natural-tiempo-libre.html
- **Consulta:** 2026-08-13
- **Catálogo CNO-11 curado:** `data/curated/occupations.json` (v1.0.0)
- **Fecha de propuesta:** 2026-08-13

## Salidas del programa (texto literal de TodoFP)

> «diseñador de itinerarios ecuestres y en bicicleta hasta media montaña; organizador de actividades físico-deportivas guiadas en el medio natural; encargado de prevención y seguridad en rutas; guía de senderismo, baja y media montaña, travesías y raquetas; guía de barrancos o espeleología de dificultad baja; guía de bicicleta de montaña, cicloturismo, caballo o embarcaciones de recreo; monitor de campamentos, albergues, colonias, granjas-escuela y escuelas de naturaleza.»

## Candidatos con ocupación existente en el catálogo

### 1. Organizador / Guía de actividades en el medio natural

| Campo | Valor |
|---|---|
| **occupationId** | `occupation:cno11:3723` |
| **Código CNO** | 3723 |
| **Etiqueta del catálogo** | Instructores de actividades deportivas |
| **Cita de TodoFP** | «organizador de actividades físico-deportivas guiadas en el medio natural» |
| **Justificación** | El programa forma para organizar y guiar actividades físico-deportivas en el medio natural. La categoría CNO-11 3723 «Instructores de actividades deportivas» cubre profesionales que imparten formación y dirigen actividades deportivas. El componente de «guía» y «medio natural» no tiene un epígrafe propio de guías turísticos en el catálogo curado; 3723 es la correspondencia más cercana por la naturaleza deportiva de las actividades (senderismo, barrancos, bicicleta de montaña, etc.). |
| **Confianza** | Media-Alta |

### 2. Guía de senderismo, montaña, barrancos, bicicleta de montaña, cicloturismo, caballos, embarcaciones de recreo

| Campo | Valor |
|---|---|
| **occupationId** | `occupation:cno11:3723` |
| **Código CNO** | 3723 |
| **Etiqueta del catálogo** | Instructores de actividades deportivas |
| **Cita de TodoFP** | «guía de senderismo, baja y media montaña, travesías y raquetas; guía de barrancos o espeleología de dificultad baja; guía de bicicleta de montaña, cicloturismo, caballo o embarcaciones de recreo» |
| **Justificación** | Las funciones de guía en actividades de montaña, barranquismo y deportes de aventura tienen un componente instructivo y de dirección de grupos que se solapa con la categoría 3723. No existe en el catálogo un epígrafe de «guías turísticos» o «guías de naturaleza» que sea una correspondencia directa. La actividad deportiva y de aventura justifica la inclusión bajo instructores de actividades deportivas. |
| **Confianza** | Media |

### 3. Monitor de campamentos, albergues, colonias, granjas-escuela y escuelas de naturaleza

| Campo | Valor |
|---|---|
| **occupationId** | `occupation:cno11:3724` |
| **Código CNO** | 3724 |
| **Etiqueta del catálogo** | Monitores de actividades recreativas y de entretenimiento |
| **Cita de TodoFP** | «monitor de campamentos, albergues, colonias, granjas-escuela y escuelas de naturaleza» |
| **Justificación** | La categoría CNO-11 3724 «Monitores de actividades recreativas y de entretenimiento» se refiere a profesionales que organizan y dirigen actividades de ocio, tiempo libre y recreativas para grupos. Los campamentos, colonias y granjas-escuela encajan directamente en esta descripción, ya que implican la supervisión y animación de actividades recreativas y de tiempo libre. Las escuelas de naturaleza añaden el componente educativo que también es parte del ámbito de esta categoría. |
| **Confianza** | Alta |

### 4. Diseñador de itinerarios ecuestres y en bicicleta hasta media montaña

| Campo | Valor |
|---|---|
| **occupationId** | `occupation:cno11:3723` |
| **Código CNO** | 3723 |
| **Etiqueta del catálogo** | Instructores de actividades deportivas |
| **Cita de TodoFP** | «diseñador de itinerarios ecuestres y en bicicleta hasta media montaña» |
| **Justificación** | El diseño de itinerarios ecuestres y ciclistas es una actividad preparatoria que acompaña a la guía deportiva en el medio natural. No existe en el catálogo un epígrafe específico para «diseñadores de rutas turísticas» o «diseñadores de itinerarios». La correspondencia más conservadora es 3723, dado que los itinerarios están orientados a actividades deportivas (ecuestre, bicicleta) y su diseño es parte del ciclo de planificación de las actividades que luego dirigen instructores de actividades deportivas. |
| **Confianza** | Baja-Media |

### 5. Encargado de prevención y seguridad en rutas

| Campo | Valor |
|---|---|
| **occupationId** | `occupation:cno11:3723` |
| **Código CNO** | 3723 |
| **Etiqueta del catálogo** | Instructores de actividades deportivas |
| **Cita de TodoFP** | «encargado de prevención y seguridad en rutas» |
| **Justificación** | La prevención y seguridad en rutas es una función transversal que acompaña a la actividad de guía e instrucción en el medio natural. No existe un epígrafe específico de «técnicos de seguridad en actividades de naturaleza» en el catálogo. La correspondencia con 3723 es conservadora: la seguridad es parte integrante de las competencias de un instructor de actividades deportivas en entorno natural. |
| **Confianza** | Baja-Media |

## Salidas rechazadas o sin correspondencia directa

### Sin ocupación existente en el catálogo curado

| Salida (cita literal de TodoFP) | Motivo del rechazo |
|---|---|
| «diseñador de itinerarios ecuestres y en bicicleta hasta media montaña» | Se ha asignado a 3723 con confianza Baja-Media (ver candidato 4). No existe un epígrafe de diseñador de rutas o planificador turístico en el catálogo curado. |
| «encargado de prevención y seguridad en rutas» | Se ha asignado a 3723 con confianza Baja-Media (ver candidato 5). No existe un epígrafe de técnico de seguridad en actividades de naturaleza o de prevención en el medio natural. |

### Sin ocupación existente en absoluto (sin asignación)

Ninguna de las 7 salidas queda completamente sin correspondencia. Sin embargo, se destaca que:

- **No existe en el catálogo curado ningún epígrafe de «guías turísticos» o «guías de naturaleza»** (p. ej., no se encuentra una categoría equivalente a los CNO-08 «Guías turísticos» o a las ocupaciones de guía ambiental), por lo que todas las funciones de guía se han tenido que asignar de forma conservadora a la categoría de instructores de actividades deportivas (3723), lo cual puede no capturar plenamente la dimensión de guía/patrimonial/turística del perfil.
- **No existe ningún epígrafe específico para «diseñador de itinerarios» o «planificador de rutas turísticas»**, por lo que esta faceta del perfil queda parcialmente cubierta por la asignación a 3723 con baja confianza.

## Resumen de correspondencias

| # | Salida TodoFP (resumen) | CNO-11 | Etiqueta CNO-11 | Confianza |
|---|---|---|---|---|
| 1 | Organizador de actividades físico-deportivas guiadas en el medio natural | 3723 | Instructores de actividades deportivas | Media-Alta |
| 2 | Guía de senderismo, montaña, barrancos, BTT, cicloturismo, caballo, embarcaciones de recreo | 3723 | Instructores de actividades deportivas | Media |
| 3 | Monitor de campamentos, albergues, colonias, granjas-escuela y escuelas de naturaleza | 3724 | Monitores de actividades recreativas y de entretenimiento | Alta |
| 4 | Diseñador de itinerarios ecuestres y en bicicleta hasta media montaña | 3723 | Instructores de actividades deportivas | Baja-Media |
| 5 | Encargado de prevención y seguridad en rutas | 3723 | Instructores de actividades deportivas | Baja-Media |

**Total de salidas:** 7
**Con correspondencia directa:** 5 (agrupadas en 2 ocupaciones CNO-11)
**Con correspondencia conservadora (baja confianza):** 2
**Sin correspondencia:** 0

## Notas

- Se ha respetado estrictamente el catálogo curado existente: **no se han modificado** `data/curated/occupations.json` ni ningún otro archivo de datos.
- No se han inventado códigos CNO-11 ni occupationId.
- La ausencia de un epígrafe de «guías de naturaleza/turísticos» en el catálogo curado es un hueco que debería abordarse en futuras ampliaciones del catálogo, ya que afecta a este y posiblemente a otros programas de la familia de Actividades Físicas y Deportivas.
- Esta propuesta es evidencia preliminar; la verificación final corresponde a Codex/Frontier.