# SALIDA CyL — fuentes salariales, sistemas SBB y criterios de diseño

**Fecha de verificación:** 4 de agosto de 2026  
**Método:** revisión exclusiva de fuentes primarias: portales estadísticos oficiales, documentación y repositorios de sus autores.  
**Decisión:** incorporar en el MVP una pestaña **«Comparar estudios»** con datos de EDUCAbase cuidadosamente rotulados; adoptar principios de SBB, pero no su marca ni sus librerías visuales; usar las skills de diseño solo como instrumentos de revisión, no como dependencias de ejecución.

## 1. ¿Existe una fuente salarial oficial utilizable?

Sí. La fuente más adecuada es la [Estadística de Inserción Laboral de las personas graduadas en FP](https://www.educacionfpydeportes.gob.es/servicios-al-ciudadano/estadisticas/laborales/insercion.html), elaborada por el Ministerio de Educación a partir de información educativa y afiliación a la Seguridad Social. No mide una promesa salarial: publica la **base de cotización por contingencias comunes anualizada** de personas afiliadas por cuenta ajena y a jornada completa. La [metodología oficial de 2025](https://www.educacionfpydeportes.gob.es/dam/jcr%3A1ae997fc-346b-4b39-800c-3d8bde091367/metodo-2025.pdf) explica población, cálculo, supresiones y límites.

### Disponibilidad por nivel

| Nivel solicitado | Fuente y granularidad disponible | ¿Uso MVP? |
| --- | --- | --- |
| Título/ciclo FP | Grado Medio y Superior: `ciclo o grupo oficial de ciclos × cohorte × 1.º–4.º año × media/límites de quintiles`, ámbito España. [GM](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?path=/laborales/insercion/bcc/l0/&file=bcc_2_03.px&L=0) · [GS](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?path=/laborales/insercion/bcc/l0/&file=bcc_3_03.px&L=0) | **Sí, dato principal** |
| Familia FP | Familia profesional a escala nacional; en Grado Básico es el máximo detalle salarial disponible | Solo como alternativa cuando no exista ciclo publicable |
| Castilla y León | `grado FP × CCAA × sexo × cohorte × año × medida`; no contiene ciclo ni familia. [GM](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?path=/laborales/insercion/bcc/l0/&file=bcc_2_04.px&L=0) · [GS](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?path=/laborales/insercion/bcc/l0/&file=bcc_3_04.px&L=0) | **Sí, referencia separada** |
| Ocupación | El [INE](https://ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177025&idp=1254735976596) publica ganancia por grandes grupos CNO-11, no por la ocupación concreta del buscador | No para el motor MVP |
| Provincia | La [AEAT](https://sede.agenciatributaria.gob.es/AEAT/Contenidos_Comunes/La_Agencia_Tributaria/Estadisticas/Publicaciones/sites/mercado/2024/jrubik2f988d6f79ea9247ea3f20c424927b60c7d465dc.html) ofrece provincia × sector, pero no título, familia FP ni ocupación | Posponer; unirlo produciría falsa precisión |

EDUCAbase facilita descargas CSV, PC-Axis y XLS; los recursos también están catalogados oficialmente en datos.gob.es para [Grado Medio](https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090080) y [Grado Superior](https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090094). La actualización es anual; la edición revisada se publicó el 26 de noviembre de 2025 y las tablas de ciclo se actualizaron de nuevo el 25 de junio de 2026. Se recomienda ingerir snapshots versionados, no depender de una consulta en tiempo real.

El catálogo remite al aviso legal del Ministerio, no a un identificador CC explícito para estas tablas. Deben conservarse atribución, URL, fecha de actualización e integridad del dato, sin insinuar respaldo del Ministerio. En cambio, el [portal de datos abiertos del INE](https://www.ine.es/datosabiertos/) publica su información bajo CC BY 4.0 y ofrece [API JSON](https://www.ine.es/dyngs/DataLab/manual.html?cid=45).

### Límites que la interfaz debe hacer visibles

- «Ciclo-grupo» no siempre equivale a un título: el producto debe mostrar el nombre oficial de la agrupación y sus miembros.
- Se suprimen resultados sin representatividad; `..` significa no disponible o no representativo. La metodología aplica umbrales de 50 personas en el denominador y 10 en el numerador.
- Las cohortes recientes son provisionales y todavía no permiten observar todos los años posteriores.
- El indicador excluye jornada parcial, trabajo por cuenta propia y otros casos no cubiertos por la afiliación utilizada.
- En la tabla territorial, Castilla y León es la comunidad del centro donde se obtuvo el título, no necesariamente el lugar del empleo.
- No existe salario oficial `ciclo × Castilla y León`, `familia × Castilla y León`, `ocupación concreta × Castilla y León` ni `ciclo × provincia`.

### Otras fuentes oficiales revisadas

- La [Estructura Salarial de Castilla y León](https://estadistica.jcyl.es/web/es/estadisticas-temas/estructura-salarial.html) ofrece contexto regional, pero agrupa ocupaciones en solo tres niveles por falta de observaciones; no sirve para atribuir una cifra a una profesión concreta.
- La [Encuesta Anual de Estructura Salarial del INE](https://ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177025&idp=1254735976596) es reciente y reutilizable, pero sus grandes grupos ocupacionales son demasiado amplios para el cruce de SALIDA CyL.
- Los [Perfiles de la oferta del SEPE](https://sepe.es/HomeSepe/que-es-observatorio/perfiles-de-la-oferta-de-empleo/Informacion-de-los-perfiles-de-la-oferta.html) contienen condiciones de muestras de ocupaciones seleccionadas, no una tabla salarial completa y estable.
- El dataset JCyL [Ofertas de empleo](https://analisis.datosabiertos.jcyl.es/explore/dataset/ofertas-de-empleo/api/?flg=es-es), CC BY 4.0 y de actualización diaria, no posee un campo salarial estructurado. Si una descripción publica una cifra, solo debe reproducirse literalmente para esa vacante, con enlace; nunca agregarse ni imputarse.

### Diseño cerrado para «Comparar estudios»

1. Tarjeta principal: **«Ingresos observados de titulados de este ciclo o grupo en España»**, con cohorte, año posterior, media y límites de quintiles. Etiqueta permanente: **«Base de cotización anualizada · jornada completa · España»**.
2. Tarjeta separada: **«Referencia de titulados de [Grado Medio/Superior] en Castilla y León»**, sin atribuirla a la familia o al ciclo.
3. Texto obligatorio: **«Mostramos ambas referencias por separado porque no existe una estadística oficial de ingresos por ciclo formativo en Castilla y León.»**
4. Nunca usar «ganarás», «salario esperado» ni combinar matemáticamente las dos tarjetas. Las comparaciones solo serán entre la misma cohorte y el mismo año posterior.

**Veredicto salarial: GO para el MVP**, como sección comparativa secundaria y metodológicamente separada del motor de ofertas.

## 2. Repositorios y sistemas SBB

| Recurso | Licencia | Alcance real | Decisión para SALIDA CyL |
| --- | --- | --- | --- |
| [SBB API Principles](https://github.com/SchweizerischeBundesbahnen/api-principles) | [Apache-2.0](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/api-principles/master/LICENSE) | Estándar documental para API, no librería | Adoptar selectivamente |
| [SwiftUI Mobile](https://github.com/SchweizerischeBundesbahnen/mobile-ios-design-swiftui) | [MIT](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/mobile-ios-design-swiftui/main/LICENSE) | Swift Package para iOS 15+, Dynamic Type, VoiceOver, claro/oscuro | No utilizable en web; extraer principios |
| [Flutter Design System Mobile](https://github.com/SchweizerischeBundesbahnen/design_system_flutter) | [MIT](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/design_system_flutter/main/LICENSE) | Paquete probado y declarado para Android/iOS | No instalar; extraer tokens/temas/pruebas |
| [`sbb-angular`](https://github.com/sbb-design-systems/sbb-angular) | [Apache-2.0](https://raw.githubusercontent.com/sbb-design-systems/sbb-angular/main/LICENSE) | Componentes web Angular para productos SBB | No instalar en React/Next; identidad inadecuada |

Los [SBB API Principles](https://schweizerischebundesbahnen.github.io/api-principles/) sí son aplicables a una web. Conviene adoptar contrato OpenAPI versionado con el código, métodos y estados HTTP estándar, identificadores estables, filtros, paginación, errores coherentes, compatibilidad hacia atrás y trazabilidad. Las secciones oficiales de [REST](https://schweizerischebundesbahnen.github.io/api-principles/restful/principles/) y [compatibilidad](https://schweizerischebundesbahnen.github.io/api-principles/general/compatibility/) respaldan esas prácticas. No hace falta importar el gobierno corporativo completo de SBB.

SwiftUI y Flutter no son dependencias web. Sus criterios trasladables son texto adaptable, lector de pantalla, temas equivalentes, componentes con variantes acotadas, tokens semánticos y pruebas visuales. `sbb-angular` sí es una librería web y declara soporte de navegadores y tecnologías de asistencia en su [README](https://raw.githubusercontent.com/sbb-design-systems/sbb-angular/main/README.md), pero está acoplada a Angular/CDK y a la identidad SBB. Cambiar de stack para usarla sería sobreingeniería improductiva. Apache-2.0 tampoco concede derechos sobre marcas.

La referencia adecuada son los [principios UX de SBB](https://digital.sbb.ch/de/principles/ux-principles/overview/): centrado en usuarios, consistente, inclusivo, reducido, autoexplicativo y orientado a tareas. En SALIDA CyL se traducen en una secuencia clara `encaje → requisito → brecha → acción`, texto breve, estados comprensibles y detalles metodológicos desplegables. No se copiarán logos, pictogramas, fuentes, nombres ni activos SBB.

## 3. Skills de diseño enlazadas

### `emilkowalski/skills`

El [repositorio](https://github.com/emilkowalski/skills), bajo [MIT](https://raw.githubusercontent.com/emilkowalski/skills/main/LICENSE), contiene instrucciones para agentes, no componentes runtime. Su skill [`emil-design-eng`](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md) es útil para auditar microinteracciones: toda animación debe tener propósito; conviene usar `transform`/`opacity`, mantener transiciones ordinarias por debajo de 300 ms y respetar `prefers-reduced-motion`.

**Decisión:** usarla como QA de movimiento después del flujo funcional. SALIDA CyL tendrá movimiento mínimo para feedback, cambios de estado y apertura de detalles; nada ornamental que retrase la evidencia.

### `design-taste-frontend`

La ficha enlaza al [repositorio Taste Skill](https://github.com/Leonxlnx/taste-skill), [MIT](https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/LICENSE). Su README identifica la v2 como experimental y la [skill](https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/taste-skill/SKILL.md) se orienta a landing pages, portfolios y rediseños, no a dashboards, tablas o flujos multipaso.

**Decisión:** aplicar sus ideas anti-«AI slop» solo a portada y presentación; no dejar que gobierne la ficha de evidencia. Si se incorpora al repositorio, fijar commit por el carácter experimental de v2.

### `ui-ux-pro-max`

El [repositorio oficial](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), bajo [MIT](https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/LICENSE), es una base de conocimiento multistack para diseño, accesibilidad, responsive, formularios, tablas y gráficos; tampoco es una dependencia runtime.

**Decisión:** usarla como checklist secundario de teclado, foco, contraste, controles táctiles, responsive y estados de carga/error/vacío. No permitir que genere automáticamente paleta, estilo o jerarquía: manda el sistema de evidencia aprobado.

## 4. Política de implementación resultante

> SBB será referencia de producto limpio y accesible; API Principles, estándar arquitectónico selectivo; `emil-design-eng`, control de movimiento; `ui-ux-pro-max`, checklist; y `design-taste-frontend`, revisión de portada. SALIDA CyL mantendrá componentes e identidad propios.

Reglas ejecutables:

1. Solo herramientas y dependencias de código abierto, con versión fijada y licencias registradas.
2. Código, identificadores y contratos en inglés; interfaz y contenido en español, con posibilidad de internacionalización.
3. Tokens propios para color, tipografía, espaciado, foco y movimiento; iconos solo cuando mejoren reconocimiento, siempre con texto accesible.
4. OpenAPI junto al código y trazabilidad desde cada indicador hasta dataset, snapshot y fecha.
5. Pruebas de teclado, lectores de pantalla, zoom, contraste, móvil y movimiento reducido.
6. Texto de interfaz limitado a título, evidencia, límite y acción; explicación extensa en metodología o detalles progresivos.

## Veredicto final

La propuesta del usuario es aplicable con dos ajustes esenciales. La pestaña tipo *que-estudio* debe llamarse **«Comparar estudios»** y usar EDUCAbase sin fabricar detalle territorial. La limpieza de SBB debe trasladarse como principios y disciplina de ingeniería, no como copia visual ni como dependencia incompatible con el stack web.
