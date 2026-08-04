# V5 — Auditoría de datos operativos para una aplicación ciudadana

**Fecha de corte:** 3 de agosto de 2026  
**Veredicto:** **0 supervivientes / 10 activos examinados**  
**Alcance:** solo se han buscado datos capaces de sostener una acción ciudadana real. No se proponen productos.

## Resultado ejecutivo

La búsqueda ya no está bloqueada por falta de ideas, sino por una carencia comprobable de **sustrato operativo reutilizable en Castilla y León**. Hay conjuntos actuales, abiertos y voluminosos, pero casi siempre publican una de estas cuatro cosas: oferta nominal, estadísticas de uso, registros de entidades o valores medios. Ninguna de ellas equivale a disponibilidad real, elegibilidad computable y una acción oficial ejecutable.

Las [bases reguladoras](<G:/_Descargas/IAPA_2377_BBRR_TRA_483_2020_yModificación,1 (1).pdf>) y la [convocatoria de 2026](G:/_Descargas/IAPA_2377_EXTRACTOyCONVOCATORIA_2026.pdf) obligan a usar al menos una fuente del portal de datos abiertos de la Junta. En Productos y Servicios, además, se valoran utilidad, valor económico, impacto social, originalidad, variedad de fuentes —en especial de la Junta—, facilidad de uso y calidad técnica. Por tanto, usar un registro menor de JCyL como adorno de una fuente operativa de otra región cumpliría la literalidad, pero debilitaría precisamente los criterios que deciden el premio.

La auditoría de los siete libros Excel arroja **256 candidaturas históricas netas**. Formación, empleo, elección de estudios, productos locales, buscadores y verificadores ya están especialmente ocupados: aparecen, entre otros, *Elige tu Universidad*, *Oferta de Formación profesional*, *Centros educativos y sus estudios*, *Carreratio*, *MercaCyL* y varias aplicaciones de empleo y alertas. Esto impide reinterpretar como innovación una capa de búsqueda sobre los mismos datos.

### Gate aplicado

Un activo solo podía sobrevivir si cumplía simultáneamente:

1. estado operativo individual, no agregado histórico;
2. reglas o campos causales suficientes para calcular una respuesta;
3. inventario disponible —no solo capacidad inicial— cuando exista escasez;
4. identificador y enlace profundo hacia la acción oficial;
5. frecuencia compatible con la decisión;
6. acceso estable y licencia reutilizable;
7. uso material de datos de JCyL;
8. alcance ciudadano y ausencia de colisión o ámbito expresamente descartado.

## Matriz de decisión

| # | Activo operativo examinado | Estado / reglas / inventario | Acción que los datos podrían sostener | Bloqueo decisivo | Veredicto |
|---:|---|---|---|---|---|
| 1 | Formación ECYL | Capacidad inicial, requisitos, colectivo, fecha y forma de inscripción | Seleccionar una formación y dirigirse al canal indicado | Cero plazos de candidatura informados; no hay plazas restantes; fuerte colisión histórica | **NO** |
| 2 | Oferta de FP de JCyL | Centro, ciclo, modalidad y grupos ofertados | Elegir dónde solicitar un ciclo | No publica cupo, vacantes, notas, plazo ni enlace de solicitud; dato anual | **NO** |
| 3 | Cursos juveniles 2026 | Curso, fechas, lugar, contacto y web | Contactar con la entidad formadora | Sin precio, requisitos, plazo, plazas o enlace profundo de matrícula; queda en calendario/directorio | **NO** |
| 4 | TuCertiCyL | Convocatoria, centro, hora y resultados | Identificar una convocatoria de certificación | Es estadística de resultados, no agenda con plazas; fechas operacionalmente incoherentes | **NO** |
| 5 | Productos Tierra de Sabor | Registro vigente de producto, marca y figura de calidad | Confirmar que un producto pertenece a la marca | Sin EAN, formato, precio, stock ni canal de compra; solo verificación/catálogo ya colisionado | **NO** |
| 6 | Precios alimentarios JCyL + MAPA | Coeficientes mensuales por producto, territorio y unidad | Comparar un precio observado con una referencia | Origen/mayorista o media agregada, no precio minorista equivalente ni oferta comprable | **NO** |
| 7 | Plazas deportivas municipales | Oferta, ocupación y plazas libres por grupo | Detectar una actividad con cupo y reservarla | La fuente operativa es de Madrid, mensual y sin equivalente de disponibilidad en CyL | **NO** |
| 8 | Animales municipales adoptables | Registro por animal con estado, rasgos y contacto | Iniciar adopción o reclamación | Sin feed equivalente en CyL y el ejemplo auditado expone datos personales incompatibles con una reutilización segura | **NO** |
| 9 | Calidad de banda ancha CNMC | Mediciones de velocidad, latencia, señal, tecnología y localización | Evaluar la calidad obtenida antes de cambiar de proveedor | No contiene ofertas, precios, cobertura contractual por domicilio ni enlace de contratación; sin operando JCyL | **NO** |
| 10 | Índice francés de reparabilidad | EAN/modelo y criterios normalizados de reparabilidad | Comparar reparabilidad antes de comprar | Cobertura francesa/declarativa, sin oferta española, precio ni stock; no existe puente material con JCyL | **NO** |

## Fichas de evidencia

### 1. Formación del ECYL

- **Fuente primaria:** [JCyL — Formación del ECYL](https://analisis.datosabiertos.jcyl.es/explore/dataset/formacion-del-ecyl/information/).
- **Acceso:** API Opendatasoft v2.1, JSON/CSV y consulta de registros; **761 registros** en la fecha de corte.
- **Licencia / frecuencia:** CC BY 4.0; anunciada como diaria; carga procesada el 2 de agosto de 2026.
- **Campos causales:** título, modalidad, colectivo destinatario, requisitos, inicio, fin, duración, `plazas`, forma de inscripción y enlace al contenido.
- **Prueba adversarial:** los **761/761** registros tienen `plazas`, pero son plazas ofertadas, no vacantes; **0/761** tienen `fecha_limite_de_presentacion_de_candidaturas`; solo **77/761** tienen `fecha_de_inicio`. Muchos registros actuales dicen “diríjase para obtener más información”, incluso con lugar “a determinar”.
- **Acción habilitada:** localizar una formación y contactar con el gestor.
- **Bloqueador:** no se puede decidir si aún admite solicitudes ni si queda sitio. Para cerrar la acción hace falta estado de inscripción, vacantes y enlace de matrícula. Además, el usuario potencial se restringe con frecuencia a personas desempleadas y el dominio formación/empleo está saturado en las candidaturas históricas.

### 2. Oferta de Formación Profesional

- **Fuente primaria:** [JCyL — Oferta de estudios de FP](https://analisis.datosabiertos.jcyl.es/explore/dataset/oferta-de-formacion-profesional/information/).
- **Acceso:** API v2.1 y exportaciones CSV/JSON/XLSX; **1.294 registros**.
- **Licencia / frecuencia:** CC BY 4.0; anual; datos procesados el 1 de diciembre de 2025.
- **Campos causales:** centro, titularidad, familia, nivel, ciclo, modalidad, tipo de enseñanza y número de grupos de primero/segundo/tercero.
- **Acción habilitada:** saber qué ciclo se imparte y en qué centro.
- **Bloqueador:** pese a que la ficha nacional habla de “plazas”, la tabla publicada no contiene capacidad ni plazas restantes. Tampoco curso académico explícito, calendario de admisión, nota de corte, reglas de prioridad o enlace profundo a la solicitud. Es oferta educativa, no inventario transaccionable, y colisiona de forma directa con varias candidaturas previas.

### 3. Próximos cursos de Formación Juvenil

- **Fuente primaria:** [JCyL — Cursos juveniles 2026](https://analisis.datosabiertos.jcyl.es/explore/dataset/cursosescuelastiempolibre2026/information/).
- **Acceso:** API v2.1 y exportaciones; **15 registros** el 3 de agosto de 2026.
- **Licencia / frecuencia:** CC BY 4.0; la carga se actualizó el mismo día de la auditoría.
- **Campos causales:** curso, entidad que lo imparte, lugar, provincia, inicio, fin, correo, teléfono y web.
- **Acción habilitada:** llamar o visitar la web genérica de la entidad.
- **Bloqueador:** faltan precio, requisitos, modalidad, plazo de inscripción, capacidad, vacantes y URL de matrícula. El conjunto actual se concentra casi por completo en titulaciones de monitor/coordinador de tiempo libre y no puede pasar de calendario/directorio, formatos expresamente descartados.

### 4. TuCertiCyL — estadística de certificaciones

- **Fuente primaria:** [JCyL — TuCertiCyL](https://analisis.datosabiertos.jcyl.es/explore/dataset/tucerticyl-estadistica-de-certificaciones/information/).
- **Acceso:** API v2.1 y exportaciones; **1.401 registros**.
- **Licencia / frecuencia:** CC BY 4.0; carga procesada el 30 de julio de 2026; la ficha no declara frecuencia.
- **Campos causales aparentes:** fecha, hora, centro, localidad, tipo de certificación, examinados y certificados.
- **Prueba adversarial:** ordenando por fecha aparecen registros de septiembre, octubre, noviembre y diciembre de 2026 con personas ya examinadas, edades medias y resultados, aunque el corte es 3 de agosto. Es compatible con una inversión día/mes en el proceso de normalización y vuelve inseguro tratar `fecha` como agenda futura.
- **Acción habilitada:** ninguna inscripción fiable; como máximo, análisis histórico de demanda y resultados.
- **Bloqueador:** no publica convocatoria abierta, aforo, plazas libres, requisitos ni enlace de reserva. Los campos de resultados demuestran que no es un inventario de exámenes futuros.

### 5. Productos de la marca Tierra de Sabor

- **Fuente primaria:** [JCyL — Productos Tierra de Sabor](https://analisis.datosabiertos.jcyl.es/explore/dataset/productos-de-la-marca-tierra-de-sabor/information/).
- **Acceso:** API v2.1 y exportaciones; **4.905 registros**.
- **Licencia / frecuencia:** CC BY 4.0; quincenal; carga del 29 de julio de 2026.
- **Campos causales:** identificador interno, producto, marca, empresa, sección, categoría, variedad y figura de calidad.
- **Acción habilitada:** verificar pertenencia nominal a la marca de garantía.
- **Bloqueador:** no hay GTIN/EAN, tamaño o presentación, precio, punto de venta, disponibilidad ni enlace de compra. No permite casar con fiabilidad un código de barras real ni cerrar una compra. El resultado inevitable sería un registro/verificador, y el dominio de producto local ya cuenta con múltiples antecedentes.

### 6. Coeficientes de precios alimentarios

- **Fuentes primarias:** [Observatorio de precios agrícolas y ganaderos de JCyL](https://datos.gob.es/es/catalogo/a07002862-observatorio-de-precios-de-los-productos-agricolas-y-ganaderos-de-castilla-y-leon) y [Panel de consumo alimentario del MAPA](https://www.mapa.gob.es/es/alimentacion/temas/consumo-tendencias/panel-de-consumo-alimentario/base-de-datos-de-consumo-en-hogares/ayuconsum).
- **Acceso:** CSV directo de JCyL; consulta web del MAPA. El fichero regional contiene mes, año, producto, ámbito, precio y unidad y alcanza junio de 2026 en la muestra auditada. El panel estatal permite consultar 624 líneas de producto.
- **Licencia / frecuencia:** componente JCyL, CC BY 4.0 y mensual; el panel MAPA es mensual, pero su página de consulta no ofrece una licencia de dataset ni una API masiva claramente documentada.
- **Campos causales:** precio en origen por provincia/CyL; cantidad, valor, precio medio, penetración y consumo/gasto per cápita en hogares.
- **Acción habilitada:** construir una referencia estadística para un producto comparable.
- **Bloqueador:** los precios regionales son de origen y los del panel son medias de compra agregadas; ninguno identifica tienda, marca, EAN, envase, promoción, stock o precio disponible ahora. Comparar una etiqueta de supermercado con esos coeficientes produciría una falsa equivalencia y no cerraría la compra.

### 7. Oferta y ocupación de actividades deportivas

- **Fuente primaria:** [Ayuntamiento de Madrid — oferta y ocupación de plazas](https://datos.gob.es/es/catalogo/l01280796-deportes-oferta-y-ocupacion-de-plazas-en-actividades-deportivas-dirigidas1), con [CSV de la temporada 2025–2026](https://datos.madrid.es/dataset/300076-0-deportes-ocupacion/resource/300076-0-deportes-ocupacion-csv/download/oferta-y-ocupacion-clases-abiertas-y-uso-libre-temporada-2025-2026.csv).
- **Acceso:** descargas CSV por temporada.
- **Licencia / frecuencia:** CC BY 4.0; mensual, en los primeros días del mes.
- **Campos causales:** distrito, centro deportivo, grupo/sesión, modalidad, oferta, ocupación y plazas libres.
- **Acción habilitada:** identificar un grupo con cupo potencial antes de acudir al sistema municipal de reserva.
- **Bloqueador:** es la clase de inventario necesaria, pero solo cubre instalaciones de gestión directa de Madrid, tiene latencia mensual y no incorpora una transacción estable por registro. En Castilla y León se encontró únicamente el [listado de instalaciones de la Diputación de Valladolid](https://datos.gob.es/es/catalogo/l02000047-instalaciones-y-centros-institucionales-culturales-sociales-y-deportivos), sin horarios, ocupación, precio ni disponibilidad; utilizarlo convertiría la aportación regional en un directorio accesorio.

### 8. Inventario municipal de animales adoptables

- **Fuente primaria:** [Ayuntamiento de Zaragoza — Adopción de animales](https://www.zaragoza.es/sede/portal/datos-abiertos/servicio/catalogo/1300), con [feed JSON](https://www.zaragoza.es/sede/servicio/mascotas.json).
- **Acceso:** JSON, CSV, JSON-LD, XML y RDF; el feed respondió con 185 elementos en la auditoría.
- **Licencia / frecuencia:** condiciones de reutilización del Ayuntamiento de Zaragoza; actualización declarada continua.
- **Campos causales:** animal, especie, raza, sexo, edad, tamaño, fecha de ingreso, estado de disponibilidad, fotografía, evaluación y datos de contacto/procedencia.
- **Acción habilitada:** identificar un animal concreto y contactar para adoptarlo o reclamarlo.
- **Bloqueadores:** JCyL solo ofrece un registro de núcleos zoológicos, no inventarios por animal. Más grave: la respuesta JSON auditada incluye en algunos registros nombres de solicitantes y campos de DNI, teléfono y domicilio. No se reproducen aquí, pero su mera presencia impide una ingestión pública responsable sin saneamiento y autorización del productor. El ejemplo no es trasladable y añadir el registro regional dejaría otra vez un directorio.

### 9. Calidad de servicio de banda ancha

- **Fuente primaria:** [CNMC — datos del Test de velocidad](https://data.cnmc.es/conjuntos-de-datos/calidad-de-servicio/datos-de-calidad-de-servicio-del-test-de-velocidad-cnmc).
- **Acceso:** ficheros mensuales comprimidos con resultados brutos; cobertura desde noviembre de 2025 y publicación disponible hasta junio de 2026 en la fecha de corte.
- **Licencia / frecuencia:** [condiciones de uso de CNMC Data](https://data.cnmc.es/condiciones-de-uso); mensual.
- **Campos causales:** velocidad de subida/bajada, latencia, intensidad de señal, tecnología, red y localización del test.
- **Acción habilitada:** contrastar la calidad medida con la recibida por otros usuarios en condiciones parecidas.
- **Bloqueador:** es crowdsourcing posterior al contrato, no inventario de ofertas. Faltan tarifa, permanencia, cobertura contractual por dirección, velocidad comprometida y canal de alta. La propia CNMC ya ofrece el test; reutilizar solo sus resultados no absorbe la decisión de cambiar y no existe un conjunto JCyL complementario con ofertas locales.

### 10. Índice de reparabilidad por modelo

- **Fuente primaria:** [data.gouv.fr — consolidado del índice de reparabilidad](https://www.data.gouv.fr/datasets/fichiers-consolides-des-donnees-respectant-le-schema-indice-de-reparabilite).
- **Acceso:** CSV consolidado y esquema oficial, generado automáticamente a partir de recursos conformes.
- **Licencia / frecuencia:** Licence Ouverte 2.0 para el consolidado; regeneración automática, actualizado el 27 de julio de 2026.
- **Campos causales:** EAN/modelo, categoría, nota y criterios como documentación, desmontabilidad, disponibilidad y precio de piezas.
- **Acción habilitada:** comparar la reparabilidad reglada de modelos antes de comprarlos.
- **Bloqueador:** la cobertura depende de fabricantes/distribuidores que publican bajo el esquema francés y varias fuentes individuales no declaran licencia o periodicidad. No contiene precio, disponibilidad o vendedor en España. JCyL carece de un inventario equivalente de bienes duraderos; Tierra de Sabor no guarda relación causal con este dominio. Sin un operando regional material, quedaría como comparador parcial de un registro extranjero.

## Hallazgos que deben condicionar la siguiente búsqueda

1. **La frecuencia declarada no garantiza operatividad.** ECYL se actualiza diariamente, pero no informa un solo plazo de candidatura y solo el 10,1 % de sus registros tiene fecha de inicio.
2. **Capacidad no es disponibilidad.** FP publica grupos y ECYL plazas iniciales; ninguno publica cupo restante o estado de inscripción.
3. **La semántica debe probarse, no suponerse.** TuCertiCyL contiene resultados asociados a fechas futuras respecto del corte; usar la fecha como convocatoria produciría respuestas falsas.
4. **Los mejores ejemplos externos revelan el hueco regional.** Madrid sí publica plazas deportivas libres y Zaragoza sí publica inventario por animal; Castilla y León solo ofrece instalaciones o centros, es decir, directorios.
5. **Un feed público puede seguir siendo inutilizable.** El ejemplo de adopciones expone campos personales de terceros; accesibilidad técnica y licencia no sustituyen una auditoría de privacidad.

## Conclusión

**No debe elegirse todavía ninguna dirección de producto a partir de estos activos.** Ninguno supera a la vez el gate operativo, la obligación de uso material de JCyL, la amplitud ciudadana y el filtro de colisión.

El resultado útil de esta fase es un requisito de búsqueda mucho más estricto: la próxima fuente candidata debe publicar por registro **estado actual + restricción/regla + disponibilidad o coeficiente individual + identificador accionable + enlace profundo oficial**, y debe hacerlo para Castilla y León bajo licencia clara. Si no aparece esa combinación, continuar generando conceptos solo reproducirá calendarios, directorios, verificadores o recomendaciones no ejecutables.
