# Estado del expediente — 6 de septiembre de 2026

## Preparado

- Producto público C15, identidad y resultados consolidados en [release-c15.md](release-c15.md).
- [Memoria por los siete criterios](jury-memo.md), [argumento económico y continuidad](economic-sustainability.md), [demostración de tres minutos](jury-demo.md).
- [Kit de piloto C15](../pilot/c15-session-pack.md), sin resultados fabricados.
- Distinción entre pruebas automáticas, autoverificación, revisión humana e impacto real.

## Depende de personas o evidencia todavía ausente

- Participantes y moderación: cinco sesiones reales; no hay muestra ejecutada.
- NVDA: aplazado por el titular. Comprobaciones incompletas de Axe: requieren revisión humana.
- Ensayo de presentación: duración y comprensión por el presentador aún no observadas.
- Presupuesto: aportar costes reales y confirmar quién asume mantenimiento. No se exige revelar facturas o datos personales en Git.
- Solicitud: identidad, contacto, declaraciones y autorización específica de envío. Revisar la orden anual completa y formulario oficial antes de presentar. El extracto aportado identifica BDNS 919240; la ficha electrónica no pudo verificarse completamente durante la evaluación.

## Referencias administrativas revisadas

Extracto BOCYL de 21/07/2026 (Orden de 14/07/2026), BDNS 919240; bases TRA/483/2020 y modificación TRA/239/2021. La modificación sustituye el art. 5.1 original: no debe usarse la antigua palabra «inédito» para afirmar que publicar SALIDA la excluye. Categoría propuesta: Productos y Servicios; la admisión no se certifica desde el repositorio.

El extracto establece dos meses desde el día siguiente a su publicación. La fecha operativa recogida en el expediente es el 21/09/2026; confirmar plazo y anexos en la [sede oficial](https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Premio/1285664800452/Propuesta) antes de la presentación. No se ha enviado nada.

## Alcance de esta tanda

Documentación y su generador/validador para representar el despliegue manual real. No se modifican código de producto, fuentes de datos, dependencias, gráficos ni configuración de producción. C15 sigue siendo el producto de referencia. No se declara un candidato nuevo por actualizar este expediente.

## Validación de esta actualización documental

- 51/51 pruebas dirigidas del generador, evidencia de release, inventario de capturas y piloto aprobadas.
- TypeScript del tooling, ESLint de los scripts modificados y formato de los archivos cambiados: correctos.
- Checksum del recibo público y enlaces locales del expediente: comprobados.
- Plantilla del piloto validada como draft; no existe archivo de resultados del piloto.
- version.json público comprobado de nuevo: HTTP 200 y commit C15 sin cambios.

La primera ejecución dirigida detectó cuatro aserciones documentales antiguas; se corrigieron las expectativas de textos que cambiaron y se conservó la comprobación de cifras congeladas. La ejecución posterior de 51 pruebas terminó sin fallos. Un intento de generación mediante tsx -e falló por formato CJS/top-level await; la generación se ejecutó después en modo ESM. No se atribuyen estos fallos de tooling al producto publicado.

No se ha repetido la suite completa del producto ni la matriz E2E: esta tanda no modifica runtime ni datos. La comprobación canónica del paquete se ejecuta después de registrar el commit, porque el validador exige una cadena Git y los archivos de evidencia sin modificaciones pendientes.
