# Público Primero — gate técnico de fuentes bibliotecarias

**Fecha de comprobación:** 3 de agosto de 2026  
**Alcance:** acceso técnico, estabilidad, acciones oficiales, licencias y restricciones. No se diseña ni se programa producto.

## Veredicto ejecutivo

**NO-GO actual para cualquier candidatura que necesite agregar automáticamente disponibilidad de ejemplares físicos de RABEL y disponibilidad de eBiblio/CineCyL. No debe iniciarse el desarrollo.** Hay evidencia sólida de que la instalación RABEL dispone de tecnología de integración —Z39.50 y web services/API—, pero no de que esos servicios estén publicados, documentados y autorizados para terceros. El catálogo web dinámico no es una alternativa válida: [RABEL bloquea `/cgi-bin/` para todos los robots](https://rabel.jcyl.es/robots.txt), precisamente donde vive el OPAC.

Sí hay un **GO técnico parcial** para dos fuentes autónomas:

- La Biblioteca Digital de Castilla y León (BDCYL) expone un OAI-PMH oficial, estable y con política explícita de metadatos.
- Los datos de bibliotecas y paradas de bibliobús tienen API oficial, licencia CC BY 4.0 y actualización diaria.

Ese subconjunto no resuelve la disponibilidad física ni digital de títulos prestables. Por tanto, no basta para el núcleo transaccional de “¿puedo conseguir este título ahora?”. El gate solo cambiaría a GO si se demuestra un acceso público/autorizado a holdings de RABEL y un acceso reutilizable a disponibilidad de eBiblio/CineCyL; no sirve inferirlo de las capacidades generales de AbsysNet.

### Resultado contra el gate acordado

| Criterio obligatorio | Resultado | Evidencia decisiva |
|---|---|---|
| Vía autorizada y estable para ejemplares y disponibilidad actual | **FAIL** | RABEL no publica contrato técnico utilizable y bloquea el CGI; eBiblio bloquea el rastreo general. |
| Correspondencia fiable ISBN ↔ título ↔ edición ↔ formato | **NO TESTABLE** | No se obtuvo una consulta bibliográfica autorizada y reproducible que atraviese los canales críticos. |
| Enlaces o acciones oficiales para reserva, préstamo o consulta | **PARTIAL** | Existen acciones en las interfaces oficiales, pero no un esquema documentado de deep-links estable ni reserva delegada. |
| Prueba representativa de 100 títulos con al menos 70 respuestas accionables | **NO EJECUTADA** | El primer requisito falló. Ejecutarla raspando las interfaces bloqueadas invalidaría la prueba en vez de validar el producto. |
| Casos de lista que combinen canales o reduzcan desplazamientos | **NO TESTABLE** | Sin holdings y circulación actuales no puede calcularse de forma verificable qué recoger, reservar o agrupar. |

La regla de descarte se activa antes del benchmark: hoy solo hay fuentes patrimoniales abiertas, APIs de localización/horarios, consultas humanas y enlaces genéricos para los canales esenciales. La idea puede conservarse aparcada, pero no reinterpretarse como aprobada ni consumirse tiempo de producto hasta levantar el primer criterio.

## 1. RABEL y AbsysNet: capacidad del producto frente a activación pública

### Lo que sí está probado

1. RABEL ejecuta **AbsysNet 2.4**: la propia [pantalla oficial de la instalación](https://rabel.jcyl.es/absysnet/inicio.htm) identifica esa versión.
2. El fabricante afirma que Absys puede compartir registros mediante **Z39.50, SRU/SRW y servidor OAI**, y que sus módulos permiten conectarlo con sistemas externos. Es capacidad general y configurable, no prueba de despliegue en una biblioteca concreta. [Ficha oficial de Absys](https://www.baratz.es/familias-soluciones-baratz/absys/).
3. La prueba más fuerte y específica es el [expediente oficial A2023/004613 de mantenimiento de RABEL](https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=Srg%2BZQD1Em6s0mjN1NDvwOZlGdKVVDlHjv1wIyb1P38OH8QowIHQMUK311fZxz2LRVaQH13VKsPhFhnEifP64mWbxUTH9h8968%2FrD67sLIs%3D&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D). Enumera para la instalación: usuarios OPAC ilimitados “incluido Z39.50”, un web service de integración con la plataforma de préstamo electrónico y “Web Service (APIs) de integración con otros sistemas”. El contrato podía prorrogarse hasta tres años.
4. En la comprobación de red, `rabel.jcyl.es` resolvió como alias de `z3950.jcyl.es` y el puerto TCP 210 aceptó conexión. Esto es coherente con Z39.50, pero una conexión TCP abierta no demuestra búsqueda anónima, base utilizable ni contenido devuelto.
5. Existe un antecedente primario: en 2002 el Ministerio de Cultura publicó un perfil Z39.50 del antiguo Catálogo Colectivo de Castilla y León —servidor `z3950.bcl.jcyl.es`, puerto 210, base `AbsysCCCL`— y dijo expresamente que permitía consultar y capturar registros. [Correo Bibliotecario nº 56, pp. 2-3](https://travesia.mcu.es/server/api/core/bitstreams/7e69ae48-c22e-4732-aff2-68908da08ce2/content).

Una consulta Z39.50 de carga mínima confirmó que el servicio actual responde al `Init` como `Red de Bibliotecas de Castilla y León/GFS/YAZ`, versión 3.0.44. Sin embargo, el perfil histórico `AbsysCCCL` ya no funciona y las bases razonablemente identificables probadas (`ABSYSNET`, `CATA`, `Default` y variantes) no produjeron ninguna búsqueda bibliográfica: el servidor rechazó la base o devolvió el diagnóstico Bib-1 235, “Database does not exist”. `IR-Explain-1` tampoco está disponible para descubrir la configuración. No se continuó adivinando nombres ni se forzó el servicio. El resultado técnico correcto es **servidor presente, acceso público reproducible no demostrado**.

### Lo que no está probado

- El perfil de 2002 **no puede tratarse como configuración vigente**: `z3950.bcl.jcyl.es` ya no resolvía DNS el 3 de agosto de 2026, mientras que el host actual es distinto. No hay publicación oficial contemporánea de nombre de base, autenticación, atributos Bib-1, sintaxis de registros ni límites de uso.
- No se ha demostrado que el servicio Z39.50 actual devuelva **holdings por sucursal, código de ejemplar y estado de disponibilidad**. Z39.50 puede entregar metadatos bibliográficos sin circulación en tiempo real; la licencia o el puerto abierto no resuelven esta diferencia.
- El contrato prueba que RABEL posee web services, no que sean públicos. No se localizaron Swagger/OpenAPI, credenciales de solo lectura, política de consumo, CORS, rate limits o licencia específica para una API externa.
- No existe evidencia oficial de **RTAC** u otro servicio público de disponibilidad en tiempo real.

### Probes HTTP acotados

Se consultaron, sin autenticación y sin seguir rutas no convencionales, los patrones públicos habituales de `rabel.jcyl.es`: `/sru`, `/SRU`, `/sru/sru` con operación `explain`; `/oai`, `/oai2`, `/cgi-bin/oai` con `Identify`; `/opensearch.xml`, `/OpenSearchDescription.xml`, `/api`, `/api/v1`, `/rest`, `/rtac` y `/RTAC`. Todos devolvieron **404**. Esto no prueba que no exista un servicio interno o en otra URL; sí impide afirmar que hay un endpoint estándar público descubrible.

La raíz de RABEL conduce al OPAC `abnetopac`, que crea un identificador de sesión en la ruta. Las fichas públicas pueden mostrar sucursal, signatura y estado, pero esa salida pertenece al CGI bloqueado por robots y no constituye una interfaz autorizada de máquina.

## 2. Catálogo anunciado para descarga

La ficha de Gobierno Abierto [“Catálogo de Bibliotecas Públicas de Castilla y León. RABEL”](https://gobiernoabierto.jcyl.es/web/jcyl/GobiernoAbierto/es/Plantilla100Detalle/1284621684532/Catalogo/1285036684832/) declara:

- cerca de tres millones de títulos;
- libros, publicaciones periódicas, películas y documentales, grabaciones sonoras, mapas y carteles;
- frecuencia de actualización **anual**;
- formatos **CSV, HTML y XLS**.

Sin embargo, la propia ficha no adjunta un CSV/XLS, no publica esquema de columnas ni fecha del último fichero. El único enlace de “Acceso al contenido” apunta a una URL de sesión del CGI de RABEL. En el HTML de la ficha, CSV/HTML/XLS aparecen como etiquetas de texto, no como enlaces de descarga. Por ello no se pudo verificar:

- si la exportación comprende el catálogo completo o solo resultados de consulta;
- si contiene ISBN/ISSN, identificador estable, sucursal y códigos de ejemplar;
- si incluye holdings o estado de préstamo;
- si lo anunciado como anual tiene una edición 2026 descargable.

Aunque apareciese un fichero anual, por definición no sustituiría un feed de circulación: una instantánea bibliográfica no puede sustentar “disponible ahora”, reserva posible ni tiempo de espera.

## 3. Deep-links y cierre de acciones

| Servicio | Descubrimiento o enlace estable | Acción oficial | Resultado del gate |
|---|---|---|---|
| **RABEL / búsqueda** | La portada es estable, pero las búsquedas del OPAC se ejecutan dentro de rutas con sesión. Se observó que `?TITN=<id>` inicia una ficha concreta, pero no está documentado y termina en CGI. | Consulta web manual. | **NO-GO para integración.** Solo es seguro enlazar a la portada o al catálogo oficial, sin prometer contexto conservado. |
| **RABEL / reserva** | No se publicó URI de acción ni esquema de enlace de Biblio JCyL. | La reserva se realiza tras identificarse en el catálogo o en Biblio JCyL. Solo se reservan ejemplares prestados/reservados; cada copia admite hasta cinco reservas concurrentes; hay límites por usuario, cuatro días para recoger y bibliotecas que no ofrecen el servicio. [Normas oficiales](https://bibliotecas.jcyl.es/web/es/bibliotecaleon/servicios/renovaciones-reservas.html). | **NO-GO para reserva delegada.** Un tercero puede remitir al servicio oficial, no iniciar ni confirmar la operación. |
| **eBiblio** | La web usa búsquedas `resources?q=...` y fichas `resources/<id>`; la interfaz oficial muestra “Prestar” o “Reservar” y fechas estimadas. | Préstamo/reserva autenticados con tarjeta de biblioteca. [Guía oficial del Ministerio](https://ebiblio.es/ebiblio/en/guia-uso.html). | **NO-GO para agregación automática:** su [`robots.txt`](https://castillayleon.ebiblio.es/robots.txt) contiene `User-agent: *` y `Disallow: /`; no se localizó API/OAI pública ni licencia de catálogo. Un deep-link conocido puede abrirse por el usuario, pero no hay vía autorizada para descubrirlo masivamente. |
| **CineCyL** | La ayuda oficial confirma que sus contenidos están incorporados al catálogo de eBiblio. [Información eBiblio CyL](https://castillayleon.ebiblio.es/ayuda/E0350/es/introduccion.htm). | Visionado desde el flujo autenticado de eBiblio/CineCyL. | Hereda el **NO-GO** de eBiblio para consumo de máquina. |
| **BDCYL** | OAI-PMH entrega identificadores persistentes y URLs de registro/objeto. Una ficha también expone “Enlace persistente”. | Acceso directo a objeto digital cuando los derechos lo permiten; no hay circulación ni reserva. | **GO.** Metadatos recolectables y deep-links verificables. |
| **Bibliobuses** | Cada registro de parada de la API contiene `enlace_al_contenido`, además de fechas y horas. | La acción real depende del servicio provincial. Segovia publica “Reservas” en algunas rutas; Burgos publica “Reservas: No” para sus materiales. [Ejemplo Segovia](https://bibliotecas.jcyl.es/web/jcyl/BibliotecaSegovia/es/Plantilla100Detalle/1284359066839/6/1193219666466/) y [norma de Burgos](https://bibliotecas.jcyl.es/web/es/bibliotecaburgos/bibliotecas-burgos/prestamo-personal-bibliobuses-burgos.html). | **GO para horarios/enlaces; NO-GO para afirmar reserva uniforme o vincular un ejemplar a una parada.** |

## 4. Fuentes realmente aptas para máquina

### Biblioteca Digital de Castilla y León

El endpoint oficial es:

`https://bibliotecadigital.jcyl.es/i18n/oai/oai_bibliotecadigital.jcyl.es.do`

La operación `Identify` respondió OAI-PMH 2.0, declaró registros eliminados persistentes, granularidad diaria, compresión y una política que sitúa los metadatos y objetos bajo Public Domain Mark. `ListMetadataFormats` ofreció `oai_dc`, `marc21`, `oai_marc`, `edm`, `ese` y `didl`; `ListSets` ofreció `objdigitales` y `driver`. Un `GetRecord` de prueba devolvió título, autor, fecha, formatos, derechos y varios enlaces del objeto.

El directorio oficial estatal [Hispana](https://hispana.mcu.es/es/recoleccion/datos.do?idOai=1945&idOrigen=501) identifica el mismo endpoint, 119.705 registros recolectados y última recolección el 9 de marzo de 2026. Esto valida tanto la intención de cosecha como su uso real. El `robots.txt` de BDCYL bloquea diversos rastreadores —incluidos varios bots de IA—, pero el OAI es un canal explícito y separado para recolección; la integración debe limitarse a OAI, no rastrear páginas HTML.

### Bibliotecas y bibliobuses

Dos APIs del portal JCyL son utilizables bajo CC BY 4.0:

1. [Bibliotecas, bibliobuses y puntos de servicio móvil](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/bibliotecas-bibliobuses-y-puntos-de-servicio-movil-geolocalizados): 1.126 registros —362 bibliotecas, 31 bibliobuses y 733 puntos—, `codigo_biblioteca`, tipo, ubicación y enlace. Declara actualización diaria; datos procesados el 30 de julio de 2026.
2. [Relación de puntos de servicio móvil](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/relacion-de-puntos-de-servicio-movil-de-los-bibliobuses-de-castilla-y-leon): 733 registros, localidad, código postal, dirección, ruta en texto, periodicidad, hora de llegada/salida, fechas 2026, incidencias y enlace oficial. Declara actualización diaria; datos procesados el 30 de julio de 2026.

El bloqueo estructural es verificable: la segunda tabla **no contiene `codigo_biblioteca`, identificador de vehículo ni clave foránea hacia los 31 bibliobuses**. El texto `ruta` puede nombrar una ruta y algunas páginas humanas añaden “Bibliobús 1/B”, pero no de manera normalizada. No puede enlazarse con rigor `ejemplar en BBxx` → `vehículo` → `próxima parada` para toda la Comunidad.

## 5. Robots, licencia y condiciones

- **RABEL:** `User-agent: * / Disallow: /cgi-bin/`. El motor dinámico está en esa ruta. Scraping periódico es incompatible con la instrucción publicada.
- **eBiblio Castilla y León:** `User-agent: * / Disallow: /`, salvo reglas particulares previas para Google. No debe usarse como backend rastreado.
- **Datos abiertos JCyL:** las dos APIs de bibliobuses declaran CC BY 4.0, procedencia JCyL y fechas de procesamiento; son la vía limpia.
- **BDCYL:** el OAI declara política de metadatos y objetos y está cosechado por Hispana. Deben respetarse, además, los derechos expresados registro a registro.
- **Condiciones generales JCyL:** el [aviso legal](https://gobiernoabierto.jcyl.es/web/jcyl/GobiernoAbierto/es/Plantilla100Detalle/1284216489702/Texto%20Generico/1246989714819/Texto) autoriza reutilización comercial y no comercial, incluida extracción y combinación, con atribución, fecha de actualización, preservación de metadatos y sin sugerir respaldo institucional. También niega garantía de continuidad. Esa autorización general no convierte una interfaz bloqueada por robots ni un web service no publicado en API pública.

No se encontró un TOS específico que prohíba enlazar manualmente a fichas públicas. El impedimento principal no es el hiperenlace: es construir un servicio automatizado sobre interfaces que no publican contrato técnico y, en RABEL/eBiblio, rechazan rastreo.

## 6. Condiciones exactas para levantar el NO-GO

Antes de considerar viable cualquier análisis o prototipo dependiente de disponibilidad deben existir, por escrito o en documentación pública, estas seis pruebas:

1. **Z39.50 RABEL actual:** host, puerto, base, acceso anónimo/autorizado, atributos y sintaxis soportadas.
2. **Holdings:** respuesta de ejemplo que incluya identificador de título/ejemplar, sucursal, estado de circulación y marca temporal; no basta MARC bibliográfico.
3. **API RABEL:** documentación del web service contratado, alcance de lectura, autenticación, límites, estabilidad, licencia y uso por terceros; alternativamente, un SRU/OAI público activado con información suficiente.
4. **eBiblio/CineCyL:** API/OAI o exportación oficialmente autorizada que incluya identificador permanente, formato y disponibilidad; el HTML no es sustituto.
5. **Acciones:** enlaces permanentes documentados a búsqueda/ficha y un handoff oficial a login/reserva que no dependa de sesiones caducables. No se exige efectuar la reserva desde un tercero, pero sí conservar el contexto.
6. **Bibliobús:** clave normalizada que una cada `codigo_biblioteca` de RABEL con vehículo, ruta y paradas, junto con la política de reserva por provincia.

Solo después de obtener y verificar los puntos 1 a 5 debe ejecutarse el benchmark ciego de 100 títulos. La muestra deberá fijarse antes de consultar resultados, incluir ficción, ensayo, infantil, audiolibro, película y distintas ediciones, y clasificar cada caso como acceso inmediato, reserva con fecha/cola, recogida física concreta o sin solución. El umbral sigue siendo el acordado: al menos 70 respuestas accionables y, dentro de ellas, casos reales donde una lista reduzca viajes o combine canales. Un enlace genérico al catálogo cuenta como **no accionable**.

## 7. Única siguiente acción justificada

No es un prototipo: es solicitar por escrito a la Junta la habilitación o documentación que ya parece existir internamente. La petición debe preguntar, de forma verificable:

1. Perfil Z39.50 vigente de RABEL: host, puerto, nombre de base, autenticación, atributos, sintaxis y límites.
2. Si ese servicio devuelve holdings por sucursal y estado de circulación con marca temporal; si no, acceso de solo lectura al API/RTAC equivalente.
3. Interfaz autorizada de eBiblio/CineCyL para identificador, ISBN, formato, disponibilidad y URL permanente.
4. Descarga real CSV/XLS anunciada en Gobierno Abierto, esquema, fecha de actualización y contenido de holdings.
5. Autorización expresa para una validación acotada de 100 títulos y condiciones de reutilización en un prototipo de concurso.

La vía oficial es la [solicitud de apertura de datos de la Junta](https://datosabiertos.jcyl.es/web/es/participa/solicitud-apertura-datos.html); la página de servicios en línea también publica el contacto bibliotecario `bcl@jcyl.es`. Esta solicitud no se ha enviado: requiere autorización expresa antes de contactar externamente.

## Conclusión

La investigación cambia una suposición importante: **RABEL no carece de tecnología de interoperabilidad; carecemos de evidencia de que esa interoperabilidad esté abierta y autorizada para este uso.** El contrato de 2023 hace plausible una solución institucional, pero `robots.txt`, la ausencia de perfil técnico público y la falta de prueba de holdings impiden basar una candidatura independiente en ella.

Por tanto:

- **GO:** BDCYL vía OAI-PMH; directorio y horarios de bibliobuses vía API JCyL; deep-links contenidos en esas fuentes.
- **NO-GO:** scraping del OPAC RABEL; scraping de eBiblio/CineCyL; reserva automática; disponibilidad física/digital agregada; promesa de que un título concreto llegará a una parada concreta.
- **Decisión global actual: NO-GO / NO DEVELOPMENT.** Si el proyecto exige operar sin acuerdos ni accesos internos, debe descartarse esta dependencia. Si antes de invertir se obtiene documentación pública o habilitación explícita de los servicios ya contratados y se superan las seis pruebas, el gate puede reabrirse desde cero con la muestra predefinida de 100 títulos.
