# Propuesta de correspondencias: ELE01S

> **Título FP:** Técnico Superior en Sistemas Electrotécnicos y Automatizados
> **Fuente oficial:** TodoFP, Ministerio de Educación, Formación Profesional y Deportes
> **URL fuente:** https://www.todofp.es/que-estudiar/familias-profesionales/electricidad-electronica/sistemas-electrotecnicos-automatizados.html
> **Consulta:** 2026-08-13
> **Catálogo utilizado:** `data/curated/occupations.json` (CNO-11)
> **Fecha de propuesta:** 2026-08-13

---

## 1. Candidatos propuestos

### Candidato 1 — `occupation:cno11:3123`

| Campo | Valor |
|---|---|
| **occupationId** | `occupation:cno11:3123` |
| **Código CNO-11** | 3123 |
| **Etiqueta del catálogo** | Técnicos en electricidad |
| **Nivel de confianza** | **ALTA** |

**Salidas FP mapeadas (6 de 10):**

1. técnico en proyectos electrotécnicos
2. proyectista electrotécnico
3. coordinador técnico de instalaciones electrotécnicas de baja tensión para edificios
4. técnico de supervisión, verificación y control de equipos e instalaciones electrotécnicas y automatizadas
5. técnico supervisor de alumbrado exterior
6. coordinador técnico de redes eléctricas de baja tensión y alumbrado exterior

**Cita textual de TodoFP:**

> "técnico en proyectos electrotécnicos; proyectista electrotécnico; coordinador técnico de instalaciones electrotécnicas de baja tensión para edificios; técnico de supervisión, verificación y control de equipos e instalaciones electrotécnicas y automatizadas; técnico supervisor de alumbrado exterior; coordinador técnico de redes eléctricas de baja tensión y alumbrado exterior"

**Justificación:**

Las seis salidas descritas corresponden a funciones de diseño, proyecto, coordinación técnica y supervisión en sistemas e instalaciones electrotécnicas. La categoría CNO-11 3123 ("Técnicos en electricidad"), integrada en el grupo 31 ("Técnicos de las ingenierías, de la producción y de las ciencias físicas, químicas y medioambientales"), es el epígrafe que cubre de forma más directa el perfil de técnico superior que diseña, coordina y supervisa instalaciones y redes eléctricas. El título de la FP ("Técnico Superior en Sistemas Electrotécnicos y Automatizados") confirma el nivel técnico superior exigido, coherente con el grupo 31 de la CNO-11.

---

### Candidato 2 — `occupation:cno11:7510`

| Campo | Valor |
|---|---|
| **occupationId** | `occupation:cno11:7510` |
| **Código CNO-11** | 7510 |
| **Etiqueta del catálogo** | Electricistas de la construcción y afines |
| **Nivel de confianza** | **MEDIA-ALTA** |

**Salidas FP mapeadas (3 de 10):**

1. jefe de equipo de instaladores de baja tensión
2. capataz o encargado de obras en redes de baja tensión y alumbrado exterior
3. jefe de equipo de instaladores en esas redes

**Cita textual de TodoFP:**

> "jefe de equipo de instaladores de baja tensión; capataz o encargado de obras en redes de baja tensión y alumbrado exterior; jefe de equipo de instaladores en esas redes"

**Justificación:**

Estas tres salidas describen roles de dirección, coordinación y supervisión de equipos de instaladores en el ámbito de redes eléctricas de baja tensión y alumbrado exterior, en contextos de obra. La categoría CNO-11 7510 ("Electricistas de la construcción y afines") es la que cubre las funciones de electricistas dedicados a instalaciones en el sector de la construcción, incluyendo la supervisión de equipos de instalación en obra. **Nota de nivel:** la categoría 7510 pertenece al grupo 7 de la CNO-11 (trabajadores cualificados de las instalaciones y las máquinas), mientras que el título FP es de nivel superior (grupos 2-3). Esta discrepancia de nivel reduce la confianza a MEDIA-ALTA; no obstante, las salidas descritas encajan funcionalmente en la definición del epígrafe.

---

### Candidato 3 — `occupation:cno11:7521`

| Campo | Valor |
|---|---|
| **occupationId** | `occupation:cno11:7521` |
| **Código CNO-11** | 7521 |
| **Etiqueta del catálogo** | Mecánicos y reparadores de equipos eléctricos |
| **Nivel de confianza** | **MEDIA-BAJA** |

**Salidas FP mapeadas (1 de 10):**

1. gestor del mantenimiento de instalaciones eléctricas de distribución y alumbrado exterior

**Cita textual de TodoFP:**

> "gestor del mantenimiento de instalaciones eléctricas de distribución y alumbrado exterior"

**Justificación:**

La componente de "mantenimiento de instalaciones eléctricas" de esta salida se alinea parcialmente con la definición de la categoría 7521 ("Mecánicos y reparadores de equipos eléctricos"), que cubre la reparación y el mantenimiento de equipos e instalaciones eléctricas. Sin embargo, la salida usa el término "gestor", que implica una responsabilidad de gestión y planificación del mantenimiento que va más allá del perfil operativo de "mecánicos y reparadores" del grupo 7. Además, el ámbito de la salida (instalaciones de distribución y alumbrado exterior) es más amplio que la reparación puntual de equipos. **Nota de nivel:** la categoría 7521 es de grupo 7 (trabajadores cualificados), mientras que el título FP es de nivel superior. La correspondencia es funcional pero débil.

---

## 2. Salidas rechazadas o sin correspondencia clara en el catálogo

| # | Salida FP | Motivo de rechazo |
|---|---|---|
| — | *(Ninguna)* | Todas las salidas del catálogo oficial al menos una candidata, aunque con niveles de confianza variables (ver sección 1). |

**Observación:** No existe una salida del catálogo CNO-11 que carezca completamente de candidato. Sin embargo, la salida 10 ("gestor del mantenimiento de instalaciones eléctricas de distribución y alumbrado exterior") tiene la correspondencia más débil (MEDIA-BAJA) y podría no superar la revisión de Frontier. Si se requiere un umbral de confianza mínimo de MEDIA, esta salida quedaría como sin correspondencia confirmada.

---

## 3. Resumen de cobertura

| occupationId | CNO-11 | Etiqueta | Salidas FP cubiertas | Confianza |
|---|---|---|---|---|
| `occupation:cno11:3123` | 3123 | Técnicos en electricidad | 6 de 10 | ALTA |
| `occupation:cno11:7510` | 7510 | Electricistas de la construcción y afines | 3 de 10 | MEDIA-ALTA |
| `occupation:cno11:7521` | 7521 | Mecánicos y reparadores de equipos eléctricos | 1 de 10 | MEDIA-BAJA |

**Cobertura total:** 10 de 10 salidas cubiertas (al menos parcialmente). La categoría `occupation:cno11:3123` concentra la mayor parte de las salidas (60%), lo que refleja que el perfil principal del FP es el de técnico en electricidad a nivel de ingeniería/proyecto.

---

## 4. Notas y limitaciones

1. **Nivel CNO-11 vs. nivel FP:** El título "Técnico Superior" corresponde al nivel 3 o 4 de la CNO-11 (grupo 2-3), mientras que las categorías 7510 y 7521 pertenecen al grupo 7. Esta discrepancia de nivel se señala explícitamente en los candidatos 2 y 3.
2. **Componente de automatización:** El título incluye "Sistemas Automatizados", pero ninguna categoría del catálogo CNO-11 existente cubre específicamente la automatización industrial a nivel técnico superior. La categoría 3139 ("Técnicos en control de procesos no clasificados bajo otros epígrafes") podría ser candidata para la componente de automatización, pero no se incluye en esta propuesta conservadora por ser más especulativa.
3. **Revisión independiente requerida:** Esta propuesta debe ser revisada por Frontier (Codex/Sol) antes de cualquier incorporación a datos curados.
