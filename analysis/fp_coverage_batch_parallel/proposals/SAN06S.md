# Propuesta de correspondencias SAN06S → CNO-11

**Fuente:** TodoFP (Ministerio de Educación, Formación Profesional y Deportes)
**Consulta:** 2026-08-13
**URL:** https://www.todofp.es/que-estudiar/familias-profesionales/sanidad/higiente-bucodental.html
**Catálogo usado:** `data/curated/occupations.json` (v1.0.0, 100 entradas curadas)

> **Nota importante:** El catálogo curado actual no contiene ninguna entrada específicamente dedicada a odontología/higiene bucodental. La búsqueda se ha realizado cruzando literalmente las etiquetas y funciones descritas en la fuente TodoFP con las 100 ocupaciones curadas.

---

## 1. Datos de partida (Fuente TodoFP)

**Título:** Técnico Superior en Higiene Bucodental

**Salidas profesionales (texto literal):**
> "técnico superior en Higiene Bucodental; técnico especialista higienista dental; higienista bucodental; educador en salud bucodental."

**Ámbito de actuación (texto literal):**
> "sector sanitario público y privado, atención sanitaria y promoción de la salud, equipos de salud bucodental, atención primaria, unidades de promoción de salud y gabinetes dentales privados, coordinado por facultativo."

---

## 2. Candidatos propuestos (correspondencia)

### 2.1. higienista bucodental / técnico especialista higienista dental

| Campo | Valor |
| --- | --- |
| **occupationId** | `occupation:cno11:3314` |
| **Código CNO** | 3314 |
| **Etiqueta exacta del catálogo** | Técnicos en laboratorio de diagnóstico clínico |
| **Cita literal de TodoFP** | "higienista bucodental" / "técnico especialista higienista dental" |
| **Justificación** | El higienista bucodental trabaja dentro de un gabinete dental (estructura clínica de diagnóstico) y realiza procedimientos de higiene dental que forman parte del proceso de diagnóstico y prevención odontológica. La ocupación CNO-11 3314 ("Técnicos en laboratorio de diagnóstico clínico") es el único epígrafe del catálogo curado que encuadra perfiles técnicos sanitarios de nivel medio-superior dentro del circuito diagnóstico-asistencial. La correspondencia se considera **aproximada**: no existe en el catálogo ninguna entrada de "técnico de laboratorio dental" o "técnico especializado en diagnóstico odontológico", que sería el reflejo más literal. |
| **Nivel de confianza** | **Baja** — corresponde por sector sanitario y nivel técnico (subprofesional/técnico), pero las actividades concretas (higiene dental vs. laboratorio clínico de diagnóstico) son diferentes. |

### 2.2. educador en salud bucodental

| Campo | Valor |
| --- | --- |
| **occupationId** | `occupation:cno11:3713` |
| **Código CNO** | 3713 |
| **Etiqueta exacta del catálogo** | Profesionales de apoyo al trabajo y a la educación social |
| **Cita literal de TodoFP** | "educador en salud bucodental" |
| **Justificación** | El perfil de educador en salud bucodental corresponde a la promoción de la salud y educación sanitaria. El epígrafe CNO-11 3713 ("Profesionales de apoyo al trabajo y a la educación social") es el más cercano en el catálogo curado a perfiles de educación y promoción. Sin embargo, 3713 se refiere principalmente a educación social, no a educación en salud (que en la clasificación CNO-11 se encontraría en subgrupo 225x - Educación, o bien en subgrupo 226x - Educación sanitaria, ningún epígrafe disponible en el catálogo). |
| **Nivel de confianza** | **Muy baja** — correlación por término "educación" pero diferencias sustanciales en dominio profesional (educación social vs. educación sanitaria/odontológica). |

---

## 3. Salidas rechazadas o sin correspondencia

### 3.1. técnico superior en Higiene Bucodental (título general)

| Campo | Valor |
| --- | --- |
| **Resultado** | **Sin correspondencia suficiente** |
| **Cita literal de TodoFP** | "técnico superior en Higiene Bucodental" |
| **Motivo del rechazo** | Es el nombre del título oficial, no un perfil laboral distinto de los ya evaluados. Tras revisar todo el catálogo (100 entradas), no existe ningún código CNO-11 dedicado a odontología, higiene dentofacial, prótesis dentales ni profilaxis bucodental. Las ocupaciones sanitarias disponibles en el catálogo son: 5611/5612 (auxiliares de enfermería), 5621 (técnicos auxiliares de farmacia), 5629 (cuidados a las personas en servicios de salud no clasificados), 3314 (técnicos de laboratorio de diagnóstico clínico) — ninguna refleja las funciones de prevención, raspado, pulido, educación sobre higiene oral o aplicación de flúor que realiza un higienista bucodental. |

### 3.2. Resumen de ocupaciones del catálogo curado sin uso

Todas las 96 ocupaciones restantes del catálogo `data/curated/occupations.json` (sector construcción, hostelería, logística, manufactura, IT, comercio, administración, agricultura, etc.) no tienen ninguna correspondencia con las salidas del ciclo formativo de Higiene Bucodental (`SAN06S`).

- **Sanitarias (4):** 5611, 5612, 5621, 5629 — rechazadas (ver arriba).
- **Todas las demás (96):** construcción, hostelería, manufactura, IT, comercio, administración, agricultura — rechazadas por ausencia de correlación domínica.

---

## 4. Observaciones para el Frontier

1. El catálogo curado de `data/curated/occupations.json` **no incluye ninguna ocupación de odontología/higiene bucodental**. Sería preciso añadir al catálogo los epígrafes CNO-11 correspondientes (posiblemente en el subgrupo 3214 - Técnicos en protesis dentales, 3215 - Técnicos en ortodoncia, o bien el subgrupo 3190 de técnicos sanitarios no clasificados).
2. Sin esas entradas en el catálogo, las coincidencias más cercanas son forzosamente aproximadas (5611/3314 para higienista, 3713 para educador).
3. **No se ha modificado `data/curated/occupations.json` ni ningún otro archivo salvo este `.md`**.

---

*Documento generado el 2026-08-13 — Propuesta conservadora, sin inventar códigos ni añadir entradas al catálogo.*