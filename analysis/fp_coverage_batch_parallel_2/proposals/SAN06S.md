# Propuesta de correspondencias SAN06S → CNO-11 (lote 2)

**Fuente:** TodoFP (Ministerio de Educación, Formación Profesional y Deportes)
**Consulta:** 2026-08-13
**URL:** https://www.todofp.es/que-estudiar/familias-profesionales/sanidad/higiente-bucodental.html
**Catálogo usado:** `data/curated/occupations.json` (v1.0.0, ~100 entradas curadas)

---

## 1. Datos de partida (Fuente TodoFP)

**Título:** Técnico Superior en Higiene Bucodental

**Salidas profesionales (texto literal):**

> "educador o educadora en salud bucodental; higienista bucodental; técnico o técnica especialista higienista dental; técnico o técnica superior en Higiene Bucodental."

---

## 2. Cruce salida por salida

### 2.1. educador o educadora en salud bucodental

| Campo                            | Valor                                                                                                                                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resultado**                    | **Sin correspondencia suficiente**                                                                                                                                                                                                                                  |
| **Cita literal de TodoFP**       | "educador o educadora en salud bucodental"                                                                                                                                                                                                                          |
| **Candidatos explorados**        | `occupation:cno11:3713` (Profesionales de apoyo al trabajo y a la educación social), `occupation:cno11:2252` (Técnicos en educación infantil)                                                                                                                        |
| **Etiqueta exacta del catálogo** | N/A — ninguna etiqueta del catálogo contiene "educación sanitaria", "salud pública", "promoción de la salud" o "educador sanitario".                                                                                                                                |
| **Motivo del rechazo**           | El catálogo curado no incluye ocupaciones de educación sanitaria ni promoción de la salud oral. CNO-11 3713 se refiere a educación social (inserción laboral, trabajo social), no a instrucción sanitaria. CNO-11 2252 está acotado a educación infantil reglada. |
| **Confianza**                    | **Nula** — no existe código sanitario-educativo en el catálogo actual.                                                                                                                                                                                              |

### 2.2. higienista bucodental

| Campo                            | Valor                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resultado**                    | **Sin correspondencia suficiente. No existe código adecuado para higienista dental en el catálogo actual.**                                                                                                                                                                                                                         |
| **Cita literal de TodoFP**       | "higienista bucodental"                                                                                                                                                                                                                                                                                                             |
| **Candidatos explorados**        | `occupation:cno11:3314` (Técnicos en laboratorio de diagnóstico clínico), `occupation:cno11:5611` (Auxiliares de enfermería hospitalaria), `occupation:cno11:5612` (Auxiliares de enfermería de atención primaria), `occupation:cno11:5621` (Técnicos auxiliares de farmacia), `occupation:cno11:5629` (Trabajadores de cuidados) |
| **Etiqueta exacta del catálogo** | N/A                                                                                                                                                                                                                                                                                                                                 |
| **Motivo del rechazo**           | Ninguna ocupación del catálogo recoge las funciones nucleares del higienista dental: raspado dental, pulido, aplicación de flúor, selladores de fisuras, educación en higiene oral, radiografías intraorales. Los candidatos explorados pertenecen a laboratorio clínico (3314), enfermería (5611/5612), farmacia (5621) o cuidados genéricos (5629); todos difieren en competencias clínicas y ámbito odontológico. |
| **Confianza**                    | **Nula** — forzar cualquier código existente sería una correspondencia engañosa.                                                                                                                                                                                                                                                    |

### 2.3. técnico o técnica especialista higienista dental

| Campo                            | Valor                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resultado**                    | **Sin correspondencia suficiente (sinónimo de 2.2)**                                                                                                                                            |
| **Cita literal de TodoFP**       | "técnico o técnica especialista higienista dental"                                                                                                                                              |
| **Motivo del rechazo**           | Se trata de una variación sinonímica de "higienista bucodental". Aplica el mismo análisis que 2.2: el catálogo carece de código odontológico/higiene dental.                                    |
| **Confianza**                    | **Nula** — idéntico a 2.2.                                                                                                                                                                     |

### 2.4. técnico o técnica superior en Higiene Bucodental

| Campo                      | Valor                                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Resultado**              | **Sin correspondencia (título oficial, no perfil laboral)**                                                                                                                                      |
| **Cita literal de TodoFP** | "técnico o técnica superior en Higiene Bucodental"                                                                                                                                               |
| **Motivo del rechazo**     | Es la denominación del título formativo, no una salida profesional distinta. Su correspondencia laboral está cubierta por los perfiles de higienista bucodental (2.2) y educador en salud (2.1). |
| **Confianza**              | **N/A** — no procede.                                                                                                                                                                           |

---

## 3. Resumen de ocupaciones del catálogo sin uso

Las ~96 ocupaciones restantes de `data/curated/occupations.json` (construcción, hostelería, manufactura, IT, comercio, administración, agricultura, transporte, etc.) no tienen ninguna correlación con el ciclo de Higiene Bucodental.

**Ocupaciones sanitarias del catálogo y su descarte:**

| occupationId               | Etiqueta                                       | Resultado   |
| -------------------------- | ---------------------------------------------- | ----------- |
| `occupation:cno11:3314`    | Técnicos en laboratorio de diagnóstico clínico | Descartado  |
| `occupation:cno11:5611`    | Auxiliares de enfermería hospitalaria          | Descartado  |
| `occupation:cno11:5612`    | Auxiliares de enfermería de atención primaria  | Descartado  |
| `occupation:cno11:5621`    | Técnicos auxiliares de farmacia                | Descartado  |
| `occupation:cno11:5629`    | Trabajadores de cuidados en servicios de salud | Descartado  |
| `occupation:cno11:3713`    | Profesionales de apoyo a la educación social   | Descartado  |
| `occupation:cno11:2252`    | Técnicos en educación infantil                 | Descartado  |

**Todas las demás (~93):** sin correlación domínica alguna con odontología/higiene bucodental.

---

## 4. Declaración expresa sobre higienista dental

**No existe código CNO-11 adecuado en el catálogo curado `data/curated/occupations.json` para "higienista dental" (ni para "higienista bucodental" ni "técnico especialista higienista dental").** El catálogo carece de cualquier entrada en el subgrupo odontológico (p. ej. 3214 — Técnicos en prótesis dentales, o los equivalentes en clasificaciones alternativas como CNO-2011 subgrupo 321x). Cualquier asignación forzada a 3314, 5611 o 5629 sería incorrecta y no reflejaría las competencias reales del perfil.

---

## 5. Observaciones para el Frontier

1. El catálogo curado de `data/curated/occupations.json` **no incluye ninguna ocupación de odontología/higiene bucodental**. Sería necesario añadir al catálogo los epígrafes CNO-11 del subgrupo 321x (técnicos sanitarios no enfermeros) o específicamente 3214 (prótesis dental) y 3215 (ortodoncia), o bien crear una entrada para "higienista dental" si no existe un código CNO-11 unívoco.
2. Las cuatro salidas de TodoFP se reducen realmente a dos perfiles laborales diferenciados: higienista bucodental (2.2/2.3) y educador en salud bucodental (2.1). El título general (2.4) no constituye salida separada.
3. **No se ha modificado `data/curated/occupations.json` ni ningún otro archivo salvo este `.md`.**

---

_Documento generado el 2026-08-13 — Propuesta conservadora, sin inventar códigos ni añadir entradas al catálogo._