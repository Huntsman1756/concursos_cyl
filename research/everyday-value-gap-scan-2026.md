# Barrido mundial de valor cotidiano inmediato (2023-2026)

**Fecha de cierre:** 3 de agosto de 2026  
**Pregunta:** ¿queda alguna aplicación ciudadana, basada causalmente en datos públicos de Castilla y León, cuyo beneficio se entienda en diez segundos y que sea nueva, realizable de forma autónoma y competitiva para el concurso?

## Veredicto ejecutivo

**No se ha encontrado ningún hueco genuino. Cero candidatos superan todos los filtros.**

El nuevo barrido no falla por falta de ideas. Falla porque los productos públicos internacionales que ahorran dinero o tiempo, permiten acceder a algo o evitan una pérdida se apoyan siempre en al menos uno de estos cuatro activos operativos:

1. precios, existencias o transacciones actuales;
2. un identificador inequívoco de producto, persona o credencial;
3. reglas estructuradas y versionadas que permiten completar una acción;
4. un canal adoptado de identidad, pago, comercio o prestación del servicio.

El catálogo de 430 conjuntos de datos de JCyL no contiene ninguno de esos activos con cobertura suficiente en un dominio no excluido. Contiene, sobre todo, estadísticas agregadas, directorios, registros descriptivos, calendarios, textos y geometrías. Son datos útiles para informar o visualizar, pero no para cerrar por sí solos una decisión cotidiana con valor verificable.

Por tanto, proponer ahora una “idea ganadora” exigiría ocultar una dependencia de datos privados, convenios, adopción masiva, interpretación normativa o trabajo manual. Eso produciría una maqueta vistosa, no un MVP autónomo. Ninguna investigación puede **garantizar** ganar un concurso; con la evidencia disponible, la decisión técnicamente responsable es no declarar un falso finalista.

## Alcance y prueba aplicada

Se contrastaron los 26 informes del corpus `research`, el inventario completo de 430 datasets, las candidaturas históricas disponibles y los conceptos descartados en los resets anteriores. En particular, este barrido incorpora como restricciones vinculantes `citizen-app-reset-v4-2026.md` y `global-gap-scan-2026.md`.

Cada mecanismo debía superar simultáneamente:

- **Comprensión:** una persona entiende en diez segundos qué dinero/tiempo ahorra, a qué accede o qué pérdida evita.
- **Causalidad:** un dato oficial de JCyL cambia directamente el resultado; no sirve de decoración.
- **Autonomía:** el MVP funciona sin convenio, feed privado, red de usuarios, moderación o integración no disponible.
- **Completitud:** resuelve una acción, no se limita a mapa, directorio, buscador, panel, alerta o chatbot.
- **Seguridad:** no da consejo legal, médico o financiero.
- **Novedad:** no repite las 256 candidaturas históricas ni ningún concepto nombrado o rechazado en el corpus.
- **Dominio permitido:** quedan fuera quejas, correcciones, alegaciones, turismo, vivienda, salud/seguridad, trámites, empleo/formación, arte generativo, bibliotecas, transporte y energía.

## Diez mecanismos internacionales y su prueba de descarte

Los ejemplos siguientes son distintos de los conceptos centrales de los barridos previos. Todos proceden de fuentes públicas primarias y estuvieron activos, fueron lanzados o reconocidos entre 2023 y 2026. Se estudia su **mecanismo**, no se propone copiarlos.

| # | Mecanismo y ejemplo oficial | Beneficio entendido en 10 segundos | Cruce causal posible con JCyL | Kill-test mínimo | Resultado |
|---:|---|---|---|---|---|
| 1 | **Identificador físico → pasaporte exacto del producto.** El [Registro europeo del Pasaporte Digital de Producto](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/dpp-registry_en) registra identificadores únicos y metadatos antes de que el producto entre en el mercado. | “Escanea esto y comprueba exactamente qué producto es.” | `productos-de-la-marca-tierra-de-sabor` sería el único anclaje temático cercano. | Probar 100 productos envasados de 20 marcas y obtener coincidencia de variante ≥95 % a partir de un identificador impreso oficial. | **NO-GO inmediato:** el dataset no contiene GTIN/EAN, SKU, presentación, peso, lote ni identificador de la unidad. Una coincidencia por nombre/marca no autentica el objeto físico. |
| 2 | **Credencial verificable → demostrar solo el atributo necesario.** La [Cartera Europea de Identidad Digital](https://digital-strategy.ec.europa.eu/en/factpages/european-digital-identity-wallet) permite compartir atributos y credenciales con divulgación selectiva; su [implantación](https://digital-strategy.ec.europa.eu/en/policies/eudi-wallet-implementation) depende de emisores y entidades verificadoras. | “Demuestra que cumples el requisito sin entregar todos tus documentos.” | Ningún dataset abierto de JCyL emite una credencial personal verificable. | Completar una prueba real con credencial emitida y verificador real, sin subir documentos ni usar datos simulados. | **NO-GO:** exige identidad y datos personales, emisores, verificadores y adopción institucional. Además deriva en acreditación/trámite, dominio excluido. |
| 3 | **Reglas computables + entrevista → transacción terminada.** El piloto [IRS Direct File](https://www.irs.gov/newsroom/news-releases-for-april-2024) permitió presentar directamente la declaración; el [IRS Data Book 2024](https://www.irs.gov/pub/irs-pdf/p55b.pdf) registra 140.803 declaraciones aceptadas. | “Responde y presenta, sin volver a introducir lo que la Administración ya sabe.” | Los conjuntos de convocatorias y normativa de JCyL contienen texto/HTML y documentos, no reglas ejecutables. | Resolver 30 casos variados con reglas oficiales versionadas, cero interpretación manual y envío real de la acción final. | **NO-GO:** faltan reglas computables y canal transaccional; usa datos personales y consejo fiscal/financiero y es un trámite. |
| 4 | **Cesta concreta → comercio con menor coste real.** El sistema de Profeco [Quién es Quién en los Precios](https://www.profeco.gob.mx/precios/canasta/ayuda.html) recopila precios semanales a gran escala y permite calcular cestas; Profeco mantiene [datos abiertos por año](https://datos.profeco.gob.mx/datos_abiertos/qqp.php). | “Tu compra cuesta menos aquí, hoy.” | El catálogo JCyL carece de precios minoristas actuales por SKU y establecimiento. | Cesta de 30 artículos, al menos tres comercios, datos ≤72 horas y correspondencia de SKU ≥80 %, sin feed privado ni captura manual. | **NO-GO:** no existe el activo causal. El IPC es agregado y antiguo para este uso; Tierra de Sabor no ofrece precio, stock ni comercio vendedor. La cesta de precios ya fue descartada en el corpus. |
| 5 | **Red comercial interoperable → comparar y comprar sin un marketplace dominante.** La red india ONDC recibió en 2024 el [National Award for e-Governance](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2051330&lang=2&reg=48). | “Encuentra y compra a vendedores distintos desde una sola puerta.” | Los registros de empresas/productos de JCyL solo describen oferta; no publican catálogo transaccionable. | Completar 20 pedidos actuales de cinco vendedores mediante endpoints públicos, sin alta negociada ni integración de pagos. | **NO-GO:** requiere red de vendedores, pedidos, pagos, stock y logística. Viola autonomía y dependencia de red; los datos JCyL no pueden causar la compra. |
| 6 | **Código de barras → etiqueta oficial legible y adaptada.** La Agencia de Asuntos del Consumidor de Japón documentó en 2025 un [piloto de visualización mediante escaneo de código de barras](https://www.caa.go.jp/policies/policy/food_labeling/meeting_materials/assets/food_labeling_cms201_250730_05.pdf). | “Escanea y lee la etiqueta exacta sin letra pequeña.” | El registro Tierra de Sabor es el único conjunto cercano a productos alimentarios. | Escanear 100 referencias y recuperar GTIN, ingredientes, alérgenos, nutrición y cantidad con cobertura ≥95 %. | **NO-GO:** el registro JCyL solo identifica producto/marca/empresa/categoría y figuras de calidad; faltan GTIN y todos los campos de etiqueta. La personalización por alergias entra además en salud. |
| 7 | **Recibo electrónico → detección automática de un derecho y cobro.** La app oficial de factura electrónica de Taiwán notifica premios según el [Ministerio de Finanzas](https://www.mof.gov.tw/singlehtml/979b54e408fb499eae3c1d9efe978868?cntId=2bc5855821394fbf9c5ae5688d8acfcb); en 2026 incorporó [transferencia automática del premio y recordatorios](https://www.mof.gov.tw/singlehtml/384fb3077bb349ea973e7fc6f13b6974?cntId=b1d2bcb5b36a495bbec22a4009570286). | “No pierdas un premio: tu recibo se comprueba y cobra solo.” | JCyL no publica una corriente de recibos o transacciones personales ni un derecho automático asociado a ellas. | Demostrar detección y entrega real del beneficio sin importar compras privadas, cuenta bancaria ni integrar al pagador. | **NO-GO por definición:** el valor nace de datos privados y de la infraestructura de facturación/pago, no de un dataset abierto JCyL. |
| 8 | **Pago en depósito → dinero liberado solo tras la entrega.** La agencia pública Kenya News Agency presentó [PostaPay](https://www.kenyanews.go.ke/postapay-unveils-unified-mobile-payment-app-for-seamless-transactions/) en 2024, incluido el depósito hasta la liberación del artículo. | “El vendedor no cobra hasta que recibes lo comprado.” | Ningún conjunto JCyL representa el estado de un pago o una entrega. | Retener y liberar fondos reales sin proveedor de pagos, cuentas privadas ni adhesión de vendedor/comprador. | **NO-GO por definición:** es un producto financiero transaccional, necesita convenios, usuarios y datos privados, y no tiene dato público JCyL causal. |
| 9 | **Reutilizar una red de confianza existente → completar un servicio en minutos.** Sudáfrica informó en 2026 de solicitudes de Smart ID en bancos participantes en unos cinco minutos y sin reserva previa, dentro del [presupuesto del Department of Home Affairs](https://www.gov.za/news/speeches/minister-leon-schreiber-home-affairs-dept-budget-vote-202627-ncop-19-may-2026). | “Haz aquí en cinco minutos lo que antes exigía desplazamiento y espera.” | No hay en datos abiertos JCyL identidad personal ni capacidad transaccional de oficinas/entidades colaboradoras. | Completar el servicio real, no solo localizarlo, sin autenticación, integración institucional ni datos privados. | **NO-GO:** el ahorro procede precisamente de integrar identidad, banco y Administración. Es además un trámite y requiere convenio. |
| 10 | **Rules as Code → eliminar pasos y costes antes de actuar.** GovHack Australia reconoció en 2025 a RedTape en las categorías de experiencia fiscal proactiva y navegador de burocracia; consta en la [lista oficial de ganadores](https://govhack.org/2025-winners-2/) y en el [reto oficial de coste de vida mediante Rules as Code](https://2025.hackerspace.govhack.org/challenges/improving_cost_of_living_outcomes_by_using_rules_as_code). | “Dime una vez tu caso y elimina los pasos que no necesitas.” | Premios, ayudas y procedimientos JCyL publican requisitos como texto y adjuntos heterogéneos. | Codificar tres dominios y superar 50 casos con cero falsos positivos, trazabilidad oficial y ejecución completa, sin interpretación jurídica. | **NO-GO:** los datos no son reglas ejecutables; convertirlos exige trabajo editorial continuado y asumir interpretación legal. También cae en trámites/beneficios y colisiona con conceptos históricos. |

## Comprobación directa de los tres falsos positivos más cercanos

No son huecos: son las únicas rutas que, vistas superficialmente, podrían parecer aprovechables.

### 1. “Escanea y verifica Tierra de Sabor”

La [API oficial de productos Tierra de Sabor](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/productos-de-la-marca-tierra-de-sabor/records?limit=1) devuelve campos como `idproducto`, `producto`, `marca`, `idempresa`, `seccion`, `categoria`, `variedad` y `figurascalidad`. La [API de empresas acogidas](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/empresas-acogidas-a-la-marca-tierra-de-sabor/records?limit=1) añade empresa, web y localización.

Eso permite consultar un directorio, pero no demostrar que el envase escaneado sea auténtico ni distinguir formato, lote o unidad. Añadir OCR o IA no crea el identificador oficial ausente. **Descartado por falta de causalidad física y por acabar como buscador/directorio.**

### 2. “No pierdas tu descuento del Carnet Joven”

La [API oficial de colaboradores del Carnet Joven](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/colaboradores-carnet-joven/records?limit=1) contiene esencialmente colaborador, web y actividad; no publica importe, regla, excepciones o vigencia de cada descuento.

Sin la regla de descuento no se puede calcular ahorro ni confirmar aplicabilidad. Además, la candidatura histórica **“Ofertas para jóvenes de Castilla y León”** ya ocupa el concepto. **Descartado por ausencia del dato que produce el ahorro y por repetición.**

### 3. “No pierdas un premio u oportunidad”

La [API oficial de premios](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/premios/records?limit=1) incluye plazos y abundante texto/HTML, pero los requisitos y documentos siguen siendo narrativos y variables. Para pasar de “agenda” a resultado habría que interpretar reglas y preparar una solicitud.

La candidatura histórica **“Agenda de Premios de la JCyL”** y el concepto **“CYL oportunidades Bot”** ya cubren la parte informativa. La mejora posible se convierte en checklist, elegibilidad o presentación: trámite e interpretación normativa, ambos excluidos. **Descartado por repetición, dominio y mantenimiento no autónomo.**

## Matriz causal final del catálogo JCyL

| Activo necesario para valor inmediato | ¿Existe con cobertura útil? | Consecuencia |
|---|---:|---|
| Precio actual por producto y comercio | No | No se puede demostrar ahorro monetario real. |
| Stock, disponibilidad o reserva ejecutable | No | No se puede garantizar acceso ni evitar un viaje perdido. |
| Transacción o recibo ciudadano | No; además sería dato privado | No se puede recuperar automáticamente dinero o derechos. |
| Identificador físico inequívoco de producto | No en los registros relevantes | No se puede hacer escaneo verificable. |
| Credencial personal verificable | No en datos abiertos | No se puede demostrar elegibilidad o identidad. |
| Regla oficial computable y versionada | No; predominan texto/HTML/PDF | No se puede completar una decisión sin interpretación. |
| Canal público de ejecución: pago, pedido, reserva o presentación | No | El producto termina inevitablemente en información o derivación. |

## Decisión

**Supervivientes: 0. Huecos genuinos: 0. Recomendaciones para construir: 0.**

No conviene elegir “la menos mala” de estas rutas. La sobreingeniería —IA, OCR, agentes, blockchain, gemelos digitales o capas predictivas— no resuelve la ausencia del dato operativo; solo la disimula y aumenta el riesgo de demostración.

El barrido solo debería reabrirse si JCyL publica o habilita al menos uno de estos cambios verificables:

- precios/stock por SKU y establecimiento con actualización frecuente;
- GTIN u otro identificador oficial unido a datos completos de producto;
- reglas públicas en formato computable y un endpoint para ejecutar la acción;
- disponibilidad y reserva real de un recurso no perteneciente a los dominios excluidos;
- una corriente oficial de derechos o importes recuperables que no requiera datos privados ni consejo regulado.

Hasta entonces, afirmar que existe una aplicación ciudadana óptima bajo todas las restricciones sería contrario a la evidencia reunida.
