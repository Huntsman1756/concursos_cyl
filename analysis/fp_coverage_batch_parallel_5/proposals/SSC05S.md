# SSC05S — Mediación Comunicativa

**Official TodoFP title:** Técnico Superior en Mediación Comunicativa  
**Source:** <https://www.todofp.es/que-estudiar/familias-profesionales/servicios-socioculturales-comunidad/mediacion-comunicativa.html>  
**Family:** Servicios Socioculturales y a la Comunidad (SSC)  
**Level:** higher (Técnico Superior)  
**Catálogo base:** `data/curated/occupations.json`, versión 1.0.0 (solo `approved`)

---

## Function area 1: Mediación comunicativa

### Literal sourceQuotes

> "Mediador / mediadora de personas con dificultades de comunicación"  
> _(SSC05S.txt, quote 6)_

> "Mediador / mediadora de personas sordociegas."  
> _(SSC05S.txt, quote 7)_

> "Mediador / mediadora social de la comunidad sorda."  
> _(SSC05S.txt, quote 8)_

### CNO-11 candidate

| Field                  | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| **occupationId**       | `occupation:cno11:3713`                                   |
| **classificationCode** | 3713                                                      |
| **preferredLabel**     | Profesionales de apoyo al trabajo y a la educación social |
| **reviewStatus**       | approved                                                  |

**Justificación:**  
El mediador/a de personas con dificultades de comunicación, el mediador/a de personas sordociegas y el mediador/a social de la comunidad sorda ejercen una función de apoyo a la inclusión social y a la participación comunitaria de personas con discapacidad sensorial: facilitan el acceso a servicios, recursos y entornos sociales mediante la intermediación comunicativa. CNO-11 3713 ("Profesionales de apoyo al trabajo y a la educación social") es la categoría approved que captura el perfil de integración y apoyo social (integradores y mediadores sociales), constituyendo la correspondencia funcional directa dentro del catálogo.

**Riesgo:** Categoría genérica de apoyo socioeducativo que no refleja la especialización en lengua de signos, sistemas de comunicación aumentativa ni guía-interpretación de personas sordociegas. No existe en el catálogo approved ningún epígrafe específico de "mediador" ni de "intérprete de lengua de signos"; 3713 es la categoría más próxima por función laboral, no por técnica comunicativa.

---

## Function area 2: Promoción, atención y formación a personas sordas

### Literal sourceQuote

> "Técnica / técnico en promoción, atención y formación a personas sordas."  
> _(SSC05S.txt, quote 9)_

### CNO-11 candidate

| Field                  | Value                                     |
| ---------------------- | ----------------------------------------- |
| **occupationId**       | `occupation:cno11:2312`                   |
| **classificationCode** | 2312                                      |
| **preferredLabel**     | Técnicos educadores de educación especial |
| **reviewStatus**       | approved                                  |

**Justificación:**  
La función de formación de personas sordas se desarrolla en contextos educativos especializados, donde el técnico en promoción, atención y formación actúa como educador y apoyo pedagógico de alumnado con discapacidad auditiva. CNO-11 2312 ("Técnicos educadores de educación especial") corresponde funcionalmente al componente formativo de esta salida: docencia y apoyo educativo a personas con necesidades educativas especiales, entre las que se incluyen las personas sordas.

**Riesgo:** 2312 cubre el componente educativo pero no los componentes de "promoción" ni de "atención" (dinamización comunitaria y cuidados), que exceden la función docente. Además, 2312 es una categoría general de educación especial, sin especificidad auditiva ni comunicativa. La correspondencia es funcional parcial (formación), no exacta.

---

## Salidas sin candidato

| Salida / función                                              | Motivo                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agente de desarrollo de la comunidad sorda** (quote 1)      | No existe ningún occupationId `approved` de desarrollo comunitario específico. La función es desarrollo de la comunidad sorda; el catálogo approved carece de epígrafe de agentes de desarrollo comunitario, y por frontier plan no se sustituye por gestión de comunidades genérica.                                                   |
| **Agente de desarrollo de la comunidad sordociega** (quote 2) | Ídem: desarrollo de la comunidad sordociega sin candidato approved. No se sustituye por gestión de comunidades.                                                                                                                                                                                                                         |
| **Agente dinamizador de la comunidad sorda** (quote 3)        | Ídem: dinamización de la comunidad sorda sin candidato approved. 3724 ("Monitores de actividades recreativas y de entretenimiento") es ocio y entretenimiento, no dinamización comunitaria de personas sordas; se descarta por no ser correspondencia funcional directa.                                                                |
| **Agente dinamizador de la comunidad sordociega** (quote 4)   | Ídem: sin candidato approved. Se descarta 3724 por desajuste funcional (ocio frente a dinamización comunitaria especializada).                                                                                                                                                                                                          |
| **Asistente de personas sordociegas** (quote 5)               | El candidato natural, 5891 "Asistentes personales o personas de compañía", tiene reviewStatus `rejected` y queda excluido por el criterio "solo approved". 5710 ("Trabajadores de los cuidados personales a domicilio") es cuidado domiciliario genérico, no asistencia comunicativa a personas sordociegas; no procede como sustituto. |
| **Lenguaje corporal** (área funcional del programa)           | Ningún occupationId approved del catálogo describe una ocupación cuyo objeto sea el lenguaje corporal. Es una técnica de comunicación interna al perfil de mediación, no una ocupación CNO-11 independiente.                                                                                                                            |
| **Expresión oral** (área funcional del programa)              | Ningún occupationId approved corresponde a una ocupación de expresión oral (locución, oratoria) como función laboral propia del programa. 4411 ("Empleados de información al usuario") es atención de mostrador/información, no expresión oral mediadora; se descarta.                                                                  |
| **Interpretación simultánea** (área funcional del programa)   | El catálogo approved no contiene traductores ni intérpretes (el epígrafe CNO-11 2624 "Traductores e intérpretes" no figura en `occupations.json`). No existe candidato.                                                                                                                                                                 |
| **Relación con medios** (área funcional del programa)         | Sin candidato por exclusión expresa del frontier plan: no se equipara mediación comunicativa con periodismo ni con relaciones públicas (ver Exclusiones). El catálogo approved tampoco contiene periodistas ni agentes de relaciones públicas.                                                                                          |

---

## Exclusiones explícitas (por frontier plan)

| Rol excluido                | Motivo                                                                                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Periodismo**              | La mediación comunicativa no es periodismo: la función es intermediación comunicativa para personas sordas/sordociegas, no producción ni difusión informativa. Se rechaza cualquier sustitución hacia ocupaciones de comunicación mediática.           |
| **Relaciones públicas**     | La mediación comunicativa no es relaciones públicas: no gestiona imagen corporativa ni comunicación institucional. Se rechaza la equivalencia con perfiles de comunicación organizacional.                                                             |
| **Gestión de comunidades**  | Las salidas de "agente de desarrollo/dinamizador de la comunidad sorda/sordociega" no se sustituyen por gestión de comunidades genérica (community management), que carece del componente de discapacidad sensorial y mediación comunicativa.          |
| **Candidatos no aprobados** | `occupations.json` contiene entradas con reviewStatus `rejected` (ej. 5891 "Asistentes personales o personas de compañía", 5831, 3202, 7212, 7223) y `draft` (4309). No se utilizan como candidatos conforme al criterio "solo occupationId approved". |

---

## Resumen de candidatos

| Función                            | occupationId            | Código | Etiqueta exacta                                           | Cita literal (TodoFP)                                                               | Tipo de correspondencia                           |
| ---------------------------------- | ----------------------- | ------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| Mediación comunicativa             | `occupation:cno11:3713` | 3713   | Profesionales de apoyo al trabajo y a la educación social | "Mediador / mediadora de personas con dificultades de comunicación" (quote 6)       | Funcional directa                                 |
| Mediación (personas sordociegas)   | `occupation:cno11:3713` | 3713   | (compartido)                                              | "Mediador / mediadora de personas sordociegas." (quote 7)                           | Funcional directa                                 |
| Mediación social (comunidad sorda) | `occupation:cno11:3713` | 3713   | (compartido)                                              | "Mediador / mediadora social de la comunidad sorda." (quote 8)                      | Funcional directa                                 |
| Formación a personas sordas        | `occupation:cno11:2312` | 2312   | Técnicos educadores de educación especial                 | "Técnica / técnico en promoción, atención y formación a personas sordas." (quote 9) | Funcional directa (parcial, componente formación) |

**Salidas sin candidato:** 5 de 9 (quotes 1–5). **Áreas funcionales sin candidato:** lenguaje corporal, expresión oral, interpretación simultánea, relación con medios.  
**Total salidas de la fuente:** 9 — **Con candidato:** 4 (quotes 6, 7, 8, 9) — **Sin candidato:** 5 (quotes 1, 2, 3, 4, 5).
