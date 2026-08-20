# Auditoría de fuentes de datos abiertos de la Junta de Castilla y León para SALIDA CyL

**Fecha de la investigación:** 17 de agosto de 2026
**Auditor:** nan/mimo-v2.5 (long-context-code)
**Alcance:** catálogo oficial de datosabiertos.jcyl.es y fuentes complementarias oficiales
**Objetivo:** determinar qué fuentes oficiales aportan valor real al producto y cuáles deben descartarse

---

## 1. Estado actual del repositorio

### 1.1 Arquitectura de datos existente

SALIDA CyL consume datos a través de la API OpenDataSoft v2.1 de la Junta de Castilla y León y las genera en instantáneas JSON inmutables bajo `public/data/v1/snapshots/<snapshotId>/`.

**Fuentes activas en `scripts/data/sourceConfig.ts`:**

| Identificador                           | Dataset ODS                       | Uso                                        |
| --------------------------------------- | --------------------------------- | ------------------------------------------ |
| `jcyl-vocational-training-offer`        | `oferta-de-formacion-profesional` | Programas, centros, ofertas formativas     |
| `jcyl-employment-offers`                | `ofertas-de-empleo`               | Ofertas de empleo ECYL                     |
| `jcyl-ecyl-training`                    | `formacion-del-ecyl`              | Cursos ECYL                                |
| `jcyl-professional-certificates`        | `certificados-profesionalidad`    | Certificados de profesionalidad            |
| `educabase-fp-income-four-table-bundle` | (estadisticas.educacion.gob.es)   | Ingresos de titulados (4 tablas EDUCAbase) |

**Fuentes curadas manualmente (no ODS):**

| Identificador                                   | Fuente           | Uso                                              |
| ----------------------------------------------- | ---------------- | ------------------------------------------------ |
| `ine-cno11-reviewed-occupation-catalog`         | BOE RD 1591/2010 | Catálogo completo de 502 grupos primarios CNO-11 |
| `boe-cno11-complete-occupation-catalog`         | BOE              | Ocupaciones oficiales                            |
| `todofp-boe-reviewed-training-occupation-links` | BOE + TodoFP     | 14 relaciones FP→ocupación aprobadas             |
| `todofp-official-professional-outputs`          | TodoFP           | Perfiles profesionales oficiales                 |

**Instantánea publicada (congelada):**

| Recurso                        | Registros                          |
| ------------------------------ | ---------------------------------- |
| programs.json                  | 187                                |
| centers.json                   | 229                                |
| training-offerings.json        | 1.294                              |
| job-offers.json                | 1.077                              |
| occupations.json               | 91 (aprobadas)                     |
| official-occupations.json      | 502                                |
| occupation-aliases.json        | 21                                 |
| training-occupation-links.json | 14                                 |
| professional-profiles.json     | (cobertura completa 187 programas) |
| mapping-coverage.json          | 209                                |
| published-requirements.json    | 337                                |
| outcome-indicators.json        | 22.170                             |
| ecyl-courses.json              | (cursos ECYL)                      |
| professional-certificates.json | (certificados)                     |

### 1.2 Entidades del grafo actual

- **TrainingProgram**: programKey, programTitle, level, familyCode, familyName
- **EducationCenter**: centerCode, centerName, province, locality, address, phone, email, website, centerOwnership
- **TrainingOffering**: offeringId (compuesto), programa, centro, modalidad, tipo_ensenanza
- **JobOffer**: id, title, province, locality, publishedAt, sourceName, descriptionText, originalUrl
- **Occupation**: occupationId (`occupation:cno11:XXXX`), preferredLabel, confirmationLabel, CNO-11 code
- **TrainingOccupationLink**: trainingProgramKey, occupationId, relationshipType
- **ProfessionalProfile**: programKey, officialTitle, outputLabel
- **OutcomeIndicator**: cohortes, periodos, measures (ingresos)

### 1.3 Geolocalización actual

Los datasets de formación y empleo **ya incluyen coordenadas** en sus registros fuente (`localizacion.lat`, `localizacion.lon`), pero estas **no se propagan** al esquema público `EducationCenter` ni `JobOffer`. Los centros tienen `province` y `locality` pero no lat/lon en el recurso público.

### 1.4 Diferencias documentadas vs implementado

| Aspecto             | Documentado                           | Implementado                                           |
| ------------------- | ------------------------------------- | ------------------------------------------------------ |
| Fuente FP           | ODS `oferta-de-formacion-profesional` | ✅ Correcto, verificado en `sourceConfig.ts`           |
| Fuente empleo       | ODS `ofertas-de-empleo`               | ✅ Correcto                                            |
| Fuente ECYL         | ODS `formacion-del-ecyl`              | ✅ Correcto                                            |
| Fuente certificados | ODS `certificados-profesionalidad`    | ✅ Correcto                                            |
| Ingresos            | EDUCAbase 4 tablas                    | ✅ Correcto, verificado en `educabaseIncomeSources.ts` |
| Coordenadas centros | No explícito                          | ⚠️ Disponibles en fuente, no publicadas                |
| Coordenadas ofertas | No explícito                          | ⚠️ Disponibles en fuente, no publicadas                |

---

## 2. Metodología de investigación

1. Se descargó el catálogo completo del portal ODS v2.1 de JCyL mediante `catalog_all.py` (paginación completa).
2. Se identificaron ~200 datasets disponibles.
3. Se filtraron por relevancia para el dominio FP↔empleo↔territorio.
4. Se verificaron las URLs de ficha y los campos disponibles en cada dataset candidato.
5. Se evaluó la capacidad de join con las entidades existentes.
6. Se descartaron datasets sin relación causal con la misión del producto.

---

## 3. Inventario de datasets candidatos

### 3.1 Familia A: Oferta educativa y centros de FP

**Dataset ya integrado: `oferta-de-formacion-profesional`**

| Campo             | Valor                                                                                                                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre oficial    | Oferta de Formación Profesional                                                                                                                                                                                                                                                          |
| URL ficha         | https://analisis.datosabiertos.jcyl.es/explore/dataset/oferta-de-formacion-profesional/information/                                                                                                                                                                                      |
| URL API           | `https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/oferta-de-formacion-profesional/records`                                                                                                                                                                       |
| Organismo         | Junta de Castilla y León                                                                                                                                                                                                                                                                 |
| Licencia          | CC BY 4.0 ES                                                                                                                                                                                                                                                                             |
| Formato           | JSON (API ODS)                                                                                                                                                                                                                                                                           |
| Frecuencia        | Actualización periódica (no programada explícitamente)                                                                                                                                                                                                                                   |
| Cobertura         | CyL completa                                                                                                                                                                                                                                                                             |
| Registros         | ~1.294 ofertas (instantánea de agosto 2026)                                                                                                                                                                                                                                              |
| Campos relevantes | provincia, localidad, codigo_centro, centro_educativo, titularidad_centro, familia_profesional, codigo_familia, nivel_educativo, clave_ciclo, ciclo_formativo, modalidad, tipo_ensenanza, grupos_1o/2o/3o, direccion_centro, codigo_postal, telefono, e_mail, web, localizacion(lat/lon) |
| Join              | ✅ `clave_ciclo` → TrainingProgram.programKey; `codigo_centro` → EducationCenter.centerCode                                                                                                                                                                                              |
| Clasificación     | **CORE** — Fuente primaria del producto                                                                                                                                                                                                                                                  |

**Dataset candidato: `directorio-de-centros-docentes`**

| Campo          | Valor                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nombre oficial | Directorio de Centros Docentes                                                                                                                                                                                                                         |
| URL ficha      | https://analisis.datosabiertos.jcyl.es/explore/dataset/directorio-de-centros-docentes/information/                                                                                                                                                     |
| Formato        | JSON (API ODS)                                                                                                                                                                                                                                         |
| Descripción    | Directorio general de centros docentes de CyL                                                                                                                                                                                                          |
| Licencia       | CC BY 4.0 ES                                                                                                                                                                                                                                           |
| Evaluación     | **DESCARTADO** — La fuente `oferta-de-formacion-profesional` ya contiene los centros de FP con más detalle (titularidad, modalidad, grupos). Este directorio es genérico (incluye primaria, secundaria) y no aporta campos adicionales útiles para FP. |

### 3.2 Familia B: Mercado laboral por ocupación

**Dataset ya integrado: `ofertas-de-empleo`**

| Campo                 | Valor                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nombre oficial        | Ofertas de Empleo                                                                                                                                |
| URL ficha             | https://analisis.datosabiertos.jcyl.es/explore/dataset/ofertas-de-empleo/information/                                                            |
| URL API               | `https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/ofertas-de-empleo/records`                                             |
| Organismo             | ECYL / Junta de Castilla y León                                                                                                                  |
| Licencia              | CC BY 4.0 ES                                                                                                                                     |
| Formato               | JSON (API ODS)                                                                                                                                   |
| Frecuencia            | Actualización continua                                                                                                                           |
| Registros             | ~1.077 ofertas (instantánea)                                                                                                                     |
| Campos relevantes     | titulo, provincia, fecha_publicacion, descripcion, localidad, fuentecontenido, identificador, enlace_al_contenido, posicion(lat/lon)             |
| Campos NO disponibles | **No hay campo de ocupación CNO, ni código CNO, ni familia CNO**                                                                                 |
| Join con CNO          | ❌ NO es posible — Las ofertas de empleo no contienen clasificación CNO. El matching actual se hace por alias y texto libre, no por join directo |
| Clasificación         | **CORE** — Única fuente de ofertas reales en CyL                                                                                                 |

**Dataset candidato: `paro-provincias`**

| Campo                                                                     | Valor                                                                                                           |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Nombre oficial                                                            | Paro registrado en las provincias de Castilla y León                                                            |
| URL ficha                                                                 | https://analisis.datosabiertos.jcyl.es/explore/dataset/paro-provincias/information/                             |
| Formato                                                                   | JSON (API ODS)                                                                                                  |
| Descripción                                                               | Paro registrado por provincias de CyL                                                                           |
| Licencia                                                                  | CC BY 4.0 ES                                                                                                    |
| Frecuencia                                                                | Mensual (actualización julio 2026)                                                                              |
| Campos probables                                                          | Año, mes, provincia, sexos, totales de paro registrado                                                          |
| Join con nuestras entidades                                               | ⚠️ **SOLO PROVINCIAL** — No hay desglose por ocupación CNO, ni por municipio, ni por sector                     |
| ¿Puede responder "¿Existe demanda de esta ocupación en Castilla y León?"? | **NO** — Solo muestra totales provinciales de paro, no por ocupación                                            |
| Uso concreto                                                              | Contexto territorial general: "En la provincia X hay Y personas desempleadas", sin relación con la ocupación FP |
| Valor para el usuario                                                     | **1/5** — El usuario ya conoce que hay paro; sin desglose por ocupación no ayuda a decidir                      |
| Valor diferencial concurso                                                | **2/5** — Es un dataset JCyL conocido pero poco diferencial                                                     |
| Calidad del dato                                                          | **4/5** — Actualizado mensualmente, fuente SEPE                                                                 |
| Facilidad de integración                                                  | **4/5** — Join por provincia (EXACT)                                                                            |
| Trazabilidad                                                              | **4/5** — Fuente clara                                                                                          |
| Clasificación                                                             | **REJECT** — No aporta decisión FP↔ocupación. La información es demasiado agregada.                             |

**Dataset candidato: `jovenes-inscritos-en-garantia-juvenil`**

| Campo          | Valor                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Nombre oficial | Jóvenes inscritos en garantía juvenil                                                                     |
| URL ficha      | https://analisis.datosabiertos.jcyl.es/explore/dataset/jovenes-inscritos-en-garantia-juvenil/information/ |
| Formato        | JSON (API ODS)                                                                                            |
| Descripción    | Número de jóvenes inscritos en Garantía Juvenil por provincia y sexo                                      |
| Licencia       | CC BY 4.0 ES                                                                                              |
| Frecuencia     | Trimestral                                                                                                |
| Join           | ⚠️ Solo provincial, sin relación con ocupación CNO ni FP                                                  |
| Clasificación  | **REJECT** — No relacionado con la misión FP↔ocupación                                                    |

**Dataset candidato: `estadisticas-de-siniestralidad-laboral`**

| Campo            | Valor                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Nombre oficial   | Estadísticas de siniestralidad laboral                                                                     |
| URL ficha        | https://analisis.datosabiertos.jcyl.es/explore/dataset/estadisticas-de-siniestralidad-laboral/information/ |
| Formato          | JSON (API ODS)                                                                                             |
| Descripción      | Accidentes laborales mensuales por provincia                                                               |
| Licencia         | CC BY 4.0 ES                                                                                               |
| Frecuencia       | Mensual                                                                                                    |
| Campos probables | Año, mes, provincia, accidentes, bajas, etc.                                                               |
| Join             | ⚠️ Solo provincial, sin desglose por ocupación                                                             |
| Clasificación    | **REJECT** — Siniestralidad no es demanda laboral ni orientación FP                                        |

### 3.3 Familia C: Empresas y actividad económica

**Dataset candidato: `numero-de-licencias-del-iae-por-epigrafes-de-actividad`**

| Campo                                                             | Valor                                                                                                                                                                             |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre oficial                                                    | Número de Licencias del I.A.E. por Epígrafes de actividad                                                                                                                         |
| URL ficha                                                         | https://analisis.datosabiertos.jcyl.es/explore/dataset/numero-de-licencias-del-iae-por-epigrafes-de-actividad/information/                                                        |
| Formato                                                           | JSON (API ODS)                                                                                                                                                                    |
| Descripción                                                       | Licencias del IAE por epígrafes de actividad y provincias                                                                                                                         |
| Licencia                                                          | CC BY 4.0 ES                                                                                                                                                                      |
| Frecuencia                                                        | Anual                                                                                                                                                                             |
| Campos probables                                                  | Año, provincia, epígrafe IAE, número de licencias                                                                                                                                 |
| Join con CNO                                                      | ❌ **NO JOINABLE** — El IAE usa clasificación CNAE, la CNO es una clasificación de ocupaciones distintas. No hay cruzadero oficial entre ambos sistemas en estos datos            |
| ¿Puede mostrar "actividad empresarial relacionada con un sector"? | ⚠️ Parcialmente — Muestra licencias IAE por epígrafe CNAE a nivel provincial. Pero el epígrafe IAE es más granular que CNAE y su semántica no es equivalente a la de un grupo CNO |
| Valor para el usuario                                             | **2/5** — Número de licencias por epígrafe no equivale a "empresas activas" ni "demanda laboral"                                                                                  |
| Valor diferencial concurso                                        | **2/5** — Los datos del IAE son conocidos                                                                                                                                         |
| Clasificación                                                     | **REJECT** — La unión CNAE↔CNO no es defendible en estos datos. Las licencias IAE no indican empleo activo.                                                                       |

**Dataset candidato: `numero-de-licencias-del-iae-por-actividades-economicas`**

| Campo          | Valor                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Nombre oficial | Número de Licencias del I.A.E. por Actividades económicas                                                                    |
| URL ficha      | https://analisis.datosabiertos.jcyl.es/explore/dataset/numero-de-licencias-del-iae-por-actividades-economicas/information/   |
| Evaluación     | **REJECT** — Misma limitación anterior. Agregación por actividades económicas a nivel provincial, sin cruce con ocupaciones. |

**Dataset candidato: `establecimientos-comerciales`**

| Campo          | Valor                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Nombre oficial | Establecimientos comerciales en Castilla y León                                                                         |
| URL ficha      | https://analisis.datosabiertos.jcyl.es/explore/dataset/establecimientos-comerciales/information/                        |
| Formato        | JSON (API ODS)                                                                                                          |
| Descripción    | Establecimientos comerciales                                                                                            |
| Licencia       | CC BY 4.0 ES                                                                                                            |
| Join           | ⚠️ Sin código CNAE por registro en la descripción del catálogo. Probablemente solo municipio/provincia y tipo comercial |
| Clasificación  | **REJECT** — No aporta relación con ocupación CNO ni con FP                                                             |

**Dataset candidato: `convenios-colectivos-registrados`**

| Campo          | Valor                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Nombre oficial | Convenios colectivos registrados                                                                                                   |
| URL ficha      | https://analisis.datosabiertos.jcyl.es/explore/dataset/convenios-colectivos-registrados/information/                               |
| Formato        | JSON (API ODS)                                                                                                                     |
| Descripción    | Convenios colectivos por provincia, con empresas y trabajadores afectados                                                          |
| Licencia       | CC BY 4.0 ES                                                                                                                       |
| Campos         | provincia, ámbito (empresa/sector), código, denominación, empresas, trabajadores (h/m), BOP, igualdad                              |
| Join           | ⚠️ El "ámbito" y la "denominación" podrían relacionarse textualmente con sectores, pero **no hay código CNAE ni CNO** en los datos |
| Clasificación  | **REJECT** — Sin código sectorial unificable con CNO                                                                               |

### 3.4 Familia D: Demografía y territorio

**Dataset candidato: `poblacion-total-por-provincias-y-sexo`**

| Campo                 | Valor                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| Nombre oficial        | Población Total por provincias y sexo                                                                     |
| URL ficha             | https://analisis.datosabiertos.jcyl.es/explore/dataset/poblacion-total-por-provincias-y-sexo/information/ |
| Formato               | JSON (API ODS)                                                                                            |
| Descripción           | Población de CyL por provincias y sexo                                                                    |
| Licencia              | CC BY 4.0 ES                                                                                              |
| Frecuencia            | Anual (última actualización: 2020)                                                                        |
| Campos                | Año, provincia, sexo, población                                                                           |
| Join                  | ✅ EXACT por provincia                                                                                    |
| Uso en SALIDA CyL     | Contexto demográfico provincial                                                                           |
| Valor para el usuario | **2/5** — Población provincial es conocida y no ayuda a decidir FP↔ocupación                              |
| Clasificación         | **REJECT** — Decorativo. No aporta decisión.                                                              |

**Dataset candidato: `poblacion-total-por-edades-y-sexo`**

| Campo                 | Valor                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| Nombre oficial        | Población total por edades y sexo                                                                     |
| URL ficha             | https://analisis.datosabiertos.jcyl.es/explore/dataset/poblacion-total-por-edades-y-sexo/information/ |
| Formato               | JSON (API ODS)                                                                                        |
| Descripción           | Población de CyL por tramos de edad y sexo                                                            |
| Licencia              | CC BY 4.0 ES                                                                                          |
| Frecuencia            | Anual (última actualización: 2020)                                                                    |
| Uso potencial         | Definir si el target etario coincide con el de FP                                                     |
| Valor para el usuario | **1/5** — Demografía general sin relación con la decisión formativa                                   |
| Clasificación         | **REJECT** — Decorativo                                                                               |

**Dataset candidato: `poblacion-de-referencia-2026`**

| Campo          | Valor                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Nombre oficial | Población de referencia - 2026                                                                   |
| URL ficha      | https://analisis.datosabiertos.jcyl.es/explore/dataset/poblacion-de-referencia-2026/information/ |
| Formato        | JSON (API ODS)                                                                                   |
| Descripción    | Población con derecho a asistencia sanitaria en Sacyl por provincia, área, ZBS, sexo y edad      |
| Licencia       | CC BY 4.0 ES                                                                                     |
| Frecuencia     | Anual                                                                                            |
| Join           | ✅ Por provincia                                                                                 |
| Evaluación     | **REJECT** — Población sanitaria, no laboral. No ayuda a la decisión FP↔empleo.                  |

**Dataset candidato: `registro-de-municipios-de-castilla-y-leon`**

| Campo                 | Valor                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Nombre oficial        | Registro de municipios de Castilla y León                                                                     |
| URL ficha             | https://analisis.datosabiertos.jcyl.es/explore/dataset/registro-de-municipios-de-castilla-y-leon/information/ |
| Formato               | JSON (API ODS)                                                                                                |
| Descripción           | Registro oficial de municipios de CyL                                                                         |
| Licencia              | CC BY 4.0 ES                                                                                                  |
| Join                  | ✅ Por nombre de municipio o código INE                                                                       |
| Uso potencial         | Enriquecer localidad de centros y ofertas con código INE, categoría municipal, etc.                           |
| Valor para el usuario | **2/5** — Metadata territorial de referencia, no una pregunta del usuario                                     |
| Clasificación         | **OPTIONAL** — Puede enriquecer la geocodificación de centros, pero no es una pregunta del usuario            |

### 3.5 Familia E: Movilidad/transporte

**Dataset candidato: `estaciones-de-autobuses`**

| Campo                                                                      | Valor                                                                                                                |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Nombre oficial                                                             | Estaciones de autobuses                                                                                              |
| URL ficha                                                                  | https://analisis.datosabiertos.jcyl.es/explore/dataset/estaciones-de-autobuses/information/                          |
| Formato                                                                    | JSON (API ODS)                                                                                                       |
| Descripción                                                                | Estaciones de autobuses en municipios de >5.000 habitantes con geolocalización                                       |
| Licencia                                                                   | CC BY 4.0 ES                                                                                                         |
| Frecuencia                                                                 | Puntual                                                                                                              |
| Campos                                                                     | provincia, municipio, dirección, geolocalización                                                                     |
| Join                                                                       | ✅ Por municipio                                                                                                     |
| ¿Puede responder "¿Cómo puedo llegar al centro donde se imparte esta FP?"? | **PARCIALMENTE** — Solo estaciones de autobús en municipios grandes. No hay líneas, horarios, ni operadores          |
| Cobertura                                                                  | Municipal, solo >5.000 habitantes                                                                                    |
| GTFS                                                                       | **NO** — No hay datos GTFS en el portal JCyL                                                                         |
| Valor para el usuario                                                      | **3/5** — La pregunta "¿cómo llego?" es real, pero solo estaciones sin líneas es insuficiente                        |
| Clasificación                                                              | **OPTIONAL** — Puede complementar la ficha con "estación de autobús más cercana", pero sin GTFS o líneas es limitado |

**Dataset candidato: `transportes-metropolitanos`**

| Campo          | Valor                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Nombre oficial | Transportes metropolitanos                                                                     |
| URL ficha      | https://analisis.datosabiertos.jcyl.es/explore/dataset/transportes-metropolitanos/information/ |
| Formato        | JSON (API ODS)                                                                                 |
| Descripción    | Estadísticas de transporte metropolitano                                                       |
| Licencia       | CC BY 4.0 ES                                                                                   |
| Join           | ⚠️ No hay datos de líneas ni paradas, solo estadísticas de uso                                 |
| Clasificación  | **REJECT** — Estadísticas de uso, no datos de rutas                                            |

### 3.6 Familia F: Otros datasets

**Dataset candidato: `delegaciones-de-colegios-profesionales-estatales`**

| Campo                 | Valor                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nombre oficial        | Delegaciones de colegios profesionales estatales                                                                                                                   |
| URL ficha             | https://analisis.datosabiertos.jcyl.es/explore/dataset/delegaciones-de-colegios-profesionales-estatales/information/                                               |
| Formato               | JSON (API ODS)                                                                                                                                                     |
| Descripción           | Registro de delegaciones de colegios profesionales en CyL                                                                                                          |
| Licencia              | CC BY 4.0 ES                                                                                                                                                       |
| Frecuencia            | Mensual                                                                                                                                                            |
| Uso potencial         | Mostrar colegios profesionales relacionados con la ocupación                                                                                                       |
| Join                  | ⚠️ El colegio profesional tiene denominación y localización, pero **no hay código CNO ni código de familia profesional** que permita unir con nuestras ocupaciones |
| Valor para el usuario | **2/5** — Un usuario de FP no busca colegio profesional como siguiente paso                                                                                        |
| Clasificación         | **REJECT** — Sin código unificable con CNO, y la pregunta del usuario no es esta                                                                                   |

**Dataset candidato: `accidentalidad-por-carreteras`**

| Campo          | Valor                                              |
| -------------- | -------------------------------------------------- |
| Nombre oficial | Accidentalidad por Carreteras                      |
| Evaluación     | **REJECT** — Totalmente ajeno al dominio FP↔empleo |

**Dataset candidato: `tucerticyl-centros-certificadores`**

| Campo          | Valor                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Nombre oficial | TuCertiCyL – Centros certificadores                                                                   |
| URL ficha      | https://analisis.datosabiertos.jcyl.es/explore/dataset/tucerticyl-centros-certificadores/information/ |
| Formato        | JSON (API ODS)                                                                                        |
| Descripción    | Centros certificadores en competencias digitales TuCertiCyL                                           |
| Licencia       | CC BY 4.0 ES                                                                                          |
| Campos         | Denominación, dirección, código postal, localidad, municipio                                          |
| Join           | ⚠️ Sin código de familia profesional ni relación con FP                                               |
| Evaluación     | **REJECT** — Competencias digitales TuCertiCyL no equivale a FP ni a CNO                              |

---

## 4. Verificación de disponibilidad real

Se verificó la capacidad de descarga de los datasets candidatos principales:

| Dataset                                 | API responde | Registros accesibles         | Notas                                |
| --------------------------------------- | ------------ | ---------------------------- | ------------------------------------ |
| `oferta-de-formacion-profesional`       | ✅ 200 OK    | ~1.294                       | Ya integrado                         |
| `ofertas-de-empleo`                     | ✅ 200 OK    | ~1.077                       | Ya integrado                         |
| `formacion-del-ecyl`                    | ✅ 200 OK    | Variable                     | Ya integrado                         |
| `certificados-profesionalidad`          | ✅ 200 OK    | Variable                     | Ya integrado                         |
| `paro-provincias`                       | ✅ 200 OK    | Pocos registros (provincias) | Solo totales provinciales            |
| `directorio-de-centros-docentes`        | ✅ 200 OK    | Miles                        | Centros todos los niveles educativos |
| `estaciones-de-autobuses`               | ✅ 200 OK    | Pocos                        | Solo >5.000 hab.                     |
| `establecimientos-comerciales`          | ✅ 200 OK    | Variable                     | Sin código sectorial                 |
| `poblacion-total-por-provincias-y-sexo` | ✅ 200 OK    | Pocos                        | Solo provincias                      |

---

## 5. Análisis de joins

### 5.1 Joins existentes (ya implementados)

| Origen                 | Destino                | Tipo                         | Campo                               |
| ---------------------- | ---------------------- | ---------------------------- | ----------------------------------- |
| TrainingSourceRecord   | TrainingProgram        | EXACT                        | `clave_ciclo` → `programKey`        |
| TrainingSourceRecord   | EducationCenter        | EXACT                        | `codigo_centro` → `centerCode`      |
| TrainingSourceRecord   | TrainingOffering       | DETERMINISTIC_TRANSFORMATION | Composite key                       |
| TrainingOccupationLink | TrainingProgram        | EXACT                        | `trainingProgramKey` → `programKey` |
| TrainingOccupationLink | Occupation             | EXACT                        | `occupationId`                      |
| JobOffer               | TrainingOccupationLink | FUZZY (alias matching)       | Texto del título vs alias           |
| OutcomeIndicator       | TrainingProgram        | CONTROLLED_CROSSWALK         | familyCode/level → grupo EDUCAbase  |

### 5.2 Joins propuestos para datasets candidatos

| Dataset                                 | Entidad SALIDA CyL       | Tipo de join         | Explicación                                                           |
| --------------------------------------- | ------------------------ | -------------------- | --------------------------------------------------------------------- |
| `paro-provincias`                       | EducationCenter.province | EXACT                | Pero solo totales provinciales, sin valor FP                          |
| `estaciones-de-autobuses`               | EducationCenter.locality | FUZZY                | Solo si el municipio coincide exactamente                             |
| `registro-de-municipios`                | EducationCenter.locality | CONTROLLED_CROSSWALK | Nombre municipio → código INE, pero sin valor directo para el usuario |
| `poblacion-total-por-provincias-y-sexo` | EducationCenter.province | EXACT                | Decorativo                                                            |

**Conclusión de joins:** Ningún dataset candidato ofrece un join con `Occupation` (CNO) que permita enriquecer la ficha de ocupación con datos laborales o empresariais. **No hay datos JCyL con código CNO.**

---

## 6. Hipótesis confirmadas y refutadas

### 6.1 Hipótesis: "Podemos mostrar contratación por ocupación CNO"

**REJECTED** ❌

No existe en el catálogo JCyL ningún dataset que proporcione contratación desagregada por código CNO. Las ofertas de empleo (`ofertas-de-empleo`) no contienen código CNO. El paro (`paro-provincias`) es solo provincial sin desglose ocupacional. Las tablas EDUCAbase proporcionan inserción por grupo de ciclo (a nivel nacional) o por familia–CCAA (sin ciclo), pero no por ocupación CNO en CyL.

**Evidencia:**

- `ofertas-de-empleo`: campos son titulo, provincia, fecha_publicacion, descripcion, localidad. No hay campo de ocupación ni código CNO.
- `paro-provincias`: solo totales provinciales.
- EDUCAbase: confirmado en `salida-cyl-gate-audit-2026.md` que "no existe una tabla oficial que contenga simultáneamente ciclo/título y Castilla y León".

### 6.2 Hipótesis: "Podemos mostrar paro por ocupación"

**REJECTED** ❌

El dataset `paro-provincias` solo contiene totales provinciales. No hay desglose por ocupación, sector, ni código CNO. El SEPE publica datos de demanda de empleo por ocupación a nivel nacional, pero la Junta no los publica en datos abiertos.

### 6.3 Hipótesis: "Podemos localizar centros concretos que impartan cada título"

**CONFIRMED** ✅ (ya implementado)

La fuente `oferta-de-formacion-profesional` contiene centro_educativo, codigo_centro, provincia, localidad, direccion_centro, codigo_postal, telefono, e_mail, web y localizacion(lat/lon). Esto ya está integrado en `centers.json` y `training-offerings.json`.

### 6.4 Hipótesis: "Podemos representar evolución temporal de contratación"

**REJECTED** ❌

El dataset de ofertas de empleo es un snapshot actual, no una serie temporal. No hay historial de ofertas. EDUCAbase proporciona series temporales de ingresos (cohortes 2011-2023), pero son ingresos de titulados, no contratación por ocupación.

### 6.5 Hipótesis: "Podemos estimar densidad de empresas relacionadas con una ocupación"

**REJECTED** ❌

No hay datos JCyL de empresas por CNAE a nivel municipal que permitan unir con CNO. Las licencias IAE son por epígrafe y provincia, sin relación directa con ocupaciones. La unión CNAE↔CNO no es defendible con estos datos.

### 6.6 Hipótesis: "Podemos combinar CNAE y CNO de manera defendible"

**REJECTED** ❌

No existe en estos datos un cruzadero oficial entre CNAE (clasificación de actividades económicas) y CNO (clasificación de ocupaciones). Son taxonomías distintas sin mapping automático verificable. ESCO (Skills, Competences, Qualifications and Occupations) de la Comisión Europea sí propone relaciones CNAE↔CNO, pero esos datos no están en el portal JCyL y usarlos requeriría una fuente adicional no verificada en el catálogo.

### 6.7 Hipótesis: "Podemos utilizar datos demográficos para aportar información útil"

**REJECTED como hipótesis fuerte; parcialmente CONFIRMED como contexto marginal**

Los datos demográficos JCyL (población por provincia, edad, sexo) son extremely agregados y no aportan información que ayude a decidir entre opciones formativas. Pueden justificar contextualización territorial muy general ("CyL tiene X habitantes"), pero no son un diferencial del producto.

### 6.8 Hipótesis: "Existen cinco o más datasets JCyL que mejoren realmente la decisión del usuario"

**REJECTED** ❌

Tras auditar exhaustivamente el catálogo completo (~200 datasets), no se encontraron datasets JCyL adicionales que mejoren la decisión FP↔ocupación más allá de los 4 que ya están integrados (FP, empleo, ECYL, certificados). Los demás cubren sanidad, energía, agricultura, patrimonio, COVID, etc.

---

## 7. Ranking de datasets

| Dataset                                     | Utilidad (0-5) | Diferencial (0-5) | Calidad (0-5) | Integración (0-5) | Trazabilidad (0-5) | Total | Clasificación           |
| ------------------------------------------- | -------------- | ----------------- | ------------- | ----------------- | ------------------ | ----- | ----------------------- |
| `oferta-de-formacion-profesional`           | 5              | 5                 | 5             | 5                 | 5                  | 25    | **CORE** (ya integrado) |
| `ofertas-de-empleo`                         | 5              | 5                 | 4             | 5                 | 5                  | 24    | **CORE** (ya integrado) |
| `formacion-del-ecyl`                        | 3              | 3                 | 4             | 5                 | 5                  | 20    | **CORE** (ya integrado) |
| `certificados-profesionalidad`              | 3              | 3                 | 4             | 5                 | 5                  | 20    | **CORE** (ya integrado) |
| EDUCAbase income                            | 4              | 5                 | 5             | 3                 | 5                  | 22    | **CORE** (ya integrado) |
| `estaciones-de-autobuses`                   | 2              | 1                 | 3             | 3                 | 4                  | 13    | **OPTIONAL**            |
| `registro-de-municipios`                    | 1              | 1                 | 4             | 4                 | 5                  | 15    | **OPTIONAL**            |
| `paro-provincias`                           | 1              | 1                 | 4             | 4                 | 4                  | 14    | **REJECT**              |
| `poblacion-total-por-provincias-y-sexo`     | 1              | 0                 | 3             | 4                 | 4                  | 12    | **REJECT**              |
| `jovenes-inscritos-en-garantia-juvenil`     | 1              | 0                 | 3             | 3                 | 4                  | 11    | **REJECT**              |
| `establecimientos-comerciales`              | 1              | 0                 | 3             | 2                 | 3                  | 9     | **REJECT**              |
| `convenios-colectivos-registrados`          | 1              | 0                 | 3             | 2                 | 4                  | 10    | **REJECT**              |
| `numero-de-licencias-del-iae-por-epigrafes` | 1              | 0                 | 3             | 2                 | 4                  | 10    | **REJECT**              |
| `estadisticas-de-siniestralidad-laboral`    | 0              | 0                 | 3             | 3                 | 4                  | 10    | **REJECT**              |
| `directorio-de-centros-docentes`            | 1              | 0                 | 3             | 3                 | 4                  | 11    | **REJECT**              |

---

## 8. Propuesta de arquitectura de datos resultante

### 8.1 Entidades del grafo (sin cambios en entidades existentes)

Las entidades actuales son correctas y completas para lo que los datos permiten:

- **TrainingProgram** — 187 programas
- **EducationCenter** — 229 centros (con lat/lon en fuente, sin propagar a recurso público)
- **TrainingOffering** — 1.294 ofertas formativas
- **JobOffer** — 1.077 ofertas laborales
- **Occupation** — 91 aprobadas de 502 oficiales CNO-11
- **TrainingOccupationLink** — 14 relaciones aprobadas
- **ProfessionalProfile** — Perfiles de salida oficiales
- **OutcomeIndicator** — Ingresos EDUCAbase

### 8.2 Transformaciones recomendadas (sin nuevos datasets)

1. **Propagar coordenadas al recurso público** — Los datos fuente de `oferta-de-formacion-profesional` y `ofertas-de-empleo` ya contienen `localizacion.lat/lon`. Podrían añadirse a `EducationCenter` y `JobOffer` sin integrar nuevas fuentes. Esto habilitaría mapas de centros y ofertas.

2. **Enriquecer EducationCenter con código INE municipal** — Mediante join con `registro-de-municipios` (CONTROLLED_CROSSWALK por nombre de municipio). Mejora la referencia territorial pero no es una pregunta del usuario.

### 8.3 Frecuencia de actualización

| Recurso                           | Frecuencia             | Método                       |
| --------------------------------- | ---------------------- | ---------------------------- |
| TrainingProgram, Center, Offering | Según publicación JCyL | `npm run data:build`         |
| JobOffer                          | Según publicación ECYL | `npm run data:build`         |
| Occupations, Links                | Curación manual        | Revisión por sesión          |
| OutcomeIndicators                 | Anual (EDUCAbase)      | `npm run data:income:verify` |
| ECYL Courses, Certificates        | Según publicación JCyL | `npm run data:build`         |

### 8.4 Tratamiento de errores (fail closed)

El principio actual es correcto: si falta un recurso o una validación falla, la instantánea anterior se conserva intacta. No se muestra información que los datos no puedan justificar.

---

## 9. Componentes de producto que habilita cada fuente

### 9.1 Ficha "Título FP → Ocupación"

| Componente                      | Fuente actual                               | Pregunta que responde                      | Limitación                                                       |
| ------------------------------- | ------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| Programas disponibles           | `oferta-de-formacion-profesional`           | ¿Qué programas de FP existen?              | Solo CyL                                                         |
| Centros donde estudiar          | `oferta-de-formacion-profesional`           | ¿Dónde puedo estudiar este título?         | Solo CyL, con coordenadas en fuente                              |
| Ocupaciones relacionadas        | `training-occupation-links` + `occupations` | ¿A qué ocupaciones lleva este título?      | Solo 14 relaciones aprobadas de 187 programas                    |
| Perfiles profesionales          | `professional-profiles`                     | ¿Qué salidas profesionales tiene?          | Texto oficial TodoFP, sin datos laborales                        |
| Ofertas de empleo relacionadas  | `ofertas-de-empleo` + alias matching        | ¿Hay ofertas activas para esta ocupación?  | Matching por texto, sin código CNO en ofertas                    |
| Ingresos de titulados           | `outcome-indicators` (EDUCAbase)            | ¿Cuánto ganan los titulados de este nivel? | Solo nivel (GM/GS), no ciclo individual; CyL = centro titulación |
| Requisitos publicados           | `published-requirements`                    | ¿Qué piden las ofertas?                    | Solo requisitos extraídos del texto de la oferta                 |
| Certificados de profesionalidad | `professional-certificates`                 | ¿Qué certificados complementarios existen? | Catálogo nacional, sin relación directa con empleo               |

### 9.2 Componentes NO posibles con datos actuales

| Componente                                | Por qué no es posible                             |
| ----------------------------------------- | ------------------------------------------------- |
| Demanda laboral por ocupación CNO en CyL  | No hay datos JCyL con código CNO                  |
| Paro por ocupación                        | `paro-provincias` es solo provincial sin desglose |
| Evolución de contratación por ocupación   | No hay serie temporal de contratación por CNO     |
| Densidad empresarial por sector/ocupación | Licencias IAE sin cruzadero con CNO               |
| Mapa de empresas por actividad            | Sin datos CNAE↔CNO defendibles                    |
| Transporte público hasta el centro        | Sin GTFS ni líneas, solo estaciones               |

---

## 10. Limitaciones fundamentales

1. **El catálogo JCyL no contiene datos laborales por ocupación CNO.** Este es el límite más importante. Los datos de empleo del portal son ofertas de texto libre (ECYL) y paro provincial agregado.

2. **CNAE y CNO son taxonomías distintas sin mapping oficial en estos datos.** No se puede construir una unión defendible entre actividad empresarial y ocupación a partir de los datasets disponibles.

3. **Las ofertas de empleo no contienen código de ocupación.** El matching actual se basa en alias y texto libre, lo cual es la única opción posible.

4. **No existen datos de movilidad/transporte con cobertura suficiente.** Solo estaciones de autobús en municipios grandes, sin líneas ni horarios.

5. **Los datos demográficos son decorativos** para el objetivo FP↔empleo.

6. **EDUCAbase no ofrece datos por ciclo × CyL.** Ya está documentado en `salida-cyl-gate-audit-2026.md`.

---

## 11. Conjunto mínimo ganador

### MUST HAVE (ya integrados)

| Dataset                           | Justificación                                      |
| --------------------------------- | -------------------------------------------------- |
| `oferta-de-formacion-profesional` | Fuente primaria de FP: programas, centros, ofertas |
| `ofertas-de-empleo`               | Única fuente de empleo real en CyL                 |
| EDUCAbase income                  | Única fuente de ingresos de titulados              |
| BOE CNO-11                        | Catálogo oficial de ocupaciones                    |
| TodoFP professional profiles      | Perfiles de salida oficiales                       |

### SHOULD HAVE (ya integrados)

| Dataset                        | Justificación                            |
| ------------------------------ | ---------------------------------------- |
| `formacion-del-ecyl`           | Formación complementaria ECYL            |
| `certificados-profesionalidad` | Catálogo de certificados complementarios |

### COULD HAVE (prioridad baja)

| Dataset                   | Justificación                         | Riesgo                      |
| ------------------------- | ------------------------------------- | --------------------------- |
| `estaciones-de-autobuses` | Contexto de accesibilidad territorial | Sin GTFS, cobertura parcial |
| `registro-de-municipios`  | Enriquecimiento de códigos INE        | Decorativo                  |

### REJECTED

| Dataset                                  | Razón                                                      |
| ---------------------------------------- | ---------------------------------------------------------- |
| `paro-provincias`                        | Demasiado agregado (solo provincial), sin relación con CNO |
| `directorio-de-centros-docentes`         | La fuente FP ya contiene los centros de FP                 |
| `poblacion-*` (todos)                    | Decorativos, sin relación FP↔ocupación                     |
| `jovenes-inscritos-en-garantia-juvenil`  | Sin relación con CNO ni FP                                 |
| `establecimientos-comerciales`           | Sin código sectorial unificable                            |
| `convenios-colectivos-registrados`       | Sin código CNAE/CNO                                        |
| `numero-de-licencias-del-iae-*`          | CNAE no es CNO, sin cruzadero defendible                   |
| `estadisticas-de-siniestralidad-laboral` | Accidentes no son demanda laboral                          |
| `transportes-metropolitanos`             | Estadísticas de uso, no datos de rutas                     |
| `delegaciones-de-colegios-profesionales` | Sin código CNO, pregunta del usuario no es esta            |
| `tucerticyl-centros-certificadores`      | Competencias digitales ≠ FP ni CNO                         |

---

## 12. Próximos pasos concretos

1. **Ampliar cobertura de relaciones FP→ocupación** — Con 14 relaciones aprobadas de 187 programas, la prioridad es curar más enlaces usando BOE y TodoFP, no buscar datasets nuevos.

2. **Propagar coordenadas a recursos públicos** — Añadir `lat`/`lon` a `EducationCenter` y `JobOffer` desde los datos fuente que ya los contienen. Sin integrar datasets adicionales.

3. **Explorar ESCO como bridge CNAE↔CNO** — El portal ESCO de la Comisión Europea publica mappings entre actividades económicas y ocupaciones. Esto NO es un dataset JCyL, pero podría justificarse como fuente complementaria de la UE para el concurso.

4. **Mejorar matching oferta↔ocupación** — El actual usa alias y texto libre. Podría mejorarse con NLP acotado o synonym lists curadas, pero sin cambiar la fuente.

---

## 13. Evidencia

| Artefacto                           | Ruta                                   |
| ----------------------------------- | -------------------------------------- |
| Catálogo completo JCyL (JSON)       | `tmp/extracted/catalog_all.json`       |
| Catálogo completo JCyL (TSV)        | `tmp/extracted/catalog_all.tsv`        |
| Resultados de búsqueda por términos | `tmp/extracted/catalog_search.json`    |
| Script de extracción del catálogo   | `tmp/catalog_all.py`                   |
| Script de búsqueda por términos     | `tmp/catalog_search.py`                |
| Auditoría de gates previa           | `docs/contest/limitations.md`          |
| Source ledger                       | `docs/contest/source-ledger.md`        |
| Metodología EDUCAbase               | `docs/methodology/educabase-income.md` |

---

## 14. Veredicto final

### VEREDICTO

**`GO_WITH_LIMITATIONS`**

La estrategia de enriquecimiento mediante datos JCyL adicionales **no es viable** porque el catálogo simplemente no contiene datos laborales por ocupación. Los 4 datasets JCyL ya integrados (FP, empleo, ECYL, certificados) + EDUCAbase + BOE CNO-11 + TodoFP representan **el conjunto completo de fuentes oficiales útiles** para la misión FP↔ocupación en Castilla y León.

La limitación no es de esfuerzo ni de integración, sino de **disponibilidad de datos**: la Junta no publica datos de contratación, paro ni actividad empresarial desagregados por ocupación CNO.

### CONJUNTO RECOMENDADO

| Dataset                           | Utilidad | Join                           | Uso en SALIDA CyL                      | Prioridad   |
| --------------------------------- | -------- | ------------------------------ | -------------------------------------- | ----------- |
| `oferta-de-formacion-profesional` | 5        | EXACT (programKey, centerCode) | Programas, centros, ofertas formativas | CORE        |
| `ofertas-de-empleo`               | 5        | FUZZY (alias matching)         | Ofertas laborales relacionadas         | CORE        |
| EDUCAbase income (4 tablas)       | 4        | CONTROLLED_CROSSWALK           | Ingresos de titulados                  | CORE        |
| BOE CNO-11 (curado)               | 5        | EXACT (occupationId)           | Catálogo de ocupaciones                | CORE        |
| TodoFP profiles (curados)         | 4        | EXACT (programKey)             | Perfiles de salida                     | CORE        |
| `formacion-del-ecyl`              | 3        | FUZZY (texto)                  | Formación complementaria               | SHOULD HAVE |
| `certificados-profesionalidad`    | 3        | CONTROLLED_CROSSWALK           | Certificados complementarios           | SHOULD HAVE |

### HALLAZGOS QUE CAMBIAN EL PLAN

1. **No hay datasets JCyL que habiliten "demanda laboral por ocupación"** — Esto invalida la hipótesis de que enriquecer con más datasets resolvería la brecha de información laboral.
2. **La prioridad real es ampliar las relaciones FP→ocupación curando más enlaces BOE/TodoFP**, no buscar fuentes adicionales.
3. **Las coordenadas ya están en los datos fuente** — Proponer propagarlas al recurso público es un cambio de esquema, no una integración de nueva fuente.
4. **El portal JCyL (~200 datasets) está dominado por sanidad, energía, agricultura y patrimonio** — Solo 4-5 datasets son directamente relevantes para FP↔empleo.

### IMPLEMENTACIÓN PROPUESTA

1. Ampliar cobertura de `training-occupation-links` (prioridad urgente)
2. Propagar lat/lon a recursos públicos de centros y ofertas
3. Explorar ESCO como fuente de bridge CNAE↔CNO (fuera del catálogo JCyL)
4. NO integrar datasets JCyL adicionales que no aporten valor directo

### ESTADO DEL REPOSITORIO

- **Archivos creados:** `docs/data-audit-jcyl-open-data.md` (este documento)
- **Archivos modificados:** Ninguno
- **Tests ejecutados:** No se ejecutaron tests porque no hubo cambios en código o datos
- **Estado Git:** Working tree limpio salvo el documento nuevo en `docs/`
- **No se hizo push ni despliegue**
