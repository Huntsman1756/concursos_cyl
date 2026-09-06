# Memoria de candidatura: SALIDA CyL

Categoría propuesta: **Productos y Servicios**, X Concurso de Datos Abiertos de Castilla y León. Producto público C15: [SALIDA CyL](https://salida-cyl.157-90-22-40.sslip.io/), commit `02d6805e5cb661f3289ade47ad2364b26fd346f8`. [Identidad y pruebas](release-c15.md).

SALIDA conecta formación profesional, ocupaciones, ofertas y centros para ayudar a explorar un siguiente paso con fuentes verificables. Permite empezar por unos estudios o una profesión. No sustituye la orientación personal ni determina acceso o habilitación profesional.

La estructura siguiente sigue los siete criterios de Productos y Servicios de las bases TRA/483/2020, con su modificación TRA/239/2021. Los criterios tienen igual proporción; no se atribuye al proyecto una puntuación oficial.

## 1. Utilidad

Una persona que está eligiendo FP encuentra información repartida entre catálogos educativos, clasificaciones ocupacionales, centros y ofertas. SALIDA reúne esos recorridos y permite comprobar qué evidencia sostiene cada conexión. La utilidad propuesta es reducir consultas inconexas y facilitar preguntas mejor informadas a un orientador.

Usuarios previstos: personas adultas que exploran formación y profesionales de orientación. No se afirma adopción ni ahorro de tiempo medidos. El [piloto preparado](../pilot/c15-session-pack.md) comprobará cinco tareas con al menos cinco participantes; todavía no se ha ejecutado.

## 2. Valor económico

El servicio público es accesible sin cuenta y su arquitectura estática permite distribuir el mismo artefacto sin consultas a modelos de IA en cada visita. La principal inversión de continuidad es revisar fuentes y relaciones, no solo alojar archivos.

Existe una hipótesis de servicio profesional para entidades orientadoras: mantenimiento de una instalación, adaptación de recorridos o elaboración de materiales a partir de datos abiertos. No hay clientes, contratos ni ingresos acreditados. El [plan de sostenibilidad](economic-sustainability.md) separa hipótesis, costes por medir y condiciones para evaluar viabilidad. El premio no se presenta como ingreso recurrente.

## 3. Valor público y social

La información educativa y laboral se hace consultable en un recorrido común, con fuentes, fechas y límites. La ausencia de una relación revisada se declara en vez de convertirla en ausencia de empleo. No se requiere crear una cuenta ni se conservan búsquedas en almacenamiento local de la aplicación.

El grafo revisado FP–CNO se ofrece en JSON y CSV, con procedencia por relación, para que otras personas puedan inspeccionarlo y reutilizarlo. El valor social se fundamenta en esta disponibilidad y transparencia; no se atribuyen contrataciones ni resultados educativos al producto.

## 4. Originalidad e innovación

La aportación está en conectar los datos en ambos sentidos y hacer visible la evidencia de cada relación. La comparación distingue los alcances estadísticos publicados y evita fabricar cruces que las fuentes no contienen. La interfaz diferencia catálogo, cobertura revisada y ofertas alcanzadas.

No se reivindica haber inventado la orientación profesional ni se presenta la similitud de textos como validación automática. La innovación defendida es una mejora concreta de acceso, trazabilidad y comprensión sobre fuentes fragmentadas.

## 5. Variedad de conjuntos de datos

Se integran ocho conjuntos del portal JCyL: oferta de FP, ofertas de empleo, formación ECYL, certificados profesionales, convocatorias públicas, contratos provinciales, municipios y directorio de centros. Se complementan con CNO-11, fuentes oficiales de titulaciones, SEPE y EDUCAbase. [Procedencia y contratos de datos](source-ledger.md).

No todos los conjuntos tienen la misma función: unos sostienen recorridos y relaciones; otros aportan contexto territorial o formación adicional. La variedad no se usa para afirmar cobertura exhaustiva.

## 6. Facilidad de uso y accesibilidad

La aplicación tiene recorridos por intención, fuentes etiquetadas, navegación interna, estados sin resultados y comparación con acceso visible en móvil. C15 se ha comprobado en escritorio y anchuras de 320 a 390 px. Los resultados automáticos y sus límites están en [release-c15.md](release-c15.md).

Quedan pendientes la escucha real con NVDA y el piloto. Axe conserva comprobaciones incompletas que requieren revisión humana. No se declara conformidad WCAG ni validación con usuarios que no se haya realizado.

## 7. Calidad técnica

La publicación usa una instantánea identificada por manifiesto, validación de esquemas e integridad, compilación reproducible y release reversible. C15 dispone de 1.351 pruebas unitarias aprobadas, una regresión de 130 E2E aprobadas y verificación HTTP de los 105 archivos publicados. Se informan también pruebas omitidas y el alcance limitado de cada ejecución.

Instantánea `20260830120000000-8c6c79fbd2a1`. La instantánea contiene 187 programas, 229 centros, 1.294 opciones formativas y 1.058 ofertas laborales. El grafo tiene 264 relaciones FP–ocupación revisadas, que abarcan 113 cualificaciones distintas y 130 claves de modalidad; no equivale a cobertura total del catálogo. En la evidencia de ofertas, 138 tienen FP revisada y 70 de 1.055 requisitos están clasificados; 985 permanecen sin clasificar. Las 196 relaciones del recurso de ofertas no son las 264 aristas del grafo FP–ocupación.

138 ofertas alcanzadas pertenecen a una copia fechada de 1.058 ofertas; no es una medida de todo el mercado.

Los hashes correctos y la ausencia de huérfanas no certifican por sí solos la exactitud semántica de cada relación. Las cifras son de una copia fechada, no de vacantes vigentes ni de todo el mercado laboral.

## Demostración y estado de entrega

[Guion de tres minutos](jury-demo.md): un recorrido útil, su fuente y un caso sin relación revisada. [Checklist de entrega](submission-checklist.md). El producto está publicado; esta memoria se prepara después de ese despliegue. La candidatura no se ha enviado y faltan las comprobaciones humanas y administrativas declaradas.
