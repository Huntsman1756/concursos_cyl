# Auditoría de gates de SALIDA CyL

**Fecha de comprobación:** 3 de agosto de 2026  
**Criterio de fuentes:** exclusivamente fuentes primarias u oficiales (Junta de Castilla y León, Ministerio de Educación/FP, EDUCAbase, BOE/TodoFP y la URL publicada del propio proyecto).

## Veredicto ejecutivo

| Gate | Resultado | Consecuencia de diseño |
|---|---|---|
| Inserción de FP por ciclo específico × Castilla y León | **No pasa en su versión fuerte** | EDUCAbase permite `familia × CCAA` o `ciclo-grupo × total nacional`, pero no ambas dimensiones a la vez. No se puede prometer una tasa histórica de CyL para cada ciclo. |
| Uso de las salidas profesionales de TodoFP | **Pasa con controles** | Es viable mantener una referencia estática, atribuida y revisada; no hace falta scraping en vivo. Conviene conservar el texto oficial y separar cualquier normalización propia. |
| Precedentes PRACTICYL, EncuentraEmpleo y StartUp CyL | **Confirmados** | Los dos primeros fueron candidaturas, no productos premiados con URL publicada. StartUp CyL fue ganador didáctico y sigue publicado. |
| Originalidad de SALIDA CyL | **Pasa solo de forma condicionada** | “Buscador de empleo + oferta de FP” está muy ocupado. La novedad defendible es `título → evidencia de requisito en vacante → brecha explícita → acción`, con recorrido inverso y trazabilidad. |

## 1. Granularidad real de la inserción laboral

### 1.1 EDUCAbase separa dos ramas que no se cruzan a nivel de ciclo

El Ministerio indica que la estadística integra registros educativos con afiliación a la Seguridad Social, cubre cohortes desde 2011-2012 y ofrece ramas distintas de resultados [por comunidad autónoma](https://estadisticas.educacion.gob.es/EducaDynPx/educabase/index.htm?type=pcaxis&path=/laborales/insercion/ccaa&file=pcaxis&l=s0) y [por familia profesional–ciclo](https://estadisticas.educacion.gob.es/EducaDynPx/educabase/index.htm?type=pcaxis&path=/laborales/insercion/famprof&file=pcaxis&l=s0). La página de publicación las enumera por separado y fecha la edición vigente el 26 de noviembre de 2025: [Inserción laboral de las personas graduadas en FP](https://www.educacionfpydeportes.gob.es/servicios-al-ciudadano/estadisticas/laborales/insercion.html).

La inspección de las dimensiones publicadas arroja este límite:

- **Máximo detalle regional:** tasa por `familia profesional × comunidad autónoma × cohorte × periodo`, tanto para [Grado Medio, tabla 2.12](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?path=/laborales/insercion/ccaa/l0/&file=ccaa_2_12.px&L=0) como para [Grado Superior, tabla 3.12](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?path=/laborales/insercion/ccaa/l0/&file=ccaa_3_12.px&L=0).
- **Máximo detalle por ciclo:** `ciclo-grupo × indicador × cohorte × periodo`, sin dimensión territorial, en [Grado Medio, tabla 2.2](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?path=/laborales/insercion/famprof/l0/&file=famprof_2_02.px&L=0) y [Grado Superior, tabla 3.2](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?path=/laborales/insercion/famprof/l0/&file=famprof_3_02.px&L=0).
- FP Básica no dispone de tabla de afiliación por ciclo.

Por tanto, **no existe una tabla oficial que contenga simultáneamente ciclo/título y Castilla y León**. No es válido filtrar el dato nacional de ciclo por CyL ni atribuir a un ciclo la tasa regional de su familia.

Además, “ciclo-grupo” no equivale siempre a un título individual: algunas categorías agregan varios ciclos. La [metodología oficial 2025](https://www.educacionfpydeportes.gob.es/dam/jcr%3A1ae997fc-346b-4b39-800c-3d8bde091367/metodo-2025.pdf) explica la agrupación necesaria para preservar representatividad y fija un mínimo de 50 personas en el denominador. También precisa que la comunidad autónoma es la del centro donde se obtuvo el título, no la ubicación del empleo.

### 1.2 El estudio propio de JCyL no es un cruce con Seguridad Social

La página autonómica solo ofrece el [Estudio de inserción laboral de titulados de FP en Castilla y León, curso 2019-2020](https://www.educa.jcyl.es/fp/es/formacion-empresa/insercion-laboral-titulados-fp-castilla-leon), publicado en diciembre de 2021.

El [PDF oficial de 111 páginas](https://www.educa.jcyl.es/fp/es/formacion-empresa/insercion-laboral-titulados-fp-castilla-leon.ficheros/1535680-ESTUDIO%20DE%20INSERCION_Curso19_20.pdf) declara en su metodología una **encuesta CAWI/CATI a 2.024 titulados**. La muestra se estratifica por provincia, familia y ciclo, pero eso no implica que publique estimaciones por ciclo. Los resultados de inserción se ofrecen globalmente, por grado, familia, modalidad, provincia y sexo; no por título concreto. La afirmación de que este estudio procede de un cruce educación–Seguridad Social es, por tanto, incorrecta.

### 1.3 Uso correcto dentro de SALIDA CyL

La ficha puede mostrar dos señales claramente independientes:

1. **Contexto regional:** inserción de la familia profesional entre titulados en centros de Castilla y León.
2. **Contexto nacional:** inserción del ciclo o grupo de ciclos, solo cuando EDUCAbase lo publique.

Cada tarjeta debe rotular población, territorio, cohorte, periodo y fuente. No debe calcularse una cifra sintética que aparente ser “inserción del ciclo en CyL”.

## 2. TodoFP: naturaleza y curación estática

TodoFP es el portal de Formación Profesional del Ministerio. Su [página institucional de inicio](https://todofp.es/inicio.html) enlaza la oferta, los registros y catálogos del Sistema de FP, herramientas de orientación y la aplicación SoyFP. El [Catálogo Nacional de Ofertas del Sistema](https://todofp.es/catalogos-registros-sistema-fp/catalogo-nacional-ofertas-sistema.html) se define como el instrumento que contiene las ofertas reconocidas y acreditables.

Las fichas de título publican listas finitas de ocupaciones. Por ejemplo, la ficha oficial de [Técnico en Actividades Comerciales](https://todofp.es/que-estudiar/familias-profesionales/comercio-marketing/actividades-comerciales.html) enumera bajo “Trabajar como” perfiles como vendedor, representante comercial, teleoperador, responsable de almacén o técnico de logística.

### ¿Se puede mantener una tabla estática?

**Sí, con estas condiciones:**

- TodoFP debe considerarse contenido oficial curado, no un dataset operativo con contrato de API.
- El [aviso legal de TodoFP](https://todofp.es/comunes/aviso-legal.html) autoriza la reproducción total o parcial de sus textos si se mantiene su integridad y se cita expresamente al Ministerio. También advierte de que el portal puede modificar contenidos y recomienda comprobar su vigencia.
- La tabla local debe guardar, como mínimo: título/código, denominación ocupacional original, URL fuente, fecha de revisión y estado `vigente/no vigente`.
- Cualquier lema normalizado, código ESCO, sinónimo o regla de correspondencia debe almacenarse como **elaboración propia**, separado del texto oficial. No debe presentarse una equivalencia inferida como si la hubiera certificado TodoFP.
- Es preferible una revisión por curso y un proceso de diferencias frente a la fuente a un scraper en tiempo real. Son relaciones finitas y el producto necesita estabilidad y auditabilidad, no frescura diaria.

El riesgo no está en la curación estática, sino en copiar una presentación completa, omitir atribución o transformar el texto oficial sin distinguirlo de la elaboración propia.

## 3. Precedentes oficiales

### 3.1 PRACTICYL

La [relación oficial de candidaturas del III Concurso (2019)](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/candidaturas-iii-concurso.html) lo describe como un “buscador multicriterio para poner en contacto a estudiantes con empresas en las que poder realizar sus prácticas o formación”.

- Era un antecedente de **estudiante → empresa/prácticas**, no un sistema de inserción histórica ni de verificación de requisitos de vacantes.
- No figura entre los [premiados del III Concurso](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/premiados-iii-concurso.html).
- La celda oficial no incluye hipervínculo. Por ello, a 3 de agosto de 2026 **no hay una demo accesible desde el registro oficial**. Esto no prueba que nunca se desarrollara o que no exista en otra ubicación; solo que la Junta no publica una URL verificable.

### 3.2 EncuentraEmpleo

La misma [relación oficial de candidaturas de 2019](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/candidaturas-iii-concurso.html) lo define únicamente como “Web con ofertas de empleo en la Comunidad”.

- Es el precedente directo de un **listado/buscador regional de ofertas**.
- Tampoco figura entre los [premiados de aquella edición](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/premiados-iii-concurso.html).
- La candidatura no contiene enlace, por lo que tampoco hay producto accesible desde el registro oficial en la fecha de revisión.

La misma edición incluyó **AR-Employ**, descrita oficialmente como una app para mostrar las últimas ofertas de empleo y formación en Castilla y León. Esto eleva aún más el riesgo de que una simple agregación de ambos catálogos se perciba como repetida.

### 3.3 StartUp CyL

La Junta confirma que **StartUp CyL: Creación de empresas a través de la Inteligencia Artificial y Datos Abiertos** obtuvo el primer premio de Recurso Didáctico en 2024: [premiados del VIII Concurso](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/premiados-viii-concurso-datos.html).

La [URL pública del proyecto](https://chatgpt.com/g/g-ut0dYT0Yk-startup-cyl) sigue resolviendo con HTTP 200 el 3 de agosto de 2026. La propia página lo titula “StartUp CyL” y lo describe como una ayuda para validar ideas de negocio o productos usando datos abiertos de Castilla y León. La disponibilidad del endpoint no garantiza que toda la experiencia conversacional funcione sin cuenta o sin las condiciones vigentes de ChatGPT.

No existe una colisión funcional fuerte con SALIDA CyL: StartUp CyL trata la simulación/validación de negocios y es un recurso didáctico; SALIDA CyL se plantea como producto ciudadano de transición formación–empleo. Sí establece un precedente de que “IA + datos de CyL” por sí solo ya no es novedoso.

## 4. Riesgos de originalidad

### Riesgo alto: repetir el envoltorio

SALIDA CyL tendría una originalidad débil si se limita a cualquiera de estas formulaciones:

- “buscador de ofertas de empleo de Castilla y León” — ya representado por EncuentraEmpleo;
- “ofertas de empleo y formación juntas” — ya representado por AR-Employ;
- “estudiantes y empresas para prácticas” — ya representado por PRACTICYL;
- “visualizar dónde estudiar FP” — el primer premio de Productos y Servicios de 2022 fue **Oferta de Formación Profesional de Castilla y León. Una alternativa atractiva y accesible con herramientas no-code**, según el [palmarés oficial del VI Concurso](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/premiados-vi-concurso.html);
- “orientador de FP” — TodoFP ya ofrece fichas, buscadores y herramientas de orientación desde su [portal oficial](https://todofp.es/inicio.html);
- “mostrar inserción histórica” — EDUCAbase ya ofrece esa consulta estadística.

### Originalidad defendible: cambiar la operación

El núcleo diferencial debe formularse de manera comprobable:

> **SALIDA CyL transforma un título de FP en un expediente auditable de oportunidades actuales: qué relación profesional existe, qué requisito aparece expresamente en cada vacante, qué información falta y qué brecha concreta impide afirmar el acceso.**

Para sostenerlo ante el jurado, el MVP debe incluir:

1. Entrada por título y recorrido inverso por ocupación.
2. Vacantes vigentes de ECYL, con enlace y fecha.
3. Evidencia textual del requisito, no un porcentaje opaco de compatibilidad.
4. Estados separados: `encaje explícito`, `relación ocupacional con requisitos incompletos` y `brecha explícita`.
5. Trazabilidad de cada vínculo título–ocupación y revisión humana de la tabla estática.
6. Centros, modalidad y territorio de CyL como siguiente acción concreta.
7. Contexto histórico regional y nacional separado, sin inferencias territoriales falsas.

Debe evitarse el lenguaje “puedes acceder” cuando el anuncio no publique información suficiente y “profesión demandada” cuando el único indicador sea el número de anuncios de ECYL.

## 5. Comprobación del alcance actual de la oferta regional

Una consulta de la [API oficial de Oferta de Formación Profesional de Castilla y León](https://analisis.datosabiertos.jcyl.es/explore/dataset/oferta-de-formacion-profesional/) realizada el 3 de agosto de 2026 devuelve **1.294 filas**, **187 claves de ciclo**, **223 centros** y **22 familias profesionales**. Por nivel son 98 ciclos de Grado Superior, 52 de Grado Medio, 19 de Grado Básico y 18 cursos de especialización.

La cifra “187” es válida para las claves distintas publicadas en esa instantánea, pero no debe presentarse como una constante normativa. La memoria debería indicar fecha de corte y actualización automática desde la fuente.

## Decisión recomendada

**GO condicionado.** SALIDA CyL es realizable y defendible si se corrige desde ahora la promesa histórica y se construye alrededor de la evidencia de requisitos en vacantes.

Es **NO-GO** si el diseño exige una tasa oficial de inserción por ciclo concreto en Castilla y León, porque esa observación no está publicada. También sería una candidatura débil si su demostración principal fuera buscar ofertas o localizar centros.

La arquitectura de datos correcta es:

`título CyL → ocupaciones oficiales curadas → vacantes ECYL → requisitos expresos/ausentes → brechas y acciones`

con dos anexos contextuales que nunca se mezclan:

- `familia × Castilla y León`;
- `ciclo-grupo × España`.
