# Checklist de presentación

> La URL vigente es https://salidacyl.es/. Los commits, gates y capturas del registro de release citado abajo son evidencia archivada anterior a la migración de dominio. Véase [la publicación actual](domain-migration-20260910.md) para las comprobaciones del nuevo dominio.

> Registro técnico generado desde la evidencia de release. Para preparar la solicitud y sus adjuntos, seguir la [guía de entrega](submission-guide.md). Los estados de este registro corresponden a la release documentada; no acreditan una presentación ni el estado actual de la web.

## Campos que debe completar una persona

- Convocatoria: [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html).
- Categoría: **Productos y Servicios**; primer premio: **2.500 €**.
- Plazo de presentación: **del 22 de julio al 21 de septiembre de 2026**.
- Presentación: [sede electrónica](https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Premio/1285664800452/Propuesta).
- Identidad de la persona solicitante: **PENDIENTE — no consta en el repositorio**.
- Contacto: **PENDIENTE — no consta en el repositorio**.
- Declaraciones, consentimiento y adjuntos exigidos: **PENDIENTE — revisar en el portal**.

## Campos técnicos

- URL raíz a presentar: [https://salidacyl.es/](https://salidacyl.es/)
- El estado del respaldo GitHub Pages se registra por separado en [verification-20260908.md](verification-20260908.md).
- Commit fuente del freeze: `8bf3ab85aac3e4c08d1826280529e9a648cbe0cc`.
- Snapshot: `20260908155911229-c72920ec4fed`.
- Commit desplegado: `ca8289ebe12c888af7765a212ce44b3754f838ca`.
- Run del workflow: no aplica (despliegue por script VPS, sin GitHub Actions).
- Release: `v2026.09.08-candidate.21`.
- `version.json` verificado: [respuesta pública](https://salida-cyl.157-90-22-40.sslip.io/version.json) con commit igual a `ca8289ebe12c888af7765a212ce44b3754f838ca`.
- Identidad del producto: el commit desplegado registrado arriba es el commit de producto; esta documentación de candidatura vive en una rama documental posterior y no forma parte del commit desplegado.

- Evidencia visual: **capturada y validada en `docs/contest/evidence-capture.json`**.

## Evidencia visual y gate final

- [x] Captura automatizada A4: 13/13 capturas actuales recapturadas y validadas en `docs/contest/evidence-capture.json`.
- [ ] Capturar y revisar visualmente los recorridos de la versión final en un navegador disponible, en escritorio y móvil; registrar versión, fecha y límites de la comprobación.
- [ ] Revisar la aplicación pública de la release actual en contexto anónimo, incluyendo las rutas de FP, ocupación y comparador.
- [ ] Conservar solo capturas actuales, sin datos personales ni credenciales; el manifiesto contiene capturas actuales ligadas al commit de publicación.
- [x] Ejecutar los gates de release y verificar la aplicación pública.
- [x] Registrar el commit desplegado y la verificación pública observados (despliegue por script VPS, sin run de GitHub Actions).
- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales. (capturas actuales; revisión humana pendiente)
- [ ] Confirmar que las cifras visibles siguen coincidiendo con `20260908155911229-c72920ec4fed`. (revisión humana pendiente)
- [ ] Obtener aprobación humana explícita para la solicitud externa.

**PENDIENTE DE APROBACIÓN HUMANA:** este repositorio no envía la solicitud al concurso ni decide los campos de identidad, contacto, declaraciones o consentimiento.

Antes de publicar cambios posteriores, ejecutar las comprobaciones pertinentes, revisar el diff y verificar el despliegue contra su commit. La observación pública más reciente se registra en [verification-20260908.md](verification-20260908.md); los registros históricos no garantizan el estado actual.
