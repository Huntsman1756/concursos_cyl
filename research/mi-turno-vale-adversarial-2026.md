# Prueba adversarial de «Mi Turno Vale»

Fecha de comprobación: 2 de agosto de 2026.

## Veredicto

**Descartar el concepto en su alcance actual** —convenio + categoría + jornada/turnos + municipio + nómina → «lo que deberían pagarte»—. Puede calcularse el SMI y algunos convenios seleccionados, pero no puede prometerse una verificación laboral fiable y autonómica con los datos abiertos disponibles.

Solo merece un *kill test* una versión mucho menor: **“valor bruto orientativo de este turno para un convenio y categoría que el propio usuario identifica”**, sin selección automática del convenio, sin salario neto, sin leer la nómina y sin dictamen de incumplimiento. Esta reducción debilita considerablemente su valor diferencial para el concurso.

## Qué sí puede calcularse

- El SMI 2026 está perfectamente estructurado en el BOE: **40,70 €/día, 1.221 €/mes y 17.094 €/año**, a prorrata para jornada inferior. Pero el propio real decreto obliga a añadir complementos convencionales y aplicar reglas de compensación y absorción; por tanto el SMI solo permite un suelo anual, no una nómina correcta. [Real Decreto 126/2026](https://boe.es/buscar/doc.php?id=BOE-A-2026-3815).
- La Seguridad Social publica bases y tipos de cotización 2026. La base incluye retribución mensual y parte proporcional de pagas extraordinarias. Es calculable si ya se conocen todos los devengos. [Orden PJC/297/2026](https://www.boe.es/eli/es/o/2026/03/30/pjc297) y [explicación de la Seguridad Social](https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/CotizacionRecaudacionTrabajadores/10721/10957/583).
- JCyL publica un conjunto anual de **fiestas locales**, con provincia, municipio, fecha, nombre e INE, descargable en CSV/JSON y accesible por API. Tiene 15.871 registros históricos y ofrece descargas específicas 2024-2026. [Dataset y API de fiestas locales](https://analisis.datosabiertos.jcyl.es/explore/dataset/fiestas-locales-calendario-de-fiestas-de-caracter-local/) y [descargas oficiales por año](https://datosabiertos.jcyl.es/web/jcyl?binning-state=&idioma=es&p0=true&p1=empleo&p5=Cualquiera&p6=Cualquiera&pagename=Comun17%2FBuscadores%2FSEResultadosBuscador17&paginaID=1284162103951&param1=Dataset&param2=1284197734502&param3=&portal=Portal_RISP%3ARISP&posicion=30&sentry=SEntry&tituloc=no).
- El BOCYL abierto ofrece cada disposición en PDF, XML y HTML y una API/catalogación de más de 61.000 entradas. Sirve para detectar normativa autonómica y convenios de ámbito autonómico publicados allí. [Dataset BOCYL](https://analisis.datosabiertos.jcyl.es/explore/dataset/bocyl/).

## El cuello de botella: determinar el convenio aplicable

- REGCON ofrece consulta pública, texto y trámites como convenio nuevo, modificación, revisión salarial, acuerdos de comisión paritaria, inaplicación y sentencias. Su tabla pública contiene metadatos, pero no una API salarial ni campos estructurados de categorías, pluses o fórmulas. [REGCON](https://expinterweb.mites.gob.es/regcon/).
- La propia Comisión Consultiva Nacional solo da información **orientativa sobre el posible convenio aplicable** según actividad principal/CNAE y provincia del centro. En caso de duda remite a una consulta formal, también no vinculante. [Mapa de Negociación Colectiva y advertencia oficial](https://ccncc.mites.gob.es/mapa-de-negociacion-colectiva).
- La CCNCC reconoce que determinar el convenio exige interpretar la actividad real y que una empresa con varias actividades autónomas puede necesitar convenios distintos. [Notas oficiales sobre determinación del ámbito funcional](https://www.mites.gob.es/ficheros/ministerio/sec_trabajo/ccncc/J_MNC/Notas_explicativas_MNC.pdf).
- El artículo 84 del Estatuto regula concurrencia y prioridades distintas: un convenio de empresa puede prevalecer en horas extra, turnos, horario o clasificación, mientras que salarios plantean otra jerarquía tras la reforma de 2021. Además puede existir una inaplicación registrada. [Estatuto de los Trabajadores, arts. 82-85](https://www.boe.es/eli/es/rdlg/2015/10/23/2/con).

**Conclusión:** actividad + municipio no determina jurídicamente un convenio único. CNAE es una pista, no prueba; el lugar relevante es el **centro de trabajo**, no el domicilio del empleado. Una clasificación automática produciría falsa certeza precisamente en la primera decisión del cálculo.

## Calidad real de los datos JCyL

El dataset [Convenios colectivos registrados](https://analisis.datosabiertos.jcyl.es/explore/dataset/convenios-colectivos-registrados/) contiene **805 filas**: 597 convenios de empresa y 208 sectoriales. Sin embargo:

- sus fechas de publicación van de septiembre de 1996 a **29 de marzo de 2019**;
- sus campos son provincia, ámbito, código, denominación, empresas/trabajadores, fecha y enlace BOP, más referencias a igualdad;
- no incluye vigencia, texto consolidado, categorías, tablas salariales, nocturnidad, festivos, turnicidad, antigüedad, absorción ni cadena de modificaciones;
- numerosos enlaces llevan a boletines provinciales, no al BOCYL.

La cifra y los límites se comprobaron directamente en la [API oficial del dataset](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/convenios-colectivos-registrados/records?limit=1). El dataset es un inventario histórico útil para localizar códigos, **no una base causal vigente para calcular salarios en 2026**.

## Por qué extraer PDFs no resuelve el problema

Los convenios no contienen siempre una tabla autosuficiente. Ejemplos oficiales actuales:

- Un convenio publicado en el BOP de León el 20 de febrero de 2026 calcula varios pluses aplicando sucesivamente porcentajes de 2019 a 2026 **sobre las tablas de 2018**; exige reconstrucción histórica, no copiar una celda. [BOP León 35/2026](https://bop.dipuleon.es/export/sites/bop/.galleries/Documentos-BOPs-en-PDF/bop-20_02_2026-ad99f654-0d71-11f1-96ca-dd38f9a6a5be-1771566394496.pdf).
- Otro convenio de marzo de 2026 publica tablas 2023-2024 y establece que 2025-2028 se actualizarán según incrementos futuros acordados para personal público, mediante reuniones posteriores de la comisión negociadora. [BOP León 52/2026](https://bop.dipuleon.es/export/sites/bop/.galleries/Documentos-BOPs-en-PDF/bop-17_03_2026-8bbfb9e1-2134-11f1-be85-dd38f9a6a5be-1773726393767.pdf).
- Un convenio empresarial 2024-2026 combina incrementos, paga extra y revisión futura ligada al IPC hasta distintos topes. [BOP León 56/2025](https://bop.dipuleon.es/export/sites/bop/.galleries/Documentos-Anuncios-en-PDF/firmado-1742516568575-final-31d6f811-2.pdf).

Haría falta un repositorio editorial versionado por **regla efectiva**, con procedencia, periodo, ámbito, fórmula y pruebas. Un LLM puede proponer extracción, pero no puede decidir de forma segura si un anexo, revisión, comisión paritaria, sentencia o descuelgue sustituye a otro.

## Municipio, turno y nómina

- El municipio solo aporta una causa sólida: identificar si una fecha fue fiesta local del centro de trabajo. No define por sí mismo si trabajarla se paga, compensa con descanso, genera un plus fijo o ya está incluido en un régimen de turnos; eso vuelve al convenio/contrato.
- El artículo 26.3 del Estatuto deja salario base y complementos a negociación colectiva o contrato individual. Los complementos pueden depender de circunstancias personales, trabajo realizado o resultados empresariales. [Estatuto, artículo 26](https://www.boe.es/eli/es/rdlg/2015/10/23/2/con).
- Verificar una nómina completa requiere además pagas prorrateadas, antigüedad, complementos personales y voluntarios, ausencias/IT, incentivos, horas extra, retribución en especie, anticipos, embargos, cotización e IRPF personal. El modelo legal de recibo separa devengos, deducciones y aportaciones empresariales. [Orden ESS/2098/2014](https://www.boe.es/eli/es/o/2014/11/06/ess2098).
- Leer una nómina mediante OCR introduce datos personales de especial impacto y errores de concepto/periodo. No es necesario para el cálculo del turno y convertiría un MVP anónimo en un producto de tratamiento documental sensible.

## Equivalentes y competencia

- **Australia, PACT:** el Fair Work Ombudsman calcula salario, turno, permisos, preaviso y redundancia para los **122 modern awards**. Funciona porque la administración mantiene un corpus normalizado y el alcance está claramente acotado. [Definición oficial vigente de PACT](https://www.fairwork.gov.au/sites/default/files/2025-01/ia-2347.pdf).
- **Francia, Code du travail numérique:** localiza convenio por empresa/SIRET y personaliza respuestas de horas extra o mínimos para convenios previamente analizados, pero advierte límites y remite al contrato si es más favorable. [Localizador oficial](https://code.travail.gouv.fr/outils/convention-collective/convention) y [horas extra personalizadas](https://code.travail.gouv.fr/contribution/heures-supplementaires).
- **Francia, URSSAF Mon-entreprise:** calcula bruto/neto y coste, pero declara que no incorpora convenios colectivos. Es una decisión de alcance muy reveladora. [Simulador oficial](https://mon-entreprise.urssaf.fr/simulateurs/salaire-brut-net).
- **España, CCNCC:** ya existe el Mapa oficial para localizar posibles convenios; «Mi Turno Vale» no debería duplicarlo ni presentar como cierta una salida que el órgano competente etiqueta como orientativa.
- **Privados españoles:** [MiConvenio](https://www.miconvenio.com/Asp/Modulos/CalculoNomina.aspx) ofrece provincia + convenio + categoría + nómina; [NomiCalc](https://nomicalc.com/) especializa convenio, empresa, grupo, turnos, festivos y deducciones para *handling*. Confirman demanda, pero también que la precisión se logra reduciendo mucho el sector o manteniendo una base editorial propietaria.

## Riesgos decisivos

1. **Falso positivo de infrapago:** puede provocar conflicto laboral o una reclamación basada en convenio/categoría incorrectos.
2. **Falso negativo:** puede tranquilizar al trabajador aunque falte un plus, revisión retroactiva o regla contractual.
3. **Competencia estatal:** SMI, cotización y legislación laboral son estatales; JCyL aporta ejecución, boletines y fiestas, pero no controla el motor principal.
4. **Cobertura engañosa:** mostrar 805 convenios sugiere amplitud, aunque el inventario abierto termina en 2019 y no contiene reglas salariales.
5. **Mantenimiento no acotado:** revisiones retroactivas, IPC, acuerdos paritarios, ultraactividad, sentencias e inaplicaciones requieren vigilancia continua.
6. **Clasificación discutible:** la categoría depende de funciones reales; lo que figura en contrato/nómina puede ser precisamente lo controvertido.
7. **Colisión de categoría del concurso:** la salida «te deben X» se aproxima a verificación laboral/reclamación, una familia expresamente excluida en la búsqueda.

## Colisión con las 256 candidaturas históricas

No se encontró coincidencia directa al buscar salario, nómina, convenio, turnos u horas extra en los siete inventarios (256 proyectos). La colisión temática es baja pero no nula: existen **CyL Formación y Empleo**, **EncuentraEmpleo**, **AR-Employ**, **Recursos Empleo Discapacidad**, **StartUp CyL** y varias aplicaciones de empleo/prácticas. Ninguna de ellas calcula retribución por convenio. Por tanto, **la historia no mata el concepto; lo matan datos, responsabilidad y mantenimiento**.

## Kill test cuantitativo

No diseñar interfaz antes de superar estas cuatro puertas con un prototipo de datos:

1. **Cobertura demostrable.** Seleccionar los tres convenios sectoriales con mayor empleo de cada provincia (27). Localizar automáticamente texto vigente, tablas y todas sus modificaciones. Exigir **≥24/27 cadenas completas (90%)** y una fuente oficial actual del número de trabajadores cubiertos. Si no puede demostrarse que esos convenios alcanzan **≥50% del empleo asalariado privado de CyL**, matar.
2. **Exactitud de reglas.** Dos laboralistas anotan independientemente categoría, salario base, extras, antigüedad, nocturnidad, turnicidad, festivo y horas extra para 27 convenios y 6 escenarios cada uno (**162 casos**). Exigir acuerdo interanotador **κ ≥0,90**, resultado bruto del motor dentro de **±1 € por mes** en **≥98%** y **cero falsos “cumple/no cumple”**. Si falla cualquiera, matar.
3. **Actualización.** Durante ocho semanas, detectar el **100%** de nuevas publicaciones/modificaciones de esos 27 convenios en REGCON/boletines en **≤72 horas**, incorporarlas y pasar regresión. Presupuesto editorial máximo: **4 horas humanas por modificación** y **0,5 ETC anual** para el alcance. Si se supera, matar.
4. **Utilidad sin dictamen.** Probar con 40 trabajadores usando nóminas previamente anonimizadas por ellos. Al menos **80%** debe identificar correctamente convenio y categoría sin asistencia; **≥60%** debe cambiar una decisión concreta (negociar un turno, pedir aclaración o comprobar un concepto) y ningún usuario debe interpretar el resultado como cantidad jurídicamente exigible. Si más de **10%** lo interpreta como veredicto legal, matar.

### Probabilidad adversarial de superar las puertas

- Cobertura: **baja** por ausencia de denominador y corpus vigente estructurado.
- Exactitud: **baja-media** en un solo convenio; **muy baja** en 27.
- Actualización: **baja** sin equipo editorial estable.
- Utilidad: **media**, pero coincide con herramientas privadas y deriva con facilidad hacia reclamación.

**Decisión recomendada:** no invertir más salvo que la organización del concurso confirme expresamente que acepta un piloto restringido a 1-3 convenios y que un resultado orientativo laboral no infringe las exclusiones. Incluso en ese caso, el nombre debería cambiar a **«Valor de turno»** y nunca prometer verificar una nómina.
